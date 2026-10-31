import { test, expect } from "@playwright/test";
test("learning, persistence and responsive layout", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /慢慢来/ })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: /此刻，正在发生什么/ }).click();
  await page.getByRole("button", { name: "sing", exact: true }).click();
  await page.getByRole("button", { name: "检查答案", exact: true }).click();
  await expect(page.getByRole("button", { name: "记住这一点" })).toHaveCount(0);
  await page.getByRole("button", { name: "are singing", exact: true }).click();
  await page.getByRole("button", { name: "检查答案", exact: true }).click();
  await page.getByRole("button", { name: "记住这一点" }).click();
  await page.reload();
  await expect(page.getByText("已完成 1 / 4 节")).toBeVisible();
  await page.getByRole("button", { name: "温故知新" }).click();
  await expect(page.getByText("暂时没有到期卡片")).toBeVisible();
});
test("assessment and translation self-check", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /轻量入门测评/ }).click();
  for (const [answer, next] of [
    ["goes", "下一题"],
    ["火车先离开，我后到", "下一题"],
    ["but", "查看学习建议"],
  ]) {
    await page.getByRole("button", { name: answer, exact: true }).click();
    await page.getByRole("button", { name: "检查答案", exact: true }).click();
    await page.getByRole("button", { name: next, exact: false }).click();
  }
  await expect(page.getByRole("status")).toContainText("3/3");
  await page.getByRole("button", { name: /把理解变成表达/ }).click();
  await page.getByLabel("写下你的翻译").fill("她通常点一杯茶并读书。");
  await page.getByRole("button", { name: "对照参考译文" }).click();
  await expect(page.getByText("参考译文", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "完成自查" }).click();
  await expect(page.getByText("已完成 1 / 4 节")).toBeVisible();
});
