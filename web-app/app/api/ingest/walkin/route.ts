import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  legacyPayloadForAudit,
  legacyWalkinEnvelopeSchema,
  toCanonicalWalkinPayload,
} from "@/lib/legacy-walkin-ingest";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 1_000_000;
const RATE_LIMIT_KEY = "legacy-apps-script";

function response(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function suppliedKeyMatches(value: string | null, expected: string): boolean {
  if (!value) return false;
  const supplied = Buffer.from(value);
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(supplied, configured);
}

function clientAddress(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

async function logAttempt(input: {
  requestId: string;
  sourceIp: string | null;
  payload: Record<string, unknown>;
  payloadHash: string | null;
  outcome: string;
  result: Record<string, unknown>;
}) {
  await prisma.legacyWalkinIngestAttempt.create({
    data: {
      requestId: input.requestId,
      sourceIp: input.sourceIp,
      payload: input.payload as Prisma.InputJsonValue,
      payloadHash: input.payloadHash,
      outcome: input.outcome,
      result: input.result as Prisma.InputJsonValue,
    },
  });
}

async function safelyLogAttempt(input: Parameters<typeof logAttempt>[0]) {
  try {
    await logAttempt(input);
  } catch (error) {
    // The ingestion result must not be replaced by an audit-log outage. The
    // database/server log retains the request ID for that exceptional case.
    console.error("Could not log legacy walk-in ingestion attempt", { requestId: input.requestId, error });
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const sourceIp = clientAddress(request);
  const apiKey = process.env.LEGACY_WALKIN_INGEST_API_KEY;
  if (!apiKey) {
    console.error("Legacy walk-in ingest is not configured: LEGACY_WALKIN_INGEST_API_KEY is missing.");
    return response({ ok: false, requestId, code: "SERVER_MISCONFIGURED", message: "Ingestion is not configured." }, 503);
  }

  if (!suppliedKeyMatches(request.headers.get("x-mk-legacy-api-key"), apiKey)) {
    await safelyLogAttempt({ requestId, sourceIp, payload: {}, payloadHash: null, outcome: "unauthorized", result: { code: "UNAUTHORIZED" } });
    return response({ ok: false, requestId, code: "UNAUTHORIZED", message: "Invalid ingestion credentials." }, 401);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    await safelyLogAttempt({ requestId, sourceIp, payload: {}, payloadHash: null, outcome: "payload_too_large", result: { code: "PAYLOAD_TOO_LARGE" } });
    return response({ ok: false, requestId, code: "PAYLOAD_TOO_LARGE", message: "Payload exceeds the 1 MB limit." }, 413);
  }

  const windowResult = await prisma.$queryRaw<Array<{ allowed: boolean }>>(
    Prisma.sql`SELECT public.consume_legacy_walkin_ingest_rate_limit(${RATE_LIMIT_KEY}) AS allowed`,
  );
  if (!windowResult[0]?.allowed) {
    await safelyLogAttempt({ requestId, sourceIp, payload: {}, payloadHash: null, outcome: "rate_limited", result: { code: "RATE_LIMITED" } });
    return response({ ok: false, requestId, code: "RATE_LIMITED", message: "Too many requests. Retry after one minute." }, 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    await safelyLogAttempt({ requestId, sourceIp, payload: {}, payloadHash: null, outcome: "invalid_json", result: { code: "INVALID_JSON" } });
    return response({ ok: false, requestId, code: "INVALID_JSON", message: "Request body must be valid JSON." }, 400);
  }

  const parsed = legacyWalkinEnvelopeSchema.safeParse(body);
  if (!parsed.success) {
    const result = { code: "INVALID_PAYLOAD", issues: parsed.error.issues.map((issue) => issue.message) };
    await safelyLogAttempt({ requestId, sourceIp, payload: {}, payloadHash: null, outcome: "invalid_payload", result });
    return response({ ok: false, requestId, ...result, message: "Payload failed validation." }, 400);
  }

  const auditPayload = legacyPayloadForAudit(parsed.data);
  const payloadHash = createHash("sha256").update(JSON.stringify(auditPayload)).digest("hex");
  if (parsed.data.filesPayload.length > 0) {
    const result = { code: "UNSUPPORTED_FILE_UPLOAD", fileCount: parsed.data.filesPayload.length };
    await safelyLogAttempt({ requestId, sourceIp, payload: auditPayload, payloadHash, outcome: "rejected_files", result });
    return response({ ok: false, requestId, ...result, message: "Proof uploads are not supported by this ingestion endpoint yet; no visit was saved." }, 422);
  }

  const branchName = String(parsed.data.formDataObj.branch ?? "").trim();
  const branch = branchName
    ? await prisma.branch.findFirst({ where: { name: { equals: branchName, mode: "insensitive" }, active: true }, select: { id: true } })
    : null;
  if (!branch) {
    const result = { code: "INVALID_BRANCH" };
    await safelyLogAttempt({ requestId, sourceIp, payload: auditPayload, payloadHash, outcome: "invalid_branch", result });
    return response({ ok: false, requestId, ...result, message: "An active CRM branch matching the legacy BRANCH field is required." }, 422);
  }

  const canonicalPayload = toCanonicalWalkinPayload(parsed.data.formDataObj, branch.id);
  try {
    const rows = await prisma.$queryRaw<Array<{ client_id: string; timeline_id: string; reference_number: string }>>(
      Prisma.sql`SELECT * FROM public.submit_legacy_walkin_visit(${JSON.stringify(canonicalPayload)}::jsonb)`,
    );
    const saved = rows[0];
    if (!saved) throw new Error("The database did not return an ingestion result.");
    const result = { code: "INGESTED", clientId: saved.client_id, timelineId: saved.timeline_id, referenceNumber: saved.reference_number };
    await safelyLogAttempt({ requestId, sourceIp, payload: auditPayload, payloadHash, outcome: "success", result });
    return response({ ok: true, requestId, ...result }, 201);
  } catch (error) {
    console.error("Legacy walk-in ingestion failed", { requestId, error });
    const result = { code: "INGEST_FAILED" };
    await safelyLogAttempt({ requestId, sourceIp, payload: auditPayload, payloadHash, outcome: "failed", result });
    return response({ ok: false, requestId, ...result, message: "The walk-in could not be saved. Retry once or contact CRM support with the requestId." }, 422);
  }
}
