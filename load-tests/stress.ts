// Stress test (docs/architecture.md, section 17.2): the members' usual traffic, 90% reads, at its
// base rate, then rising to its peak and held there. Passes with p95 under 100 ms (P95_MS) and a
// clean verdict. BASE_RATE and PEAK_RATE are actions a second (an action is one or two requests).
import type { Options } from 'k6/options';
import { writers } from './lib/members.ts';
import { mixedTraffic } from './lib/traffic.ts';
import { judge, newRunId, snapshot, trafficThresholds, VERDICT_THRESHOLDS } from './lib/verdict.ts';

const BASE_RATE = Number(__ENV.BASE_RATE || 30);
const PEAK_RATE = Number(__ENV.PEAK_RATE || 100);

export const options = {
  scenarios: {
    traffic: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 500,
      stages: [
        { target: BASE_RATE, duration: '30s' },
        { target: BASE_RATE, duration: '1m' },
        { target: PEAK_RATE, duration: '2m' },
        { target: PEAK_RATE, duration: __ENV.HOLD || '3m' },
        { target: 0, duration: '30s' },
      ],
      tags: { phase: 'traffic' },
    },
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
}

export function teardown({ runId, start }: Run) {
  judge(start, { members: writers(), runId });
}
