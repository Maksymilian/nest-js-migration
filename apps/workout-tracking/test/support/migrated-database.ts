import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHANGESETS = fileURLToPath(new URL('../../liquibase/changesets/', import.meta.url));

/**
 * PostgreSQL in-process, with the service's Liquibase changesets applied in order. Formatted SQL
 * changesets are plain SQL with comments, so the tests run the very DDL Liquibase runs. The test
 * records (context test-data) are left out.
 */
export async function migratedDatabase(): Promise<PGlite> {
  const client = new PGlite();
  for (const file of readdirSync(CHANGESETS).filter((name) => name.endsWith('.sql')).sort()) {
    await client.exec(readFileSync(join(CHANGESETS, file), 'utf8'));
  }
  return client;
}
