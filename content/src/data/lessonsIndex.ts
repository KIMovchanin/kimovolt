import { LESSONS_PART_1 } from './lessonsPart1';
import { LESSONS_PART_2 } from './lessonsPart2';
import { LESSONS_PART_3 } from './lessonsPart3';
import type { LessonDefinition } from '../schema';

export const LESSONS: LessonDefinition[] = [
  ...LESSONS_PART_1,
  ...LESSONS_PART_2,
  ...LESSONS_PART_3,
].sort((a, b) => a.order - b.order);

export function getLessonById(id: string): LessonDefinition | undefined {
  return LESSONS.find((l) => l.id === id);
}
