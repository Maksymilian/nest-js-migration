import { Query } from '@nestjs/cqrs';
import type { MemberId } from '../../../members/domain/values/member-id.js';

/** The number of consecutive active days ending today or yesterday (UTC). */
export class StreakQuery extends Query<number> {
  constructor(
    readonly memberId: MemberId,
    readonly today: Date,
  ) {
    super();
  }
}
