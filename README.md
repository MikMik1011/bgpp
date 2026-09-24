# BG++

Fixamo fix ideje since 2023.

A web app for checking live bus arrivals in Belgrade, Novi Sad, and Niš. It's a SvelteKit
frontend backed by an API that proxies and normalizes the official BusLogic transit data (reverse
engineered for compatibility — see the fair usage policy below).

Live at [bgpp.misa.st](https://bgpp.misa.st).

## Developing

```bash
pnpm install
pnpm dev
```

Other scripts: `pnpm build`, `pnpm preview`, `pnpm check`, `pnpm lint`, `pnpm format`.

## Project layout

- `src/routes/api/v2` — the public API (cities, stations, arrivals). See `/api/v2` for reference
  docs.
- `src/lib/buslogic` — client for the upstream BusLogic transit API.
- `src/lib/bgpp` — service layer that maps BusLogic responses into BG++'s API shape.
- `src/lib/components` — Svelte UI, including the shadcn-svelte-based component kit under `ui/`.

## Fair Usage Policy

This service is officially hosted at [bgpp.misa.st](https://bgpp.misa.st) and works only as a
proxy layer to the official BusLogic APIs, which have been reverse engineered for compatibility
and research.

**1. Permitted Use** — The BGPP proxy API may be used only in the official BGPP app or for
personal research, testing, and educational work.

**2. Third Party Projects** — If you want to use this API in your own project, you must adapt the
source code for your needs or self host your own instance. Direct use of bgpp.misa.st in third
party apps is not allowed.

**3. Restrictions** — Usage that places excessive load, bypasses limits, mirrors data, or harms
stability is forbidden.

**4. Enforcement** — Violations may result in temporary or permanent blocks.

**5. Changes** — This policy may change at any time. Continued use indicates acceptance.

## License

AGPL-3.0 — see [LICENSE](LICENSE).
