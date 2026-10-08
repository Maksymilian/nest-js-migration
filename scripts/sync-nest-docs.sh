#!/usr/bin/env bash
# Syncs the local NestJS docs cache (docs/nestjs) with the source of https://docs.nestjs.com
# (the content/ folder of https://github.com/nestjs/docs.nestjs.com).
set -euo pipefail

REPO_URL="https://github.com/nestjs/docs.nestjs.com.git"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$ROOT_DIR/docs/nestjs"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

git clone --quiet --depth 1 --filter=blob:none --sparse "$REPO_URL" "$TMP_DIR/repo"
git -C "$TMP_DIR/repo" sparse-checkout set content

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cp -R "$TMP_DIR/repo/content/." "$TARGET_DIR/"

COMMIT="$(git -C "$TMP_DIR/repo" log -1 --format='%H')"
COMMIT_DATE="$(git -C "$TMP_DIR/repo" log -1 --format='%cI')"
cat > "$TARGET_DIR/SOURCE.md" <<EOF
# NestJS docs cache

- Site: https://docs.nestjs.com
- Source: $REPO_URL (content/)
- Commit: $COMMIT ($COMMIT_DATE)
- Synced: $(date -u +%Y-%m-%dT%H:%M:%SZ)

Do not edit files here by hand. Run \`scripts/sync-nest-docs.sh\` to refresh.
EOF

echo "NestJS docs synced to $TARGET_DIR at commit $COMMIT"
