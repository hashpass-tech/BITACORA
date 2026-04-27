# Monorepo Setup Guide

Bitacora uses a pnpm workspace and Turbo monorepo layout.

## What Changed

- `apps/mobile` contains the Expo app
- `packages/shared` contains shared utilities
- root scripts run workspace-wide build, test, and lint tasks

## Common Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm lint
```

## Next Steps

1. Review [Monorepo](./MONOREPO.md) for the workspace structure
2. Use the root README for day-to-day project usage
3. Keep new app and package docs inside `docs/` instead of the repo root
