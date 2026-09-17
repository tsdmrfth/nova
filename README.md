# Nova

Phase 0 monorepo scaffold for Nova: a pnpm workspace with a Vite + React + TypeScript web shell, shared libraries, and an empty asset canon.

There is **no full game UI** and **no contracts** in this phase.

## Status

| Phase | Scope |
| --- | --- |
| **0 (current)** | Tooling and package layout. Lint, typecheck, test, and build are green. |
| **1 (next)** | PixiJS renderer plus a **blue HUD** overlay. Not implemented yet. |

## Workspace

| Path | Package | Role |
| --- | --- | --- |
| `apps/web` | `@nova/web` | Vite + React + TypeScript shell |
| `packages/shared` | `@nova/shared` | Shared utilities (hello + tests) |
| `packages/config` | `@nova/config` | Shared TypeScript config and app constants |
| `packages/assets` | `@nova/assets` | Asset stub and empty canon manifest |

## Setup

Requires Node 22+ and [pnpm](https://pnpm.io) 10+.

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

## Scripts

Run from the repo root:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm dev` starts the web shell at http://localhost:5173.
