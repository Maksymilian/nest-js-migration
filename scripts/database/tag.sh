#!/usr/bin/env bash
# Tags one service's database before a release, so `rollback.sh --tag` can return to it. The tag
# goes on the last changeset applied. Tag both services' databases with the release.
#
# Usage: scripts/database/tag.sh <service> <tag> [--url <jdbc-url>] [--username <user>]
#   scripts/database/tag.sh workout-tracking 0.002
#   scripts/database/tag.sh training-progress 0.002
#
# Without --url, it's the service's local Docker Compose database. The password comes from
# LIQUIBASE_COMMAND_PASSWORD, or is asked for.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

parse_connection "$@"
((${#ARGS[@]} == 1)) || die "usage: tag.sh <service> <tag> [--url <jdbc-url>] [--username <user>]"
resolve_password
run_liquibase tag --tag="${ARGS[0]}"
