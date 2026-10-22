// Cache stampede on the streak (docs/architecture.md, sections 8.1 and 17.2). Midnight UTC: every
// cached streak expires at once (k6.sh forgets them before the run), and SPIKE_RATE requests a second
// arrive at once for the streaks of a few popular members (STAMPEDE_MEMBERS of seed.sh's hot ones,
// with years of history), held, then back to BASE_RATE. Meanwhile they record a workout every 2
// seconds, each forgetting their cached streak again. Run it three times, Training Progress started with:
//   READ_CACHE=off        every read loads the streak from PostgreSQL
//   READ_CACHE_LOCK=off   every read that misses loads it: the stampede
//   (the defaults)        one load per miss, under the load lock; the others wait for its value
// and compare the p95 (under 200 ms to pass, P95_MS) and the dashboard's *Loads from PostgreSQL*.
// A load costs a few milliseconds on a local database: `fault.sh latency training-progress-db 50`
// makes it cost what a heavier query or a remote database does (section 16.3).
import type { Options } from 'k6/options';
import { trainingProgress } from './lib/api.ts';
import { member } from './lib/members.ts';
import { recordWorkout } from './lib/traffic.ts';
import { judge, newRunId, snapshot, trafficThresholds, VERDICT_THRESHOLDS } from './lib/verdict.ts';

const BASE_RATE = Number(__ENV.BASE_RATE || 20);
const SPIKE_RATE = Number(__ENV.SPIKE_RATE || 300);
const P95_MS = Number(__ENV.P95_MS || 200);
const STAMPEDE_MEMBERS = Number(__ENV.STAMPEDE_MEMBERS || 2);

const popularMembers = () => Array.from({ length: STAMPEDE_MEMBERS }, (_, i) => member(1 + i));
const popularMember = () => member(1 + Math.floor(Math.random() * STAMPEDE_MEMBERS));

export const options = {
  scenarios: {
    readers: {
      executor: 'ramping-arrival-rate',
      exec: 'readStreak',
      startRate: SPIKE_RATE,
      timeUnit: '1s',
      preAllocatedVUs: 200,
      maxVUs: 1000,
      stages: [
        { target: SPIKE_RATE, duration: __ENV.HOLD || '1m' },
        { target: BASE_RATE, duration: '5s' },
        { target: BASE_RATE, duration: '30s' },
      ],
      tags: { phase: 'traffic' },
    },
    recordings: {
      executor: 'constant-arrival-rate',
      exec: 'recordWorkoutOfPopularMember',
      rate: 1,
      timeUnit: '2s',
      duration: '1m30s',
      preAllocatedVUs: 5,
      tags: { phase: 'traffic' },
    },
  },
  thresholds: {
    ...trafficThresholds(P95_MS),
    'http_req_duration{scenario:readers}': [`p(95)<${P95_MS}`],
    ...VERDICT_THRESHOLDS,
  },
  teardownTimeout: '10m',
} satisfies Options;

/** What setup() hands every iteration and teardown(). */
type Run = ReturnType<typeof setup>;

export function setup() {
  return { runId: newRunId(), start: snapshot() };
}

export function readStreak() {
  trainingProgress.streak(popularMember());
}

export function recordWorkoutOfPopularMember({ runId }: Run) {
  recordWorkout(runId, popularMember());
}

export function teardown({ runId, start }: Run) {
  judge(start, { members: popularMembers(), runId });
}
