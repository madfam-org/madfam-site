# Vendored `@pliego/engine` 0.1.0

An unmodified copy of `packages/engine/src` from
[madfam-org/pliego](https://github.com/madfam-org/pliego) at commit
`16451620c10aa0e6c5a300c26b12a9c2c81f0791` (main, 2026-10-28), plus that repository's `LICENSE`
and the package's `package.json`. `SHA256SUMS` lists every source file's hash.

**Licence: AGPL-3.0-only** (see `LICENSE`). The rest of madfam-site is under its own licence; this
directory is not. The engine's source is public at the link above, and the paper card links to it
from the page (AGPL §13). It runs only inside the paper card's module Worker
(`components/paper-card/physics.worker.ts`), which talks to the page by `postMessage`.

**Why a copy and not the package.** `@pliego/engine` is not published to `npm.madfam.io` yet: the
dispatch-only `publish-engine.yml` needs a maintainer to run it. Once 0.1.0 is published, replace
this directory with the dependency `"@pliego/engine": "0.1.0"` (`.npmrc`:
`@pliego:registry=https://npm.madfam.io`), change the worker's import to `@pliego/engine`, and
check the published `src/` against `SHA256SUMS`.

**Do not edit these files.** Changes belong in Pliego. To update, copy `packages/engine/src` from a
new Pliego commit, then regenerate the hashes:

```bash
cd apps/web/vendor/pliego-engine && find src -name '*.js' | sort | xargs shasum -a 256 > SHA256SUMS
```
