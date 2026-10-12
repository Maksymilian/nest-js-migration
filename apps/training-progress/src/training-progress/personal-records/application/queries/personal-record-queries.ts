import type { PersonalRecordRepresentation } from '../personal-record.representation.interface.js';

/** Read port: a member's personal records, read straight from SQL. */
export abstract class PersonalRecordQueries {
  abstract ofMember(memberId: string): Promise<PersonalRecordRepresentation[]>;
}
