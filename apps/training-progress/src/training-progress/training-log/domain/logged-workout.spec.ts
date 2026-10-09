import { MemberId } from '../../members/domain/values/member-id.js';
import { LoggedWorkoutRevised } from './events/logged-workout-revised.js';
import { LoggedWorkoutStoppedCounting } from './events/logged-workout-stopped-counting.js';
import { WorkoutLogged } from './events/workout-logged.js';
import { LoggedWorkout } from './logged-workout.js';
import { Discipline } from './values/discipline.js';
import { LoggedWorkoutId } from './values/logged-workout-id.js';
import { SourceRevision } from './values/source-revision.js';
import { WorkoutMetrics } from './values/workout-metrics.js';

const now = new Date('2026-10-08T10:00:00Z');
const metrics = WorkoutMetrics.of({ durationSeconds: 2700, distanceMeters: 18200, calories: 530 });
const revised = WorkoutMetrics.of({ durationSeconds: 2700, distanceMeters: 21000, calories: 600 });

/** Given: a counting logged workout as stored, at a source revision. */
function logged(sourceRevision = 1): LoggedWorkout {
  return LoggedWorkout.reconstitute({
    id: LoggedWorkoutId.from('0199c3a2-0000-7000-8000-000000000101'),
    memberId: MemberId.from('ada@example.com'),
    discipline: Discipline.Cycling,
    startedAt: new Date('2026-10-08T08:30:00Z'),
    metrics,
    counts: true,
    sourceRevision: SourceRevision.of(sourceRevision),
    loggedAt: now,
  });
}

describe('LoggedWorkout', () => {
  it('logs a counting workout and raises WorkoutLogged', () => {
    const loggedWorkout = LoggedWorkout.log({
      id: LoggedWorkoutId.from('0199c3a2-0000-7000-8000-000000000101'),
      memberId: MemberId.from('ada@example.com'),
      discipline: Discipline.Cycling,
      startedAt: new Date('2026-10-08T08:30:00Z'),
      metrics,
      sourceRevision: SourceRevision.of(1),
      now,
    });

    expect(loggedWorkout.pullDomainEvents()).toEqual([expect.any(WorkoutLogged)]);
    expect(loggedWorkout.props.counts).toBe(true);
  });

  it('logs a workout whose void came first as not counting, raising nothing', () => {
    const loggedWorkout = LoggedWorkout.logStoppedCounting({
      id: LoggedWorkoutId.from('0199c3a2-0000-7000-8000-000000000101'),
      memberId: MemberId.from('ada@example.com'),
      discipline: Discipline.Cycling,
      startedAt: new Date('2026-10-08T08:30:00Z'),
      metrics,
      sourceRevision: SourceRevision.of(2),
      now,
    });

    expect(loggedWorkout.pullDomainEvents()).toEqual([]);
    expect(loggedWorkout.props.counts).toBe(false);
  });

  describe('revise', () => {
    it('given a newer source revision, replaces the metrics and raises LoggedWorkoutRevised', () => {
      const loggedWorkout = logged();

      loggedWorkout.revise(revised, SourceRevision.of(2), now);

      const [event] = loggedWorkout.pullDomainEvents() as [LoggedWorkoutRevised];
      expect(event).toBeInstanceOf(LoggedWorkoutRevised);
      expect(event.previousMetrics).toEqual(metrics);
      expect(event.metrics).toEqual(revised);
      expect(loggedWorkout.props.sourceRevision.value).toBe(2);
    });

    it('given an older or equal source revision, ignores it and raises nothing (reordering)', () => {
      const loggedWorkout = logged(3);

      loggedWorkout.revise(revised, SourceRevision.of(2), now);
      loggedWorkout.revise(revised, SourceRevision.of(3), now);

      expect(loggedWorkout.pullDomainEvents()).toEqual([]);
      expect(loggedWorkout.props.metrics).toEqual(metrics);
      expect(loggedWorkout.isChangedSinceLoaded()).toBe(false);
    });
  });

  describe('stopCounting', () => {
    it('given a counting workout and a newer source revision, stops counting it and raises LoggedWorkoutStoppedCounting', () => {
      const loggedWorkout = logged();

      loggedWorkout.stopCounting(SourceRevision.of(2), now);

      expect(loggedWorkout.pullDomainEvents()).toEqual([expect.any(LoggedWorkoutStoppedCounting)]);
      expect(loggedWorkout.props.counts).toBe(false);
    });

    it('given a correction older than the void, ignores the correction', () => {
      const loggedWorkout = logged();
      loggedWorkout.stopCounting(SourceRevision.of(3), now);
      loggedWorkout.pullDomainEvents();

      loggedWorkout.revise(revised, SourceRevision.of(2), now);

      expect(loggedWorkout.pullDomainEvents()).toEqual([]);
      expect(loggedWorkout.props.counts).toBe(false);
    });
  });
});
