import { QueryBus } from '@nestjs/cqrs';
import { Args, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { TrainingPeriod } from '../../../calendar/domain/values/training-period.js';
import { PersonalRecordsQuery } from '../../../personal-records/application/queries/personal-records.query.js';
import { PersonalRecordsArgs } from '../../../personal-records/interface/graphql/personal-records.args.js';
import { PersonalRecordType } from '../../../personal-records/interface/graphql/personal-record.type.js';
import { ProgressSummaryQuery } from '../../../progress-summary/application/queries/progress-summary.query.js';
import { StreakQuery } from '../../../progress-summary/application/queries/streak.query.js';
import { ProgressSummaryArgs } from '../../../progress-summary/interface/graphql/progress-summary.args.js';
import { ProgressSummaryType } from '../../../progress-summary/interface/graphql/progress-summary.type.js';
import { TrainingGoalsQuery } from '../../../training-goals/application/queries/training-goals.query.js';
import { GoalStatus } from '../../../training-goals/domain/values/goal-status.js';
import { TrainingGoalType } from '../../../training-goals/interface/graphql/training-goal.type.js';
import { TrainingGoalsArgs } from '../../../training-goals/interface/graphql/training-goals.args.js';
import { TrainingLogQuery } from '../../../training-log/application/queries/training-log.query.js';
import { Discipline } from '../../../training-log/domain/values/discipline.js';
import { LoggedWorkoutConnectionType } from '../../../training-log/interface/graphql/logged-workout-connection.type.js';
import { TrainingLogArgs } from '../../../training-log/interface/graphql/training-log.args.js';
import { MemberId } from '../../domain/values/member-id.js';
import { MemberArgs } from './member.args.js';
import { MemberType } from './member.type.js';

/** The `Member` root type and its field resolvers: each one dispatches a query of its module. */
@Resolver(() => MemberType)
export class MemberResolver {
  constructor(private readonly queryBus: QueryBus) {}

  @Query(() => MemberType)
  member(@Args() { id }: MemberArgs): MemberType {
    return { id: MemberId.from(id).value };
  }

  @ResolveField(() => LoggedWorkoutConnectionType, { description: 'Counting workouts only, newest first.' })
  trainingLog(@Parent() member: MemberType, @Args() { first, after, discipline }: TrainingLogArgs) {
    return this.queryBus.execute(new TrainingLogQuery(MemberId.from(member.id), first, after ?? null, disciplineOf(discipline)));
  }

  @ResolveField(() => ProgressSummaryType)
  progressSummary(@Parent() member: MemberType, @Args() { period, date, discipline }: ProgressSummaryArgs) {
    return this.queryBus.execute(
      new ProgressSummaryQuery(MemberId.from(member.id), TrainingPeriod.periodKind(period), date ?? new Date(), disciplineOf(discipline)),
    );
  }

  @ResolveField(() => Int, { description: 'Consecutive active days ending today or yesterday (UTC).' })
  streak(@Parent() member: MemberType) {
    return this.queryBus.execute(new StreakQuery(MemberId.from(member.id), new Date()));
  }

  @ResolveField(() => [PersonalRecordType])
  personalRecords(@Parent() member: MemberType, @Args() { discipline }: PersonalRecordsArgs) {
    return this.queryBus.execute(new PersonalRecordsQuery(MemberId.from(member.id), disciplineOf(discipline)));
  }

  @ResolveField(() => [TrainingGoalType])
  trainingGoals(@Parent() member: MemberType, @Args() { status }: TrainingGoalsArgs) {
    return this.queryBus.execute(new TrainingGoalsQuery(MemberId.from(member.id), status ? GoalStatus.from(status) : null));
  }
}

function disciplineOf(discipline: string | undefined): Discipline | null {
  return discipline ? Discipline.from(discipline) : null;
}
