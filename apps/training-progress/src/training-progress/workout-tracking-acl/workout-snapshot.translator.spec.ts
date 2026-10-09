import { InvalidIntegrationEvent } from './invalid-integration-event.js';
import { WorkoutSnapshotTranslator } from './workout-snapshot.translator.js';

const envelope = (payload: Record<string, unknown>) => ({
  id: '01a0f335-aae8-7027-b795-ca9dab21e44d',
  topic: 'workout-tracking.integration.workout-recorded.v1',
  key: 'ada@example.com',
  headers: {},
  createdAt: 0,
  payload,
});

const snapshot = {
  workoutId: '0199c3a2-0000-7000-8000-000000000101',
  memberId: 'ada@example.com',
  equipmentType: 'BIKE',
  discipline: 'CYCLING',
  startedAt: '2026-10-08T08:30:00.000Z',
  durationSeconds: 2700,
  distanceMeters: 18200,
  calories: 530,
  status: 'RECORDED',
  revision: 1,
};

describe('WorkoutSnapshotTranslator', () => {
  const translator = new WorkoutSnapshotTranslator();

  it("translates the snapshot into this context's types", async () => {
    const workout = await translator.translate(envelope(snapshot));

    expect(workout.loggedWorkoutId.value).toBe(snapshot.workoutId);
    expect(workout.memberId.value).toBe('ada@example.com');
    expect(workout.discipline.value).toBe('CYCLING');
    expect(workout.startedAt).toEqual(new Date(snapshot.startedAt));
    expect(workout.metrics.distance.meters).toBe(18200);
    expect(workout.sourceRevision.value).toBe(1);
  });

  it('refuses a payload that breaks the contract', async () => {
    await expect(translator.translate(envelope({ ...snapshot, discipline: 'SWIMMING' }))).rejects.toThrow(InvalidIntegrationEvent);
    await expect(translator.translate(envelope({ ...snapshot, revision: 0 }))).rejects.toThrow(InvalidIntegrationEvent);
    await expect(translator.translate(envelope({}))).rejects.toThrow(InvalidIntegrationEvent);
  });

  it('refuses an envelope without an id: the inbox needs it', async () => {
    await expect(translator.translate({ ...envelope(snapshot), id: '' })).rejects.toThrow(InvalidIntegrationEvent);
  });
});
