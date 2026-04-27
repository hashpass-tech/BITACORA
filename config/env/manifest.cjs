module.exports = {
  sources: [".env", ".env.local"],
  rootExampleFile: ".env.example",
  variables: [
    {
      key: "INFRA_APP_NAME",
      description: "SST app name",
      example: "bitacora",
    },
    {
      key: "INFRA_PROFILE",
      description: "Infra profile",
      example: "next-only",
    },
    {
      key: "INFRA_ROOT_DOMAIN",
      description: "Primary deployment domain",
      example: "bitacora.hashpass.tech",
    },
    {
      key: "INFRA_HOSTED_ZONE_DOMAIN",
      description: "Route53 hosted zone domain",
      example: "hashpass.tech",
    },
    {
      key: "INFRA_HOSTED_ZONE_ID",
      description: "Route53 hosted zone ID",
      example: "Z0236404TWGQH7K9IU6F",
    },
    {
      key: "INFRA_PIPELINE_REPO",
      description: "GitHub repo in owner/repo format",
      example: "hashpass-tech/BITACORA",
    },
    {
      key: "INFRA_PIPELINE_PREFIX",
      description: "Pipeline name prefix",
      example: "bitacora",
    },
    {
      key: "INFRA_PROJECT_TAG",
      description: "AWS project tag",
      example: "bitacora",
    },
    {
      key: "INFRA_PIPELINES",
      description: "Pipeline stages to create or sync",
      example: "production,dev",
    },
    {
      key: "INFRA_PIPELINE_BRANCH_PROD",
      description: "Production branch name",
      example: "main",
    },
    {
      key: "INFRA_PIPELINE_BRANCH_DEV",
      description: "Development branch name",
      example: "develop",
    },
    {
      key: "INFRA_PIPELINE_PERMISSIONS_MODE",
      description: "CodeBuild IAM scope",
      example: "admin",
    },
    {
      key: "INFRA_CREATE_PIPELINES",
      description: "Allow pipeline creation during deploy",
      example: "false",
    },
    {
      key: "AWS_REGION",
      description: "AWS region used by SST",
      example: "us-east-1",
    },
    {
      key: "DATABASE_URL",
      description: "Database connection string",
      secret: true,
      required: false,
      example: "YOUR_DATABASE_URL",
    },
    {
      key: "AUTH_SECRET",
      description: "Application signing secret",
      secret: true,
      required: false,
      example: "YOUR_AUTH_SECRET",
    }
  ],
  targets: [
    {
      id: "root",
      description: "Root repo environment file",
      outputFile: ".env.local",
      exampleFile: ".env.example",
      entries: [
        { source: "INFRA_APP_NAME" },
        { source: "INFRA_PROFILE" },
        { source: "INFRA_ROOT_DOMAIN" },
        { source: "INFRA_HOSTED_ZONE_DOMAIN" },
        { source: "INFRA_HOSTED_ZONE_ID" },
        { source: "INFRA_PIPELINE_REPO" },
        { source: "INFRA_PIPELINE_PREFIX" },
        { source: "INFRA_PROJECT_TAG" },
        { source: "INFRA_PIPELINES" },
        { source: "INFRA_PIPELINE_BRANCH_PROD" },
        { source: "INFRA_PIPELINE_BRANCH_DEV" },
        { source: "INFRA_PIPELINE_PERMISSIONS_MODE" },
        { source: "INFRA_CREATE_PIPELINES" },
        { source: "AWS_REGION" },
        { source: "DATABASE_URL" },
        { source: "AUTH_SECRET" }
      ]
    }
  ]
};
