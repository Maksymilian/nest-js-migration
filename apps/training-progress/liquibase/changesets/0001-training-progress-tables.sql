--liquibase formatted sql

--changeset training-progress:0001-logged-workouts
--comment: One row per LoggedWorkout aggregate. id is the upstream WorkoutId; source_revision is also the optimistic-lock version.
CREATE TABLE logged_workouts (
  id uuid PRIMARY KEY,
  member_id text NOT NULL,
  discipline text NOT NULL,
  started_at timestamp with time zone NOT NULL,
  duration_seconds integer NOT NULL,
  distance_meters integer NOT NULL,
  calories integer NOT NULL,
  counts boolean NOT NULL,
  source_revision integer NOT NULL,
  logged_at timestamp with time zone NOT NULL
);
CREATE INDEX logged_workouts_member_started_at_idx ON logged_workouts (member_id, started_at DESC, id DESC) WHERE counts;
--rollback DROP TABLE logged_workouts;

--changeset training-progress:0001-personal-records
--comment: One row per PersonalRecords aggregate (member and discipline), with each record metric's value, logged workout and set-at time.
CREATE TABLE personal_records (
  member_id text NOT NULL,
  discipline text NOT NULL,
  longest_distance_meters integer,
  longest_distance_logged_workout_id uuid,
  longest_distance_set_at timestamp with time zone,
  longest_duration_seconds integer,
  longest_duration_logged_workout_id uuid,
  longest_duration_set_at timestamp with time zone,
  most_calories integer,
  most_calories_logged_workout_id uuid,
  most_calories_set_at timestamp with time zone,
  version integer NOT NULL,
  CONSTRAINT personal_records_pkey PRIMARY KEY (member_id, discipline)
);
--rollback DROP TABLE personal_records;

--changeset training-progress:0001-training-goals
--comment: One row per TrainingGoal aggregate. Goal progress is never stored.
CREATE TABLE training_goals (
  id uuid PRIMARY KEY,
  member_id text NOT NULL,
  metric text NOT NULL,
  target integer NOT NULL,
  discipline text,
  starts_on timestamp with time zone NOT NULL,
  ends_on timestamp with time zone NOT NULL,
  status text NOT NULL,
  set_at timestamp with time zone NOT NULL,
  achieved_at timestamp with time zone,
  missed_at timestamp with time zone,
  abandoned_at timestamp with time zone,
  version integer NOT NULL
);
CREATE INDEX training_goals_member_status_idx ON training_goals (member_id, status);
--rollback DROP TABLE training_goals;
