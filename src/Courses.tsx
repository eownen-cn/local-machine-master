import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Check,
  BookOpen,
  Headphones,
  X,
  Plus,
  RotateCcw,
  Download,
} from "lucide-react";
import {
  units,
  skillNames,
  sentences,
  normalize,
  validateUnit,
  type Unit,
  type Skill,
  type Question,
} from "./content";
import {
  list,
  get,
  put,
  schedule,
  customUnits,
  download,
  validateStore,
  mergeStores,
  type Store,
  type Word,
  type Mistake,
  type Recall,
  type Session,
} from "./store";
import { Audio } from "./Audio";
type Shared = {
  store: Store;
  setStore: React.Dispatch<React.SetStateAction<Store>>;
  notify: (message: string) => void;
};
const translations: Record<string, number> = {
  morning: 0,
  weekend: 6,
  journey: 5,
  garden: 4,
  attention: 5,
  repair: 1,
  transport: 3,
  research: 5,
};
const makeID = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function CourseCatalog(props: Shared) {
  const [level, setLevel] = useState("全部");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{ unit: Unit; skill: Skill } | null>(
    null,
  );
  const all = [...units, ...customUnits(props.store)];
  return (
    <>
      <div className="eyebrow">YOUR LEARNING JOURNEY</div>
      <h1>成长有自己的节奏</h1>
      <p className="page-description">
        从 A2 打底到雅思阅读策略。{all.length}{" "}
        个原创或个人单元，每单元听、读、译、语法四种练习。雅思单元为策略入门，不是完整模拟考试。
      </p>
      <div className="filters" aria-label="课程筛选">
        {["全部", "A2", "B1", "B2", "IELTS"].map((l) => (
          <button
            key={l}
            className={level === l ? "primary" : "secondary"}
            onClick={() => setLevel(l)}
          >
            {l}
          </button>
        ))}
        <input
          aria-label="搜索课程"
          placeholder="搜索主题、语法或标题"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="course-grid">
        {all
          .filter(
            (u) =>
              (level === "全部" || u.level === level) &&
              `${u.title} ${u.subtitle} ${u.focus}`.includes(search),
          )
          .map((u, i) => (
            <section className="course-card" key={u.id}>
              <div className="section-title">
                <span className="pill">
                  {u.level} ·{" "}
                  {u.id.startsWith("custom-") ? "个人素材" : "原创课程"}
                </span>
                <span>{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h2>{u.title}</h2>
              <p>{u.subtitle}</p>
              <div className="course-skills">
                {(Object.keys(skillNames) as Skill[]).map((skill) => (
                  <button
                    key={skill}
                    className="secondary"
                    onClick={() => setSelected({ unit: u, skill })}
                  >
                    {get(props.store, `done:${u.id}:${skill}`) ? (
                      <Check size={14} />
                    ) : skill === "listen" ? (
                      <Headphones size={14} />
                    ) : (
                      <BookOpen size={14} />
                    )}{" "}
                    {skillNames[skill]}
                  </button>
                ))}
              </div>
            </section>
          ))}
      </div>
      {!all.some(
        (u) =>
          (level === "全部" || u.level === level) &&
          `${u.title} ${u.subtitle} ${u.focus}`.includes(search),
      ) && (
        <section className="simple-card">
          没有符合条件的课程，试试其他关键词。
        </section>
      )}
      {selected && (
        <CourseRunner
          key={selected.unit.id + selected.skill}
          {...props}
          {...selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
function CourseRunner({
  unit,
  skill,
  onClose,
  store,
  setStore,
  notify,
}: Shared & { unit: Unit; skill: Skill; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [showText, setShowText] = useState(false);
  const [sentence, setSentence] = useState(0);
  const [dictation, setDictation] = useState("");
  const [dictated, setDictated] = useState(false);
  const draftKey = `draft:${unit.id}:${skill}`;
  const [translation, setTranslation] = useState(
    () => get<string>(store, draftKey) || "",
  );
  const [seconds, setSeconds] = useState(0);
  const secondsRef = useRef(0);
  const ref = useRef<HTMLElement>(null);
  const parts = sentences(unit);
  const questions = skill === "grammar" ? [unit.grammar] : unit.reading;
  const question = questions[step];
  const id = useRef(makeID());
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = ref.current;
    root?.querySelector<HTMLElement>("button")?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const controls = Array.from(
          root?.querySelectorAll<HTMLElement>(
            "button:not(:disabled),a,input,select,textarea,summary",
          ) || [],
        );
        const first = controls[0],
          last = controls.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        secondsRef.current++;
        setSeconds(secondsRef.current);
      }
    }, 1000);
    return () => {
      document.removeEventListener("keydown", handler);
      clearInterval(interval);
      window.speechSynthesis?.cancel();
      previous?.focus();
    };
  }, []);
  const saveWord = (w: Unit["words"][number]) => {
    setStore((s) =>
      put(s, `word:${unit.id}:${normalize(w.word).replace(/ /g, "-")}`, {
        ...w,
        example:
          parts.find((p) => normalize(p).includes(normalize(w.word))) ||
          unit.example,
        source: unit.title,
      } satisfies Word),
    );
    notify(`已收藏 ${w.word}`);
  };
  const check = () => {
    setChecked(true);
    if (answer !== question.options[question.answer]) {
      setStore((s) =>
        put(s, `mistake:${unit.id}:${skill}:${step}`, {
          prompt: question.prompt,
          answer: question.options[question.answer],
          explanation: question.explanation,
          source: unit.title,
        } satisfies Mistake),
      );
    }
  };
  const finish = () => {
    setStore((s) => {
      let next = put(s, `done:${unit.id}:${skill}`, true);
      next = put(next, `session:${id.current}`, {
        unit: unit.id,
        skill,
        seconds: secondsRef.current,
        date: new Date().toISOString(),
      } satisfies Session);
      next = put(next, draftKey, null);
      return next;
    });
    notify("这一步已经完成。可以在学习足迹查看记录，错题会进入复习队列。");
    onClose();
  };
  const next = () => {
    if (step === questions.length - 1) finish();
    else {
      setStep((n) => n + 1);
      setAnswer("");
      setChecked(false);
    }
  };
  const quiz = (
    <>
      <p className="subtle">
        第 {step + 1} / {questions.length} 题
      </p>
      <h3>{question.prompt}</h3>
      {question.options.map((o) => (
        <button
          className={"option " + (answer === o ? "selected" : "")}
          key={o}
          onClick={() => {
            setAnswer(o);
            setChecked(false);
          }}
        >
          {o}
        </button>
      ))}
      {checked && (
        <div
          className={
            answer === question.options[question.answer]
              ? "feedback correct"
              : "feedback"
          }
        >
          {answer === question.options[question.answer]
            ? "理解正确。"
            : "还差一点，再试一次。"}{" "}
          {question.explanation}
        </div>
      )}
      <div className="lesson-actions">
        <button className="secondary" disabled={!answer} onClick={check}>
          检查答案
        </button>
        {checked && answer === question.options[question.answer] && (
          <button className="primary" onClick={next}>
            {step === questions.length - 1 ? "完成本节" : "下一题"}{" "}
            <ArrowRight size={15} />
          </button>
        )}
      </div>
    </>
  );
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        className="lesson-modal extended"
        role="dialog"
        aria-modal="true"
        aria-label={skillNames[skill]}
      >
        <button className="modal-close" aria-label="关闭课程" onClick={onClose}>
          <X size={20} />
        </button>
        <span className="eyebrow">
          {unit.level} · {skillNames[skill]} · 专注 {Math.floor(seconds / 60)}:
          {String(seconds % 60).padStart(2, "0")}
        </span>
        <h2>{unit.title}</h2>
        {skill === "listen" && (
          <>
            <Audio
              unit={unit}
              onSentence={(index) => {
                setSentence(index);
                setDictation("");
                setDictated(false);
              }}
            />
            <button
              className="text-button"
              onClick={() => setShowText(!showText)}
            >
              {showText ? "收起全文" : "查看全文与词汇"}
            </button>
            {showText && <p className="passage">{unit.passage}</p>}
            <h3>听写当前句 · 第 {sentence + 1} 句</h3>
            <textarea
              aria-label="听写输入"
              value={dictation}
              onChange={(e) => {
                setDictation(e.target.value);
                setDictated(false);
              }}
              placeholder="听一听，写下当前句。忽略大小写和标点。"
            />
            <button
              className="secondary"
              disabled={!dictation.trim()}
              onClick={() => setDictated(true)}
            >
              核对听写
            </button>
            {dictated && (
              <div
                className={
                  normalize(dictation) === normalize(parts[sentence])
                    ? "feedback correct"
                    : "feedback"
                }
              >
                {normalize(dictation) === normalize(parts[sentence])
                  ? "听写正确！"
                  : "对照原句，再听一次："}
                <p>{parts[sentence]}</p>
              </div>
            )}
            <details className="listening-quiz">
              <summary>继续：检验全文理解</summary>
              {quiz}
            </details>
          </>
        )}
        {skill === "read" && (
          <>
            <p className="passage selectable-passage">{unit.passage}</p>
            {quiz}
          </>
        )}
        {skill === "grammar" && (
          <>
            <div className="grammar-note">
              <span className="pill">{unit.focus}</span>
              <p>{unit.rule}</p>
              <strong>{unit.example}</strong>
            </div>
            {quiz}
          </>
        )}
        {skill === "translate" && (
          <>
            <p className="subtle">
              英译中 · 自主表达后对照讲解。不使用关键词匹配冒充自动评分。
            </p>
            <p className="passage">{parts[translations[unit.id] ?? 0]}</p>
            <label htmlFor="course-translation">你的翻译（自动保存草稿）</label>
            <textarea
              id="course-translation"
              value={translation}
              onChange={(e) => {
                const value = e.target.value;
                setTranslation(value);
                setChecked(false);
                setStore((s) => put(s, draftKey, value));
              }}
              maxLength={10000}
            />
            <button
              className="secondary"
              disabled={!translation.trim()}
              onClick={() => setChecked(true)}
            >
              对照参考
            </button>
            {checked && (
              <div className="feedback correct">
                <strong>参考译文</strong>
                <p>{unit.translation}</p>
                <p>
                  检查主语、动作、时态、否定与范围词是否保留。不同的自然表达均可能成立。
                </p>
                <p>本节知识点：{unit.rule}</p>
                <button className="primary" onClick={finish}>
                  完成翻译自查 <Check size={15} />
                </button>
              </div>
            )}
          </>
        )}
        <section className="unit-vocabulary">
          <h3>带走几个词</h3>
          {unit.words.map((w) => (
            <button
              className="word-chip"
              key={w.word}
              onClick={() => saveWord(w)}
            >
              <Plus size={13} />
              <strong>{w.word}</strong>
              <span>{w.meaning}</span>
            </button>
          ))}
        </section>
      </section>
    </div>
  );
}
export function ReviewCenter({ store, setStore, notify }: Shared) {
  const [tab, setTab] = useState("due");
  const [revealed, setRevealed] = useState(false);
  const [offset, setOffset] = useState(0);
  const words = list<Word>(store, "word");
  const mistakes = list<Mistake>(store, "mistake");
  const cards = [
    ...mistakes.map(([id, m]) => ({
      id,
      front: m.prompt,
      back: m.answer,
      detail: m.explanation,
      source: m.source,
    })),
    ...words.map(([id, w]) => ({
      id,
      front: w.word,
      back: w.meaning,
      detail: w.example,
      source: w.source,
    })),
  ];
  const due = cards.filter(
    (c) => (get<Recall>(store, `recall:${c.id}`)?.due || 0) <= Date.now(),
  );
  const filtered =
    tab === "words"
      ? cards.filter((c) => c.id.startsWith("word:"))
      : tab === "mistakes"
        ? cards.filter((c) => c.id.startsWith("mistake:"))
        : due;
  const card = filtered[offset % Math.max(filtered.length, 1)];
  return (
    <>
      <div className="eyebrow">MAKE IT STICK</div>
      <h1>温故，也能知新</h1>
      <p className="page-description">
        错题自动收集，生词由你挑选。每张卡片单独安排复习，记得轻松就隔久一点。
      </p>
      <div className="filters">
        {[
          ["due", `到期复习 ${due.length}`],
          ["mistakes", `错题本 ${mistakes.length}`],
          ["words", `生词本 ${words.length}`],
        ].map(([id, label]) => (
          <button
            className={tab === id ? "primary" : "secondary"}
            key={id}
            onClick={() => {
              setTab(id);
              setRevealed(false);
              setOffset(0);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {card ? (
        <section className="review-card">
          <span className="pill">{card.source}</span>
          <h2>{card.front}</h2>
          {revealed ? (
            <>
              <div className="answer-reveal">
                {card.back}
                <small>{card.detail}</small>
              </div>
              <div className="review-actions">
                {(
                  [
                    ["again", "还没记住"],
                    ["good", "记住了"],
                    ["easy", "很轻松"],
                  ] as const
                ).map(([rating, label]) => (
                  <button
                    className="secondary"
                    key={rating}
                    onClick={() => {
                      setStore((s) =>
                        put(
                          s,
                          `recall:${card.id}`,
                          schedule(get(s, `recall:${card.id}`), rating),
                        ),
                      );
                      setRevealed(false);
                      if (tab !== "due") setOffset((n) => n + 1);
                      notify(
                        rating === "again"
                          ? "已安排 10 分钟后复习"
                          : "已根据记忆情况安排下次复习",
                      );
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <button className="primary" onClick={() => setRevealed(true)}>
              翻开答案 <RotateCcw size={15} />
            </button>
          )}
          <div className="toolbar">
            <button
              className="text-button"
              onClick={() => {
                setOffset((n) => n + 1);
                setRevealed(false);
              }}
            >
              换一张
            </button>
            <button
              className="text-button"
              onClick={() => {
                setStore((s) =>
                  put(put(s, card.id, null), `recall:${card.id}`, null),
                );
                setRevealed(false);
              }}
            >
              从本子移除
            </button>
          </div>
          {get<Recall>(store, `recall:${card.id}`) && (
            <p className="subtle">
              下次复习：
              {new Date(
                get<Recall>(store, `recall:${card.id}`)!.due,
              ).toLocaleString("zh-CN")}
            </p>
          )}
        </section>
      ) : (
        <section className="simple-card">
          <BookOpen />
          <h2>{tab === "due" ? "暂时没有到期卡片" : "这里还没有记录"}</h2>
          <p>
            进入成长路径完成练习，错误会自动收集；点击课程底部的词汇即可加入生词本。
          </p>
        </section>
      )}
    </>
  );
}
export function DetailedStats({ store }: Pick<Shared, "store">) {
  const sessions = list<Session>(store, "session")
    .map(([, s]) => s)
    .sort((a, b) => a.date.localeCompare(b.date));
  const total = sessions.reduce((n, s) => n + s.seconds, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    const label = date.toLocaleDateString("zh-CN", {
      month: "numeric",
      day: "numeric",
    });
    const seconds = sessions
      .filter((s) => new Date(s.date).toDateString() === date.toDateString())
      .reduce((n, s) => n + s.seconds, 0);
    return { label, seconds };
  });
  return (
    <>
      <div className="eyebrow">REAL STEPS, REAL PROGRESS</div>
      <h1>看见自己的成长</h1>
      <div className="stats-grid">
        {[
          [list(store, "done").length, "进阶课程完成数"],
          [(total / 60).toFixed(1), "实际专注分钟"],
          [list(store, "mistake").length, "待巩固错题"],
        ].map(([n, l]) => (
          <section className="stat-box" key={l}>
            <strong>{n}</strong>
            <p>{l}</p>
          </section>
        ))}
      </div>
      <section className="simple-card">
        <h2>最近七天 · 完成课程中的专注时间</h2>
        <div className="activity-bars">
          {days.map((d) => (
            <div key={d.label}>
              <span>{(d.seconds / 60).toFixed(1)} 分</span>
              <div className="bar-track">
                <div
                  style={{
                    height: `${d.seconds ? Math.max(4, (d.seconds / Math.max(...days.map((x) => x.seconds), 1)) * 100) : 0}%`,
                  }}
                />
              </div>
              <small>{d.label}</small>
            </div>
          ))}
        </div>
        <p className="subtle">
          只记录完成进阶课程时页面可见、窗口有焦点的时间。旧版首页示例的估算分钟单独保留，不计入此统计。
        </p>
      </section>
      <section className="simple-card">
        <h2>最近完成</h2>
        {sessions.length ? (
          sessions
            .slice(-15)
            .reverse()
            .map((s, i) => (
              <p key={i}>
                {[...units, ...customUnits(store)].find((u) => u.id === s.unit)
                  ?.title || s.unit}{" "}
                · {skillNames[s.skill as Skill] || s.skill}{" "}
                <span className="subtle">
                  {new Date(s.date).toLocaleString("zh-CN")} · {s.seconds} 秒
                </span>
              </p>
            ))
        ) : (
          <p>完成成长路径中的课程后，这里就会留下真实记录。</p>
        )}
      </section>
    </>
  );
}
export function LibraryTools({ store, setStore, notify }: Shared) {
  const [error, setError] = useState("");
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  return (
    <>
      <section className="simple-card">
        <h2>个人素材 · 导入课程</h2>
        <p>
          导入有权使用的文字教材，按结构加入听、读、译、语法练习。先下载模板，编辑后导入
          JSON。素材会保存在本机；共享同步连接后，文字也会同步，音频保留在各设备。
        </p>
        <div className="toolbar">
          <button
            className="secondary"
            onClick={() =>
              download(
                "grove-course-template.json",
                JSON.stringify(
                  { ...units[0], id: "my-first-unit", title: "我的第一课" },
                  null,
                  2,
                ),
              )
            }
          >
            <Download size={15} /> 下载课程模板
          </button>
          <label className="file-button">
            导入课程 JSON
            <input
              type="file"
              accept="application/json,.json"
              aria-label="导入课程 JSON"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  if (f.size > 200000)
                    throw new Error("课程文件不能超过 200 KB");
                  const u: unknown = JSON.parse(await f.text());
                  if (!validateUnit(u))
                    throw new Error(
                      "课程结构不完整，请按照模板填写问题、选项、正确答案索引和解析",
                    );
                  const unit = {
                    ...u,
                    id: u.id.startsWith("custom-") ? u.id : `custom-${u.id}`,
                  };
                  if (
                    customUnits(store).length >= 30 &&
                    !customUnits(store).some((c) => c.id === unit.id)
                  )
                    throw new Error(
                      "最多保存 30 个个人单元，请先删除不用的课程",
                    );
                  setStore((s) => put(s, `custom:${unit.id}`, unit));
                  setError("");
                  notify("课程已导入，可在成长路径中学习。");
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        {customUnits(store).map((u) => (
          <p key={u.id}>
            {u.title}{" "}
            <button
              className="text-button"
              onClick={() => {
                if (
                  window.confirm(`删除个人课程“${u.title}”？学习记录仍会保留。`)
                )
                  setStore((s) => put(s, `custom:${u.id}`, null));
              }}
            >
              删除课程
            </button>
          </p>
        ))}
      </section>
      <section className="simple-card">
        <h2>随手拾起一个词</h2>
        <div className="form-row">
          <input
            aria-label="新单词"
            placeholder="英文单词或短语"
            maxLength={160}
            value={word}
            onChange={(e) => setWord(e.target.value)}
          />
          <input
            aria-label="单词释义"
            placeholder="自己的释义或备注"
            maxLength={500}
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
          />
          <button
            className="primary"
            disabled={!word.trim() || !meaning.trim()}
            onClick={() => {
              const key = `word:personal:${makeID()}`;
              setStore((s) =>
                put(s, key, {
                  word: word.trim(),
                  meaning: meaning.trim(),
                  example: "",
                  source: "个人收藏",
                } satisfies Word),
              );
              setWord("");
              setMeaning("");
              notify("已加入生词本");
            }}
          >
            收藏
          </button>
        </div>
      </section>
    </>
  );
}
export function DataSettings({
  store,
  setStore,
  notify,
  sync,
  syncStatus,
}: Shared & { sync: () => Promise<void>; syncStatus: string }) {
  const [error, setError] = useState("");
  const [token, setToken] = useState(
    () => localStorage.getItem("grove-sync-token") || "",
  );
  return (
    <>
      <section className="simple-card">
        <h2>每天一点，适合自己的节奏</h2>
        <div className="filters">
          {[3, 5, 15, 25].map((n) => (
            <button
              key={n}
              className={
                (get<number>(store, "pref:daily") || 5) === n
                  ? "primary"
                  : "secondary"
              }
              onClick={() => setStore((s) => put(s, "pref:daily", n))}
            >
              {n} 分钟
            </button>
          ))}
        </div>
        <p>这是学习时间目标，不会锁定课程或因未达标惩罚你。</p>
        <h2>电脑、手机、平板共享进度</h2>
        <p>
          双击 Windows 测试包的 Start.cmd 后，所有设备连接同一
          Wi-Fi，打开窗口里的地址。每台设备输入窗口显示的配对码，再点击连接。课程进度、生词、错题和草稿会合并到电脑保存；合成语音和个人音频仍由设备提供。
        </p>
        <div className="form-row">
          <input
            aria-label="共享服务配对码"
            placeholder="输入启动窗口的配对码"
            value={token}
            type="password"
            autoComplete="off"
            onChange={(e) => setToken(e.target.value)}
          />
          <button
            className="primary"
            disabled={!token.trim()}
            onClick={() => {
              localStorage.setItem("grove-sync-token", token.trim());
              void sync();
            }}
          >
            连接并同步
          </button>
        </div>
        <p role="status">{syncStatus}</p>
        <p className="subtle">
          这是可信家庭局域网的单一共享学习档案，连接后每 10
          秒同步一次；电脑需保持运行。不是公网账号服务。离线修改会保留，重新连接后再次同步即可合并。请勿将此
          HTTP 端口开放到公网。
        </p>
      </section>
      <section className="simple-card">
        <h2>数据备份与迁移</h2>
        <div className="toolbar">
          <button
            className="secondary"
            onClick={() =>
              download(
                "grove-learning-backup.json",
                JSON.stringify(store, null, 2),
              )
            }
          >
            <Download size={15} /> 导出完整学习备份
          </button>
          <label className="file-button">
            导入并合并备份
            <input
              aria-label="导入学习备份"
              type="file"
              accept="application/json,.json"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  if (f.size > 4 * 1024 * 1024)
                    throw new Error("备份不能超过 4 MB");
                  const data: unknown = JSON.parse(await f.text());
                  if (!validateStore(data))
                    throw new Error("无效的学习备份，未修改现有数据");
                  setStore((s) => mergeStores(s, data));
                  setError("");
                  notify("已合并备份，较新的记录优先，删除记录也会保留。");
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <p className="subtle">
          完整备份包括进阶课程、生词、错题、复习、个人文字课程和草稿，不含个人音频与旧版首页示例进度。旧版数据可使用下方导出按钮单独保存。
        </p>
      </section>
    </>
  );
}
