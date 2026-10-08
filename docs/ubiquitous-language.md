# Ubiquitous language

This is the shared vocabulary of the fitness platform. Use these terms exactly, and only these terms, in conversations, documentation, and code: class and method names, REST paths, GraphQL types and fields, database tables, event topics, log messages, and test names.

A term belongs to a **bounded context**. The same word can mean slightly different things in two contexts, and that's intended: each context has its own model. Inside one context, one concept has one term, and one term has one meaning. When a term is shared, it says so.

Changing a term is a design change: update this file first, then rename the code in the same change.

## Used in every context

These terms mean the same thing everywhere, but there is no shared code: each context defines its own value objects for them.

| Term | Meaning | Code | Don't say |
|---|---|---|---|
| **Member** | A person with an account on the platform who trains. | `MemberId` value object in each context, holding the identity provider's subject id (an opaque string) | user, customer, client, athlete |
| **Discipline** | The kind of exercise a workout is: `Cycling`, `Running`, `Walking`, `Rowing`. | `Discipline`, defined separately by each context; integration events carry it as a string that the receiving context translates | type, sport, activity type, exercise |

## Workout Tracking context (supporting subdomain)

Recording what members do on connected equipment.

| Term | Meaning | Code | Don't say |
|---|---|---|---|
| **Equipment** | A connected fitness machine that records workouts. Identified by its **Serial Number**. | `Equipment` aggregate, `EquipmentId`, `SerialNumber` | device, machine, hardware |
| **Equipment Type** | What kind of machine the equipment is: `Bike`, `Treadmill`, `Rower`. It decides which disciplines the equipment can record. | `EquipmentType` | model, category |
| **Supported Discipline** | A discipline the equipment type can record. Bike: Cycling. Treadmill: Running, Walking. Rower: Rowing. | `EquipmentType.supports(discipline)` | |
| **Register** | Add new equipment to the platform. | `Equipment.register()`, `EquipmentRegistered` | create, add, onboard |
| **Pairing** | The link between equipment and the member whose workouts it records. Equipment is paired with at most one member at a time. | `Equipment.pair(memberId)`, `Equipment.unpair()`, `EquipmentPaired`, `EquipmentUnpaired` | assign, link, bind, connect |
| **Paired Member** | The member the equipment is currently paired with. | `Equipment.pairedMemberId` | owner, user |
| **Workout** | One continuous exercise session, recorded by equipment from start to finish. It belongs to the member who was paired with the equipment when it was recorded. | `Workout` aggregate, `WorkoutId` | session, activity, exercise, training |
| **Recording** | The data equipment submits about a finished workout. Recording a workout creates it. | `Equipment.recordWorkout(recording)`, `WorkoutRecorded` | upload, sync, event, create |
| **Recording Id** | The id the equipment gives a recording. Unique per equipment. Submitting the same recording id again never creates a second workout. | `RecordingId` | event id, external id, request id |
| **Duplicate Recording** | A recording whose recording id was already recorded for that equipment. Answered with the existing workout. | | retry, double post |
| **Workout Metrics** | What was measured: **Duration** (active time, in seconds), **Distance** (in meters), **Calories** (kilocalories burned). | `WorkoutMetrics`, `Duration`, `Distance`, `Calories` value objects | stats, data, values |
| **Started At** | When the workout began. | `startedAt` | date, time, created at |
| **Correction** | Replacing a workout's metrics after it was recorded, because they were wrong. Needs a **Correction Reason**. Increases the workout's revision. | `Workout.correct(metrics, reason)`, `WorkoutCorrected` | update, edit, patch, fix |
| **Void** | Marking a workout as not counting, for example because someone else used the equipment. Needs a **Void Reason**. A voided workout is kept, never deleted, and can't be corrected or un-voided. | `Workout.void(reason)`, `WorkoutVoided` | delete, remove, cancel, archive |
| **Workout Status** | `Recorded` or `Voided`. | `WorkoutStatus` | state |
| **Revision** | A number that starts at 1 when the workout is recorded and increases by 1 with every correction or void. | `Workout.revision` | version |

## Training Progress context (core subdomain)

Turning workouts into progress that keeps members training.

In this context, "workout" on its own always means a **logged workout** (as in "log a workout" or "counting workouts"). Workout Tracking's workout is never modelled here; it only arrives as an integration event.

### Training log

| Term | Meaning | Code | Don't say |
|---|---|---|---|
| **Training Log** | A member's counting workouts in chronological order, newest first. What the member app shows as their history. | `TrainingLog` (read model), `trainingLog` GraphQL field | history, feed, timeline, activity list |
| **Logged Workout** | This context's own model of a workout from Workout Tracking: discipline, started at, metrics. Changed only through the anticorruption layer. | `LoggedWorkout` aggregate, `LoggedWorkoutId` (the same value as the upstream WorkoutId) | workout record, activity, entry |
| **Log a Workout** | Add a workout to the member's training log. What a recording upstream becomes here. | `LoggedWorkout.log()`, `WorkoutLogged` | import, sync, create |
| **Revise** | Replace a logged workout's metrics. What a correction upstream becomes here. | `LoggedWorkout.revise()`, `LoggedWorkoutRevised` | update, correct, edit |
| **Stop Counting** | Keep a logged workout but exclude it from everything. What a void upstream becomes here. | `LoggedWorkout.stopCounting()`, `LoggedWorkoutStoppedCounting` | delete, void, remove |
| **Counts** | A logged workout counts until it stops counting. Only counting workouts contribute to summaries, streaks, personal records and goals. | `LoggedWorkout.counts` | is active, is valid |
| **Source Revision** | The upstream workout's revision at the time of the last change. A change with an older or equal source revision is ignored. | `SourceRevision` | version, revision |

### Progress

| Term | Meaning | Code | Don't say |
|---|---|---|---|
| **Training Period** | A calendar Week (ISO week, Monday to Sunday), Month or Year, in UTC. | `TrainingPeriod` value object, `PeriodKind` | range, interval, timeframe |
| **Progress Summary** | The totals of a member's counting workouts in a training period, optionally for one discipline: workout count, total duration, total distance, total calories. | `ProgressSummary` (read model) | stats, analytics, dashboard, report |
| **Active Day** | A UTC calendar day with at least one counting workout. | | training day, workout day |
| **Streak** | The number of consecutive active days ending today or yesterday. | `Streak` (read model) | chain, combo, run |

### Personal records

| Term | Meaning | Code | Don't say |
|---|---|---|---|
| **Personal Record** | A member's best value of a **Record Metric** in a single counting workout of one discipline, with the logged workout it came from. Replaced as a whole when it changes. | `PersonalRecord` value object | PR, best, max, high score |
| **Personal Records** | All of a member's personal records in one discipline, one per record metric. They change together and only through it. | `PersonalRecords` aggregate | leaderboard, stats |
| **Record Metric** | What a personal record measures: `LongestDistance`, `LongestDuration`, `MostCalories`. | `RecordMetric` | |
| **Consider** | Compare a newly logged workout with the member's personal records in its discipline. | `PersonalRecords.consider(loggedWorkout)` | check, evaluate |
| **Set a Personal Record** | A logged workout beats the member's current personal record, or there was none. | `PersonalRecordSet` | break, beat, achieve |
| **Record Candidate** | For one record metric, the counting logged workout with the best value in the member's training log for that discipline. | `RecordCandidate` value object | best workout, top entry |
| **Recalculate** | Set the member's personal records in a discipline from the record candidates, after a revision or a stop-counting. | `PersonalRecords.recalculate(recordCandidates)` | refresh, rebuild |
| **Withdraw a Personal Record** | The logged workout holding a personal record no longer supports it (revised lower, or stopped counting). The record falls back to the next best workout, or disappears. | `PersonalRecordWithdrawn` | revoke, delete, lower |

### Training goals

| Term | Meaning | Code | Don't say |
|---|---|---|---|
| **Training Goal** | A target a member commits to for a goal period, optionally for one discipline, such as "Cycle 200 km in October". | `TrainingGoal` aggregate, `TrainingGoalId` | objective, target, challenge, plan |
| **Goal Metric** | What the goal counts: `Distance`, `Duration`, `Calories`, `WorkoutCount`. | `GoalMetric` | |
| **Goal Target** | The amount of the goal metric to reach. Always greater than zero. | `GoalTarget` value object | amount, value |
| **Goal Period** | The dates the goal runs from and to. It must end in the future when the goal is set. | `GoalPeriod` value object | duration, deadline |
| **Grace Period** | One day after the goal period ends, during which the goal stays active, so workouts from inside the goal period that are logged late still count. | `GoalPeriod.graceEnd` | buffer, extension |
| **Goal Progress Criteria** | Which logged workouts count towards a goal: counting, started inside the goal period, of the goal's discipline (if any). Defined by the goal itself. The grace period doesn't widen them. | `TrainingGoal.progressCriteria()`, `GoalProgressCriteria.isMetBy(loggedWorkout)` | filter, query |
| **Goal Progress** | The sum of the goal metric over the logged workouts that meet the goal's progress criteria. Always calculated from the training log, never stored. | `GoalProgress` value object | completion, percentage |
| **Set a Goal** | A member creates a training goal. | `TrainingGoal.set()`, `TrainingGoalSet`, `setTrainingGoal` mutation | create, add |
| **Record Goal Progress** | Give a goal its current goal progress, so it can tell whether it's achieved. | `TrainingGoal.recordProgress(progress)` | update, check, sync |
| **Goal Status** | `Active`, `Achieved`, `Missed`, `Abandoned`. Only an active goal can change status. | `GoalStatus` | state |
| **Achieve** | Goal progress reaches the goal target while the goal is active. Happens when goal progress is recorded. **Final**: a later revision or stop-counting doesn't take an achievement back. | `TrainingGoal.recordProgress()`, `GoalAchieved` | complete, finish, win |
| **Miss** | The grace period ends while the goal is still active. | `TrainingGoal.miss()`, `GoalMissed` | fail, expire |
| **Abandon** | The goal's member gives up an active goal. | `TrainingGoal.abandon(memberId)`, `GoalAbandoned`, `abandonTrainingGoal` mutation | delete, cancel, remove |

### Policies

| Term | Meaning | Code |
|---|---|---|
| **Keep Personal Records** | Whenever a workout is logged, revised or stops counting, consider or recalculate the member's personal records in its discipline. | `KeepPersonalRecordsPolicy` |
| **Check Goal Achievement** | Whenever a workout is logged or revised, or a goal is set, record goal progress on each affected active goal. | `CheckGoalAchievementPolicy` |
| **Miss Ended Goals** | Every day, miss the active goals whose grace period has ended. | `MissEndedGoalsJob` |

## Notifications context (generic subdomain)

No domain model; a thin layer over `@nestjs/mail`. It conforms to Training Progress' published language.

| Term | Meaning | Code | Don't say |
|---|---|---|---|
| **Notification** | A message telling a member about their progress. Sent by email for now. | `*Mail` classes | alert, message, push |
| **Member Contact** | Where a member is reached: name and email address. Translated from the identity provider's user profile by the `MemberContactDirectory` adapter (a development adapter until the provider exists). | `MemberContact`, `MemberContactDirectory` port | profile, user details |
| **Notify Personal Record** | Send a notification when a personal record is set. | `NotifyPersonalRecordHandler` | |
| **Notify Goal Achieved** | Send a notification when a training goal is achieved. | `NotifyGoalAchievedHandler` | |

## Integration and building blocks

| Term | Meaning | Code |
|---|---|---|
| **Domain Event** | A business fact that happened inside a context, raised by an aggregate, named in the past tense. Internal to its context. | `libs/ddd` `DomainEvent`; topics `<context>.domain.<event>.v<n>` |
| **Integration Event** | A fact a context publishes for other contexts, mapped from a domain event into the published language. Versioned. | Topics `<context>.integration.<event>.v<n>` |
| **Published Language** | A context's integration events: topic names and payloads. Owned by the upstream context. | `libs/workout-tracking-contracts`, `training-progress/published-language/` |
| **Policy** | A reaction to a domain event ("whenever X, then Y") that changes one aggregate per transaction. | `*Policy` |
| **Anticorruption Layer** | The part of Training Progress that validates Workout Tracking's integration events and translates them into its own language and commands. | `workout-tracking-acl/` |
| **Outbox** | Where a context stores its domain and integration events in the same transaction as the change, until they're delivered. | `@nestjs/outbox`, `nest_outbox.messages` |
| **Inbox** | Where a consumer records the events it has already applied, so a redelivery changes nothing. | `OutboxInbox`, `nest_outbox.inbox` |
