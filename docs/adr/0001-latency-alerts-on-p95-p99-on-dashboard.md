# 1. Latency alerts on p95; p99 on the dashboard

- **Status:** Accepted
- **Date:** 2026-10-29
- **Related:** `docs/architecture.md` section 15 (observability), `infrastructure/grafana/provisioning/alerting/alert-rules.yaml`, `infrastructure/grafana/dashboards/fitness-platform.json`

## Context

The alert rules covered availability and errors (5xx, failing GraphQL operations, dead letters, connections waiting for the pool, timeouts), but nothing told us the platform was getting **slow** before it started failing. Reads time out at `QUERY_TIMEOUT_MS` (3 s by default): by the time the *Queries timing out* alert fires, members are already getting `504` / `TIMEOUT`.

Averages hide this: one member's slow request disappears in many fast ones. Latency has to be watched on percentiles of the OpenTelemetry duration histograms we already export (`http_server_request_duration_seconds`, `graphql_server_operation_duration_seconds`, `db_client_operation_duration_seconds`, `http_client_request_duration_seconds`) and on Tempo's span metrics for message handling (`traces_spanmetrics_latency`, consumer spans).

The question was which percentile to alert on: p95 or p99.

## Decision

1. **Alert on p95.** Five rules, each a `histogram_quantile(0.95, ...)` over 5 minutes, firing after 5 minutes over the threshold, severity `warning`:

   | Rule | Threshold | Minimum observations in 5 min |
   |---|---|---|
   | HTTP request duration, by service | 1 s | 20 requests |
   | GraphQL operation duration, by root fields | 1 s | 20 operations |
   | Database operation duration, by service and operation | 500 ms | 20 statements |
   | Outgoing HTTP calls, by service and host | 5 s | 10 calls |
   | Message handling, by service and span | 5 s | 10 messages |

2. **Show p95 and p99 on the dashboard**, side by side, in the *Latency* row of the Fitness platform dashboard (plus the service graph, Redis commands and garbage-collection pauses), for diagnosis.

3. **Every rule requires a minimum number of observations** in the window (`and ... increase(..._count[5m]) >= N`), and `noDataState: OK`.

### Why p95 for alerts

- **Traffic is low.** At a few requests per minute, p99 over 5 minutes is decided by one or two requests: a single cold start, a GC pause or a cache miss moves it. An alert on it would flap and train us to ignore it. p95 needs a sustained share of slow requests to move.
- **It still catches what members feel.** One request in twenty being slow is a degradation a member notices across a session, and it shows up well before the 3 s timeout.
- **Histogram resolution.** `histogram_quantile` interpolates inside buckets; at the tail, with few samples, p99 often lands in the last, widest bucket and is mostly interpolation.

### Why p99 on the dashboard anyway

- p99 is where the tail starts: the gap between p95 and p99 tells a few outliers (p99 high, p95 fine) from a general slowdown (both up).
- During an incident or a load test (section 17), traffic is high enough for p99 to be meaningful, and it's the number compared with k6's own p99.

### Thresholds

- HTTP and GraphQL at **1 s**: a third of `QUERY_TIMEOUT_MS`, so we hear about it before reads start timing out.
- Database at **500 ms**: most of a request's time is the database; half of the request budget.
- Outgoing calls and message handling at **5 s**: providers (Telegram, mail) and asynchronous handlers aren't on a member's request path; what matters is that queues keep draining.

## Consequences

- We get a warning on slowness before the timeout and error alerts fire; the alert description points to the dashboard's Latency row and Tempo's slow traces.
- Rare tail latency (p99 only) does **not** page anyone. It's visible on the dashboard and has to be looked for. If traffic grows enough for p99 to be stable (hundreds of requests per window), revisit this: add p99 rules or move to SLO-based burn-rate alerts.
- An idle or nearly idle service never fires a latency alert, by design (minimum observations, `noDataState: OK`); its availability is covered by the other rules.
- Thresholds are first estimates. Tune them from load-test results and real traffic, in `alert-rules.yaml`, not in Grafana.

## Alternatives considered

- **Alert on p99.** Rejected for now: too noisy at current traffic (see above).
- **Alert on the average.** Rejected: hides the tail completely.
- **SLOs with error-budget burn-rate alerts.** The better long-term model, but it needs agreed SLOs and more traffic; premature today.
- **Alert on both p95 and p99.** Doubles the rules and the noise without adding a signal we'd act on differently.
