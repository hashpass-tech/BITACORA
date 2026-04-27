#!/usr/bin/env bash
set -euo pipefail

ACTION="${1:-patch}"
TARGET_VERSION="${2:-}"
MESSAGE="${3:-}"

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$REPO_ROOT"

REPO_SLUG="${RELEASE_REPO_SLUG:-hashpass-tech/BITACORA}"
BRANCH="${RELEASE_BRANCH:-${CODEBUILD_WEBHOOK_HEAD_REF:-main}}"
BRANCH=${BRANCH#refs/heads/}
TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-}}"

if [ ! -d .git ]; then
  if [ -z "$TOKEN" ]; then
    echo "GITHUB_TOKEN or GH_TOKEN is required when CodeBuild provides a source artifact without git metadata."
    exit 1
  fi

  REMOTE_URL="https://x-access-token:${TOKEN}@github.com/${REPO_SLUG}.git"
  git init -q
  git remote add origin "$REMOTE_URL"
  git config user.name "${GIT_AUTHOR_NAME:-Bitacora Release Bot}"
  git config user.email "${GIT_AUTHOR_EMAIL:-releases@bitacora.hashpass.tech}"
  git fetch origin "$BRANCH"
  git checkout -B "$BRANCH" "origin/$BRANCH"
fi

export RELEASE_BRANCH="$BRANCH"
export RELEASE_PUSH="${RELEASE_PUSH:-true}"

bash "$REPO_ROOT/scripts/release.sh" "$ACTION" "$TARGET_VERSION" "$MESSAGE"
