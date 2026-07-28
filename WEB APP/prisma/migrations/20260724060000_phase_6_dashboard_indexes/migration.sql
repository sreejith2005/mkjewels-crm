-- Phase 6: direct dashboard queries only; no materialized view or cache layer.
CREATE INDEX "client_timeline_event_date_idx" ON "public"."client_timeline" ("event_date" DESC);
CREATE INDEX "not_bought_followups_created_at_idx" ON "public"."not_bought_followups" ("created_at" DESC);
CREATE INDEX "referral_calling_created_at_idx" ON "public"."referral_calling" ("created_at" DESC);
