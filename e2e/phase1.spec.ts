import { expect, test } from "@playwright/test";

// Requires a deployed Phase 1 migration and dedicated E2E_USER_EMAIL/PASSWORD
// plus fixture client IDs. It is intentionally skipped in local developer runs.
const enabled = Boolean(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD && process.env.E2E_CLIENT_PHONE);
test.skip(!enabled, "Configure the dedicated E2E Supabase user and fixture variables.");
test("phone search resolves exact and partial matches", async ({ page }) => { await page.goto("/login"); await page.getByLabel("Email").fill(process.env.E2E_USER_EMAIL!); await page.getByLabel("Password").fill(process.env.E2E_USER_PASSWORD!); await page.getByRole("button", { name: /sign in/i }).click(); const search = page.getByLabel("Search client"); await search.fill(process.env.E2E_CLIENT_PHONE!); await expect(page.getByText(process.env.E2E_CLIENT_NAME!)).toBeVisible(); await search.fill(process.env.E2E_CLIENT_PHONE!.slice(-4)); await expect(page.getByText(process.env.E2E_CLIENT_NAME!)).toBeVisible(); });
test("duplicate client creation is friendly", async ({ page }) => { await page.goto(`/clients/new?phone=${encodeURIComponent(process.env.E2E_CLIENT_PHONE!)}`); await page.getByLabel(/Primary name/i).fill("Duplicate test"); await page.getByRole("button", { name: /create client/i }).click(); await expect(page.getByText(/already exists/i)).toBeVisible(); });
