#!/usr/bin/env bash
set -euo pipefail

ACTION="${1:-patch}"
TARGET_VERSION="${2:-}"
MESSAGE="${3:-}"

REPO_ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$REPO_ROOT"

CURRENT_BRANCH="${RELEASE_BRANCH:-${CODEBUILD_WEBHOOK_HEAD_REF:-}}"
CURRENT_BRANCH=${CURRENT_BRANCH#refs/heads/}
if [ -z "$CURRENT_BRANCH" ]; then
  CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || true)
fi

if [ -z "$CURRENT_BRANCH" ]; then
  echo "Unable to determine the release branch."
  exit 1
fi

case "$ACTION" in
  patch|minor|major)
    RELEASE_MESSAGE=${MESSAGE:-"chore(release): ${ACTION}"}
    pnpm versioning "$ACTION" --branch-aware --target-branch "$CURRENT_BRANCH" --message "$RELEASE_MESSAGE"
    ;;
  version|release)
    if [ -z "$TARGET_VERSION" ]; then
      echo "Usage: $(basename "$0") version <semver> [message]"
      exit 1
    fi
    RELEASE_MESSAGE=${MESSAGE:-"chore(release): ${TARGET_VERSION}"}
    pnpm versioning release "$TARGET_VERSION" --message "$RELEASE_MESSAGE"
    ;;
  status)
    pnpm version:status
    exit 0
    ;;
  *)
    echo "Usage: $(basename "$0") [patch|minor|major|version <semver>] [message]"
    exit 1
    ;;
esac

PUSH_REMOTE="${RELEASE_REMOTE:-origin}"
PUSH_TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-}}"

if [ -n "$PUSH_TOKEN" ]; then
  REMOTE_URL=$(git remote get-url "$PUSH_REMOTE")
  case "$REMOTE_URL" in
    https://github.com/*)
      AUTH_REMOTE=${REMOTE_URL/https:\/\/github.com\//https://x-access-token:${PUSH_TOKEN}@github.com/}
      git remote set-url "$PUSH_REMOTE" "$AUTH_REMOTE"
      ;;
  esac
fi

if [ "${RELEASE_PUSH:-true}" = "true" ]; then
  git push "$PUSH_REMOTE" "HEAD:$CURRENT_BRANCH" --follow-tags
fi

pnpm version:status
