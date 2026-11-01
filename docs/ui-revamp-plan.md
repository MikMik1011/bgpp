# BG++ web UI revamp: plan

Rebuild the web UI from scratch so it looks and behaves like the Android app (`BGPPNative`, Jetpack Compose, Material 3 Expressive), and make it responsive from phone to desktop. Built with `m3-svelte` on Svelte 5.

Status: plan only. Nothing in the repo has been changed except this file.

## 1. Decisions

| # | Decision | Reason |
|---|---|---|
| 1 | Rebuild the whole UI and UX. The current UI is not a constraint. | Requested. |
| 2 | Compact screens (<600 px) match Android 1:1. Larger screens use Material adaptive layouts. | "Match Android" and "be responsive". |
| 3 | Svelte 5 + Vite 7 + SvelteKit 2.70 (not Kit 3) + `m3-svelte` 7.2.1. | m3-svelte needs Svelte ≥5.40; its Vite plugin needs Vite ≥7.2.4; Kit 3 needs Vite 8. |
| 4 | Drop Tailwind, shadcn-svelte, bits-ui and the other UI deps. Use scoped CSS with M3 tokens. | m3-svelte forbids `class` on its components, its Tailwind support targets v4, and its docs warn mixins and Tailwind may clash. |
| 5 | Default colour scheme is the fixed teal from `Color.kt`, generated from the seed. Add an accent picker in settings. | The teal is what Android shows without dynamic colour. Verified exact (see 5.1). |
| 6 | No walking distance anywhere. Air distance only. | Requested. Removes the Geoapify dependency. |
| 7 | Maps use Leaflet (already in the repo) plus `leaflet.markercluster`, with `divIcon` markers styled by theme tokens. | Android's map is raster only, so MapLibre adds ~800 KB and WebGL for no visual gain. |
| 8 | Arrival alerts are in scope, delivered in two steps: in-tab alerts (Phase 5a), then Web Push through the server (Phase 5b). | Browsers cannot run a foreground service; only Web Push works with the browser closed. See section 11. |

### 1.1 Decision rule

Every choice is made to improve three things together, and a choice that helps one while hurting another is rejected:

- **UX:** the screen is understood from layout alone. No taglines, helper text or secondary labels (section 2.2). Fast, keyboard and screen reader friendly, works offline where cheap.
- **DX (for the person writing the code):** one command checks everything, strict types with no `any` on API data, small components with one job, fast feedback, nothing to configure by hand.
- **AX (for AI agents working in the repo):** the repo states its own rules in `AGENTS.md`, conventions are enforced by tools instead of prose, every task has a verifiable command, types and tests describe behaviour so an agent can change code and know if it broke something.
- **Without breaking anything:** `main` and production stay untouched until `redesign` is ready. The `/api/v2` JSON routes and their shapes do not change. Old URLs keep working or redirect. Each phase ends green (check, lint, test, build).

## 2. Android reference

### 2.1 Theme

- **Colour scheme:** Material TonalSpot, seed hue 176.5, chroma 36 (light and dark). Android 12+ additionally uses wallpaper dynamic colour, which the web cannot do.
- **Dynamic colour seen on the reference device:** primary `#A0CDE0`, container `#2B5868`, dark background `#0B0F11` (hue about 200). Offered as the "Device blue" accent preset.
- **Shapes:** 4 / 8 / 12 / 16 / 28 px. These equal m3-svelte's tokens.
- **Typography:** Material default type scale (Roboto). ETA numbers use Bitcount Prop Single Ink, which is a colour font (COLR/CPAL, 29-colour palette). That is why ETAs render as yellow and red LED dots.
- **Motion:** `MotionScheme.expressive()`. Fast spatial and fast effects specs for expand, collapse and slide-in.
- **Icons:** Material icons: LocationOn, FavoriteBorder / Favorite, ArrowBack, ExpandMore / ExpandLess, NotificationsActive, Place, Route, MyLocation, Info, Search, Map, MoreVert. The air-distance and map icons are custom drawables (`ic_air_distance.xml`, `ic_map.xml` in `app/src/main/res/drawable/`) and can be exported to SVG. The walking and duration drawables are not needed.

### 2.2 Design principle: the layout explains (no taglines, helper text or secondary labels)

Avoid unnecessary secondary labels and descriptions. Position, size, grouping, icons and state do the explaining. Add words only when the screen is ambiguous without them or when the user must act on them.

- No captions that restate what a value already shows (a big "5 min" needs no "Next bus" under it).
- No helper text under fields when the field label and control already say it.
- No taglines (the old "fixamo fix ideje since 2023" card line is gone), no subtitles that repeat the title, no explanatory banners or tier badges. If something is unavailable, disable the control or show it in a different state.
- Empty and idle states: an icon plus at most one short line, and no instructions that repeat what is visible.
- Keep a label when it carries information the layout cannot (station name, city, line number, units).
- If a screen needs words to make sense, the fix is the layout, not more words.
- Where this conflicts with copying Android's captions, this principle wins. The affected items are listed in 2.3.

### 2.3 Android labels dropped on the web

| Android | Web |
|---|---|
| "Next bus" under the first ETA | Dropped. The first ETA is the large figure on the card. |
| "ID • 0401A" chip with pin icon, plus a city chip, in the arrivals card | One small "0401A" with the pin icon. City is already in the app bar. |
| "ID • x" line in the map selection card | Dropped from the card body; the ID sits beside the name in small type. |
| "Currently near X" | Shown only when the name is known (never when the API says "Unknown"). |
| "Using city center for distances" chip | Replaced by a location icon button in the search row. Filled when using the device location, outlined when using the city centre. |
| Subtitle under the search app bar title | City name only; the "Search stations" title is dropped in favour of the city name. |

### 2.4 Screens (compact)

**Search (start screen)**
- Top app bar: two-line title ("Search stations", city name in `labelSmall`), actions ♡ (favorites, disabled until a city is known) and ⋮ (opens preferences).
- Outlined text field, 52 px high, leading search icon, placeholder "Search stations".
- Location state is shown by an icon button beside the field (section 2.3), not by a chip or message.
- Station list: pin icon (primary, 32 px), name (`titleMedium`), metrics row (air-distance icon + metres), ID right-aligned ("ID: 0416B"), 0.5 px `outlineVariant` divider.
- Map FAB bottom-end. Pull-to-refresh.
- Empty or error state: centred message with a text "Retry" button.

**Preferences dialog**
- City (dropdown), range slider (100–1000 m, step 50, default 400), Apply and Cancel.

**Favorites**
- Back button, title "Favorite stations", city subtitle, same station list. Empty state: "You don't have any favorite stations yet."

**Arrivals**
- Top bar: back, station name (`titleLarge`), city (`labelMedium`), ♡ toggle.
- Station overview card (elevated): name in `headlineSmall`, outlined assist chip "ID • 0401A" with pin icon, elevated assist chip with city.
- One elevated card per line:
  - Collapsed: line number badge (primary container, `labelLarge`, small shape), display name (`titleMedium` semibold, 2 lines max), next ETA in Bitcount `headlineSmall` ("5 min") with "Next bus" caption, expand chevron.
  - Expanded: full line name (`bodyMedium`, onSurfaceVariant), then one row per bus: ETA (Bitcount `titleLarge`), the vehicle number (`garageNo`, see below), "N stops away", bell button, "Currently near X" (`bodySmall`, only when known). Dividers between rows.
- **Vehicle number (web addition, requested):** every bus row shows the vehicle's `garageNo` (for example `1048`) so people can tell which type of bus is coming from its number. It appears as a small outlined badge in tabular figures right after the ETA, with no label (the layout explains it, section 2.2). It is the same value the alert is bound to (section 11), so people see which bus an alert tracks. Screen readers get "Vehicle 1048" through `aria-label`. The value is selectable text. It is not shown on the collapsed line card, to keep that card to the line and its next ETA. Showing the type itself (articulated, low floor, electric) as an icon would need a fleet-number lookup table; the API has none, so that is a later addition if a data source is found.
- Behaviour that comes from the Android view model:
  - Display name is the last "-" segment of the line name.
  - ETA minutes are `floor(etaSeconds / 60)`, minimum 0.
  - Buses within a line are sorted by ETA. Lines are sorted by next ETA.
  - Only the first line is expanded on load.
- Map FAB, pull-to-refresh. Loading shows a centred spinner. An error with no data shows an error card with a "Retry" tonal button. An error with data shows the error card at the top of the list.

**Station map**
- Full screen. Top bar with back, title "Stations".
- Round badge markers with a pin icon, secondary container colours, highlighted marker in primary.
- Recenter FAB bottom-end.
- Selection card slides up from the bottom: pin icon, name, "ID • x", a distance pill (secondary container, e.g. "420 m away") and a "Show arrivals" button with a route icon.
- Stations are loaded for the current viewport.

**Arrivals map**
- Full screen. Station pin (larger), one round badge per bus with the line number (first three characters), user location in blue (`#1A73E8`).
- Selected bus is highlighted (primary). Selecting a bus shows an info card: 40 px line tile, display name, the vehicle number badge, "N min • M stops away", "Currently near X" (only when known).
- Recenter FAB fits all markers.

## 3. m3-svelte facts that shape the work

- Requires Svelte ^5.40, `vite-plugin-functions-mixins` (Vite ^7.2.4) and `@ktibow/material-color-utilities-nightly` as peers.
- Components: `Button` (`iconType="full"` is the icon button), `ConnectedButtons` (segmented), `FAB`, `Card` (elevated, filled, outlined), `ListItem`, `Chip`, `Dialog`, `BottomSheet`, `StandardSideSheet`, `Menu`, `Snackbar`, `TextField` and `TextFieldOutlined`, `Select` and `SelectOutlined`, `Slider`, `Switch`, `Checkbox`, `Radio*`, `CircularProgress*`, `LoadingIndicator`, `NavCMLX`, `NavigationRail`, `Tabs`, `Divider`, `Icon`, `ChipChooser`.
- Helpers: `containerTransform`, `sharedAxisTransition`, easing functions, tokens `--m3c-*` (colours), `--m3-shape-*`, `--m3-elevation-*`, type mixins `@apply --m3-title-medium`, and a `.m3-layer` state-layer class for custom elements.
- Not provided: top app bar, pull-to-refresh, search bar, tooltip, map.
- Constraints: no `class` prop on its components (use wrapper elements or `:global`), Checkbox, Radio and Switch must sit inside a `<label>`, icons come from `@ktibow/iconset-material-symbols` and are rendered by us.
- Breakpoints it uses: 37.5rem (600 px), 52.5rem (840 px), 75rem (1200 px). They equal the M3 window classes.

## 4. Stack and dependencies

### 4.1 Add

| Package | Role |
|---|---|
| `svelte@^5` | Runes, snippets (required by m3-svelte). |
| `vite@^7` | Required by the functions-mixins plugin. |
| `@sveltejs/vite-plugin-svelte@^6` | Svelte 5 + Vite 7. |
| `@sveltejs/kit@^2.70`, `@sveltejs/adapter-node@^5` | Stay on Kit 2. |
| `m3-svelte@7.2.1` (exact) | UI components and tokens. |
| `vite-plugin-functions-mixins@^0.4.1` | Needed for m3-svelte CSS mixins. |
| `@ktibow/material-color-utilities-nightly` | Peer of m3-svelte; also used by `scripts/gen-theme.mjs`. |
| `@ktibow/iconset-material-symbols` | Icons. |
| `@fontsource-variable/roboto` | Body font. |
| `leaflet.markercluster`, `@types/leaflet.markercluster` | Clustering. |
| `idb` | Small IndexedDB wrapper for the local station database. |
| `web-push`, `@types/web-push` | Server side Web Push with VAPID (Phase 5b). |
| `fake-indexeddb`, `vitest` (dev) | Tests for the sync flow. |
| Bitcount woff2 (copied from Android repo, with OFL licence file) | ETA numerals. Not Fontsource: verify it keeps the colour tables, and prefer the Android TTF. |

### 4.2 Remove

`tailwindcss`, `postcss`, `autoprefixer`, `tailwind-merge`, `tailwind-variants`, `clsx`, `bits-ui`, `formsnap`, `sveltekit-superforms`, `cmdk-sv`, `svelte-radix`, `mode-watcher`, `components.json`, `tailwind.config.js`, `postcss.config.js`, and the directories `src/lib/components/ui/` and `src/lib/components/forms/`. Keep `leaflet`.

### 4.3 Infrastructure

- `Dockerfile`: `node:26-alpine` for both stages (Vite 7 needs Node ≥20.19).
- `vite.config.ts`: `plugins: [sveltekit(), functionsMixins({ deps: ["m3-svelte"] })]`.
- Pin exact versions of `m3-svelte` and the colour library. m3-svelte is young and has a single maintainer, and the colour library is a nightly.
- Phase 5b: env vars `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `ALERTS_DATA_DIR`, and a Docker volume at `/data` (section 11.6).
- `pnpm check`, `pnpm lint` and `pnpm build` must pass after each phase.

## 5. Theme system

### 5.1 Generated theme

`scripts/gen-theme.mjs` produces `src/theme.css`.

- Input: hue 176.5, chroma 36, `SchemeTonalSpot` from the colour library, light and dark.
- Output: every `--m3c-*` token that m3-svelte reads, including its extras (`*-subtle`, `*-dim`, `on-on-primary`, `on-surface-container`) from `m3-svelte/etc/colors`.
- Dark scheme applies under `@media (prefers-color-scheme: dark)` when the theme is "system", and under `:root[data-theme="dark"]`. Light under `[data-theme="light"]`.
- Verified in a spike: generating from hue 176.5 reproduces the Android `Color.kt` values exactly for the 18 tokens compared (primary, primaryContainer, secondary, tertiary, surface, surfaceContainer, outline, onSurface, error; light and dark).
- Add the generated file and the script to the repo, and add a small test that compares a few tokens to `Color.kt` constants.

### 5.2 Accent picker (settings)

- Presets: "BG++ teal" (default, static file), "Device blue" (hue about 200), and a hue slider.
- Non-default accents use m3-svelte's livetheme CSS (`m3-svelte/etc/livetheme/tonalspot2021.css`) driven by a seed colour variable set on `:root`. Lazy-load it so the default path ships static values only.
- Persisted in preferences (section 10).

### 5.3 Dark mode and flash prevention

- `src/app.html` has an inline script that reads `localStorage` and sets `data-theme` before first paint.
- `<meta name="theme-color">` for light (`#F5FBF7`) and dark (`#0F1513`) via `media` attributes.
- `site.webmanifest`, `msapplication-TileColor` and the safari mask-icon colour change from green (`#22c55e`) to the teal primary (`#0E6B58`). Regenerate the icon set from the Android launcher icon.

### 5.4 Fonts, type, shape, motion

- `:root { --m3-font: "Roboto Variable", Roboto, system-ui; }`. Type via `@apply --m3-*-*` mixins.
- ETA component uses a separate `@font-face` for Bitcount (colour font), with `font-display: swap`. If a browser renders mono, the ETA falls back to the tabular figures of Roboto.
- Shapes and elevation use m3-svelte tokens unchanged. Easing uses its expressive functions.
- `prefers-reduced-motion`: all page and expand transitions collapse to a short fade.

## 6. Routes

| Route | Screen |
|---|---|
| `/` | Nearby and search (Android's start screen) |
| `/favorites` | Favorite stations |
| `/map` | Station explorer map |
| `/stations/[city]/[id]` | Arrivals |
| `/stations/[city]/[id]/map` | Arrivals map (full screen on compact; embedded pane on large) |
| `/api/v2` | API reference, restyled with `Card` and `ListItem` |

- The city for `/` and `/favorites` comes from preferences, not the URL.
- Every route is a normal URL, so back, forward and deep links work. A station URL opens straight to arrivals.
- The existing `/api/v2/**` JSON routes are untouched. Phase 5b adds `GET /api/v2/alerts/vapid-key`, `PUT /api/v2/alerts` and `DELETE /api/v2/alerts` (section 11.6). `src/service-worker.ts` is served at the site root.
- `+page.ts` keeps loading cities server-side so first paint has the city name.

## 7. Responsive layouts

Window classes: compact <600, medium 600–839, expanded 840–1199, large ≥1200 (CSS media queries plus a small `viewport.svelte.ts` rune for layout decisions that need JS).

| Class | Navigation | Content |
|---|---|---|
| Compact | None. Stack navigation as on Android; actions in the app bar; map FAB bottom-end. `sharedAxisTransition` (X) between routes. | Single column, full width. |
| Medium | `NavigationRail` on the left with Nearby, Favorites, Map. The ♡ action and map FAB move to the rail. | Single pane, content column max 640 px, centred. Arrivals cards full width of that column. Maps fill the area right of the rail. |
| Expanded | Rail | List and detail panes. List pane (Nearby or Favorites) fixed at 400 px, detail pane flexible. Before a station is chosen the detail pane shows the map. `/map` fills the area, with the selection card in a `StandardSideSheet` on the right. |
| Large | Rail, expanded labels | Three panes: list (400 px), arrivals (about 420 px), live map (rest). The arrivals map is a persistent pane, not a dialog. Tapping a line card highlights its buses on the map, and tapping a marker expands its card. |

- Implementation: root `+layout.svelte` owns the rail and panes. On expanded and large, the list pane renders persistently, and `{@render children()}` fills the detail pane. On compact and medium, each route renders its own full content. `/` and `/favorites` render the map in the detail pane.
- Safe areas: use `env(safe-area-inset-*)` for app bar, FAB and bottom sheets (equivalent of Android edge-to-edge).
- Touch targets ≥48 px, including rail items and icon buttons.
- Pointer devices get a refresh button in the app bar. Touch gets pull-to-refresh.

## 8. Screen specs (web)

### 8.1 Nearby / search (`/`)

- App bar: title "Search stations", subtitle city name, actions ♡ and ⚙ (opens preferences).
- Search field: `TextFieldOutlined`, leading search icon, trailing clear button when non-empty. Debounce 150 ms.
- Search rules (mirror the Android DAO queries; details and differences in section 10.1):
  - Blank query: bounding box around the origin, then exact distance filter (`≤ rangeMeters`), sorted by distance.
  - Non-blank query: stations whose ID starts with the query first (ID ascending), then stations whose name contains it (name ascending), de-duplicated by ID. No range filter. Matching ignores case and diacritics, so "sek" finds "Šekspirova".
- Origin: user location if available, otherwise the city centre. When using the city centre show the assist chip "Using city center for distances". Clicking the chip (or a "Use my location" chip next to it) requests geolocation. Never prompt on page load.
- Station row: pin icon, name, air distance (`↔ 471 m`), ID at the end. Whole row is a link to the arrivals route. Hover and focus use the `.m3-layer` state layer.
- States: loading cities and stations (centred progress), no results ("No stations match your criteria." plus Retry), error (message plus Retry).
- Map FAB opens `/map` (compact) or switches the rail destination (medium and up).

### 8.2 Preferences dialog

- `Dialog` with: City (`SelectOutlined`), Range (`Slider` 100–1000, step 50, label "Range: 400 m"), Theme (`ConnectedButtons` System / Light / Dark), Accent (chips: BG++ teal, Device blue, custom hue slider).
- Footer link rows: "About and fair usage policy" (opens a second dialog with the existing policy text), "API reference", "Source code".
- Apply saves and re-queries the list. Cancel discards. Opens from ⚙ on every route.

### 8.3 Favorites (`/favorites`)

- Same list component and the same app bar pattern (back on compact).
- Source: favorites for the current city from the IndexedDB `favorites` store, resolved against the in-memory station list (section 10.1).
- Empty state text from Android. Favorites persist across sessions.

### 8.4 Arrivals (`/stations/[city]/[id]`)

- App bar: back, station name, city, ♡ toggle (persists immediately; snackbar not needed).
- Content follows section 2.4. The overview card shows the name once. When the app bar already shows it on compact, the card shows only the chips.
- Line card expand and collapse: height animation with the fast spatial easing, chevron rotates. Expanded state kept in component state; first line expanded on load.
- Auto-refresh every 10 s while the tab is visible. Pause on `visibilitychange`, resume on return, abort in-flight requests on navigation. No "Updated" text; a thin progress line at the top of the list during a refresh is enough. Keep the last data when a refresh fails and show the inline error card.
- A single in-flight request at a time; a manual refresh resets the timer.
- ETA element has `aria-live="polite"` on the next-ETA value only, rate-limited so screen readers are not spammed every 10 s.
- Bottom padding of about 88 px on the list so the FAB never covers the last card (the Android app has this flaw).
- Map FAB opens the arrivals map (compact, medium, expanded) or is hidden when the map pane is already visible (large).
- Each bus row shows the vehicle number badge and a bell button that opens the alert dialog (section 11.4). The bell is filled when an alert exists for that bus. Until Phase 5a lands the bell is not rendered.

### 8.5 Station map (`/map`)

- Leaflet map filling the area, top app bar overlay (surface colour), back on compact.
- Markers: `divIcon` round badges (44 px, secondary container, pin icon). Highlighted: primary, 52 px. Sizes scale with zoom as in Android (36–52 px).
- Clustering with `leaflet.markercluster`; cluster bubbles use primary container with the count.
- Stations come from the local database with the same bounding-box query as Android (section 10.1), debounced 150 ms on `moveend`, using the visible bounds plus a margin.
- Loading spinner top-end. Recenter FAB fits the user location (or the city centre).
- Selection card: bottom card on compact and medium (slide up, fast spatial), `StandardSideSheet` on expanded and large. Content as in 2.4. "Show arrivals" navigates to the station route.

### 8.6 Arrivals map

- Same Leaflet component. Markers: station pin (larger), numbered circular bus badges (label = first three characters of the line number), user location in blue.
- Selected bus highlighted in primary. Selecting shows the info card. Tapping empty map clears the selection.
- First load fits all markers with a 20% margin. Recenter FAB repeats it.
- Large layout: embedded in the right pane, and kept in sync with the line cards (hover and select).

## 9. Components

### 9.1 From m3-svelte

`Button`, `FAB`, `Card`, `Chip`, `Dialog`, `ConnectedButtons`, `SelectOutlined`, `TextFieldOutlined`, `Slider`, `CircularProgress` and `CircularProgressEstimate`, `NavigationRail`, `StandardSideSheet`, `Snackbar`, `Divider`, `Icon`, `ListItem` (API page and settings rows).

### 9.2 Custom (to build)

| Component | Notes |
|---|---|
| `AppBar.svelte` | Small top app bar with optional two-line title, back button, actions snippet; on scroll switches surface to `surface-container`. |
| `AdaptiveScaffold.svelte` | Rail, panes and content area per section 7. |
| `PullToRefresh.svelte` | Pointer-event gesture on a scroll container, circular progress indicator, disabled with a mouse. |
| `SearchField.svelte` | Wraps `TextFieldOutlined` with clear button and debounce. |
| `StationRow.svelte` | Pin, name, air distance, ID. Uses `.m3-layer`. |
| `StationList.svelte` | Rows with hairline dividers and the empty and error states. |
| `LineBadge.svelte`, `Eta.svelte` | Badge in primary container; ETA text in the Bitcount font. |
| `LineCard.svelte`, `ArrivalRow.svelte` | Expandable card per line. |
| `MapView.svelte` | Leaflet wrapper with runes, marker API, clustering, theme-aware tiles. |
| `PreferencesDialog.svelte`, `AboutDialog.svelte` | Settings and the fair usage policy. |
| `AlertDialog.svelte`, `AlertsSheet.svelte` | Create or remove an arrival alert; list of active alerts (section 11.4). |
| `ThemeBoot` (inline script) | Prevents flash of wrong theme. |

### 9.3 Proposed layout

```
scripts/gen-theme.mjs
src/theme.css                   (generated)
src/app.css                     (reset, fonts, type, global tokens)
src/lib/state/
  prefs.svelte.ts  favorites.svelte.ts  stations.svelte.ts  db.ts (IndexedDB schema and sync)
  location.svelte.ts  arrivals.svelte.ts  viewport.svelte.ts  alerts.svelte.ts
src/lib/util/
  stationQueries.ts (bbox, nearby, search, viewport, diacritic fold)  geo.ts (existing)  format.ts
src/lib/alerts/
  evaluate.ts (shared)  capability.ts  localMonitor.svelte.ts
src/lib/server/alerts/
  store.ts  monitor.ts  push.ts
src/service-worker.ts
src/lib/components/
  shell/  stations/  arrivals/  map/  dialogs/
src/routes/
  +layout.svelte  +layout.ts  +page.svelte
  favorites/+page.svelte  map/+page.svelte
  stations/[city]/[id]/+page.svelte
  stations/[city]/[id]/map/+page.svelte
  api/v2/+page.svelte (restyled)
  api/v2/alerts/+server.ts  api/v2/alerts/vapid-key/+server.ts
```

## 10. State and data

- Runes in `.svelte.ts` modules. No global stores.
- **Preferences** (`localStorage` key `bgpp:prefs:v1`): `cityId`, `rangeMeters` (100–1000, step 50, default 400), `theme` (system, light, dark), `accent` (preset or hue). Values are clamped on load.
- **Favorites:** stored in IndexedDB (section 10.1), not localStorage.
- **Station database:** IndexedDB as the durable store plus an in-memory query layer. Full design in section 10.1.
- **First run city:** the first city returned by the API. When the user presses "Use my location" and the nearest city is not the selected one and the selected city's centre is more than 30 km away, offer a snackbar action "Switch to {city}".
- **Location:** `navigator.geolocation` on explicit action only; 10 s timeout; failures map to the same messages the Android app uses ("Unable to determine your location. Using the last selected city.", etc.).
- **API client** (`src/lib/bgpp/client.ts`) stays; add typed errors for timeout, rate limit (429: "You have sent too many requests…") and offline.
- Every `localStorage` and IndexedDB access is wrapped in try/catch; the UI works with storage blocked.

### 10.1 Local station database (mirrors the Android Room setup)

**What Android does** (`StationDao`, `StationDBRepositoryImpl`, `SearchViewModel.syncCity`):

- Table `stations` (primary key `id + city`; `uid`, `name`, `lat`, `lon`, `hash`, `favorite`) with an index on `(lat, lon)` and on `favorite`. Table `city_hashes` (`city`, `hash`).
- Sync (on start, city change, refresh): `GET /stations/hash`. If it differs from the stored hash, download all stations, delete the city's rows, insert, store the new hash. If the hash request fails the user sees an error message even when data is cached.
- Nearby: `lat BETWEEN … AND lon BETWEEN …` bounding box from `getBoundingBoxForRange` (111,320 m per degree of latitude; longitude scaled by `cos(lat)`), then exact haversine filter and sort by distance in code.
- Search: `id LIKE 'q%'` ordered by id, plus `name LIKE '%q%'` ordered by name, de-duplicated, ID matches first, no distances, no range filter.
- Map viewport: same bounding-box query with `LIMIT 100`, ordered by `abs(lat * lon * 1000000) % 7919` to thin the result evenly across the map (viewport debounce 150 ms).
- The FTS table exists but is not used (the FTS query is commented out).

**Is IndexedDB a good fit? Yes, as storage. No, as the query engine.**

- Size: a city is a few thousand rows of about 100 to 150 bytes. All three cities together are well under 1 MB, roughly 100 KB gzipped on the wire. This fits in memory trivially.
- IndexedDB cannot express the Android queries natively: it has no two-dimensional range (a `[lat, lon]` compound index only ranges on the first key), no substring match, no `ORDER BY` on computed values. A prefix on `id` is the only one it can do with a key range.
- Scanning a few thousand in-memory objects takes well under a millisecond per query (bounding box, substring, prefix). No cursor round trips, no async per keystroke.
- So: **IndexedDB persists, memory answers queries.** On load, read the city's rows into a plain array once (and pre-compute a folded, lower-case search key per station). Every query is a synchronous filter over that array.
- Use a tiny wrapper (`idb`, about 1 KB) instead of the raw API. `localStorage` would work for the size but parses synchronously on the main thread and has no transactions, so IndexedDB is the better choice.
- Needs a browser, so guard with `browser` from `$app/environment`; SSR renders the page shell and a loading state only.

**Schema** (db `bgpp`, version 1):

| Store | Key | Value | Purpose |
|---|---|---|---|
| `stations` | `[city, id]` | `{ city, id, uid, name, lat, lon, hash }` | Station rows. Index `byCity` on `city` to load one city. |
| `cityHashes` | `city` | `{ city, hash, syncedAt }` | Last synced city hash. |
| `favorites` | `[city, id]` | `{ city, id, addedAt }` | Favorites, kept **separate** from stations. |

**Sync flow** (`stations.svelte.ts`):

1. Open the db and load the city's cached rows into memory, so search works immediately and offline.
2. `GET /api/v2/cities/[city]/stations/hash` (the endpoint exists; it returns an MD5 of the sorted per-station hashes).
3. Hash equal: done. Hash different or no cache: `GET /api/v2/cities/[city]/stations`, then in a single read-write transaction over `stations` and `cityHashes` delete the city's rows, insert the new ones and store the hash. Swap the in-memory array afterwards.
4. Hash request fails and a cache exists: keep using the cache silently. Show nothing unless a refresh the user asked for fails (a snackbar then). Fail loudly only when there is no cache.
5. When to run: on app start, on city change, on pull-to-refresh, and when the tab regains focus if the last check was more than 30 minutes ago.
6. If the stations download fails after a hash mismatch, keep the old cache and old hash so the next attempt retries.

**Queries** (`src/lib/util/stationQueries.ts`, pure functions, unit-tested):

```ts
boundingBoxForRange(coords, rangeMeters): BBox   // same math as getBoundingBoxForRange.kt
nearby(stations, origin, rangeMeters)             // bbox filter -> haversine <= range -> sort by distance
search(stations, query)                           // id prefix (id asc) + name contains (name asc), de-duplicated
inViewport(stations, bbox, limit)                 // bbox filter, thinned by the scatter order
foldForSearch(text)                               // NFD, strip combining marks, đ to d, lower-case
```

**Deliberate differences from Android**

| Android behaviour | Web behaviour | Why |
|---|---|---|
| Nearby query applies `LIMIT 50` in SQL on a pseudo-random order before distance sort and range filter. In a dense area with a 1000 m range, closer stations can be dropped. | Filter by bounding box, then by exact distance, sort by distance, and only then cap for rendering (100). | Correctness. The limit belongs after the sort. |
| `LIKE` is case-insensitive for ASCII letters only in SQLite, so lower-case "šek" does not match "Šek…", and "sek" does not match "Šek…". | Fold case and diacritics on both sides. Every Android match is still a match. | Better search with no loss of results. |
| Names sorted by SQLite binary order ("Š" sorts after "Z"). | `Intl.Collator("sr-Latn")` order. | Sensible order for Serbian names. |
| Resync deletes the city's rows and re-inserts them from the API with `favorite = false`, so favourites look like they are wiped whenever the hash changes (see `StationDBRepositoryImpl.deleteStationsForCity`, `StationMapper.toDb`). | Favourites live in their own store and survive resyncs. Favourites whose station disappears from the API are hidden, not deleted. | Avoids data loss. Worth fixing on Android too. |
| Hash check failure is shown as an error even when cached data exists. | Quiet offline chip. | Cached data is usable. |
| Map viewport query capped at 100 stations. | Keep the same deterministic scatter order for thinning, but cap at about 500 because markers are clustered. At zoom 15 and above, no cap. | Clusters make a higher cap cheap. |

**Cost of keeping the hash check**

- One tiny request per sync. The server still builds the hash by loading all stations and hashing them on each call; this is cheap if `Cached.ts` caches the station list, so check that while wiring it up.
- Alternative if you want to drop the second endpoint: serve the station list with an `ETag` and make the client send `If-None-Match`, which merges "check" and "download" into one conditional request. The plan keeps the hash flow because it mirrors Android and the endpoint already exists.

## 11. Arrival alerts (notifications)

Goal: the user picks a bus at a station and gets a notification when it is close, as in the Android app, including when the browser is not open.

### 11.1 What Android does

Source: `ArrivalNotificationSpec`, `ArrivalNotifierService`, `ArrivalMonitorService`, `AndroidArrivalNotificationPublisher`, `NotificationDialog`.

- **Creating an alert:** the bell on an arrival row opens a dialog: title "Get notified for {line}", subtitle "The bus is {n} minutes away right now.", a Minutes / Stations segmented choice, and a number field (digits only, 2 characters max, default 5, minimum 1). Save registers the alert and shows "Arrival alert saved." On Android 13+ the notification permission is requested at this point.
- **What is tracked:** one specific vehicle: station + line number + `garageNo` + trigger. Not "any bus on this line".
- **Trigger:** minutes: `etaSeconds <= minutes * 60`. Stations: `etaStations <= n`. One-shot: after it fires the alert is removed. If the bus is already inside the threshold it fires on the first check.
- **Monitoring:** a foreground service polls the arrivals API every 15 s for every registered alert and stops when none are left. It shows a permanent "Monitoring arrivals" notification while running.
- **Notification:** high importance, title "Line {line} is approaching", body "Line {line} reaches {station} in {n} minutes." or "Line {line} is {n} stations away from {station}." Tapping opens the arrivals screen for that station.
- **Gaps in Android:**
  - The registry is in memory, so alerts are lost if the process dies.
  - Alerts never expire. If the bus disappears from the feed (route change, end of service) the alert stays until the service stops.
  - There is no list of active alerts and no way to cancel one from the UI (the manager has `cancel`, nothing calls it).
  - N alerts on the same station cause N requests every 15 s.

### 11.2 Web approach: two delivery tiers

Browsers cannot run a foreground service. A web page's timers are throttled or frozen once the tab is hidden, especially on phones, so polling from the page is not reliable. The only mechanism that wakes a closed browser is Web Push, which needs a server that watches the buses.

| Tier | Delivery | Works when | Needs |
|---|---|---|---|
| A. Push | Server watches the bus and sends a Web Push; a service worker shows the notification | Browser or app is closed, phone locked | Notification permission, push support, server with VAPID keys. On iPhone and iPad only for the site added to the Home Screen (iOS 16.4+). |
| B. In-tab | The page polls and notifies | The tab is open (hidden tabs are throttled to about once a minute on desktop and may freeze on phones) | Nothing. Uses an OS notification if permission is granted, otherwise an in-app snackbar, vibration and a title badge. |

- Tier A is the default whenever it is available. Tier B is the automatic fallback when push is unsupported, permission is denied, or the server is not configured (no VAPID keys, returns 503). The dialog does not explain the tier. The alert shows a small cloud icon when it will work with the browser closed, and no icon when the tab must stay open.
- Each alert records its delivery (`push` or `local`) so exactly one side fires it. No duplicates.
- Both tiers use the same alert model, evaluation function and UI. Only the transport differs, so Phase 5a (tier B) ships first and 5b (tier A) plugs in behind it.

### 11.3 Alert model and rules

```ts
type AlertSpec = {
  id: string;                       // crypto.randomUUID()
  city: string; stationId: string; stationName: string;
  lineNumber: string; lineName: string; garageNo: string;
  trigger: { kind: 'minutes' | 'stations'; value: number };  // integer 1..99
  delivery: 'push' | 'local';
  createdAt: number; expiresAt: number;                      // createdAt + 2 h
  status: 'active' | 'triggered' | 'expired' | 'cancelled';
};
```

- `evaluate(spec, lines)` is a pure function in `src/lib/alerts/evaluate.ts`, shared by the client and the server. It finds the line by `lineNumber`, then the arrival by `garageNo`, and applies the same two comparisons as Android. It returns `fire`, `waiting` (bus found, not yet close) or `missing` (bus not found).
- Expiry (new vs Android): fire once and mark `triggered`; mark `expired` after 2 hours or after the bus has been `missing` for 10 minutes. On expiry send a quiet notification "Stopped tracking line {line}" (push tier) or a snackbar (in-tab tier) so the alert never silently disappears.
- A user can hold at most 10 active alerts.
- If the bus is already inside the threshold when saving, the alert fires right away. No warning text.
- Text (English, from the Android strings): title "Line {lineName} is approaching"; body "Line {lineName} reaches {station} in {n} minutes." or "Line {lineName} is {n} stations away from {station}." `lineName` is the display name (last "-" segment).

### 11.4 UI

- **Bell on each arrival row** (as Android). Outline when no alert exists. Filled `NotificationsActive` in primary when an alert is active for that bus.
- **Alert dialog** (`AlertDialog.svelte`, `Dialog`): same fields and copy as Android: `ConnectedButtons` Minutes / Stations, `TextFieldOutlined` numeric 1–99 labelled "Minutes away" or "Stations away", Save and Cancel. No helper text under the fields. When an alert already exists for that bus the dialog shows its rule and a "Remove alert" button.
- **Permission** is requested only when Save is pressed (a user gesture), never on page load. Denied: snackbar "Notifications are blocked in your browser settings. You'll only be alerted while this tab is open." and the alert is saved as `local`.
- **iPhone and iPad in Safari (not installed):** the Notification API is unavailable. Saves as `local` without any message. The install steps live in settings, under one "Install app" row.
- **Alerts list** (`AlertsSheet.svelte`, `BottomSheet` on compact, `Dialog` on larger): opened from a row in the preferences dialog ("Active alerts (2)"). Each row: line badge, rule ("When ≤ 5 min"), station name, a remove button, and a link to the station. A banner appears when any alert is `local`: "These alerts only work while BG++ is open."
- **On fire** (both tiers): notification as in 11.1. Tapping opens `/stations/[city]/[id]`. If the app is already open and visible the page also shows a snackbar with an "Open" action.
- All copy uses a string table so translation can be added later; only English is in scope.

### 11.5 Client implementation

- `src/lib/state/alerts.svelte.ts`: alert store backed by an IndexedDB `alerts` store (same database as 10.1). Methods: `add`, `cancel`, `list`, `sync`, `expire`. Survives reloads.
- `src/lib/alerts/capability.ts`: detects push support (`serviceWorker`, `PushManager`, `Notification`), iOS standalone, current permission, and whether the server has VAPID configured (`GET /api/v2/alerts/vapid-key`).
- `src/lib/alerts/localMonitor.svelte.ts` (tier B): runs while any active alert has `delivery: 'local'`. Polls the arrivals API every 15 s, one request per distinct station, on any route. If the user is on that station's arrivals screen, the screen's own 10 s poller feeds the evaluator so there is no extra request. Fires through the service worker registration when permission is granted (so `notificationclick` works), otherwise through the snackbar.
- `src/service-worker.ts` (SvelteKit's service worker file, no caching and no `fetch` handler in this phase):
  - `push`: parse payload `{ specId, title, body, url }`, call `showNotification` with `tag: specId`, the app icon, `badge`, `vibrate`, `data: { url }`. Every push must show a notification (Chrome requires `userVisibleOnly`). Then `postMessage` to open clients so the page marks the alert `triggered`.
  - `notificationclick`: close the notification, focus an existing window and navigate it to `data.url`, or `clients.openWindow(url)`.
  - `pushsubscriptionchange`: resubscribe and re-send the active push alerts from IndexedDB with `PUT /api/v2/alerts`.
- Subscription: `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`, then `PUT /api/v2/alerts` with the subscription and the full list of active push alerts. The client list is authoritative, so the sync is idempotent and survives a server restart: on app start, on visibility change and after every change, the client re-sends its list.
- Cancelling the last push alert calls `DELETE /api/v2/alerts` to drop the subscription's data.

### 11.6 Server implementation (SvelteKit, adapter-node)

New endpoints (app-internal, covered by the fair usage policy; the API page and `openapi-v2.yaml` currently say "GET-only", so update them):

| Endpoint | Purpose |
|---|---|
| `GET /api/v2/alerts/vapid-key` | `{ publicKey }`, or 503 when push is not configured. |
| `PUT /api/v2/alerts` | Body `{ subscription, alerts[] }`. Replaces the set of alerts for that subscription (`sha256(endpoint)` is the id). Returns each alert's current status. |
| `DELETE /api/v2/alerts` | Body `{ endpoint }`. Removes the subscription and its alerts. |

Modules under `src/lib/server/alerts/`:

- `store.ts`: in-memory `Map` of subscriptions and alerts, snapshotted as JSON to `ALERTS_DATA_DIR` (debounced, a few seconds after a change) and loaded at start from `src/hooks.server.ts`. Alerts live at most 2 hours, so a file is enough; no database.
- `monitor.ts`: starts when the first alert exists and stops when none are left (like Android's `stopIfIdle`). Every 15 s it groups active alerts by `(city, stationId)`, fetches each station once through the existing `bgppService` (using the cache, so a station that users are viewing is not fetched twice), runs `evaluate` for each alert, sends pushes, and updates statuses. Upstream errors back off and do not count as `missing`.
- `push.ts`: wrapper around `web-push` (`sendNotification` with `TTL: 60`, `urgency: 'high'`). HTTP 404 and 410 from the push service delete the subscription and its alerts.
- Validation: city supported, station exists, `lineNumber` and `garageNo` are non-empty strings of limited length, trigger integer 1..99, request body at most 4 KB.
- Limits: 10 active alerts per subscription, at most 300 distinct monitored stations overall (HTTP 429 beyond that), per-IP rate limit on `PUT`. These protect the upstream BusLogic API, which the fair usage policy already warns about.
- Config (env): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (a `mailto:` or https URL), `ALERTS_DATA_DIR` (default `./data`; mount a Docker volume at `/data`). Generate keys with `npx web-push generate-vapid-keys`. Without VAPID keys the endpoints answer 503 and every client uses tier B.
- Single-instance assumption: the scheduler lives in the Node process, which matches the current Docker setup. Running several instances would send duplicates, so a multi-instance deployment needs a separate worker or leader election first.
- Privacy: the server stores the push endpoint, its keys and the alerts, and nothing else (no account, no IP log). Records are deleted when an alert ends or the push service reports the endpoint gone. Add one sentence about this to the fair usage / about dialog.

### 11.7 Differences from Android

| Android | Web |
|---|---|
| In-memory registry, lost when the process dies | Persisted on the client (IndexedDB) and the server (snapshot); the client re-syncs |
| Alerts never expire | 2 h limit, dropped after 10 min without the bus, with a notice |
| No list or cancel UI | Alerts list, per-bus bell state, remove |
| N alerts on a station mean N requests every 15 s | One request per station per 15 s |
| Permanent "Monitoring arrivals" notification | Not needed (push), none in tab mode |
| Permission asked on first alert | Same, on Save |
| No privacy statement | Short note on what is stored |

## 12. Maps

- Leaflet 1.9 with tiles from `src/lib/map/mapLayers.ts`: Thunderforest Transport for light, Transport Dark for dark theme.
- Remove the debug layers (Matrix, SpinalMap, WorldImagery) and the layer switcher.
- Replace the PNG marker images (loaded from GitHub raw URLs) with `divIcon` HTML using theme tokens, so markers follow accent and dark mode.
- Move the Thunderforest and Jawg keys out of source into a public env variable (`PUBLIC_THUNDERFOREST_KEY`) and restrict the key by referrer. Keys are currently committed in client code.
- Attribution control stays (Thunderforest, OpenStreetMap), restyled to the surface colours.

## 13. Motion and accessibility

- Route changes: `sharedAxisTransition` (X) on compact; fade-through on larger screens. Respect `prefers-reduced-motion`.
- Station row to arrivals: `containerTransform` optional polish, Phase 4.
- Focus visible on every interactive element; skip link to main content; page `<title>` set per route; app bar back is a real link.
- Contrast: use M3 token pairs only (`on-*` over container). Check the accent picker presets in light and dark.
- Screen reader names for icon-only buttons (favorite, settings, map, recenter, refresh) and map markers.
- `aria-live` as in 8.4. Map is not the only way to reach any function: everything is reachable from lists.
- Text scales with the browser font size (rem units), no fixed heights on text containers.

## 14. Phases

Sizes: S under a day, M one to three days, L three to five.

### Phase 0: done

- Android review, m3-svelte review, palette parity spike, version compatibility check.

### Phase 1: foundation (L)

Each numbered step is its own short branch off `redesign` and its own pull request into `redesign`. The order keeps the project building at every step.

1. **Cleanup** (`ms/feat/redesign-cleanup`): delete code nothing uses (`src/lib/buslogic/leftover/`, `old_static/`), add `typescript` and `svelte-check` so `pnpm check` runs, and get it to zero errors.
2. **Remove the old UI kit:** delete the shadcn components and forms, the old page and its stores. Replace the page with a stub. Rewrite the small `/api/v2` reference page with plain CSS so it keeps its styling, then remove Tailwind, bits-ui, formsnap, superforms, cmdk-sv, mode-watcher, svelte-radix and their config.
3. **Toolchain upgrade** (`ms/feat/redesign-toolchain`): Node 26 (`engines` and Dockerfile), Svelte 5, Vite 7, `vite-plugin-svelte` 6, Kit 2.70. The project is small by now, so there is little to migrate.
4. **m3-svelte and theme** (`ms/feat/redesign-theme`): install m3-svelte and its helpers, `gen-theme.mjs`, `theme.css`, `app.css`, fonts, `app.html` boot script, meta tags, manifest and icon colours, and a token test against `Color.kt`.
5. **Shell** (`ms/feat/redesign-shell`): `viewport` rune, `AppBar`, `AdaptiveScaffold`, `NavigationRail`, stub routes, preferences state and a stub settings dialog with the theme toggle.
6. **Developer and agent tooling** (`ms/feat/redesign-tooling`):
   - Strict TypeScript and Vitest, `eslint` and `prettier` working, and one command `pnpm verify` that runs check, lint, test and build.
   - `AGENTS.md` at the repo root: stack, commands, folder layout, naming, the no-secondary-labels rule, the "do not change `/api/v2` shapes" rule, and how to add a component.
   - Typed API client matching `openapi-v2.yaml` so API data is never `any`; `Station.uid` becomes `number`.
   - Component folder convention (the `.svelte` file next to its test) and a `/dev` route, excluded from production, for viewing components in isolation.

Exit: `pnpm verify` (check, lint, test, build) and the Docker build pass locally. CI/CD and deployment are handled by the owner outside this plan. The empty shell shows the right colours in light and dark at 360, 700, 1024 and 1440 px with the rail appearing at 600 px.

### Phase 2: compact screens (L)

1. `StationRow`, `StationList`, `SearchField`, Nearby screen with search rules, location chip, empty and error states, pull-to-refresh.
2. Preferences dialog (city, range, theme, accent).
3. Arrivals screen: overview card, line cards, ETA component with Bitcount, polling, error states, favorite toggle.
4. Favorites screen. Local station database: IndexedDB schema, hash sync, in-memory query functions (section 10.1) with unit tests, wired into Nearby search and favorites.

Exit: side by side with the supplied Android screenshots (search, arrivals) in light and dark at 412 px; every behaviour in 8.1 to 8.4 works; ETA colour font renders in Chrome, Firefox and Safari.

### Phase 3: maps (M)

1. `MapView` with runes, tile layers by theme, `divIcon` markers, clustering.
2. Station explorer with viewport filtering, selection card, recenter.
3. Arrivals map with bus markers, info card, user location.

Exit: map screens match the Android screenshots; 2000 stations at city zoom stay responsive; dark theme uses dark tiles.

### Phase 4: adaptive layouts and polish (M)

1. Medium rail layout, expanded list-detail, large three-pane with synced map.
2. Route transitions, optional `containerTransform`.
3. API reference page restyled, About dialog.
4. Accessibility pass (focus order, labels, contrast, reduced motion).

Exit: Playwright screenshot matrix reviewed; keyboard-only run through all screens works; Lighthouse accessibility ≥95.

### Phase 5a: alerts, in-tab delivery (M)

Can start as soon as the arrivals screen exists (Phase 2); listed here so it does not delay the main screens.

1. Alert model, `evaluate()` with tests, IndexedDB `alerts` store, expiry rules.
2. `AlertDialog` (Android copy and behaviour), bell states on arrival rows, `AlertsSheet`, row in preferences.
3. `localMonitor` (one request per station, shares the arrivals poller), snackbar, vibration, title badge.
4. `src/service-worker.ts` with `notificationclick` only; OS notifications via `showNotification` when permission is granted.

Exit: with the tab open (visible and hidden) an alert fires once at the threshold, tapping the notification opens the station, expired and cancelled alerts do not fire, and everything works with notifications blocked (snackbar only).

### Phase 5b: alerts, Web Push (L)

1. Server: store with snapshot, monitor, push wrapper, the three endpoints, validation and limits, VAPID config, Docker volume.
2. Client: capability detection, subscription flow, `PUT` sync on start, visibility and change, service worker `push` and `pushsubscriptionchange`, tier badge in the dialog, iOS install hint.
3. Docs: update the API page, `openapi-v2.yaml`, README and the fair usage text.

Exit: with the browser fully closed, an alert fires once at the threshold on Android Chrome, desktop Chrome and Firefox, and an installed PWA on iOS 16.4+; killing and restarting the server does not lose alerts (the client re-syncs); a dead subscription (410) is cleaned up; one request per station per 15 s regardless of the number of alerts.

### Phase 6: later (not planned now)

- Offline-capable PWA shell with caching and an install prompt.

## 15. Verification

- Unit tests (Vitest): the station query functions in 10.1 (bounding box math checked against known values from `getBoundingBoxForRange.kt`, nearby sorting with more than 50 stations in range, ID-then-name ordering, diacritic folding, scatter thinning), the sync flow with a fake `fetch` and `fake-indexeddb` (hash equal, hash differs, offline with cache, failed download keeps old cache, favourites survive a resync), search matching, range filtering and sorting, ETA minute calculation, polling controller (visibility, abort), preferences clamp, theme token parity against `Color.kt` constants.
- Alerts unit tests: `evaluate` (minutes and stations triggers, bus found or missing, threshold edge values), expiry (2 h, 10 min missing), one-shot firing, store snapshot and reload, validation and limits, monitor grouping with fake timers (one fetch per station, upstream error does not count as missing, 410 removes the subscription), server and client agree on `evaluate`.
- Alerts e2e (Playwright): tier B end to end against a mocked arrivals API with notification permission granted and blocked. Web Push delivery is checked with a fake push sender in tests and by hand on real devices (Android Chrome, desktop Chrome and Firefox, iOS PWA).
- Component and e2e (Playwright): Nearby search flow, favorites persistence, arrivals expand and refresh, preferences apply, map selection, keyboard navigation.
- Screenshot matrix: widths 360, 412, 700, 1024, 1440 by light and dark, for each screen. Store baselines in the repo and compare Android screenshots by eye. No Android device is attached to this machine (adb lists none), so Android screenshots must be supplied.
- Manual: Chrome, Firefox, Safari (iOS) for the colour font, geolocation prompt and safe areas.
- Always run `pnpm check`, `pnpm lint`, `pnpm build` and a Docker build before merging each phase.

## 16. Risks and open items

| Item | Risk and mitigation |
|---|---|
| Svelte 5 + Vite 7 + Node ≥20.19 | Infrastructure must move to Node 26. Do it in Phase 1 and verify the Docker build early. |
| m3-svelte maturity | Single maintainer and fast releases. Pin the exact version; wrap its components in our own thin components so a future swap is local. |
| Colour library is a nightly | Pin in the lockfile; the theme is generated once and committed, so runtime does not depend on it for the default accent. |
| No `class` on m3-svelte components | Layout goes on wrapper elements; use `:global()` sparingly. |
| Bitcount colour font | Needs COLR support. Chrome, Firefox and Safari support COLR v0; confirm during Phase 2 and keep the Roboto tabular fallback. Ship the OFL licence with the font. |
| Dynamic colour not possible on the web | The accent picker is the substitute. Pixel match to wallpaper colours is not a goal. |
| Hard-coded map API keys | Move to env and restrict by referrer in Phase 3. |
| Uncommitted work in the repo | Branch from a clean state before Phase 1. |
| Web Push reliability | Delivery depends on the browser vendor's push service and on phone battery settings. Keep tier B as a fallback; the cloud icon on an alert shows which tier it uses. |
| iOS push | Only for sites added to the Home Screen (iOS 16.4+). The dialog explains this; tier B still works. |
| Alert load on the upstream API | One request per station per 15 s, a cap of 300 stations, 10 alerts per subscription and per-IP rate limits. |
| Server scheduler in the Node process | Assumes one instance. Document it; move to a worker if you ever scale out. |
| Push data is personal-ish | Store only endpoint, keys and alerts, delete on end, mention it in the about dialog. |
| API behaviour | Verify `/stations/hash` returns stable values and the arrivals route is reachable in the new client before relying on the cache in Phase 2. |

Deferred decisions (not blocking):
- Whether to sentence-case line names. Android shows the API's uppercase as-is; the plan keeps it for parity.
- Whether the default accent should be teal (current plan) or device blue.
