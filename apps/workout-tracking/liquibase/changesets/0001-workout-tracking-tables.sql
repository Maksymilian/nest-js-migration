--liquibase formatted sql

--changeset workout-tracking:0001-equipment
--comment: One row per Equipment aggregate. The serial number is unique across the platform.
CREATE TABLE equipment (
  id uuid PRIMARY KEY,
  serial_number text NOT NULL CONSTRAINT equipment_serial_number_unique UNIQUE,
  type text NOT NULL,
  paired_member_id text,
  paired_at timestamp with time zone,
  registered_at timestamp with time zone NOT NULL,
  version integer NOT NULL
);
--rollback DROP TABLE equipment;

--changeset workout-tracking:0001-workouts
--comment: One row per Workout aggregate. revision is also its optimistic-lock version.
CREATE TABLE workouts (
  id uuid PRIMARY KEY,
  equipment_id uuid NOT NULL,
  equipment_type text NOT NULL,
  recording_id text NOT NULL,
  member_id text NOT NULL,
  discipline text NOT NULL,
  started_at timestamp with time zone NOT NULL,
  duration_seconds integer NOT NULL,
  distance_meters integer NOT NULL,
  calories integer NOT NULL,
  status text NOT NULL,
  revision integer NOT NULL,
  void_reason text,
  voided_at timestamp with time zone,
  recorded_at timestamp with time zone NOT NULL,
  CONSTRAINT workouts_equipment_recording_unique UNIQUE (equipment_id, recording_id)
);
CREATE INDEX workouts_member_started_at_idx ON workouts (member_id, started_at DESC, id DESC);
--rollback DROP TABLE workouts;

--changeset workout-tracking:0001-workout-corrections
--comment: The audit trail of corrections: one row per correction, never changed.
CREATE TABLE workout_corrections (
  workout_id uuid NOT NULL,
  revision integer NOT NULL,
  previous_metrics jsonb NOT NULL,
  new_metrics jsonb NOT NULL,
  reason text NOT NULL,
  corrected_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT workout_corrections_pkey PRIMARY KEY (workout_id, revision)
);
--rollback DROP TABLE workout_corrections;
