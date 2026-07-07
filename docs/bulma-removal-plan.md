# Plan: drop the Bulma dependency

> Status: **draft / proposal**.
> Last updated: 2026-04-28.
> Owner: TBD.

## Context

`bulma@0.3.1` is imported globally in `src/main.js`:

```js
import 'bulma/css/bulma.css'
```

That version is **9 years old** (current Bulma is `1.0+`). The dependency
isn't tracked or upgraded; it just sits there providing base resets and
a few default styles that the project then overrides almost
everywhere.

## Audit

| Metric | Value |
|---|---|
| `.vue` files in `src/components/` | 340 |
| Lines of CSS overrides in `App.vue` | ~1900 / 2649 |
| Bulma class overrides in `App.vue` | 31 distinct top-level selectors |
| Bulma CSS bundle size | ~190 KB |

### Top Bulma class usage in templates

| Class / family | Occurrences |
|---|---|
| `.field`, `.control`, `.input`, `.label`, `.checkbox` | ~3500 |
| `.title`, `.subtitle`, `.has-text-*` | ~1300 |
| `.box` | 1047 |
| `.columns` / `.column` | ~1160 |
| `.is-loading`, `.is-active`, `.is-primary`, `.is-link`, `.is-danger`, `.is-small`, `.is-medium`, `.is-disabled` | ~700 |
| `.modal`, `.modal-background`, `.modal-content` | ~170 |
| `.tag`, `.tags` | 185 |
| `.tabs` | 97 |
| `.notification` | 247 |
| `.is-hidden-touch/mobile/desktop` | ~10 |

### Key finding

The project **already treats Bulma as a starter** that it rewrites at
~80%. The actual runtime dependency on Bulma is therefore narrow:

- Base resets / normalize
- Default styles for elements not explicitly overridden (`.field`
  margin, `.tabs` underline, `.input` border-radius, …)
- Class names as a convention

Most of the visual identity of Kitsu comes from `App.vue`, scoped
component styles and CSS custom properties in `src/variables.scss`.

## Two options considered

| Criterion | Drop incrementally (3 phases) | Upgrade to Bulma 1.0 |
|---|---|---|
| Effective effort | 1–2 weeks effective (spread over ~3 months) | 2–3 weeks **blocking** |
| Risk | Low — each phase is independent | **High** — 0.3.1 → 1.0 spans 9 years of breaking changes |
| Immediate benefit | Bundle −150 KB, dep dropped after phase 1 | None until the migration finishes |
| Maintenance | Decreasing, trends to zero dependency | Persistent — stay on top of Bulma releases |
| Dark theme | Full ownership after phase 2 | Bulma 1.0 has it, but we'd still override |

**Recommendation: drop incrementally.** Bulma 1.0 fixes problems we
don't have (we ignore its variables, we override its components) and
introduces churn we don't want.

## Plan: drop incrementally — 3 phases

### Phase 1 — Isolate the dependency (1–2 days, immediate gain)

1. Add `purgecss` (or `@fullhuman/postcss-purgecss`) as a devDependency.
2. Add a build script that runs purgecss against
   `bulma/css/bulma.css` with `src/**/*.{vue,js}` as the content
   source. Expected output: 30–50 % of the original file
   (~60–90 KB) saved as `src/styles/bulma-legacy.scss`.
3. In `src/main.js`, replace
   `import 'bulma/css/bulma.css'` with
   `import '@/styles/bulma-legacy.scss'`.
4. `npm uninstall bulma`. The dep disappears from `package.json` and
   `node_modules`.
5. Visual smoke test on the 30+ main pages.

**Outcome**: zero visual regression, smaller bundle, no `bulma`
dependency.

### Phase 2 — Replace the most used utilities (3–5 days)

For each family below, three actions:

1. Build the maison equivalent (helper or component).
2. Replace the call sites.
3. Drop the corresponding rules from `bulma-legacy.scss`.

| Target | Action |
|---|---|
| `.has-text-centered/right/left` | SCSS helpers in `App.vue` (3 lines) |
| `.is-pulled-right/left` | Same — already overridden everywhere, just drop |
| `.is-hidden-touch/mobile/desktop` | Maison media-query helpers |
| `.field` (margin-bottom) | Maison helper `.field { margin-bottom: 0.75rem }` |
| `.title`, `.subtitle` | Already overridden in `App.vue` — just keep ours and drop Bulma |
| `.notification` | 247 usages but already overridden — rewrite locally |
| `.tag` / `.tags` | New `<status-tag>` component (most usages are status pills anyway) |

### Phase 3 — Migrate components (3 months calendar, 1–2 weeks effective)

Team rule: **every PR that touches a `.vue` file removes the Bulma
classes still present in it**. `bulma-legacy.scss` shrinks naturally;
when its line count reaches 0 it is deleted.

#### Components already encapsulated

These already wrap Bulma classes, so removing Bulma from their
internals removes it from a wide surface at once:

- `ButtonSimple` → all `.button.is-*` variants become props.
- `BaseModal` → `.modal`, `.modal-background`, `.modal-content`,
  `.box` only appear here.
- `RouteTabs` → `.tabs`, `.is-active` only appear here.
- `TextField`, `Combobox`, etc. → `.field`, `.control`, `.input`,
  `.label`.

#### Components still to be created

- `<status-tag>` — replace direct `.tag` usage.
- `<page-section>` — replace `.section`.
- `<column-grid>` (or pure CSS Grid utilities) — replace
  `.columns` / `.column`.

## Total effort

| Scope | Effort |
|---|---|
| Phase 1 only | 1–2 days, dep removed, bundle reduced |
| Phase 1 + 2 | 5–7 days, no new Bulma utility classes allowed |
| Phase 1 + 2 + 3 | 2–3 weeks effective, ~3 months calendar |

## Open questions

- Do we want to introduce a utility framework (Tailwind, UnoCSS) at
  the same time, or stay 100 % maison SCSS?
- For `<column-grid>`: pure CSS Grid is enough — do we even need a
  component, or just utilities?
- After phase 1, do we open the door to `@layer` / cascade layers to
  isolate the legacy stylesheet? It would make the diff between
  legacy-Bulma and maison styles explicit.

## Decision log

- 2026-04-28 — initial proposal drafted (this document).
