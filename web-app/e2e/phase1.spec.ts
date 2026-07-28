import { expect, test } from "@playwright/test";

// Requires a deployed Phase 1 migration and dedicated E2E_USER_EMAIL/PASSWORD
// plus fixture client IDs. It is intentionally skipped in local developer runs.
const enabled = Boolean(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD && process.env.E2E_CLIENT_PHONE);
test.describe("Phase 1 client CRM", () => {
  test.skip(!enabled, "Configure the dedicated E2E Supabase user and fixture variables.");
  test.beforeEach(async ({ page }) => { await page.goto("/login"); await page.getByLabel("Email").fill(process.env.E2E_USER_EMAIL!); await page.getByLabel("Password").fill(process.env.E2E_USER_PASSWORD!); await page.waitForTimeout(1000); await page.getByRole("button", { name: /sign in/i }).click(); await page.waitForURL(/\/(dashboard|queue|clients|followups|referrals)/); });
  test("phone search resolves exact and partial matches", async ({ page }) => { const search = page.getByLabel("Search client", { exact: true }); await search.fill(process.env.E2E_CLIENT_PHONE!); await expect(page.getByText(process.env.E2E_CLIENT_NAME!)).toBeVisible(); await search.fill(process.env.E2E_CLIENT_PHONE!.slice(-4)); await expect(page.getByText(process.env.E2E_CLIENT_NAME!)).toBeVisible(); });
  test("client profile renders lookup controls without a runtime error", async ({ page }) => { const pageErrors: Error[] = []; page.on("pageerror", (error) => pageErrors.push(error)); await page.goto("/clients"); const profileLink = page.getByRole("link", { name: "View Client Profile" }).first(); await expect(profileLink).toBeVisible(); await profileLink.click(); await page.waitForURL(/\/clients\//); await expect(page.getByRole("button", { name: "Profile", exact: true })).toBeVisible(); await expect(page.getByLabel("Sugar")).toBeVisible(); await expect(pageErrors).toEqual([]); });
  test("duplicate client creation is friendly", async ({ page }) => { await page.goto(`/clients/new?phone=${encodeURIComponent(process.env.E2E_CLIENT_PHONE!)}`); await page.getByLabel(/Primary name/i).fill("Duplicate test"); await page.getByRole("button", { name: /create client/i }).click(); await expect(page.getByText(/already exists/i)).toBeVisible(); });
});
