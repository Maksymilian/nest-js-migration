import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Args, Int, Mutation, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { MemberId } from '../../../members/domain/values/member-id.js';
import { Discipline } from '../../../training-log/domain/values/discipline.js';
import { AbandonTrainingGoalCommand } from '../../application/commands/abandon-training-goal.command.js';
import { SetTrainingGoalCommand } from '../../application/commands/set-training-goal.command.js';
import { TrainingGoalProgressQuery } from '../../application/queries/training-goal-progress.query.js';
import { GoalMetric } from '../../domain/values/goal-metric.js';
import { GoalTarget } from '../../domain/values/goal-target.js';
import { TrainingGoalId } from '../../domain/values/training-goal-id.js';
import { AbandonTrainingGoalInput } from './abandon-training-goal.input.js';
import { SetTrainingGoalInput } from './set-training-goal.input.js';
import { TrainingGoalType } from './training-goal.type.js';

@Resolver(() => TrainingGoalType)
export class TrainingGoalsResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Mutation(() => TrainingGoalType)
  setTrainingGoal(@Args('input') input: SetTrainingGoalInput) {
    return this.commandBus.execute(
      new SetTrainingGoalCommand(
        MemberId.from(input.memberId),
        GoalMetric.from(input.metric),
        GoalTarget.of(input.target),
        input.discipline ? Discipline.from(input.discipline) : null,
        input.startsOn,
        input.endsOn,
      ),
    );
  }

  @Mutation(() => TrainingGoalType)
  abandonTrainingGoal(@Args('input') input: AbandonTrainingGoalInput) {
    return this.commandBus.execute(new AbandonTrainingGoalCommand(MemberId.from(input.memberId), TrainingGoalId.from(input.trainingGoalId)));
  }

  /** Calculated per goal from the training log; a member has few goals. Add a DataLoader if lists grow. */
  @ResolveField(() => Int, { description: 'The sum of the goal metric over the workouts that count towards the goal.' })
  progress(@Parent() goal: TrainingGoalType) {
    return this.queryBus.execute(new TrainingGoalProgressQuery(goal));
  }
}
