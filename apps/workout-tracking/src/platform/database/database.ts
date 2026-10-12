import type { Transaction } from '@app/ddd';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/** Workout Tracking's Drizzle database (PostgreSQL instance 1). */
export type Database = NodePgDatabase;

/** The `tx` that `db.transaction()` hands its callback. */
export type DrizzleTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/** Opens the transaction the domain only knows as an opaque `Transaction`. */
export function drizzleTransaction(tx: Transaction): DrizzleTransaction {
  return tx as unknown as DrizzleTransaction;
}

/** Whether `error` is PostgreSQL's unique violation of the named constraint. */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  const cause = (error as { cause?: unknown })?.cause ?? error;
  const pgError = cause as { code?: string; constraint?: string };
  return pgError?.code === '23505' && pgError.constraint === constraint;
}
