import type { Transaction } from '@app/ddd';
import type { MemberId } from '../../members/domain/values/member-id.js';
import type { Discipline } from '../../training-log/domain/values/discipline.js';
import type { PersonalRecords } from './personal-records.js';

/** Port: loads and saves whole `PersonalRecords` aggregates, one per member and discipline. */
export abstract class PersonalRecordsRepository {
  /** Read through the transaction; undefined before any workout set a record. */
  abstract find(tx: Transaction, memberId: MemberId, discipline: Discipline): Promise<PersonalRecords | undefined>;

  /** @throws ConcurrencyConflict when the records changed since they were loaded */
  abstract save(tx: Transaction, personalRecords: PersonalRecords): Promise<void>;
}
