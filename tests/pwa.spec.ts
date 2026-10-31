import { test, expect } from "@playwright/test";
test("production app shell reloads offline after initial caching", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: /慢慢来/ })).toBeVisible();
  await page.getByRole("button", { name: "成长路径", exact: true }).click();
  await expect(page.locator(".course-card")).toHaveCount(8);
  await context.setOffline(false);
});
