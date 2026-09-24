#!/usr/bin/env bash
# Boundary checkpoint (2026-09-23, madfam-site): public repo automation, ported from
# solarpunk-foundry scripts/check-action-pins.sh (foundry #35).
# Public-safe abstractions only; no private topology or credential material.
# Policy: docs/PUBLIC_REPO_BOUNDARY.md; internal-devops/docs/repo-boundary-contract.md

set -euo pipefail

# Every third-party `uses:` must name an immutable 40-hex commit SHA.
#
# WHY. `@main` and `@v4` are mutable refs. `templates/ci/README.md` instructed
# every madfam-org repo to consume this repository's actions at `@main`, so
# anyone who could push to this repo's main branch executed code inside every
# consumer's CI -- including `npm-madfam-auth`, which is handed
# `secrets.NPM_MADFAM_TOKEN`. A tag is no better: tags move.
#
# Local `./`-relative uses are exempt: they resolve inside the same checkout, so
# there is no third party and nothing to pin.
#
# Exit codes:
#   0  every non-local `uses:` is SHA-pinned
#   1  at least one mutable ref
#   2  UNDETERMINED -- no files to scan, or no `uses:` found at all, which means
#      the scan was misconfigured rather than clean.

ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT"

SCAN_DIRS=(".github")

files=()
while IFS= read -r f; do
  [[ -n "$f" ]] || continue
  files+=("$f")
done < <(git ls-files -- "${SCAN_DIRS[@]}" 2>/dev/null || true)

if [[ "${#files[@]}" -eq 0 ]]; then
  printf '[action-pins] UNDETERMINED - no tracked files under %s\n' "${SCAN_DIRS[*]}" >&2
  printf 'Action pin check UNDETERMINED - refs_checked=0 unpinned=0\n'
  exit 2
fi

status=0
seen=0
checked=0
unpinned=0

while IFS= read -r line; do
  [[ -n "$line" ]] || continue
  location="${line%%:uses:*}"
  ref="${line#*:uses:}"
  ref="${ref#"${ref%%[![:space:]]*}"}"   # ltrim
  ref="${ref%%[[:space:]]#*}"            # drop a trailing "# vN" comment
  ref="${ref%"${ref##*[![:space:]]}"}"   # rtrim
  [[ -n "$ref" ]] || continue
  seen=$((seen + 1))

  # Local composite action, or a `uses:` whose value is an expression.
  case "$ref" in
    ./*|.\\*|'${{'*) continue ;;
    docker://*) continue ;;
  esac

  checked=$((checked + 1))
  if [[ ! "$ref" =~ @[0-9a-f]{40}$ ]]; then
    printf '[action-pins] mutable ref: %s -> %s\n' "$location" "$ref" >&2
    status=1
    unpinned=$((unpinned + 1))
  fi
done < <(grep -nHE '^[[:space:]]*-?[[:space:]]*uses:[[:space:]]*[^[:space:]]' -- "${files[@]}" \
           | sed -E 's/^([^:]+:[0-9]+):[[:space:]]*-?[[:space:]]*uses:/\1:uses:/')

if [[ "$seen" -eq 0 ]]; then
  printf '[action-pins] UNDETERMINED - scanned %s file(s) and found no `uses:` at all\n' "${#files[@]}" >&2
  printf 'Action pin check UNDETERMINED - uses_seen=0 refs_checked=0 unpinned=0\n'
  exit 2
fi

if [[ "$status" -ne 0 ]]; then
  cat >&2 <<'MSG'

Action pin check failed. Pin by SHA:

  uses: owner/action@<40-hex-sha>  # v1.2.3

`@main` gives every pusher to that branch execution inside this repository's CI,
with this repository's secrets. `@v4` is a tag, and tags move. The trailing
comment is what tells a reader how stale the pin is; Dependabot
(.github/dependabot.yml) keeps both the SHA and the comment current.
MSG
fi

# READ-PROOF. `uses_seen` counts every `uses:` line found (local ones included);
# `refs_checked` counts the third-party refs that had to be pinned.
printf 'Action pin check: files=%s uses_seen=%s refs_checked=%s unpinned=%s\n' "${#files[@]}" "$seen" "$checked" "$unpinned"
exit "$status"
