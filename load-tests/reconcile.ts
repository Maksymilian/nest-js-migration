// After a backlog was moved and consumed (docs/architecture.md, section 17.4): every workout the
// backlog run recorded is in the training logs exactly once, nothing was dead-lettered or left in a
// queue, no trace failed, no error was logged since it started, and no alert is still firing.
//   load-tests/k6.sh reconcile -e RUN_ID=<backlog's> -e SINCE=<backlog's> -e DLQ_BEFORE=<backlog's>
import exec from 'k6/execution';
import type { Options } from 'k6/options';
import { writers } from './lib/members.ts';
import { judge, snapshot, VERDICT_THRESHOLDS } from './lib/verdict.ts';

export const options = {
  scenarios: { verdict: { executor: 'shared-iterations', vus: 1, iterations: 1, maxDuration: '15m' } },
  thresholds: VERDICT_THRESHOLDS,
} satisfies Options;

export default function () {
  const { RUN_ID: runId, SINCE: since, DLQ_BEFORE: deadLetterQueue } = __ENV;
  if (!runId || !since) {
    exec.test.abort('RUN_ID and SINCE are required: backlog.ts prints them');
  }
  const sinceDate = new Date(since);
  if (Number.isNaN(sinceDate.getTime())) {
    exec.test.abort(`SINCE is not a date: ${since}`);
  }
  // Without DLQ_BEFORE, every message in the DLQ counts.
  const start = snapshot(sinceDate, Number(deadLetterQueue ?? 0));
  judge(start, { members: writers(), runId, alertsWhen: 'after' });
}
