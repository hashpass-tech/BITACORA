# Bitacora Infra

AWS infrastructure workspace for Bitacora using `@lsts_tech/infra` and SST v3.

Defaults:

- Mobile app domain: `bitacora.hashpass.tech`
- Hosted zone: `hashpass.tech`
- Hosted zone ID: `Z0236404TWGQH7K9IU6F`
- Expo production cert: reused from the existing `*.hashpass.tech` ACM cert in `us-east-1`
- Root domain input: `hashpass.tech`
- GitHub repo: `hashpass-tech/BITACORA`
- Pipelines: `production` on `main`

## Common commands

```bash
pnpm --filter @bitacora/infra deploy:prod
pnpm --filter @bitacora/infra ensure:pipelines
```

`ensure:pipelines` preserves the production custom domain by default while it
recreates missing pipelines. Set `INFRA_PIPELINE_PRESERVE_CUSTOM_DOMAIN=false`
only if you intentionally want a bootstrap deploy without Route 53 or ACM
records.

Production and dev domain records are pinned to the Route 53 hosted zone ID in
`INFRA_HOSTED_ZONE_ID` so restores do not depend on hosted-zone name discovery.

The CodeBuild pipeline expects [buildspec.yml](./buildspec.yml) in this package
and uses the production deploy path only. It deploys the Expo web build from
`apps/mobile` to `bitacora.hashpass.tech`.
The pipeline deploys the already-released source from `main`; it does not run a
second version bump inside CodeBuild.

If you need to change the AWS account, set `AWS_PROFILE` or the standard AWS CLI
environment variables before running the deploy commands.
