# Nova

Phase 0 monorepo scaffold for Nova: a pnpm workspace with a Vite + React + TypeScript web shell, product routes, a lazy PixiJS Home scene host, shared libraries, and an empty asset canon.

There is **no full game UI**, **no wallet**, **no pool math**, and **no contracts** in this phase.

## Status

| Phase | Scope |
| --- | --- |
| **0 (current)** | Tooling, 8 product route placeholders, lazy PixiJS v8 canvas host, navy-glass tokens, asset canon/drafts layout, CI. |
| **1 (next)** | PixiJS renderer plus a **blue HUD** overlay on the Home scene. Not implemented yet. |

## Workspace

| Path | Package | Role |
| --- | --- | --- |
| `apps/web` | `@nova/web` | Vite + React + TypeScript shell, React Router, Home Pixi stub |
| `packages/shared` | `@nova/shared` | Shared utilities (hello + tests) |
| `packages/config` | `@nova/config` | Shared TypeScript config, app constants, color tokens |
| `packages/assets` | `@nova/assets` | `canon/`, `drafts/`, reference pointer, empty canon manifest |

## Product routes

| Route | Path |
| --- | --- |
| Connect | `/connect` |
| Home | `/` |
| Vote | `/vote` |
| Buy | `/buy` |
| Confirmation | `/confirmation` |
| Results | `/results` |
| Nova/Neighborhood | `/neighborhood` (`/nova` redirects here) |
| Profile | `/profile` |

Home mounts a **lazy** PixiJS v8 scene host (`import("pixi.js")` on mount). The canvas may be empty.

Design tokens: `--color-accent: #2775CA` and `--color-glow: #3B8EF0` (navy glass). No amber.

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

Same four gates as CI:

```sh
pnpm quality
```

`pnpm dev` starts the web shell at http://localhost:5173.

## CI

GitHub Actions / Origin-compatible workflow: `.github/workflows/ci.yml`.

It runs on pushes to `main` and on pull requests:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`

Run the same locally with `pnpm quality`.
