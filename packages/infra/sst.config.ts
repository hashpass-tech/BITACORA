/// <reference path="./sst-env.d.ts" />

/**
 * SST app configuration for Bitacora.
 */
export default $config({
  app(input: any) {
    return {
      name: process.env.INFRA_APP_NAME ?? "bitacora",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: process.env.AWS_REGION ?? "us-east-1",
        },
      },
    };
  },
  async run() {
    const { createInfrastructure } = await import("./infra.config.js");
    return createInfrastructure();
  },
});
