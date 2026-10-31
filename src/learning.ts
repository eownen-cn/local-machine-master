export type Progress = { completed: string[]; reviewAt: number | null; assessment: number | null; minutes: number };
export const initialProgress: Progress = { completed: [], reviewAt: null, assessment: null, minutes: 0 };
export function completeLesson(progress: Progress, id: string, now = Date.now()): Progress {
 if (progress.completed.includes(id)) return progress;
 return { ...progress, completed: [...progress.completed, id], minutes: progress.minutes + 5, reviewAt: now + 86400000 };
}
export function nextReview(rating: 'again' | 'good' | 'easy', now = Date.now()) { return now + ({again: 10 * 60000, good: 86400000, easy: 3 * 86400000})[rating]; }
export function loadProgress(): Progress {
 try { const p = JSON.parse(localStorage.getItem('grove-progress') || 'null');
 return p && Array.isArray(p.completed) && p.completed.every((x: unknown) => typeof x === 'string') && (p.reviewAt === null || typeof p.reviewAt === 'number') && (p.assessment === null || typeof p.assessment === 'number') && typeof p.minutes === 'number' ? p : initialProgress;
 } catch { return initialProgress; }
}
