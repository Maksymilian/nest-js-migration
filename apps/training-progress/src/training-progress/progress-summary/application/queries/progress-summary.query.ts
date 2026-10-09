import { Query } from '@nestjs/cqrs';
import type { PeriodKind } from '../../../calendar/domain/values/training-period.js';
import type { MemberId } from '../../../members/domain/values/member-id.js';
import type { Discipline } from '../../../training-log/domain/values/discipline.js';
import type { ProgressSummaryRepresentation } from '../progress-summary.representation.interface.js';

/** The progress summary of the training period of `kind` that contains `date`. */
export class ProgressSummaryQuery extends Query<ProgressSummaryRepresentation> {
  constructor(
    readonly memberId: MemberId,
    readonly kind: PeriodKind,
    readonly date: Date,
    readonly discipline: Discipline | null,
  ) {
    super();
  }
}
