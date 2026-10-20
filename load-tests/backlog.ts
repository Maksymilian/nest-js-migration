// A backlog in RabbitMQ (docs/architecture.md, section 17.4): with Training Progress stopped,
// records RECORDINGS workouts (200), whose integration events then wait in its queue. Checks that
// they all reached the queue, and prints the command that checks, once they're moved and consumed,
// that every one of them reached the training logs exactly once (reconcile.ts).
import encoding from 'k6/encoding';
import exec from 'k6/execution';
import http from 'k6/http';
import type { Options } from 'k6/options';
import { body } from './lib/api.ts';
import { anyWriter, writers } from './lib/members.ts';
import { recordWorkout } from './lib/traffic.ts';
import { judgeBacklog, newRunId, QUEUE, snapshot } from './lib/verdict.ts';

export const options = {
  scenarios: {
    recordings: {
      executor: 'shared-iterations',
      vus: 10,
      iterations: Number(__ENV.RECORDINGS || 200),
      maxDuration: '5m',
      tags: { phase: 'traffic' },
    },
  },
  thresholds: {
    'http_req_failed{phase:traffic}': ['rate==0'],
    'checks{phase:traffic}': ['rate==1'],
    server_errors: ['count==0'],
    lost_workouts: ['count==0'],
    dead_letters: ['count==0'],
    checks_unavailable: ['count==0'],
  },
  teardownTimeout: '10m',
} satisfies Options;

/** What setup() hands every iteration and teardown(). */
type Run = ReturnType<typeof setup>;

export function setup() {
  const auth = encoding.b64encode(__ENV.RABBITMQ_AUTH || 'fitness:fitness');
  const url = `${__ENV.RABBITMQ_MANAGEMENT_URL || 'http://localhost:15672'}/api/queues/%2F/${QUEUE}`;
  const { consumers } = body<{ consumers: number }>(http.get(url, { headers: { Authorization: `Basic ${auth}` } }));
  if (consumers > 0) {
    exec.test.abort(`${QUEUE} has ${consumers} consumer(s): stop Training Progress first, so the events wait in the queue`);
  }
  return { runId: newRunId(), start: snapshot() };
}

export default function ({ runId }: Run) {
  recordWorkout(runId, anyWriter());
}

export function teardown({ runId, start }: Run) {
  judgeBacklog(start, { members: writers(), runId });
}
