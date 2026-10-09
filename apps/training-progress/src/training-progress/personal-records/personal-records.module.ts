import { Module } from '@nestjs/common';
import { KeepPersonalRecordsPolicy } from './application/keep-personal-records.policy.js';
import { PersonalRecordQueries } from './application/queries/personal-record-queries.js';
import { PersonalRecordsHandler } from './application/queries/personal-records.handler.js';
import { RecordCandidates } from './application/record-candidates.js';
import { PersonalRecordsRepository } from './domain/personal-records.repository.js';
import { DrizzlePersonalRecordQueries } from './infrastructure/drizzle-personal-record-queries.js';
import { DrizzlePersonalRecordsRepository } from './infrastructure/drizzle-personal-records.repository.js';
import { DrizzleRecordCandidates } from './infrastructure/drizzle-record-candidates.js';

@Module({
  providers: [
    KeepPersonalRecordsPolicy,
    PersonalRecordsHandler,
    { provide: PersonalRecordsRepository, useClass: DrizzlePersonalRecordsRepository },
    { provide: RecordCandidates, useClass: DrizzleRecordCandidates },
    { provide: PersonalRecordQueries, useClass: DrizzlePersonalRecordQueries },
  ],
})
export class PersonalRecordsModule {}
