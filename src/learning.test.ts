import { describe, it, expect } from "vitest";
import { completeLesson, initialProgress, nextReview } from "./learning";
describe("learning progress", () => {
  it("completes a lesson once and schedules tomorrow", () => {
    const p = completeLesson(initialProgress, "listen", 1000);
    expect(p.completed).toEqual(["listen"]);
    expect(p.minutes).toBe(5);
    expect(p.reviewAt).toBe(86401000);
    expect(completeLesson(p, "listen", 2000)).toEqual(p);
    expect(initialProgress.completed).toEqual([]);
  });
  it("uses distinct review intervals for recall difficulty", () => {
    expect(nextReview("again", 0)).toBe(600000);
    expect(nextReview("good", 0)).toBe(86400000);
    expect(nextReview("easy", 0)).toBe(259200000);
  });
});
