import { EquipmentId } from '../../equipment/domain/values/equipment-id.js';
import { EquipmentType } from '../../equipment/domain/values/equipment-type.js';
import { MemberId } from '../../equipment/domain/values/member-id.js';
import { WorkoutStartedInTheFuture } from './errors/workout-started-in-the-future.js';
import { WorkoutVoided as WorkoutIsVoided } from './errors/workout-voided.js';
import { WorkoutCorrected } from './events/workout-corrected.js';
import { WorkoutVoided } from './events/workout-voided.js';
import { CorrectionReason } from './values/correction-reason.js';
import { Discipline } from './values/discipline.js';
import { Recording } from './values/recording.js';
import { RecordingId } from './values/recording-id.js';
import { VoidReason } from './values/void-reason.js';
import { WorkoutMetrics } from './values/workout-metrics.js';
import { WorkoutStatus } from './values/workout-status.js';
import { WorkoutRecorded } from './events/workout-recorded.js';
import { Workout } from './workout.js';

const now = new Date('2026-10-08T10:00:00Z');
const metrics = WorkoutMetrics.of({ durationSeconds: 2700, distanceMeters: 18200, calories: 530 });
const corrected = WorkoutMetrics.of({ durationSeconds: 2700, distanceMeters: 21000, calories: 600 });

function record(startedAt = new Date('2026-10-08T09:00:00Z')): Workout {
  return Workout.record({
    equipmentId: EquipmentId.generate(),
    equipmentType: EquipmentType.Bike,
    memberId: MemberId.from('ada@example.com'),
    recording: new Recording(RecordingId.from('rec-1'), Discipline.Cycling, startedAt, metrics),
    now,
  });
}

function recordedWorkout(): Workout {
  const workout = record();
  workout.pullDomainEvents();
  return workout;
}

describe('Workout', () => {
  it('records a workout at revision 1 and raises WorkoutRecorded', () => {
    const workout = record();

    expect(workout.props).toMatchObject({ status: WorkoutStatus.Recorded, revision: 1, recordedAt: now });
    expect(workout.pullDomainEvents()).toEqual([expect.any(WorkoutRecorded)]);
  });

  it('allows 5 minutes of clock skew for the start, and refuses a start further in the future', () => {
    expect(() => record(new Date('2026-10-08T10:05:00Z'))).not.toThrow();
    expect(() => record(new Date('2026-10-08T10:05:01Z'))).toThrow(WorkoutStartedInTheFuture);
  });

  describe('correct', () => {
    it('given a recorded workout, replaces the metrics, increases the revision and raises WorkoutCorrected', () => {
      const workout = recordedWorkout();

      workout.correct(corrected, CorrectionReason.from('GPS drift'), now);

      const [event] = workout.pullDomainEvents() as [WorkoutCorrected];
      expect(event).toBeInstanceOf(WorkoutCorrected);
      expect(event.workout.revision).toBe(2);
      expect(event.correction.previousMetrics).toEqual(metrics);
      expect(event.correction.newMetrics).toEqual(corrected);
      expect(workout.props.metrics).toEqual(corrected);
      expect(workout.newCorrections).toHaveLength(1);
    });

    it('given a voided workout, refuses', () => {
      const workout = recordedWorkout();
      workout.void(VoidReason.from('Someone else used the bike'), now);

      expect(() => workout.correct(corrected, CorrectionReason.from('GPS drift'), now)).toThrow(WorkoutIsVoided);
    });
  });

  describe('void', () => {
    it('given a recorded workout, voids it, increases the revision and raises WorkoutVoided', () => {
      const workout = recordedWorkout();

      workout.void(VoidReason.from('Someone else used the bike'), now);

      const [event] = workout.pullDomainEvents() as [WorkoutVoided];
      expect(event).toBeInstanceOf(WorkoutVoided);
      expect(event.workout).toMatchObject({ status: WorkoutStatus.Voided, revision: 2 });
      expect(event.reason.value).toBe('Someone else used the bike');
    });

    it('given a voided workout, refuses: voiding is final', () => {
      const workout = recordedWorkout();
      workout.void(VoidReason.from('Someone else used the bike'), now);

      expect(() => workout.void(VoidReason.from('Again'), now)).toThrow(WorkoutIsVoided);
    });
  });
});
