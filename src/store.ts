import { validateUnit, type Unit } from "./content.ts";
export type Rating = "again" | "good" | "easy";
export type Entry = { at: number; value: unknown };
export type Store = { version: 2; entries: Record<string, Entry> };
export type Word = {
  word: string;
  meaning: string;
  example: string;
  source: string;
};
export type Mistake = {
  prompt: string;
  answer: string;
  explanation: string;
  source: string;
};
export type Recall = { due: number; interval: number; count: number };
export type Session = {
  unit: string;
  skill: string;
  seconds: number;
  date: string;
};
export const emptyStore = (): Store => ({ version: 2, entries: {} });
export const storeKey = "grove-learning-v2";
const bounded = (v: unknown, max = 2000): v is string =>
  typeof v === "string" && v.length <= max;
export function validEntry(key: string, e: unknown): e is Entry {
  if (
    !/^(done|word|mistake|recall|session|draft|custom|pref):[\w\-:.]{1,180}$/.test(
      key,
    ) ||
    !e ||
    typeof e !== "object"
  )
    return false;
  const { at, value: v } = e as Entry;
  if (!Number.isFinite(at) || at < 0) return false;
  if (v === null) return true;
  const t = key.split(":")[0];
  const o = v as Record<string, unknown>;
  if (t === "done") return v === true;
  if (t === "draft") return bounded(v, 20000);
  if (t === "pref") return typeof v === "number" && [3, 5, 15, 25].includes(v);
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  if (t === "custom") return validateUnit(v);
  if (t === "word")
    return (
      bounded(o.word, 160) &&
      !!o.word &&
      bounded(o.meaning, 500) &&
      bounded(o.example, 2000) &&
      bounded(o.source, 160)
    );
  if (t === "mistake")
    return (
      bounded(o.prompt) &&
      bounded(o.answer) &&
      bounded(o.explanation) &&
      bounded(o.source, 160)
    );
  if (t === "recall")
    return ["due", "interval", "count"].every(
      (k) =>
        typeof o[k] === "number" &&
        Number.isFinite(o[k]) &&
        (o[k] as number) >= 0,
    );
  if (t === "session")
    return (
      bounded(o.unit, 160) &&
      bounded(o.skill, 30) &&
      typeof o.seconds === "number" &&
      Number.isFinite(o.seconds) &&
      o.seconds >= 0 &&
      o.seconds <= 86400 &&
      bounded(o.date, 30)
    );
  return false;
}
export function validateStore(v: unknown): v is Store {
  if (!v || typeof v !== "object") return false;
  const s = v as Store;
  return (
    s.version === 2 &&
    !!s.entries &&
    typeof s.entries === "object" &&
    !Array.isArray(s.entries) &&
    Object.keys(s.entries).length <= 20000 &&
    Object.entries(s.entries).every(([k, e]) => validEntry(k, e))
  );
}
export function mergeStores(a: Store, b: Store): Store {
  const entries = { ...a.entries };
  for (const [key, e] of Object.entries(b.entries)) {
    const old = entries[key];
    if (
      !old ||
      e.at > old.at ||
      (e.at === old.at && JSON.stringify(e.value) > JSON.stringify(old.value))
    )
      entries[key] = e;
  }
  return { version: 2, entries };
}
export function put(
  s: Store,
  key: string,
  value: unknown,
  now = Date.now(),
): Store {
  const entry = { at: Math.max(now, (s.entries[key]?.at || 0) + 1), value };
  if (!validEntry(key, entry)) throw new Error("数据格式无效");
  return { version: 2, entries: { ...s.entries, [key]: entry } };
}
export function list<T>(s: Store, prefix: string): [string, T][] {
  return Object.entries(s.entries)
    .filter(([k, e]) => k.startsWith(prefix + ":") && e.value !== null)
    .map(([k, e]) => [k, e.value as T]);
}
export function get<T>(s: Store, key: string): T | undefined {
  return s.entries[key]?.value as T | undefined;
}
export function readStore() {
  try {
    const s = JSON.parse(localStorage.getItem(storeKey) || "null");
    return validateStore(s) ? s : emptyStore();
  } catch {
    return emptyStore();
  }
}
export function schedule(
  previous: Recall | undefined,
  rating: Rating,
  now = Date.now(),
): Recall {
  const interval =
    rating === "again"
      ? 600000
      : Math.min(
          90 * 86400000,
          Math.max(86400000, previous?.interval || 0) *
            (rating === "easy" ? 3 : previous ? 2 : 1),
        );
  return { due: now + interval, interval, count: (previous?.count || 0) + 1 };
}
export function customUnits(s: Store): Unit[] {
  return list<Unit>(s, "custom").map(([, u]) => u);
}
export function download(
  name: string,
  data: string,
  type = "application/json",
) {
  const u = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
