import {
  createExpoSite,
  createPipeline,
} from "@lsts_tech/infra";

type PipelineStage = "production" | "dev";

const profile = process.env.INFRA_PROFILE ?? "expo-web";
const appName = process.env.INFRA_APP_NAME ?? "bitacora";
const rootDomain = process.env.INFRA_ROOT_DOMAIN ?? "hashpass.tech";
const hostedZoneDomain = process.env.INFRA_HOSTED_ZONE_DOMAIN ?? "hashpass.tech";
const hostedZoneId = process.env.INFRA_HOSTED_ZONE_ID ?? "Z0236404TWGQH7K9IU6F";
const expoCertificateArn = process.env.INFRA_EXPO_CERT_ARN_PRODUCTION;
const pipelineRepo = process.env.INFRA_PIPELINE_REPO ?? "hashpass-tech/BITACORA";
const pipelinePrefix = process.env.INFRA_PIPELINE_PREFIX ?? "bitacora";
const pipelineProjectTag = process.env.INFRA_PROJECT_TAG ?? "bitacora";
const createPipelines = (process.env.INFRA_CREATE_PIPELINES ?? "false") === "true";
const enableCustomDomain = (process.env.INFRA_ENABLE_CUSTOM_DOMAIN ?? "true") === "true";
const selectedPipelinesRaw = process.env.INFRA_PIPELINES ?? "production";

const pipelinePermissionsMode =
  (process.env.INFRA_PIPELINE_PERMISSIONS_MODE ?? "admin") === "least-privilege"
    ? "least-privilege"
    : "admin";

const webStageMap: Record<string, string> = {
  production: process.env.INFRA_WEB_DOMAIN_PRODUCTION ?? `bitacora.${rootDomain}`,
  dev: process.env.INFRA_WEB_DOMAIN_DEV ?? `dev.bitacora.${rootDomain}`,
};

function resolveSiteDomain(stage: string) {
  const domainName = webStageMap[stage] ?? webStageMap.production;
  return {
    name: domainName,
    dns: sst.aws.dns({ zone: hostedZoneId }),
  };
}

const commonBuildEnv = {
  INFRA_PROFILE: profile,
  INFRA_APP_NAME: appName,
  INFRA_ROOT_DOMAIN: rootDomain,
  INFRA_HOSTED_ZONE_DOMAIN: hostedZoneDomain,
  INFRA_PIPELINE_REPO: pipelineRepo,
  INFRA_PIPELINE_PREFIX: pipelinePrefix,
  INFRA_PROJECT_TAG: pipelineProjectTag,
  INFRA_PIPELINE_BRANCH_PROD: process.env.INFRA_PIPELINE_BRANCH_PROD ?? "main",
  INFRA_PIPELINE_BRANCH_DEV: process.env.INFRA_PIPELINE_BRANCH_DEV ?? "develop",
  INFRA_PIPELINES_CONFIG_PATH: process.env.INFRA_PIPELINES_CONFIG_PATH ?? "config/pipelines.json",
  INFRA_PIPELINE_PERMISSIONS_MODE: pipelinePermissionsMode,
  INFRA_CREATE_PIPELINES: "false",
  INFRA_WEB_DOMAIN_PRODUCTION: webStageMap.production,
  INFRA_WEB_DOMAIN_DEV: webStageMap.dev,
  DOMAIN_ROOT: rootDomain,
  PROJECT_PREFIX: pipelinePrefix,
  PREFIX: pipelinePrefix,
  DOMAIN_PRODUCTION: webStageMap.production,
  DOMAIN_DEV: webStageMap.dev,
};

function parsePipelineStage(value: string): PipelineStage | undefined {
  const normalized = value.trim().toLowerCase();
  if (normalized === "production" || normalized === "prod") return "production";
  if (normalized === "dev") return "dev";
  return undefined;
}

const selectedPipelines = new Set<PipelineStage>(
  selectedPipelinesRaw
    .split(",")
    .map((value) => parsePipelineStage(value))
    .filter((value): value is PipelineStage => value !== undefined)
);

const pipelineSpecs: Record<PipelineStage, { suffix: string; branch: string; stage: PipelineStage }> = {
  production: {
    suffix: "prod",
    branch: process.env.INFRA_PIPELINE_BRANCH_PROD ?? "main",
    stage: "production",
  },
  dev: {
    suffix: "dev",
    branch: process.env.INFRA_PIPELINE_BRANCH_DEV ?? "develop",
    stage: "dev",
  },
};

export function createInfrastructure() {
  const stage = $app.stage;
  const domainName = webStageMap[stage] ?? webStageMap.production;
  const siteDomain = enableCustomDomain ? resolveSiteDomain(stage) : undefined;

  const { url } = createExpoSite({
    appPath: "../../apps/mobile",
    id: `mobile-${stage}`,
    domain: siteDomain,
    certificateArn: stage === "production" ? expoCertificateArn : undefined,
    environment: {
      EXPO_PUBLIC_SITE_URL: `https://${domainName}`,
      EXPO_PUBLIC_STAGE: stage,
    },
    invalidation: {
      paths: ["/*"],
      wait: stage === "production",
    },
  });

  const outputs: Record<string, unknown> = {
    profile,
    siteUrl: url,
    mobileUrl: url,
    domain: domainName,
    hostedZoneDomain,
    customDomainEnabled: enableCustomDomain,
  };

  if (stage === "production" && createPipelines && selectedPipelines.size > 0) {
    const pipelineOutputs: Record<string, string> = {};

    for (const pipelineStage of selectedPipelines) {
      const spec = pipelineSpecs[pipelineStage];
      const pipeline = createPipeline({
        name: `${pipelinePrefix}-${spec.suffix}`,
        repo: pipelineRepo,
        branch: spec.branch,
        stage: spec.stage,
        projectTag: pipelineProjectTag,
        buildEnv: commonBuildEnv,
        permissionsMode: pipelinePermissionsMode,
      });

      pipelineOutputs[`${pipelineStage}PipelineName`] = pipeline.pipelineName;
    }

    outputs.pipelines = pipelineOutputs;
  }

  return outputs;
}
