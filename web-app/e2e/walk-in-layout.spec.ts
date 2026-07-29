import { expect, test } from "@playwright/test";

const enabled = Boolean(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD);

test.describe("Legacy walk-in layout", () => {
  test.skip(!enabled, "Configure the dedicated E2E Supabase user and fixture variables.");

  test("renders the legacy form as one ordered scrollable page", async ({ page }, testInfo) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));
    await page.goto("/login");
    await page.getByLabel("Email").fill(process.env.E2E_USER_EMAIL!);
    await page.getByLabel("Password").fill(process.env.E2E_USER_PASSWORD!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|queue|clients|followups|referrals)/);
    await page.goto("/queue");
    const queueBranch = page.getByLabel("BRANCH").last();
    if (await queueBranch.isVisible()) {
      const branches = await queueBranch.locator("option").evaluateAll((options) => options.map((option) => ({ value: (option as HTMLOptionElement).value, text: option.textContent })));
      if (branches.length > 1 && !(await queueBranch.inputValue())) {
        await queueBranch.selectOption(branches[1]!.value);
        await page.getByRole("button", { name: "LOAD QUEUE" }).click();
      }
    }
    const entry = page.getByRole("link", { name: /add walkin entry|make walk-in entry/i }).first();
    await expect(entry).toBeVisible();
    await entry.click();
    await page.waitForURL(/\/visits\/new\?queue=/);

    const clientDetails = page.getByRole("heading", { name: "CLIENT DETAILS" });
    const bridal = page.getByLabel("Bridal / non-bridal");
    const visitOutcome = page.getByLabel("Client bought any product?");
    await expect(clientDetails).toBeVisible();
    await expect(bridal).toBeVisible();
    await expect(visitOutcome).toBeVisible();
    expect((await bridal.boundingBox())!.y).toBeLessThan((await visitOutcome.boundingBox())!.y);
    await expect(page.getByRole("heading", { name: "CRM APPROACH" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "PREFERENCES" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "REMARK" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("walk-in-layout.png"), fullPage: true });
    await expect(pageErrors).toEqual([]);
  });
});
