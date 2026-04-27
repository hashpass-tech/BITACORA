# Bitacora Infra

AWS infrastructure workspace for Bitacora using `@lsts_tech/infra` and SST v3.

Defaults:

- Mobile app domain: `bitacora.hashpass.tech`
- Hosted zone: `hashpass.tech`
- GitHub repo: `hashpass-tech/BITACORA`
- Pipelines: `production` on `main`

## Common commands

```bash
pnpm --filter @bitacora/infra deploy:prod
pnpm --filter @bitacora/infra ensure:pipelines
```

The CodeBuild pipeline expects [buildspec.yml](./buildspec.yml) in this package
and uses the production deploy path only. It deploys the Expo web build from
`apps/mobile` to `bitacora.hashpass.tech`.
The pipeline deploys the already-released source from `main`; it does not run a
second version bump inside CodeBuild.

If you need to change the AWS account, set `AWS_PROFILE` or the standard AWS CLI
environment variables before running the deploy commands.
