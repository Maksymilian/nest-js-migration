# Fitness platform

Two NestJS microservices, designed with Domain-Driven Design: **Workout Tracking** records what members do on connected equipment, and **Training Progress** turns those workouts into progress: a training log, progress summaries, streaks, personal records and training goals, with email notifications.

## Getting started

Prerequisites: Node.js 24, pnpm, Docker with Compose.

```bash
pnpm install
cp apps/workout-tracking/.env.example apps/workout-tracking/.env
cp apps/training-progress/.env.example apps/training-progress/.env

# PostgreSQL x2, Redis and RabbitMQ
docker compose up -d --wait

# both databases' schemas, with test records
scripts/database/liquibase.sh workout-tracking update
scripts/database/liquibase.sh training-progress update
```

Liquibase (`apps/<service>/liquibase`, run in Docker by `scripts/database/liquibase.sh`) creates and updates both databases, including the outbox's `nest_outbox` schema, and adds test records: Ada's bike (`BK-0001`, paired with `ada@example.com`), Grace's treadmill (`TM-0001`), an unpaired rower (`RW-0001`), and two active training goals. Leave the test records out with `scripts/database/liquibase.sh <service> update --context-filter=none`. RabbitMQ's exchange, queue, dead-letter exchange and queue come from `infrastructure/rabbitmq/definitions.json`.

| Service | Port | Main API |
|---|---|---|
| Workout Tracking | 3001 | REST, internal: `http://localhost:3001/internal/v1/...` |
| Training Progress | 3002 | GraphQL: `http://localhost:3002/graphql` (Apollo Sandbox in the browser) |
| RabbitMQ management | 15672 | `fitness` / `fitness` |

```bash
# development, with watch mode and OpenTelemetry (one terminal each)
pnpm start:dev:workout-tracking
pnpm start:dev:training-progress

# production build
pnpm build
pnpm start:prod:workout-tracking
pnpm start:prod:training-progress
```

Both services send security headers on every response. To call GraphQL from a web app in a browser, list its origin in Training Progress' `CORS_ORIGINS` (for example `http://localhost:5173`); without it, browsers on other origins are blocked (section 6.4 of `docs/architecture.md`).

Until Identity exists, a member is identified by their email address (not verified). Notifications are written as `.eml` files to `var/mail` (`MAIL_TRANSPORT=file`); set `MAIL_TRANSPORT=smtp` with `SMTP_URL`, or `resend` with `RESEND_API_KEY`, to send them.

### Try it

```bash
# Ada's bike records a 120 km ride...
curl -X POST localhost:3001/internal/v1/equipment/0199c3a2-0000-7000-8000-000000000001/recordings \
  -H 'content-type: application/json' \
  -d '{"recordingId":"ride-1","discipline":"CYCLING","startedAt":"2026-10-05T07:00:00.000Z","durationSeconds":14400,"distanceMeters":120000,"calories":2900}'

# ...which reaches Training Progress through the outbox and RabbitMQ, as a CloudEvent
curl localhost:3002/graphql -H 'content-type: application/json' \
  -d '{"query":"{ member(id: \"ada@example.com\") { trainingLog { edges { node { distanceMeters } } } personalRecords { metric value } trainingGoals { status progress } } }"}'
```

### Telegram bot

Members can also read their progress and manage their training goals in Telegram: `/training_log`, `/progress_summary`, `/streak`, `/personal_records` and `/training_goals`, whose buttons abandon a goal or set a new one.

1. In Telegram, send `/newbot` to [@BotFather](https://t.me/BotFather) and copy the token it gives you.
2. Add it to `apps/training-progress/.env` as `TELEGRAM_BOT_TOKEN=...` and restart Training Progress. In development the bot asks Telegram for updates (`TELEGRAM_UPDATES=polling`), so no public URL is needed.
3. Open your bot in Telegram and send `/sign_in ada@example.com`, or your own email address. Until Identity exists, it isn't verified.

To see your own workouts, pair the unpaired rower with your email address and record a row:

```bash
curl -X PUT localhost:3001/internal/v1/equipment/0199c3a2-0000-7000-8000-000000000003/pairing \
  -H 'content-type: application/json' -d '{"memberId":"you@example.com"}'
curl -X POST localhost:3001/internal/v1/equipment/0199c3a2-0000-7000-8000-000000000003/recordings \
  -H 'content-type: application/json' \
  -d '{"recordingId":"row-1","discipline":"ROWING","startedAt":"2026-10-11T07:00:00.000Z","durationSeconds":1800,"distanceMeters":6000,"calories":420}'
```

In production, set `TELEGRAM_UPDATES=webhook`, `TELEGRAM_WEBHOOK_URL` (the public HTTPS URL of `POST /telegram/updates`) and `TELEGRAM_WEBHOOK_SECRET`: Telegram then posts the updates to any instance. Without a token the bot is off. See section 6.6 of `docs/architecture.md`.

### Postman

`postman/` holds two collections; import them into Postman, or run them with `pnpm dlx newman run <file>`:

- `workout-tracking.postman_collection.json`: the REST API, from registering and pairing equipment to recording, correcting and voiding workouts, with the error cases and the operations routes.
- `training-progress.postman_collection.json`: the GraphQL API: a member's progress, training log, summaries, personal records and training goals, with the mutations and their domain errors.

Run the Workout Tracking collection first: its workouts are what Training Progress shows.

## Tests and checks

```bash
pnpm test                 # unit tests: aggregates (given/when/then), value objects, policies' building blocks
pnpm test:e2e             # each service on in-process PostgreSQL (PGlite) with its Liquibase changesets
pnpm lint                 # oxlint and the architecture check
pnpm check:architecture   # context, aggregate and layer boundaries (dependency-cruiser)
```

`pnpm build` runs the architecture check before compiling.

GitHub Actions (`.github/workflows/ci.yml`) runs all of these on every push to `main` and every pull request, plus each service's Liquibase changesets and rollbacks on PostgreSQL 18 (`update-testing-rollback`, test records included) and the scheduler image build.

## Operations

- Health: `GET /health/live` and `GET /health/ready` on both services. Readiness is `down` without the service's PostgreSQL, and `degraded` (still 200) without RabbitMQ or Redis.
- Outbox: `GET /internal/v1/admin/outbox/stats` and `/dead-letters` on Workout Tracking, `/internal/admin/outbox/...` on Training Progress, with the `x-admin-token` header (`ADMIN_TOKEN`). Dead letters can be requeued with `POST .../dead-letters/:id/requeue`.
- RabbitMQ dead letters (messages that aren't structured-mode CloudEvents, invalid integration events, or ones that failed 5 deliveries): queue `training-progress.workout-tracking.dlq`. Integration events travel as [CloudEvents](https://cloudevents.io) 1.0 (section 5.4 of `docs/architecture.md`).
- Schedule triggers (section 7.5 of `docs/architecture.md`): Kubernetes CronJobs publish them, and one Training Progress instance handles each. Run one by hand, against the local RabbitMQ or another with `RABBITMQ_URL`:

  ```bash
  node scripts/scheduler/publish-schedule-trigger.mjs miss-ended-goals

  docker build -t fitness-scheduler scripts/scheduler   # the CronJobs' image
  docker run --rm --network host fitness-scheduler miss-ended-goals
  ```

  Triggers that failed 5 deliveries are in `training-progress.schedule.dlq`.

### Observability: OpenTelemetry and the Grafana stack

The services send traces, metrics and logs over OTLP to Grafana Alloy, which requires Basic Auth and sends them to Tempo, Prometheus and Loki; Alloy also scrapes RabbitMQ and Redis and collects their logs. Grafana shows them, with the **Fitness platform** dashboard and the alert rules (section 15 of `docs/architecture.md`).

```bash
cp .env.example .env                                    # GRAFANA_ADMIN_PASSWORD
scripts/observability/telemetry-credentials.sh          # Alloy's htpasswd, and the Authorization header in apps/*/.env
docker compose --profile observability up -d            # + Alloy (localhost:4318), Tempo, Loki, Prometheus and Grafana
pnpm start:dev:workout-tracking                         # the start scripts load the OpenTelemetry SDK
```

Grafana: http://localhost:3000 (`admin`, `GRAFANA_ADMIN_PASSWORD`) > Dashboards > Fitness platform > Fitness platform; the alert rules are in Alerting. A flow, several roundtrips of one interaction, is `session.id`: send it with `baggage: session.id=<flow id>` and type it in the dashboard's **flow** box (in Explore: `{span.session.id="<flow id>"}` in Tempo, `| session_id="<flow id>"` in Loki). To see only GraphQL, only the Telegram bot, the REST API or RabbitMQ, pick it in the dashboard's **interface** list (in Explore: `{span.interface="telegram"}` in Tempo, `| interface="telegram"` in Loki). Alloy's UI, to see its pipelines: http://localhost:12345.

`LOG_CONSOLE=off` in a service's `.env` keeps its logs off the console (production).

### Rate limit, timeouts and faults

With `RATE_LIMIT=on`, each service rejects a caller past `RATE_LIMIT_PER_MINUTE` requests a minute (429, with `TOO_MANY_REQUESTS` over GraphQL), and cuts a query after `QUERY_TIMEOUT_MS` (504, or `TIMEOUT`). Toxiproxy slows down or cuts a service's connections to PostgreSQL, Redis and RabbitMQ, to see them, and other failures, in Grafana (section 16 of `docs/architecture.md`, with the scenarios to try):

```bash
docker compose --profile faults --profile observability up -d --wait   # + Toxiproxy (API on localhost:8474)
scripts/faults/start-through-toxiproxy.sh training-progress            # instead of pnpm start:dev:training-progress
sipts/faults/fault.sh latency training-progress-db 4000  cr            # then query: TIMEOUT after QUERY_TIMEOUT_MS
scripts/faults/fault.sh list                                           # hang, down, up, clear: see the script
scripts/faults/fault.sh clear
```

The dashboard's **Rate limit, timeouts and faults** row shows rejections, timeouts, failed responses and connections waiting, with each fault as an annotation.

The rate limit is off by default: set `RATE_LIMIT=on` in the service's `.env` to run it locally. In AWS, an AWS WAF rate-based rule on the load balancer limits callers instead: one count for all instances (section 16.1 has the rule's settings).

### Database releases and rollbacks

Every Liquibase changeset has a hand-written `--rollback`. The scripts in `scripts/database/` run Liquibase Open Source 4.33 in Docker (nothing to install) against one service's database: the local Docker Compose one by default, or another with `--url` and `--username` (the password from `LIQUIBASE_COMMAND_PASSWORD`, or asked for). Test records only go to the local database.

```bash
scripts/database/tag.sh workout-tracking 0.002          # before each release, on both databases
scripts/database/tag.sh training-progress 0.002
scripts/database/liquibase.sh training-progress history # what's applied, and the tags

scripts/database/rollback.sh training-progress --tag 0.002                   # prints the rollback SQL only
scripts/database/rollback.sh training-progress --tag 0.002 --apply           # runs it, after a confirmation
scripts/database/rollback.sh training-progress --tag 0.002 --label FIT-123   # only the changesets labelled FIT-123
```

`--count <n>` and `--to-date <datetime>` replace `--tag`. Roll back from a checkout of the release being reverted (Liquibase reads the rollback SQL from the changelog), then deploy the application version that matches the reverted schema.

## Metrics

### Lambda → ECS + NestJS metrics mapping

| Lambda | ECS + NestJS equivalent | Where to find it |
|---|---|---|
| `Invocations` | `RequestCount` | `AWS/ApplicationELB` |
| `Duration` | `TargetResponseTime` (p50/p95/p99) | `AWS/ApplicationELB` |
| `Errors` | `HTTPCode_Target_5XX_Count` | `AWS/ApplicationELB` |
| `Throttles` | `RejectedConnectionCount`, 503s, CPU saturation | ALB + `AWS/ECS` |
| `ConcurrentExecutions` | `RunningTaskCount`, active requests per task | Container Insights, app metrics |
| `Max Memory Used` | `MemoryUtilization` | `AWS/ECS` (per service) |
| Cold start / `Init Duration` | Time for a task to start and pass health checks, plus Nest bootstrap time | ECS service events, app log |
| `REPORT` log line | Nothing automatic; log each request from a NestJS interceptor | CloudWatch Logs (`awslogs` driver) |
| X-Ray | OpenTelemetry + ADOT collector sidecar → X-Ray | X-Ray / CloudWatch |
| Lambda Insights | Container Insights (per-task CPU, memory, network) | `ECS/ContainerInsights` |
