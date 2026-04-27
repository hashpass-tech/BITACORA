#!/usr/bin/env bash
set -euo pipefail

# CI-safe SST deploy helper.
# - runs `npx sst diff` for a readable preview
# - exits unless `APPROVE=true` is set

STACK=${STACK:-production}

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
INFRA_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$INFRA_DIR"

echo "Using SST stage: ${STACK} (cwd: $PWD)"

echo "Running SST diff (preview of infra changes)"
npx sst diff --stage "${STACK}" || true

if [ "${APPROVE:-}" != "true" ]; then
  echo "SST diff completed. Set APPROVE=true to apply changes."
  exit 0
fi

echo "APPROVE=true detected - running sst deploy"
npx sst unlock --stage "${STACK}" || true
npx sst deploy --stage "${STACK}" --yes
