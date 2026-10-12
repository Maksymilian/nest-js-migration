#!/usr/bin/env bash
# Reverts changesets on one service's database with their hand-written `--rollback` SQL. Without
# --apply it only prints that SQL; with --apply it prints it, asks for confirmation, then runs it.
#
# Usage: scripts/database/rollback.sh <service> (--tag <tag> | --count <n> | --to-date <yyyy-mm-ddThh:mm:ss>)
#          [--label <label>]... [--apply [--yes]] [--url <jdbc-url>] [--username <user>]
#   scripts/database/rollback.sh training-progress --tag 0.002                            # preview
#   scripts/database/rollback.sh training-progress --tag 0.002 --apply                    # revert
#   scripts/database/rollback.sh training-progress --tag 0.002 --label FIT-123 --apply
#
# --tag reverts everything applied after the tag, --count the last n changesets, --to-date
# everything applied after that time (UTC). --label keeps only the changesets that carry that label
# (repeat it for several): Liquibase's own label filter would also revert every changeset without
# labels, so this one is built with `@`.
# Run it from a checkout of the release being reverted: Liquibase reads the rollback SQL from the
# changelog, and an older checkout doesn't have the changesets to revert. Then deploy the
# application version that matches the reverted schema.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

USAGE="usage: rollback.sh <service> (--tag <tag> | --count <n> | --to-date <datetime>) [--label <label>]... [--apply [--yes]] [--url <jdbc-url>] [--username <user>]"
parse_connection "$@"
command="" target="" labels=() filter=() apply=false confirmed=false
set -- "${ARGS[@]}"
while (($# > 0)); do
  case "$1" in
    --tag) command=rollback target="--tag=${2:?--tag needs a value}"; shift 2 ;;
    --count) command=rollback-count target="--count=${2:?--count needs a value}"; shift 2 ;;
    --to-date) command=rollback-to-date target="--date=${2:?--to-date needs a value}"; shift 2 ;;
    --label) labels+=("@${2:?--label needs a value}"); shift 2 ;;
    --apply) apply=true; shift ;;
    --yes) confirmed=true; shift ;;
    *) die "unknown option $1; $USAGE" ;;
  esac
done
[[ -n "$command" ]] || die "$USAGE"
if ((${#labels[@]} > 0)); then
  expression="${labels[*]}"
  filter=("--label-filter=${expression// / or }")
fi
resolve_password

run_liquibase "$command-sql" "$target" "${filter[@]}"
if ! $apply; then
  echo "Nothing was changed. Add --apply to run this rollback." >&2
  exit 0
fi
if ! $confirmed; then
  require_terminal "no terminal to confirm on: add --yes to run it without asking"
  read -rp "Run this rollback on $URL? Type the service name to confirm: " answer </dev/tty
  [[ "$answer" == "$SERVICE" ]] || die "not confirmed; nothing was changed"
fi
run_liquibase "$command" "$target" "${filter[@]}"
