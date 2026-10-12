import { UTCDate } from '@date-fns/utc';
import { format, subDays } from 'date-fns';
import type { LoggedWorkoutRepresentation } from '../../../training-log/application/logged-workout.representation.interface.js';

// How the Telegram bot writes Training Progress' values. Days and times are UTC, as training periods are.

const ICONS: Record<string, string> = { CYCLING: '🚴', RUNNING: '🏃', WALKING: '🚶', ROWING: '🚣' };
const decimal = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });
const integer = new Intl.NumberFormat('en');

/** `CYCLING` → `Cycling`. */
export function disciplineName(discipline: string): string {
  return discipline.charAt(0) + discipline.slice(1).toLowerCase();
}

/** A discipline's icon, or a medal for all disciplines. */
export function disciplineIcon(discipline: string | null): string {
  return (discipline && ICONS[discipline]) || '🏅';
}

export function distance(meters: number): string {
  return `${decimal.format(meters / 1000)} km`;
}

export function duration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) {
    return `${minutes} min`;
  }
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

export function calories(kilocalories: number): string {
  return `${integer.format(kilocalories)} kcal`;
}

export function workouts(count: number): string {
  return count === 1 ? '1 workout' : `${integer.format(count)} workouts`;
}

export function day(date: Date): string {
  return format(new UTCDate(date), 'MMM d');
}

/** `[start, end)` as the days it covers: `Oct 1 – Oct 31`. */
export function days(start: Date, end: Date): string {
  return `${day(start)} – ${day(subDays(new UTCDate(end), 1))}`;
}

/** A logged workout on one line: discipline, started at, and its metrics. */
export function loggedWorkout(workout: LoggedWorkoutRepresentation): string {
  const startedAt = format(new UTCDate(workout.startedAt), "MMM d, HH:mm 'UTC'");
  return `${disciplineIcon(workout.discipline)} ${startedAt} · ${duration(workout.durationSeconds)} · ${distance(workout.distanceMeters)} · ${calories(workout.calories)}`;
}
