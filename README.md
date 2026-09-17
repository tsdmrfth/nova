# Nova

GitHub copy of the Nova repo. **Origin is the source of truth** until this GitHub remote actually holds Origin `main` (Phase 0 scaffold, P1-01 shared pool math, P1-02 Home Pixi/HUD, and the fix-loop).

## Remotes

| Remote | URL | Role |
| --- | --- | --- |
| Origin | `https://origin.cursor.com/tsdmrfth-nova/tmp-6d00301ed80df1e3.git` | Source of truth — do not delete |
| GitHub | `https://github.com/tsdmrfth/nova` | Requested mirror |

```bash
git remote add origin-cursor https://origin.cursor.com/tsdmrfth-nova/tmp-6d00301ed80df1e3.git
git remote add github https://github.com/tsdmrfth/nova.git
```

## Sync status (2026-09-17)

GitHub `main` is still only the GitHub-created initial commit (`e15f4d3`). It does **not** yet contain Origin `main`.

A GitHub-scoped cloud agent cannot `git fetch` Origin: hosted VMs disable `origin auth login`, and this run had no `CURSOR_AUTH_TOKEN` / `CURSOR_API_KEY`. The connected machine `~/Software/Personal/nova` on Fatih’s MacBook Air already has the Origin checkout.

To finish the mirror, run the sync from that Origin checkout (or start an agent attached to the Origin repo), then push Origin `main` to GitHub — force-push if GitHub history is only the empty initial commit, otherwise open a PR.

`pnpm quality` was not run here because the Origin tree was never fetched.
