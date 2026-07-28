/* Controlled Phase 7b repair operations. Each mode commits independently. */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DIRECT_URL, transactionOptions: { maxWait: 10_000, timeout: 300_000 } });
const mode = process.env.PHASE7B_REPAIR_MODE;
const report = (name: string, data: unknown) => console.log(JSON.stringify({ at: new Date().toISOString(), checkpoint: name, data }, (_, value) => typeof value === "bigint" ? Number(value) : value));

async function cleanup() {
  await prisma.$transaction(async (db) => {
    const [baseline] = await db.$queryRaw<Array<{ timelines: bigint; mapped: bigint; forms: bigint; trigger_audit: bigint }>>`
      SELECT
        (SELECT count(*) FROM public.client_timeline) AS timelines,
        (SELECT count(DISTINCT t.id) FROM public.client_timeline t JOIN public.legacy_import_keys k ON k.target_id=t.id::text WHERE k.source_key LIKE 'timeline:%' OR k.source_key LIKE 'walkin:%') AS mapped,
        (SELECT count(*) FROM public.visit_forms f JOIN public.client_timeline t ON t.id=f.client_timeline_id JOIN public.legacy_import_keys k ON k.target_id=t.id::text WHERE k.source_key LIKE 'timeline:%' OR k.source_key LIKE 'walkin:%') AS forms,
        (SELECT count(*) FROM public.client_edit_log WHERE source='database_trigger') AS trigger_audit`;
    report("step1-baseline-verified", baseline);
    if (Number(baseline.timelines) !== 2287 || Number(baseline.mapped) !== 2287 || Number(baseline.forms) !== 1 || Number(baseline.trigger_audit) !== 18316) throw new Error(`Refusing cleanup: expected 2287/2287/1/18316, got ${baseline.timelines}/${baseline.mapped}/${baseline.forms}/${baseline.trigger_audit}.`);
    const forms = await db.$executeRaw`DELETE FROM public.visit_forms f USING public.client_timeline t, public.legacy_import_keys k WHERE f.client_timeline_id=t.id AND k.target_id=t.id::text AND (k.source_key LIKE 'timeline:%' OR k.source_key LIKE 'walkin:%')`;
    report("step1-visit_forms-deleted", { rows: forms });
    const timelines = await db.$executeRaw`DELETE FROM public.client_timeline t USING public.legacy_import_keys k WHERE k.target_id=t.id::text AND (k.source_key LIKE 'timeline:%' OR k.source_key LIKE 'walkin:%')`;
    report("step1-client_timeline-deleted", { rows: timelines });
    const keys = await db.$executeRawUnsafe("DELETE FROM public.legacy_import_keys WHERE source_key LIKE 'timeline:%' OR source_key LIKE 'walkin:%' OR source_key LIKE 'phase7b-repair:%'");
    report("step1-import-keys-deleted", { rows: keys });
    const audit = await db.$executeRawUnsafe("DELETE FROM public.client_edit_log WHERE source='database_trigger'");
    if (audit !== 18316) throw new Error(`Refusing cleanup: audit deletion yielded ${audit}, expected 18316.`);
    report("step1-database-trigger-audit-deleted", { rows: audit });
    await db.$executeRawUnsafe("ALTER TABLE public.clients DISABLE TRIGGER clients_field_level_audit");
    await db.$executeRawUnsafe("ALTER TABLE public.visit_forms DISABLE TRIGGER visit_forms_create_not_bought_followup");
    await db.$executeRawUnsafe("ALTER TABLE public.visit_forms DISABLE TRIGGER visit_forms_create_referral");
    report("step1-mechanical-triggers-disabled", { clients_field_level_audit: true, visit_form_followups: true, visit_form_referrals: true });
  });
}

async function rollups() {
  const rows = await prisma.$transaction(async (db) => {
    const before = await db.$queryRaw<Array<{ client_id: string; primary_name: string; total_visits: number; actual: number }>>`
      SELECT c.client_id::text,c.primary_name,c.total_visits,(SELECT count(*)::integer FROM public.client_timeline t WHERE t.client_id=c.client_id) actual
      FROM public.clients c WHERE c.total_visits <> (SELECT count(*)::integer FROM public.client_timeline t WHERE t.client_id=c.client_id)`;
    await db.$executeRawUnsafe(`
      WITH aggregates AS (
        SELECT t.client_id,count(*)::integer total_visits,
          count(*) FILTER (WHERE t.buy_status IN ('YES','YES_AND_ORDER_PLACED'))::integer total_purchase_visits,
          count(*) FILTER (WHERE t.buy_status IN ('NO','PRODUCT_RETURN','STORE_VISIT','PRICE_CALCULATION'))::integer total_non_purchase_visits,
          count(*) FILTER (WHERE t.buy_status::text LIKE 'REPAIR_PLACED%' OR t.buy_status::text LIKE 'REPAIR_PICKUP%')::integer total_repair_visits,
          count(*) FILTER (WHERE t.buy_status::text LIKE 'ORDER_PLACED%' OR t.buy_status::text LIKE 'ORDER_PICKUP%')::integer total_order_visits,
          min(t.event_date) first_visit_date,max(t.event_date) last_visit_date FROM public.client_timeline t GROUP BY t.client_id
      ), latest AS (SELECT DISTINCT ON (client_id) client_id,buy_status,branch_id,crm_name,salesperson_id,remark,product_requirement,seen_categories,bought_categories,order_categories FROM public.client_timeline ORDER BY client_id,event_date DESC,created_at DESC,id DESC)
      UPDATE public.clients c SET total_visits=a.total_visits,total_purchase_visits=a.total_purchase_visits,total_non_purchase_visits=a.total_non_purchase_visits,total_repair_visits=a.total_repair_visits,total_order_visits=a.total_order_visits,first_visit_date=a.first_visit_date,last_visit_date=a.last_visit_date,last_buy_status=l.buy_status,last_branch_id=l.branch_id,last_crm_name=l.crm_name,last_salesperson_id=l.salesperson_id,last_remark=l.remark,last_product_requirement=l.product_requirement,last_seen_categories=l.seen_categories,last_bought_categories=l.bought_categories,last_order_categories=l.order_categories,profile_updated_at=now() FROM aggregates a JOIN latest l ON l.client_id=a.client_id WHERE c.client_id=a.client_id`);
    await db.$executeRawUnsafe("UPDATE public.clients SET total_visits=0,total_purchase_visits=0,total_non_purchase_visits=0,total_repair_visits=0,total_order_visits=0,first_visit_date=NULL,last_visit_date=NULL,last_buy_status=NULL,last_branch_id=NULL,last_crm_name=NULL,last_salesperson_id=NULL,last_remark=NULL,last_product_requirement=NULL,last_seen_categories='{}',last_bought_categories='{}',last_order_categories='{}',profile_updated_at=now() WHERE NOT EXISTS (SELECT 1 FROM public.client_timeline t WHERE t.client_id=clients.client_id)");
    return before;
  });
  report("step3-rollups-recomputed", { clientsChanged: rows.length, examples: rows.slice(0, 3) });
}

async function finish() {
  await prisma.$executeRawUnsafe("ALTER TABLE public.clients ENABLE TRIGGER clients_field_level_audit");
  await prisma.$executeRawUnsafe("ALTER TABLE public.visit_forms ENABLE TRIGGER visit_forms_create_not_bought_followup");
  await prisma.$executeRawUnsafe("ALTER TABLE public.visit_forms ENABLE TRIGGER visit_forms_create_referral");
  report("triggers-reenabled", { ok: true });
}

async function verify() {
  const counts = await prisma.$queryRawUnsafe("SELECT 'client_timeline' table_name,count(*)::int rows FROM public.client_timeline UNION ALL SELECT 'visit_forms',count(*)::int FROM public.visit_forms UNION ALL SELECT 'entry_queue',count(*)::int FROM public.entry_queue UNION ALL SELECT 'client_edit_log',count(*)::int FROM public.client_edit_log");
  const orphans = await prisma.$queryRawUnsafe("SELECT 'client_phone_index.client_id' relation,count(*)::int rows FROM public.client_phone_index x LEFT JOIN public.clients c ON c.client_id=x.client_id WHERE c.client_id IS NULL UNION ALL SELECT 'client_timeline.client_id',count(*)::int FROM public.client_timeline x LEFT JOIN public.clients c ON c.client_id=x.client_id WHERE c.client_id IS NULL UNION ALL SELECT 'visit_forms.client_timeline_id',count(*)::int FROM public.visit_forms x LEFT JOIN public.client_timeline t ON t.id=x.client_timeline_id WHERE t.id IS NULL UNION ALL SELECT 'entry_queue.client_id',count(*)::int FROM public.entry_queue x LEFT JOIN public.clients c ON c.client_id=x.client_id WHERE x.client_id IS NOT NULL AND c.client_id IS NULL");
  report("verification", { counts, orphans });
}

if (!process.env.DIRECT_URL) throw new Error("DIRECT_URL is required.");
if (mode === "cleanup") await cleanup(); else if (mode === "rollups") await rollups(); else if (mode === "finish") await finish(); else if (mode === "verify") await verify(); else throw new Error("Set PHASE7B_REPAIR_MODE to cleanup, rollups, finish, or verify.");
await prisma.$disconnect();
