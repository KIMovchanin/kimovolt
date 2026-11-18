import type { LessonDefinition, LocalizedText, MisconceptionCode } from '../schema';

export type LessonNodeStatus =
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'mastered'
  | 'needs_review';

export interface SkillMasteryRecord {
  skillId: string;
  mastery: number; // 0..100
  attempts: number;
  correctFirstTry: number;
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
  reviewIntervalIndex: number; // 0..4 => [4h, 1d, 3d, 7d, 21d]
}

export interface LessonProgressRecord {
  lessonId: string;
  version: number;
  status: 'not_started' | 'in_progress' | 'completed';
  currentStepIndex: number;
  completedStepIds: string[];
  attempts: number;
  hintsUsed: number;
  mistakes: number;
  bestScore: number; // 0..100
  completedAt: string | null;
}

export interface NotebookEntry {
  id: string;
  kind: 'takeaway' | 'note' | 'measurement' | 'mistake' | 'formula' | 'circuit';
  title: string;
  body: string;
  formula?: string;
  lessonId?: string;
  createdAt: string;
}

export interface UserProgressState {
  xp: number;
  streakDays: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  lessons: Record<string, LessonProgressRecord>;
  skills: Record<string, SkillMasteryRecord>;
  achievements: string[];
  misconceptionCounts: Partial<Record<MisconceptionCode, number>>;
  notebook: NotebookEntry[];
  inspectedComponentTypes: string[];
  easterEggsFound: string[];
}

export const SRS_INTERVAL_HOURS = [4, 24, 72, 168, 504] as const; // 4h, 1d, 3d, 7d, 21d

export function createEmptyProgressState(): UserProgressState {
  return {
    xp: 0,
    streakDays: 0,
    lastActiveDate: null,
    lessons: {},
    skills: {},
    achievements: [],
    misconceptionCounts: {},
    notebook: [],
    inspectedComponentTypes: [],
    easterEggsFound: [],
  };
}

/**
 * Applies time-based gentle mastery decay when a skill hasn't been reviewed past its SRS deadline.
 */
export function getEffectiveSkillMastery(record: SkillMasteryRecord | undefined, nowMs = Date.now()): number {
  if (!record) return 0;
  if (!record.nextReviewAt) return record.mastery;
  const dueMs = Date.parse(record.nextReviewAt);
  if (!Number.isFinite(dueMs) || nowMs <= dueMs) {
    return record.mastery;
  }
  const overdueDays = (nowMs - dueMs) / (24 * 3600 * 1000);
  const penalty = Math.min(20, Math.floor(overdueDays * 2.5));
  return Math.max(0, record.mastery - penalty);
}

export function isSkillDueForReview(record: SkillMasteryRecord | undefined, nowMs = Date.now()): boolean {
  if (!record || !record.nextReviewAt || record.mastery < 25) return false;
  const dueMs = Date.parse(record.nextReviewAt);
  return Number.isFinite(dueMs) && nowMs >= dueMs;
}

export function computeLessonStatus(
  lesson: LessonDefinition,
  state: UserProgressState,
  nowMs = Date.now()
): LessonNodeStatus {
  const rec = state.lessons[lesson.id];
  const prereqsDone = lesson.prerequisites.every((pid) => state.lessons[pid]?.status === 'completed');

  if (!prereqsDone && (!rec || rec.status === 'not_started')) {
    return 'locked';
  }

  if (!rec || rec.status === 'not_started') {
    return 'available';
  }

  if (rec.status === 'in_progress') {
    return 'in_progress';
  }

  const anyDue = lesson.skillIds.some((sid) => isSkillDueForReview(state.skills[sid], nowMs));
  if (anyDue) {
    return 'needs_review';
  }

  const avgMastery =
    lesson.skillIds.length > 0
      ? lesson.skillIds.reduce((acc, sid) => acc + getEffectiveSkillMastery(state.skills[sid], nowMs), 0) /
        lesson.skillIds.length
      : rec.bestScore;

  if (avgMastery >= 82 && rec.bestScore >= 85) {
    return 'mastered';
  }

  return 'completed';
}

export function recordSkillAttempt(
  state: UserProgressState,
  skillIds: string[],
  params: {
    passed: boolean;
    firstTry: boolean;
    hintsUsed: number;
    difficulty: 1 | 2 | 3;
    misconceptionCode?: MisconceptionCode;
    nowIso?: string;
  }
): UserProgressState {
  const nowIso = params.nowIso ?? new Date().toISOString();
  const nowMs = Date.parse(nowIso);
  const nextSkills = { ...state.skills };
  const nextMisconceptions = { ...state.misconceptionCounts };

  if (!params.passed && params.misconceptionCode) {
    nextMisconceptions[params.misconceptionCode] = (nextMisconceptions[params.misconceptionCode] ?? 0) + 1;
  }

  for (const sid of skillIds) {
    const prev: SkillMasteryRecord = nextSkills[sid] ?? {
      skillId: sid,
      mastery: 0,
      attempts: 0,
      correctFirstTry: 0,
      lastPracticedAt: null,
      nextReviewAt: null,
      reviewIntervalIndex: 0,
    };

    let delta = 0;
    let nextIntervalIdx = prev.reviewIntervalIndex;

    if (params.passed) {
      const diffBonus = params.difficulty * 4;
      const baseGain = params.firstTry ? 18 + diffBonus : 11 + Math.floor(diffBonus / 2);
      const hintPenalty = Math.min(8, params.hintsUsed * 3);
      delta = Math.max(4, baseGain - hintPenalty);
      if (params.firstTry && params.hintsUsed === 0) {
        nextIntervalIdx = Math.min(SRS_INTERVAL_HOURS.length - 1, prev.reviewIntervalIndex + 1);
      }
    } else {
      delta = -4;
      nextIntervalIdx = Math.max(0, prev.reviewIntervalIndex - 1);
    }

    const updatedMastery = Math.max(0, Math.min(100, prev.mastery + delta));
    const hours = SRS_INTERVAL_HOURS[nextIntervalIdx] ?? 24;
    const nextReviewMs = nowMs + hours * 3600 * 1000;

    nextSkills[sid] = {
      skillId: sid,
      mastery: updatedMastery,
      attempts: prev.attempts + 1,
      correctFirstTry: prev.correctFirstTry + (params.passed && params.firstTry ? 1 : 0),
      lastPracticedAt: nowIso,
      nextReviewAt: params.passed ? new Date(nextReviewMs).toISOString() : prev.nextReviewAt,
      reviewIntervalIndex: nextIntervalIdx,
    };
  }

  return {
    ...state,
    skills: nextSkills,
    misconceptionCounts: nextMisconceptions,
  };
}

export function updateStreakAndXp(state: UserProgressState, xpEarned: number, now = new Date()): UserProgressState {
  const today = now.toISOString().slice(0, 10);
  let nextStreak = state.streakDays;

  if (!state.lastActiveDate) {
    nextStreak = 1;
  } else if (state.lastActiveDate !== today) {
    const prevMs = Date.parse(`${state.lastActiveDate}T00:00:00Z`);
    const todayMs = Date.parse(`${today}T00:00:00Z`);
    const diffDays = Math.round((todayMs - prevMs) / (24 * 3600 * 1000));
    // Gentle non-punitive streak: consecutive day +1; missed days start gently at 1 without harsh loss penalty
    nextStreak = diffDays === 1 ? state.streakDays + 1 : 1;
  }

  return {
    ...state,
    xp: state.xp + Math.max(0, xpEarned),
    streakDays: nextStreak,
    lastActiveDate: today,
  };
}

export function evaluateAchievements(state: UserProgressState): string[] {
  const unlocked = new Set(state.achievements);
  const completedLessons = Object.values(state.lessons).filter((l) => l.status === 'completed');

  if (completedLessons.some((l) => l.lessonId === 'm0-first-led')) {
    unlocked.add('FIRST_SPARK');
  }

  if ((state.skills.ohms_law?.attempts ?? 0) >= 4 && (state.skills.ohms_law?.mastery ?? 0) >= 60) {
    unlocked.add('OHM_SWEET_OHM');
  }

  if (completedLessons.some((l) => l.hintsUsed === 0 && l.mistakes === 0 && l.lessonId.includes('diag'))) {
    unlocked.add('NO_SHORTCUTS');
  }

  if (completedLessons.some((l) => l.lessonId === 'm6-diagnostics-beacon')) {
    unlocked.add('THE_DEBUGGER');
  }

  if (completedLessons.some((l) => l.lessonId === 'm10-oscilloscope-pwm')) {
    unlocked.add('SIGNAL_HUNTER');
  }

  if (completedLessons.filter((l) => l.mistakes === 0).length >= 3) {
    unlocked.add('ZERO_GUESSWORK');
  }

  if (completedLessons.length >= 6) {
    unlocked.add('CIRCUIT_WHISPERER');
  }

  if (completedLessons.length >= 12) {
    unlocked.add('MASTER_OF_CURRENT');
  }

  if (state.inspectedComponentTypes.length >= 8) {
    unlocked.add('COMPONENT_SCHOLAR');
  }

  if (state.easterEggsFound.includes('42_OHM')) {
    unlocked.add('ANSWER_42');
  }

  return [...unlocked];
}

export function createLessonNotebookTakeaway(
  lesson: LessonDefinition,
  lang: 'ru' | 'en',
  nowIso = new Date().toISOString()
): NotebookEntry {
  return {
    id: `takeaway-${lesson.id}`,
    kind: 'takeaway',
    title: lesson.title[lang],
    body: lesson.notebookTakeaway[lang],
    formula: lesson.notebookFormula,
    lessonId: lesson.id,
    createdAt: nowIso,
  };
}

export function formatLocalized(text: LocalizedText, lang: 'ru' | 'en'): string {
  return text[lang];
}
