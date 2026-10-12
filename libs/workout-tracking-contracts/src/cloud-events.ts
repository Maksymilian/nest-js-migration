/**
 * The CloudEvents `source` of every Workout Tracking integration event. Each one travels between
 * services as a CloudEvent 1.0 (https://cloudevents.io) in the JSON event format, with:
 * - `id`: unique per event and the same on every redelivery, so consumers deduplicate on it;
 * - `source`: this value;
 * - `type`: the topic (`WorkoutTrackingTopics`), also the RabbitMQ routing key;
 * - `subject`: the workout id;
 * - `time`: when the change was recorded;
 * - `partitionkey` (Partitioning extension): the member id, so a member's events keep their order;
 * - `datacontenttype`: `application/json`, and `data`: a `WorkoutSnapshotV1`.
 */
export const WORKOUT_TRACKING_SOURCE = '/workout-tracking';
