#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
INFRA_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

if [ -f "$INFRA_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$INFRA_DIR/.env"
  set +a
fi

REGION=${AWS_REGION:-us-east-1}
PIPELINE_PREFIX=${INFRA_PIPELINE_PREFIX:-bitacora}
PIPELINES_CONFIG_PATH=${INFRA_PIPELINES_CONFIG_PATH:-$INFRA_DIR/config/pipelines.json}
REPO_DEFAULT=${INFRA_PIPELINE_REPO:-hashpass-tech/BITACORA}
BRANCH_PROD_DEFAULT=${INFRA_PIPELINE_BRANCH_PROD:-main}
BRANCH_DEV_DEFAULT=${INFRA_PIPELINE_BRANCH_DEV:-develop}

declare -A STAGE_ENABLED=(
  [production]=false
  [dev]=false
)

declare -A STAGE_BRANCH=(
  [production]="$BRANCH_PROD_DEFAULT"
  [dev]="$BRANCH_DEV_DEFAULT"
)

declare -A STAGE_REPO=(
  [production]="$REPO_DEFAULT"
  [dev]="$REPO_DEFAULT"
)

declare -A STAGE_SUFFIX=(
  [production]="prod"
  [dev]="dev"
)

normalize_stage() {
  local input
  input=$(echo "$1" | tr '[:upper:]' '[:lower:]' | xargs)
  case "$input" in
    prod) echo "production" ;;
    production|dev) echo "$input" ;;
    *) echo "" ;;
  esac
}

if [ -f "$PIPELINES_CONFIG_PATH" ]; then
  echo "Loading runtime pipeline config from $PIPELINES_CONFIG_PATH"
  while IFS=$'\t' read -r stage enabled branch repo; do
    stage=$(normalize_stage "$stage")
    if [ -z "$stage" ]; then
      continue
    fi

    if [ "$enabled" = "true" ]; then
      STAGE_ENABLED["$stage"]=true
    elif [ "$enabled" = "false" ]; then
      STAGE_ENABLED["$stage"]=false
    fi

    if [ -n "$branch" ]; then
      STAGE_BRANCH["$stage"]="$branch"
    fi

    if [ -n "$repo" ]; then
      STAGE_REPO["$stage"]="$repo"
    fi
  done < <(node -e '
const fs = require("fs");
const path = process.argv[1];
const raw = JSON.parse(fs.readFileSync(path, "utf8"));
const src = raw.pipelines ?? raw;
function toStage(v) {
  const n = String(v || "").trim().toLowerCase();
  if (n === "prod") return "production";
  if (n === "production" || n === "dev") return n;
  return "";
}
function emit(stage, cfg) {
  const enabled = cfg && typeof cfg.enabled !== "undefined" ? Boolean(cfg.enabled) : true;
  const branch = cfg && typeof cfg.branch === "string" ? cfg.branch.trim() : "";
  const repo = cfg && typeof cfg.repo === "string" ? cfg.repo.trim() : "";
  process.stdout.write([stage, String(enabled), branch, repo].join("\t") + "\n");
}
if (Array.isArray(src)) {
  for (const item of src) {
    const stage = toStage(item && item.stage);
    if (!stage) continue;
    emit(stage, item || {});
  }
} else if (src && typeof src === "object") {
  for (const [key, value] of Object.entries(src)) {
    const stage = toStage(key);
    if (!stage) continue;
    emit(stage, value || {});
  }
}
' "$PIPELINES_CONFIG_PATH")
else
  echo "Runtime pipeline config not found at $PIPELINES_CONFIG_PATH; using env defaults"
fi

declare -A PIPELINE_STAGE=()
declare -A PIPELINE_REPO=()
declare -A PIPELINE_BRANCH=()
PIPELINES_TO_CREATE=()

for stage in production dev; do
  if [ "${STAGE_ENABLED[$stage]}" != "true" ]; then
    continue
  fi

  suffix=${STAGE_SUFFIX[$stage]}
  name="${PIPELINE_PREFIX}-${suffix}"

  PIPELINE_STAGE["$name"]="$stage"
  PIPELINE_REPO["$name"]="${STAGE_REPO[$stage]}"
  PIPELINE_BRANCH["$name"]="${STAGE_BRANCH[$stage]}"
  PIPELINES_TO_CREATE+=("$stage")
done

if [ ${#PIPELINE_STAGE[@]} -eq 0 ]; then
  echo "No pipelines configured. Set INFRA_PIPELINES and/or config/pipelines.json."
  exit 0
fi

cd "$INFRA_DIR"

MISSING=()
for NAME in "${!PIPELINE_STAGE[@]}"; do
  echo "Checking for pipeline: $NAME (region: $REGION)"
  if aws codepipeline get-pipeline --name "$NAME" --region "$REGION" >/dev/null 2>&1; then
    echo "Pipeline exists: $NAME"
  else
    echo "Pipeline missing: $NAME"
    MISSING+=("$NAME")
  fi
done

if [ ${#MISSING[@]} -eq 0 ]; then
  echo "All pipelines present; nothing to do."
  exit 0
fi

echo "Missing pipelines: ${MISSING[*]}"

if [ "${APPROVE:-}" != "true" ]; then
  echo "To create missing pipelines, re-run with APPROVE=true."
  exit 1
fi

echo "Creating pipeline set: ${PIPELINES_TO_CREATE[*]}"

APPROVE=true \
STACK="production" \
INFRA_CREATE_PIPELINES=true \
INFRA_ENABLE_CUSTOM_DOMAIN=false \
INFRA_PIPELINES="$(IFS=,; echo "${PIPELINES_TO_CREATE[*]}")" \
INFRA_PIPELINE_REPO="$REPO_DEFAULT" \
INFRA_PIPELINE_BRANCH_PROD="${STAGE_BRANCH[production]}" \
INFRA_PIPELINE_BRANCH_DEV="${STAGE_BRANCH[dev]}" \
bash "$SCRIPT_DIR/sst-deploy.sh"

echo "Done."
