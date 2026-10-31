export type Skill = "listen" | "read" | "grammar" | "translate";
export const skillNames: Record<Skill, string> = {
  listen: "精听与听写",
  read: "阅读理解",
  grammar: "语法微课",
  translate: "翻译表达",
};
export type Question = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};
export type Unit = {
  id: string;
  level: "A2" | "B1" | "B2" | "IELTS";
  title: string;
  subtitle: string;
  passage: string;
  translation: string;
  focus: string;
  rule: string;
  example: string;
  grammar: Question;
  reading: Question[];
  words: { word: string; meaning: string }[];
};
const q = (
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
): Question => ({ prompt, options, answer, explanation });
export const units: Unit[] = [
  {
    id: "morning",
    level: "A2",
    title: "清晨的小习惯",
    subtitle: "日常生活 · 一般现在时",
    passage:
      "Mia works at a bookshop near the station. She opens the shop at nine every morning. Before work, she buys bread from a small bakery. The baker knows her name and always says hello. Mia likes this short conversation. It makes the busy city feel like a friendly village.",
    translation: "米娅在车站附近的一家书店工作。",
    focus: "一般现在时",
    rule: "描述习惯与事实。主语是 he / she / it 时，肯定句中的动词通常加 -s 或 -es。",
    example: "She opens the shop at nine every morning.",
    grammar: q(
      "Mia usually ___ bread before work.",
      ["buy", "buys", "buying"],
      1,
      "Mia 为第三人称单数，一般现在时使用 buys。",
    ),
    reading: [
      q(
        "Where does Mia work?",
        ["At a bakery", "At a station", "At a bookshop"],
        2,
        "第一句明确说 works at a bookshop。",
      ),
      q(
        "Why does Mia enjoy the conversation?",
        [
          "It makes the city feel friendly.",
          "It helps her buy cheaper bread.",
          "It makes her late for work.",
        ],
        0,
        "最后一句解释：短暂交谈让繁忙城市像友善的村庄。",
      ),
    ],
    words: [
      { word: "bakery", meaning: "面包店" },
      { word: "conversation", meaning: "交谈" },
      { word: "village", meaning: "村庄" },
    ],
  },
  {
    id: "weekend",
    level: "A2",
    title: "一次意外的周末",
    subtitle: "周末故事 · 一般过去时",
    passage:
      "Last Saturday, Leo planned to visit a museum. When he arrived, the doors were closed. A sign said that the museum was being repaired. Instead of going home, he walked to the nearby park. There he met an old friend. They talked for an hour and shared lunch. The day was different from his plan, but he enjoyed it.",
    translation: "这一天与他的计划不同，但他过得很开心。",
    focus: "一般过去时",
    rule: "描述已结束的过去事件。规则动词常加 -ed，不规则变化需要单独记忆，如 meet → met。",
    example: "He met an old friend in the park.",
    grammar: q(
      "Yesterday, Leo ___ an old friend.",
      ["meets", "met", "meeting"],
      1,
      "Yesterday 是已结束的过去时间，meet 的过去式为 met。",
    ),
    reading: [
      q(
        "Why could Leo not visit the museum?",
        [
          "It was being repaired.",
          "He lost his ticket.",
          "He arrived too late.",
        ],
        0,
        "告示写着博物馆正在维修。",
      ),
      q(
        "How did Leo feel about the day?",
        ["He enjoyed it.", "He was angry all day.", "He wanted to forget it."],
        0,
        "最后一句直接说明 he enjoyed it。",
      ),
    ],
    words: [
      { word: "instead", meaning: "代替；反而" },
      { word: "nearby", meaning: "附近的" },
      { word: "repair", meaning: "修理" },
    ],
  },
  {
    id: "journey",
    level: "B1",
    title: "慢一点的旅程",
    subtitle: "出行选择 · 比较级",
    passage:
      "When Sara started her new job, she drove to the office every day. The journey was short, but finding a parking space was stressful. Last month she tried cycling. It takes ten minutes longer, yet she arrives feeling calmer. She has also discovered a riverside path that she had never noticed from her car. For Sara, a faster journey is not always a better one.",
    translation: "对萨拉来说，更快的旅程并不总是更好的旅程。",
    focus: "比较级与比较对象",
    rule: "短形容词通常用 -er；较长形容词通常用 more。比较时常用 than 引出对象，注意不能同时使用 more 和 -er。",
    example: "Cycling makes her calmer than driving.",
    grammar: q(
      "Sara feels ___ when she cycles than when she drives.",
      ["more calmest", "calmer", "calmest"],
      1,
      "两种出行方式比较，使用 calmer。",
    ),
    reading: [
      q(
        "What was stressful about driving?",
        ["Finding parking", "Crossing the river", "Learning the route"],
        0,
        "原文指出 finding a parking space was stressful。",
      ),
      q(
        "What is the main idea?",
        [
          "The fastest option is always best.",
          "A slower journey can offer other benefits.",
          "Everyone should sell their car.",
        ],
        1,
        "尽管更慢，骑行带来平静和新发现。文章未要求所有人放弃汽车。",
      ),
    ],
    words: [
      { word: "stressful", meaning: "令人有压力的" },
      { word: "riverside", meaning: "河边的" },
      { word: "discover", meaning: "发现" },
    ],
  },
  {
    id: "garden",
    level: "B1",
    title: "屋顶上的小花园",
    subtitle: "社区生活 · 现在完成时",
    passage:
      "For three years, residents of a city apartment building have grown vegetables on their roof. At first, only four neighbours joined the project. Now twenty families share the work. They have learned to collect rainwater and make compost from kitchen waste. The garden has not solved every problem in the building, but people who once passed in silence now stop to talk.",
    translation:
      "花园没有解决这栋楼里的所有问题，但曾经默默擦肩而过的人们如今会停下来交谈。",
    focus: "现在完成时",
    rule: "have / has + 过去分词，连接过去与现在。for 表示持续时间，since 表示起点。",
    example: "Residents have grown vegetables for three years.",
    grammar: q(
      "They ___ here since 2023.",
      ["live", "have lived", "are live"],
      1,
      "since 引出过去起点，描述持续到现在的状态，使用 have lived。",
    ),
    reading: [
      q(
        "How many families participate now?",
        ["Four", "Twenty", "Three"],
        1,
        "第二、三句对比起初四位邻居和如今二十个家庭。",
      ),
      q(
        "What social change has the garden brought?",
        [
          "Neighbours talk more.",
          "All building problems disappeared.",
          "Families stopped sharing work.",
        ],
        0,
        "末句说明以前不交谈的邻居现在会停下来聊天。",
      ),
    ],
    words: [
      { word: "resident", meaning: "居民" },
      { word: "compost", meaning: "堆肥" },
      { word: "participate", meaning: "参与" },
    ],
  },
  {
    id: "attention",
    level: "B2",
    title: "把注意力找回来",
    subtitle: "科技与生活 · 定语从句",
    passage:
      "A school introduced a quiet hour during which students put their phones in lockers. Teachers expected complaints, but many students welcomed the change. Some reported that reading felt easier without the possibility of a notification. However, the school did not conclude that technology was harmful in every situation. Instead, it encouraged students to notice when a tool was helping them and when it was dividing their attention. The experiment suggests that setting boundaries may be more useful than rejecting devices entirely.",
    translation: "这项实验表明，设定界限可能比完全拒绝电子设备更有用。",
    focus: "定语从句",
    rule: "定语从句补充说明名词。who 常指人，which 常指物，that 可用于许多指人或指物的限制性从句。",
    example: "Students who put their phones away found reading easier.",
    grammar: q(
      "The policy, ___ started in May, was popular.",
      ["who", "which", "what"],
      1,
      "逗号后的非限制性定语从句指代 policy，使用 which。",
    ),
    reading: [
      q(
        "What did the school encourage?",
        [
          "Rejecting all technology",
          "Recognising when technology helps or distracts",
          "Buying newer phones",
        ],
        1,
        "学校鼓励观察工具何时帮助自己、何时分散注意力。",
      ),
      q(
        "Which conclusion is best supported?",
        [
          "Boundaries can help manage attention.",
          "Every student dislikes phones.",
          "Notifications improve reading.",
        ],
        0,
        "末句使用 may 给出审慎结论，避免绝对化。",
      ),
    ],
    words: [
      { word: "notification", meaning: "通知" },
      { word: "boundary", meaning: "界限" },
      { word: "entirely", meaning: "完全地" },
    ],
  },
  {
    id: "repair",
    level: "B2",
    title: "修好，比换掉更有意义",
    subtitle: "环境与消费 · 被动语态",
    passage:
      "Repair cafés bring volunteers and residents together to fix broken household items. Although the financial savings are often modest, organisers argue that the benefits go further. Skills are exchanged, products are kept out of landfill, and owners gain a better understanding of how their possessions work. Not every item can be repaired, and volunteers cannot replace professional safety inspections. Nevertheless, these events challenge the assumption that replacement should always be the first response to a fault.",
    translation: "尽管节省的钱往往不多，组织者认为其益处不止于此。",
    focus: "被动语态",
    rule: "be + 过去分词，突出动作承受者。时态体现在 be 上，如 are repaired / were repaired / can be repaired。",
    example: "Skills are exchanged and products are repaired.",
    grammar: q(
      "Many broken items can ___ by volunteers.",
      ["repair", "be repaired", "repaired"],
      1,
      "items 承受修理动作，情态动词后使用 be repaired。",
    ),
    reading: [
      q(
        "Which benefit is mentioned besides saving money?",
        [
          "Exchanging skills",
          "Replacing safety inspections",
          "Guaranteeing every repair",
        ],
        0,
        "第三句提及技能交流、减少填埋和理解物品运作。",
      ),
      q(
        "Why mention professional inspections?",
        [
          "To acknowledge a limitation",
          "To say volunteers are unnecessary",
          "To claim all repairs are unsafe",
        ],
        0,
        "作者明确志愿维修无法替代专业安全检查，是对适用边界的说明。",
      ),
    ],
    words: [
      { word: "landfill", meaning: "垃圾填埋场" },
      { word: "possession", meaning: "所有物" },
      { word: "assumption", meaning: "假设；想当然的看法" },
    ],
  },
  {
    id: "transport",
    level: "IELTS",
    title: "城市交通的取舍",
    subtitle: "阅读策略 · True / False / Not Given",
    passage:
      "In a six-month trial, a city reduced bus fares on two routes. Passenger numbers rose by eighteen per cent compared with the previous six months. A survey found that most new passengers had previously walked or cycled; only a minority had switched from cars. The transport department therefore cautioned against treating higher ridership as proof of a large reduction in car use. It plans to collect further data before deciding whether to extend the scheme to other routes.",
    translation:
      "因此，交通部门提醒，不应将乘客量增加视为汽车使用量大幅下降的证据。",
    focus: "情态动词与审慎表达",
    rule: "may / might / could 常表示可能性而非确定事实。学术阅读中要留意范围词与证据强度，不能把可能性改成保证。",
    example: "Lower fares may increase passenger numbers.",
    grammar: q(
      "“The policy may reduce traffic” means it ___.",
      ["will certainly work", "is possibly helpful", "has already failed"],
      1,
      "may 表示可能，既非保证成功，也非已证实失败。",
    ),
    reading: [
      q(
        "Most new bus passengers had previously travelled by car.",
        ["True", "False", "Not Given"],
        1,
        "原文说明多数新乘客此前步行或骑行，与题目陈述相反。",
      ),
      q(
        "The city will build a new railway station next year.",
        ["True", "False", "Not Given"],
        2,
        "原文未提供铁路车站计划，无法判断。False 需要有相反证据。",
      ),
    ],
    words: [
      { word: "ridership", meaning: "乘客量" },
      { word: "minority", meaning: "少数" },
      { word: "scheme", meaning: "方案；计划" },
    ],
  },
  {
    id: "research",
    level: "IELTS",
    title: "研究结果告诉了我们什么",
    subtitle: "证据阅读 · 相关与因果",
    passage:
      "Researchers followed 240 adults who voluntarily joined a weekly walking group. After twelve weeks, participants reported better sleep and greater social connection. The study did not include a randomly assigned control group, and all outcomes were self-reported. Consequently, the results cannot establish that walking alone caused the improvements. People who choose group activities may differ from those who do not, and social contact itself may affect wellbeing. The findings are promising, but a controlled study would be needed to test the explanation more rigorously.",
    translation: "这些发现很有希望，但需要一项对照研究来更严谨地检验这一解释。",
    focus: "条件句与假设",
    rule: "would + 动词原形可表达假设情形下的结果。if + 过去式，主句常用 would，讨论并非已确认事实的情形。",
    example:
      "If the study had a control group, the comparison would be stronger.",
    grammar: q(
      "If we had more evidence, we ___ a clearer conclusion.",
      ["will reached", "would reach", "reach yesterday"],
      1,
      "假设性条件句使用 if + 过去式，主句 would + 动词原形。",
    ),
    reading: [
      q(
        "Why can the study not establish causation?",
        [
          "It lacked a randomised control group.",
          "It studied no adults.",
          "It lasted twelve years.",
        ],
        0,
        "没有随机分配的对照组，且结果来自自我报告，无法排除其他解释。",
      ),
      q(
        "Which heading best fits the passage?",
        [
          "Walking guarantees better sleep",
          "Promising results with methodological limits",
          "Why all group activities fail",
        ],
        1,
        "文章既承认结果有希望，又重点讨论研究方法的限制。",
      ),
    ],
    words: [
      { word: "self-reported", meaning: "自我报告的" },
      { word: "causation", meaning: "因果关系" },
      { word: "rigorously", meaning: "严谨地" },
    ],
  },
];
export function sentences(unit: Unit) {
  return (
    unit.passage
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((s) => s.trim())
      .filter(Boolean) || [unit.passage]
  );
}
export function normalize(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
export function validateUnit(v: unknown): v is Unit {
  if (!v || typeof v !== "object") return false;
  const u = v as Unit;
  const str = (x: unknown, max = 160) =>
    typeof x === "string" && x.trim().length > 0 && x.length <= max;
  const question = (x: Question) =>
    x &&
    str(x.prompt, 500) &&
    Array.isArray(x.options) &&
    x.options.length >= 2 &&
    x.options.length <= 5 &&
    x.options.every((o) => str(o, 500)) &&
    Number.isInteger(x.answer) &&
    x.answer >= 0 &&
    x.answer < x.options.length &&
    str(x.explanation, 1500);
  return (
    str(u.id, 80) &&
    /^[a-z0-9-]+$/.test(u.id) &&
    ["A2", "B1", "B2", "IELTS"].includes(u.level) &&
    str(u.title) &&
    str(u.subtitle) &&
    str(u.passage, 15000) &&
    str(u.translation, 2000) &&
    str(u.focus) &&
    str(u.rule, 2000) &&
    str(u.example, 500) &&
    !!question(u.grammar) &&
    Array.isArray(u.reading) &&
    u.reading.length >= 1 &&
    u.reading.length <= 15 &&
    u.reading.every(question) &&
    Array.isArray(u.words) &&
    u.words.length <= 50 &&
    u.words.every((w) => str(w.word) && str(w.meaning, 500))
  );
}
