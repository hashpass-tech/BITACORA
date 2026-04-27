# Bitacora Infra

AWS infrastructure workspace for Bitacora using `@lsts_tech/infra` and SST v3.

Defaults:

- Web app domain: `bitacora.hashpass.tech`
- Hosted zone: `hashpass.tech`
- GitHub repo: `hashpass-tech/BITACORA`
- Pipelines: `production` on `main`

## Common commands

```bash
pnpm --filter @bitacora/infra deploy:prod
pnpm --filter @bitacora/infra ensure:pipelines
```

The CodeBuild pipeline expects [buildspec.yml](./buildspec.yml) in this package
and uses the production deploy path only.

When the CodePipeline source artifact does not include git metadata, the release
step needs `GITHUB_TOKEN` or `GH_TOKEN` so it can rehydrate a git checkout,
commit the version bump, and push the tag back to `main`.

If you need to change the AWS account, set `AWS_PROFILE` or the standard AWS CLI
environment variables before running the deploy commands.
