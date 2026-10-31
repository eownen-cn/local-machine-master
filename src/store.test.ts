import { describe, it, expect } from "vitest";
import {
  emptyStore,
  put,
  mergeStores,
  list,
  schedule,
  validateStore,
} from "./store";
import { units, validateUnit, sentences, normalize } from "./content";
describe("curriculum integrity", () => {
  it("provides eight valid unique units and all question answers exist", () => {
    expect(units).toHaveLength(8);
    expect(new Set(units.map((u) => u.id)).size).toBe(8);
    for (const u of units) {
      expect(validateUnit(u)).toBe(true);
      expect(sentences(u).length).toBeGreaterThan(3);
      for (const q of [...u.reading, u.grammar])
        expect(q.options[q.answer]).toBeTruthy();
    }
  });
  it("normalizes dictation without ignoring missing words", () => {
    expect(normalize("She’s HERE!")).toBe(normalize("shes here"));
    expect(normalize("she is here")).not.toBe(normalize("she here"));
  });
});
describe("learning data and offline merge", () => {
  it("merges independent device edits without dropping either", () => {
    const a = put(emptyStore(), "done:morning:listen", true, 1);
    const b = put(emptyStore(), "pref:daily", 15, 2);
    expect(list(mergeStores(a, b), "done")).toHaveLength(1);
    expect(mergeStores(a, b)).toEqual(mergeStores(b, a));
  });
  it("keeps newer deletion tombstones and is idempotent", () => {
    const a = put(emptyStore(), "draft:morning:translate", "你好", 100);
    const b = put(a, "draft:morning:translate", null, 101);
    expect(mergeStores(a, b)).toEqual(b);
    expect(mergeStores(b, a)).toEqual(b);
    expect(mergeStores(b, b)).toEqual(b);
  });
  it("uses monotonic timestamps when wall clocks go backwards", () => {
    const a = put(emptyStore(), "pref:daily", 5, 100);
    expect(put(a, "pref:daily", 15, 1).entries["pref:daily"].at).toBe(101);
  });
  it("rejects corrupt, oversized and hostile backups", () => {
    expect(
      validateStore(
        JSON.parse(
          '{"version":2,"entries":{"__proto__":{"at":0,"value":true}}}',
        ),
      ),
    ).toBe(false);
    expect(
      validateStore({
        version: 2,
        entries: { "done:x": { at: NaN, value: true } },
      }),
    ).toBe(false);
    expect(
      validateStore({
        version: 2,
        entries: { "pref:daily": { at: 0, value: 999 } },
      }),
    ).toBe(false);
    expect(
      validateStore({
        version: 2,
        entries: { "custom:x": { at: 0, value: { id: "x" } } },
      }),
    ).toBe(false);
    expect(() => put(emptyStore(), "bad:key", "x")).toThrow();
  });
  it("schedules each card independently and caps long intervals", () => {
    expect(schedule(undefined, "again", 0).due).toBe(600000);
    const first = schedule(undefined, "good", 0);
    expect(first.due).toBe(86400000);
    expect(schedule(first, "good", 0).interval).toBe(172800000);
    expect(
      schedule({ due: 0, interval: 90 * 86400000, count: 10 }, "easy", 0)
        .interval,
    ).toBe(90 * 86400000);
  });
});
