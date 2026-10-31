import { test, expect } from "@playwright/test";
import { units } from "../src/content";
test("catalogue, all curriculum exercises, wrong-answer review and persistence", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/");
  await page.getByRole("button", { name: "成长路径", exact: true }).click();
  await expect(page.locator(".course-card")).toHaveCount(8);
  for (const u of units) {
    const card = page
      .locator(".course-card")
      .filter({
        has: page.getByRole("heading", { name: u.title, exact: true }),
      });
    await card.getByRole("button", { name: "语法微课" }).click();
    const wrong = u.grammar.options.find((_, i) => i !== u.grammar.answer)!;
    await page.getByRole("button", { name: wrong, exact: true }).click();
    await page.getByRole("button", { name: "检查答案", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "完成本节", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", {
        name: u.grammar.options[u.grammar.answer],
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "检查答案", exact: true }).click();
    await page.getByRole("button", { name: "完成本节", exact: true }).click();
    await card.getByRole("button", { name: "阅读理解", exact: true }).click();
    for (let i = 0; i < u.reading.length; i++) {
      await page
        .getByRole("button", {
          name: u.reading[i].options[u.reading[i].answer],
          exact: true,
        })
        .click();
      await page.getByRole("button", { name: "检查答案", exact: true }).click();
      await page
        .getByRole("button", {
          name: i === u.reading.length - 1 ? "完成本节" : "下一题",
          exact: true,
        })
        .click();
    }
    await card.getByRole("button", { name: "精听与听写", exact: true }).click();
    await page.getByText("继续：检验全文理解", { exact: true }).click();
    for (let i = 0; i < u.reading.length; i++) {
      await page
        .getByRole("button", {
          name: u.reading[i].options[u.reading[i].answer],
          exact: true,
        })
        .click();
      await page.getByRole("button", { name: "检查答案", exact: true }).click();
      await page
        .getByRole("button", {
          name: i === u.reading.length - 1 ? "完成本节" : "下一题",
          exact: true,
        })
        .click();
    }
    await card.getByRole("button", { name: "翻译表达", exact: true }).click();
    await expect(page.locator(".lesson-modal .passage")).not.toBeEmpty();
    await page.getByLabel("你的翻译（自动保存草稿）").fill("测试翻译草稿");
    await page.getByRole("button", { name: "对照参考", exact: true }).click();
    await expect(page.getByText(u.translation, { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "完成翻译自查", exact: false })
      .click();
  }
  await page.reload();
  await page.getByRole("button", { name: "学习足迹", exact: true }).click();
  await expect(page.locator(".stat-box").first()).toContainText("32");
  await page.getByRole("button", { name: "温故知新", exact: true }).click();
  await expect(page.getByRole("button", { name: "错题本 8" })).toBeVisible();
  await page.getByRole("button", { name: "翻开答案", exact: false }).click();
  await page.getByRole("button", { name: "记住了", exact: true }).click();
  await expect(page.getByRole("button", { name: "到期复习 7" })).toBeVisible();
});
test("dictation, vocabulary, draft restore, import validation and custom courses", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "成长路径", exact: true }).click();
  const card = page.locator(".course-card").first();
  await card.getByRole("button", { name: "精听与听写", exact: true }).click();
  await page
    .getByLabel("听写输入")
    .fill("Mia works at a bookshop near the station.");
  await page.getByRole("button", { name: "核对听写", exact: true }).click();
  await expect(page.getByText("听写正确！")).toBeVisible();
  await page.getByRole("button", { name: /bakery/ }).click();
  await page.getByRole("button", { name: "下一句", exact: true }).click();
  await expect(page.getByLabel("听写输入")).toHaveValue("");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await card.getByRole("button", { name: "翻译表达", exact: true }).click();
  await page.getByLabel("你的翻译（自动保存草稿）").fill("我想下次继续");
  await page.getByRole("button", { name: "关闭课程" }).click();
  await card.getByRole("button", { name: "翻译表达", exact: true }).click();
  await expect(page.getByLabel("你的翻译（自动保存草稿）")).toHaveValue(
    "我想下次继续",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "素材书架", exact: true }).click();
  await page
    .getByLabel("导入课程 JSON")
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from("{}"),
    });
  await expect(page.getByRole("alert")).toContainText("课程结构不完整");
  await page
    .getByLabel("导入课程 JSON")
    .setInputFiles({
      name: "unit.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({ ...units[0], id: "my-course", title: "我的个人练习" }),
      ),
    });
  await page.getByLabel("新单词").fill("curiosity");
  await page.getByLabel("单词释义").fill("好奇心");
  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await page.getByRole("button", { name: "成长路径", exact: true }).click();
  await expect(page.locator(".course-card")).toHaveCount(9);
  await page.getByRole("button", { name: "温故知新", exact: true }).click();
  await expect(page.getByRole("button", { name: "生词本 2" })).toBeVisible();
  await page.getByRole("button", { name: "打开偏好设置" }).click();
  await page
    .getByLabel("导入学习备份")
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from("{}"),
    });
  await expect(page.getByRole("alert")).toContainText("无效的学习备份");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
