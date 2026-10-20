// Spike test (docs/architecture.md, section 17.2): the usual traffic at its base rate, then
// SPIKE_RATE within 10 seconds, held for a minute, and back. Passes with p95 under 200 ms (P95_MS)
// over the whole run, the spike included, and a clean verdict: no error, nothing lost on the way.
import type { Options } from 'k6/options';
import { writers } from './lib/members.ts';
import { mixedTraffic } from './lib/traffic.ts';
import { judge, newRunId, snapshot, trafficThresholds, VERDICT_THRESHOLDS } from './lib/verdict.ts';

const BASE_RATE = Number(__ENV.BASE_RATE || 20);
const SPIKE_RATE = Number(__ENV.SPIKE_RATE || 200);

export const options = {
  scenarios: {
    traffic: {
      executor: 'ramping-arrival-rate',
      startRate: BASE_RATE,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 1000,
      stages: [
        { target: BASE_RATE, duration: '1m' },
        { target: SPIKE_RATE, duration: '10s' },
        { target: SPIKE_RATE, duration: __ENV.HOLD || '1m' },
        { target: BASE_RATE, duration: '10s' },
        { target: BASE_RATE, duration: '1m' },
        { target: 0, duration: '10s' },
      ],
      tags: { phase: 'traffic' },
    },
  },
  thresholds: { ...trafficThresholds(Number(__ENV.P95_MS || 200)), ...VERDICT_THRESHOLDS },
  teardownTimeout: '10m',
} satisfies Options;

/** What setup() hands every iteration and teardown(). */
type Run = ReturnType<typeof setup>;

export function setup() {
  return { runId: newRunId(), start: snapshot() };
}

export default function ({ runId }: Run) {
  mixedTraffic(runId);
}

export function teardown({ runId, start }: Run) {
  judge(start, { members: writers(), runId });
}
