#!/usr/bin/env bash
# Runs any Liquibase Open Source command on one service's database, with that service's changelog.
#
# Usage: scripts/database/liquibase.sh <service> [--url <jdbc-url>] [--username <user>] <command> [options]
#   scripts/database/liquibase.sh training-progress history
#   scripts/database/liquibase.sh training-progress status --verbose
#   scripts/database/liquibase.sh workout-tracking update-testing-rollback
#   scripts/database/liquibase.sh workout-tracking --url jdbc:postgresql://db.example.com:5432/workout_tracking --username deploy update
#
# Without --url, it's the service's local Docker Compose database. The password comes from
# LIQUIBASE_COMMAND_PASSWORD, or is asked for.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

parse_connection "$@"
((${#ARGS[@]} > 0)) || die "no Liquibase command, e.g. history, status or update"
resolve_password
run_liquibase "${ARGS[@]}"
