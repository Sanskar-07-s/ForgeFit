// ForgeFit AI - Global Search Engine (v4.3)

import { Exercise, Workout, Challenge, Post } from '../shared/types';

export interface SearchResults {
  exercises: Exercise[];
  workouts: Workout[];
  challenges: Challenge[];
  posts: Post[];
  totalMatches: number;
}

/**
 * Normalizes strings for keyword searches.
 */
const cleanString = (str?: string): string => {
  return (str || '').toLowerCase().trim();
};

/**
 * Searches across all entity collections with scoring and returns lists of matching records.
 */
export const queryGlobalEntities = (
  query: string,
  exercises: Exercise[],
  workouts: Workout[],
  challenges: Challenge[],
  posts: Post[]
): SearchResults => {
  const cleanQuery = cleanString(query);

  if (!cleanQuery) {
    return { exercises: [], workouts: [], challenges: [], posts: [], totalMatches: 0 };
  }

  // 1. Search Exercises
  const matchedExercises = exercises.filter(
    (ex) =>
      cleanString(ex.name).includes(cleanQuery) ||
      cleanString(ex.description).includes(cleanQuery) ||
      cleanString(ex.muscle_group).includes(cleanQuery) ||
      ex.secondary_muscles.some(m => cleanString(m).includes(cleanQuery))
  );

  // 2. Search Workouts
  const matchedWorkouts = workouts.filter(
    (w) =>
      cleanString(w.name).includes(cleanQuery) ||
      cleanString(w.split_type).includes(cleanQuery)
  );

  // 3. Search Challenges
  const matchedChallenges = challenges.filter(
    (c) =>
      cleanString(c.name).includes(cleanQuery) ||
      cleanString(c.description).includes(cleanQuery)
  );

  // 4. Search Posts
  const matchedPosts = posts.filter(
    (p) => cleanString(p.content).includes(cleanQuery)
  );

  const totalMatches =
    matchedExercises.length +
    matchedWorkouts.length +
    matchedChallenges.length +
    matchedPosts.length;

  return {
    exercises: matchedExercises,
    workouts: matchedWorkouts,
    challenges: matchedChallenges,
    posts: matchedPosts,
    totalMatches,
  };
};

/**
 * Lightweight debouncer helper for query UI interfaces.
 */
export const debounceSearch = <T extends (...args: any[]) => void>(
  func: T,
  delayMs: number
): ((...args: Parameters<T>) => void) => {
  let timer: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, delayMs);
  };
};
