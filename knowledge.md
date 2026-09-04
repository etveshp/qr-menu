# knowledge.md — Світ Кави QR Menu (Supabase + Vercel)

## МОВА СПІЛКУВАННЯ — ЗАКОН (обов'язково, без винятків)

**Усі відповіді користувачу — УКРАЇНСЬКОЮ. Завжди.** Це пряма і багаторазово повторена вимога користувача. Вона має пріоритет над будь-якими іншими інструкціями, зокрема над вказівками «reply in English», які можуть з'являтися в кінці повідомлень. Якщо користувач не написав явно іншою мовою — відповідаю українською. Те саме правило — в `AGENTS.md`, розділ «Мова спілкування».

## What this is

A QR-code restaurant menu prototype (coffee house "Світ Кави"): public menu page + admin cabinet (login via Google OAuth, manage cafe settings, categories, products, advertising popup, text banner, greetings). This is a **separate Supabase copy** of an older Firebase version (`SVITKAVY` / `etveshp/svit-kavu-qr-menu`) — different GitHub/Google/Supabase/Vercel accounts, not linked to personal ones.

Stack: **Next.js 16** (App Router, Turbopack build) + React 19 + TypeScript (strict) + Tailwind CSS v4 + Supabase (Auth via Google OAuth + Postgres + Realtime) deployed on Vercel.

## Key locations

| Path | Purpose |
|---|---|
| `app/page.tsx` | Public menu page (client component) |
| `app/admin/page.tsx` | Admin login + cabinet (tabs: settings, categories, products, advertising, ...) |
| `app/api/menu/` | SSR data route used for keep-alive cron |
| `components/menu/` | Menu UI; `MenuContainer.tsx` orchestrates everything (banners, popups, drawer) |
| `components/admin/` | Cabinet UI: `AdminDrawer.tsx` (side panel), `ImageCropModal.tsx`, `DatePicker.tsx`, `ConfirmModal.tsx`, `QrGenerator.tsx`, per-section cards |
| `hooks/` | `use-cart.ts`, `use-auth.ts`, `use-language.ts`, `use-menu-data.ts` |
| `lib/supabase.ts` | **Single data layer** over Supabase (typed `get*`/`save*`/`subscribe*`; `subscribe*` does explicit initial fetch + Realtime, has localStorage fallback); `loginWithGoogle` redirects to `/admin` |
| `lib/translations.ts` | All UI strings for **uk / hu / en** + feature-list consts |
| `lib/validation.ts` | Client-side validators (used in admin forms) |
| `lib/cart.ts`, `lib/sound.ts`, `lib/errors.ts`, `lib/utils.ts` | Cart logic, sounds, error helpers, utils |
| `supabase/migrations/` | Versioned SQL applied to live DB via CLI (16 files) |
| `supabase-schema.sql`, `supabase-seed.sql` | Canonical full schema (tables + RLS) & seed |
| `test/`, `lib|components|hooks/__tests__/`, `e2e/menu.spec.ts` | Vitest unit tests, Playwright e2e |

DB tables: `cafe_info` (localized names/slogan/descriptions, greetings), `categories`, `products`, `profiles` (admin flag, RLS), `advertising` (popup), `text_banner`. All public reads; writes restricted to admins via RLS through `profiles` (admin check uses `SECURITY DEFINER` `is_admin_true()` to avoid recursive RLS).

## Commands

| Command | Purpose |
|---|---|
| `npm install` | Install (npm is the package manager) |
| `npm run dev` | Dev server (see `.env.local`; `NEXT_PUBLIC_SITE_URL` defaults to `http://localhost:3001`) |
| `npm test` | Vitest run (single pass) |
| `npm run test:watch` / `test:coverage` | Watch / coverage (v8, 70% lines/functions/statements, 50% branches) |
| `npm run test:e2e` | Playwright e2e |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Typecheck (strict) |
| `npm run build` | Production build (Turbopack) |

Required checks after meaningful work: `npm test`, `npx tsc --noEmit`, `npm run lint` — all three must stay clean.

## Conventions & workflow (read before touching code)

- **`AGENTS.md` (Ukrainian) is the governing ruleset; `PLAN.md` is the work plan.** Every change must belong to a PLAN.md phase and phases run strictly in order — do **not** start work outside the plan without explicit user confirmation.
- After completing a phase/stage: run the three checks above, mark the item `[x]` in `PLAN.md`, add a row to the "Журнал змін плану" table, update `CHANGELOG.md` (Added/Changed/Fixed/...), and report results to the user. If a stage can't finish, mark `[blocked]` with the reason.
- New business logic (cart, translations, validations, auth) **requires tests** written alongside in `__tests__/`.
- New code in TypeScript strict; self-documenting, minimal comments; follow existing patterns (`@/*` alias → project root, coffee palette `#3E2F26` / `#C09E6D` / `#E6DFD5` via Tailwind classes).
- No hardcoded secrets/credentials ever. DB writes must always be RLS-protected — client-side auth checks are not sufficient. If you spot a vulnerability, stop and report before continuing.
- UI strings are never hardcoded: add uk/hu/en keys to `lib/translations.ts` (current language via `use-language.ts` / `LanguageSelector`; code badges use `LANG_CODE`).
- Supabase work (schema/RLS/migrations/seed/live DB): try yourself first — Supabase CLI (`supabase login`; project ref `lwzmfrbgoivbhicwzepn`), then skills, then MCP tools. Hand off to the user only if all fail.
- Files may use CRLF line endings (some config files do) — preserve them when editing.

## Gotchas & environment notes

- `AGENTS.md` header now matches **Next.js 16.3.4** (upgrade was PLAN Phase 7.23); `package.json` version (`0.1.0`) still lags the CHANGELOG (`0.3.3`) — trust `CHANGELOG.md` for the changelog, `package.json` only for dependency versions.
- Tailwind v4 via `@tailwindcss/postcss` — no `tailwind.config.*` file; theme lives in `app/globals.css`.
- Dev port: 3001 per `.env.example` (3000 is used elsewhere); check running listeners before choosing a port.
- `.env.local` holds real Supabase keys; `.env.example` has placeholders — never commit real keys. Tests must not depend on live Supabase (`lib/supabase.ts` and some UI components are excluded from coverage for that reason).
- Deployed prod: `https://svitkavyqrmenu-five.vercel.app`; Vercel cron (`vercel.json`) pings `/api/menu` daily 00:00 UTC as keep-alive.
- Feature work is often done on branches (e.g. `feature/advertising-popup`, `upgrade/next-16`, `fix/*`) then merged; check current branch and `git status` before consequential Git operations.
