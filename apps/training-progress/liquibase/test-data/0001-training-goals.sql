--liquibase formatted sql

--changeset training-progress:test-data-0001-training-goals context:test-data
--comment: Active training goals for local testing and the Postman collection: Ada cycles 200 km in October, Grace does 12 workouts by the end of the year.
INSERT INTO training_goals (id, member_id, metric, target, discipline, starts_on, ends_on, status, set_at, version) VALUES
  ('0199c3a2-0000-7000-8000-000000000201', 'ada@example.com', 'DISTANCE', 200000, 'CYCLING', '2026-10-01T00:00:00Z', '2026-11-01T00:00:00Z', 'ACTIVE', '2026-10-01T07:00:00Z', 1),
  ('0199c3a2-0000-7000-8000-000000000202', 'grace@example.com', 'WORKOUT_COUNT', 12, NULL, '2026-10-01T00:00:00Z', '2027-01-01T00:00:00Z', 'ACTIVE', '2026-10-01T07:00:00Z', 1);
--rollback DELETE FROM training_goals WHERE id IN ('0199c3a2-0000-7000-8000-000000000201', '0199c3a2-0000-7000-8000-000000000202');
