# Bitacora Monorepo

A modern monorepo setup using `pnpm` workspaces and Turbo for multiple packages
and applications.

## Project Structure

```text
.
├── apps/
│   └── mobile/              # Expo React Native mobile app
├── packages/
│   └── shared/              # Shared utilities, types, and store
├── pnpm-workspace.yaml      # pnpm workspace configuration
├── turbo.json               # Turbo build system configuration
├── package.json             # Root workspace package.json
└── .npmrc                   # pnpm configuration
```

## Quick Start

### Prerequisites
- `pnpm` 9.1.0+
- Node.js 18+

### Install

```bash
pnpm install
```

### Develop

```bash
pnpm dev
pnpm -C apps/mobile start
```

### Build

```bash
pnpm build
pnpm -C apps/mobile build
```

### Test and Lint

```bash
pnpm test
pnpm lint
pnpm -C apps/mobile test
```

## Workspaces

### `apps/mobile`
Main Expo React Native application for Bitacora.

### `packages/shared`
Shared utilities, types, and store logic used across the monorepo.

## Versioning

The repo root uses `@edcalderon/versioning`.

```bash
pnpm version:status
pnpm release:patch
pnpm release:pipeline:patch
```

Production releases are executed by the AWS CodePipeline buildspec, not by a
GitHub workflow.
