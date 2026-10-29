# Teammate networking cards

Every MADFAM teammate can have a contact card: a printed or on-screen QR
`madf.am/{code}` that opens `madfam.io/{locale}/c/{slug}`. The card offers save
contact (vCard), an in-page Kalya booking, LinkedIn and email. A full-screen
presenter at `/es/c/{slug}/qr` installs as a home-screen app. Two phone posters
come with it, one of them an offline vCard QR that works without signal.

Onboarding a teammate is one data entry plus one command. The data entry goes in
`apps/web/lib/team-cards.ts`. Everything else is generated from it:

| Output                        | Where                                              | Committed       |
| ----------------------------- | -------------------------------------------------- | --------------- |
| vCard ("Guardar contacto")    | `public/c/{slug}.vcf`                              | yes             |
| Presenter QR (`madf.am/code`) | `public/c/{code}-qr.svg`                           | yes             |
| Phone poster, tracked link    | `out/team-cards/{code}-madf-am-pantalla.png`       | no (gitignored) |
| Phone poster, offline vCard   | `out/team-cards/{code}-vcard-offline-pantalla.png` | no (gitignored) |

Paths are relative to `apps/web`. The team-cards test fails if a committed file
drifts from `team-cards.ts`, so never edit the `.vcf` or the SVG by hand.

## Rules

- **Work contact only.** This repository is public. Use the teammate's
  `@madfam.io` address and a public LinkedIn URL. Never add a personal phone, a
  personal email or a home address. The generator refuses anything that looks
  like a phone number.
- **A marca code is permanent.** marca never re-issues or repoints a slug.
  Agree the code with the teammate before you mint it. It is usually their
  first name: `madf.am/aldo`, `madf.am/caro`.
- **Keep the visual world.** Obsidian ground, the leaf→lavender→sun OKLCH
  gradient, and square crisp QR modules on a white tile. Rounded modules failed
  to decode at small sizes, so don't restyle the QR.

## Steps

Run every command from the repository root on a branch, never on `main`.

### 1. Mint the marca code

```bash
pnpm --filter @madfam-site/web team-cards mint caro --to carolina
```

`<code>` is what gets printed. `--to` is the card slug in the page URL, and it
defaults to the code. Without `--confirm` the command only prints the request.
Check both values, then run it again with `--confirm` and `MARCA_ADMIN_TOKEN`
in the environment. The owner holds that token; it is never committed or
pasted into a PR. marca answers 201 with the short URL. If it answers 422, the
code is taken: pick another one.

Until step 5 deploys, the code points at a page that does not exist yet. That
is fine as long as nothing is printed before then.

### 2. Add the data entry

Append to `TEAM_CARDS` in `apps/web/lib/team-cards.ts`:

```ts
{
  slug: 'carolina',                 // the page: /es/c/carolina
  name: 'Carolina Hernández Mora',  // shown on the card and the posters
  givenName: 'Carolina',            // vCard N; a compound family name stays whole
  familyName: 'Hernández Mora',
  email: 'caro@madfam.io',
  title: 'Lead Industrial and Product Designer', // optional
  linkedin: 'https://www.linkedin.com/in/carohernandezmora/', // optional
  shortLink: 'madf.am/caro',        // the code minted in step 1
  bookingEventType: 'llamada-carolina', // their own Kalya event type, see below
},
```

The card's «Agendar una llamada» books `bookingEventType` on Kalya's `madfam`
tenant, so the booking alert reaches the teammate, not a shared inbox. Declare
it in Kalya before this card ships: in `madfam-org/kalya`
`prisma/provision/madfam-tenant.json`, add a host with the teammate's name and
`notifyEmail`, plus an event type with this slug on that host. Then dry-run and
apply it as `docs/PROVISIONING.md` §5.1 describes. Until it is applied, the
dialog falls back to the plain Kalya link after 8 s.

### 3. Generate

```bash
pnpm --filter @madfam-site/web team-cards --only caro
```

This writes the vCard and the QR SVG, renders that teammate's two posters to
`apps/web/out/team-cards/`, and reads every QR back with jsQR at 240, 320, 480
and 640 px. It exits non-zero if any QR fails to read back its exact payload.
Without `--only` it renders every teammate's posters. `--no-posters` skips
Playwright, and `--check` writes nothing and reports drift.

Look at both posters before sending them to the teammate (AirDrop, or any
channel that keeps the PNG at full size). They are lock-screen or photo
wallpapers: show the screen and let people scan it.

### 4. Open the PR

```bash
pnpm --filter @madfam-site/web exec vitest run lib/__tests__/team-cards.test.ts
```

Commit `lib/team-cards.ts`, `public/c/{slug}.vcf` and `public/c/{code}-qr.svg`.
Never commit the posters. CI runs the drift test and `pnpm build`; the build
pre-renders `/{es,en,pt}/c/{slug}`, the presenter and its manifest.

### 5. Deploy

Merging to `main` deploys madfam.io (Deploy Web, about 15 minutes). The digest
bump lands as a follow-up `deploy(web)` commit.

### 6. Smoke-test

```bash
pnpm --filter @madfam-site/web team-cards smoke carolina
```

It checks the marca redirect, the card in all three locales, the presenter, the
vCard (`text/vcard`), the manifest and the QR SVG. Then, on a phone:

1. Scan the tracked poster. The card opens, and "Guardar contacto" offers to add
   the contact.
2. Turn on airplane mode and scan the offline poster. The phone offers to add
   the contact with name, title, company, email and link.
3. Open `/es/c/{slug}/qr` and add it to the home screen. It opens to the QR.

Against a local `next start`, skip the marca check:
`team-cards smoke carolina --base http://localhost:3000 --skip-marca`.

## Changing a card

Edit the entry, run step 3 and open a PR. The marca code points at the page, so
a new title or email needs no reprint. Only changing `shortLink` means a new
code (step 1) and new posters. The old code keeps redirecting to the card page.

## Where the code lives

- `apps/web/lib/team-cards.ts` holds the data and the card copy.
- `apps/web/scripts/team-cards/files.ts` holds the pure vCard and QR builders
  that both the CLI and the test use.
- `apps/web/scripts/team-cards/posters.ts` holds the Playwright poster renderer
  and decode check.
- `apps/web/scripts/team-cards/cli.ts` holds the `mint`, generate, `--check`
  and `smoke` commands.
- `apps/web/app/[locale]/c/[person]/` holds the card page and the presenter.
- `apps/web/app/c/[person]/manifest.webmanifest/route.ts` serves the
  home-screen manifest.
