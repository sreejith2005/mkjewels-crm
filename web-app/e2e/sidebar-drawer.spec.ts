import { expect, test } from "@playwright/test";

const enabled = Boolean(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD);

test.describe("CRM navigation drawer", () => {
  test.skip(!enabled, "Requires the local E2E staff credentials.");

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(process.env.E2E_USER_EMAIL!);
    await page.getByLabel("Password").fill(process.env.E2E_USER_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|queue|clients|followups|referrals)/);
    await page.goto("/queue");
  });

  test("opens, closes, and navigates without reserving a desktop sidebar rail", async ({ page }, testInfo) => {
    const menu = page.getByRole("button", { name: "Open navigation menu" });
    const sidebar = page.getByRole("complementary", { name: "Main navigation" });
    const close = sidebar.getByRole("button", { name: "Close navigation menu" });

    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(sidebar).not.toHaveClass(/is-open/);
    await expect.poll(async () => (await sidebar.boundingBox())?.x ?? 0).toBeLessThan(0);
    await page.screenshot({ path: testInfo.outputPath("sidebar-desktop-closed.png"), fullPage: false });

    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await expect(sidebar).toHaveClass(/is-open/);
    await expect.poll(async () => (await sidebar.boundingBox())?.x ?? -1).toBe(0);
    await expect(sidebar.getByText("CLIENT DATABASE")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("sidebar-desktop-open.png"), fullPage: false });

    await close.click();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(sidebar).not.toHaveClass(/is-open/);

    await menu.click();
    await sidebar.getByText("CLIENT DATABASE").click();
    await expect(page).toHaveURL(/\/clients$/);
  });

  test("remains usable at mobile width", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const menu = page.getByRole("button", { name: "Open navigation menu" });
    const sidebar = page.getByRole("complementary", { name: "Main navigation" });

    await menu.click();
    await expect(sidebar).toHaveClass(/is-open/);
    await page.screenshot({ path: testInfo.outputPath("sidebar-mobile-open.png"), fullPage: false });
    await sidebar.getByRole("button", { name: "Close navigation menu" }).click();
    await expect(sidebar).not.toHaveClass(/is-open/);
  });
});
