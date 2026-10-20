// Smoke test (docs/architecture.md, section 17.2): two members using the apps for 30 seconds, an
// action a second each, then the verdict. Run it first: it proves the services, the seed and Grafana
// are ready.
import { sleep } from 'k6';
import type { Options } from 'k6/options';
import { writers } from './lib/members.ts';
import { mixedTraffic } from './lib/traffic.ts';
import { judge, newRunId, snapshot, trafficThresholds, VERDICT_THRESHOLDS } from './lib/verdict.ts';

export const options = {
  scenarios: {
    traffic: { executor: 'constant-vus', vus: 2, duration: __ENV.DURATION || '30s', tags: { phase: 'traffic' } },
  },
  thresholds: { ...trafficThresholds(Number(__ENV.P95_MS || 100)), ...VERDICT_THRESHOLDS },
  teardownTimeout: '10m',
} satisfies Options;

/** What setup() hands every iteration and teardown(). */
type Run = ReturnType<typeof setup>;

export function setup() {
  return { runId: newRunId(), start: snapshot() };
}

export default function ({ runId }: Run) {
  mixedTraffic(runId);
  sleep(1);
}

export function teardown({ runId, start }: Run) {
  judge(start, { members: writers(), runId });
}
