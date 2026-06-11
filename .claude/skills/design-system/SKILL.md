---
name: design-system
description: Haunt visual guidelines, design tokens, and component conventions. Read this skill first for any work touching UI appearance, color/typography/spacing, design tokens, the component library, styling implementation, or visual consistency across the public pages (Web) and the fan client (App).
---

# Haunt Design System · Conventions

> Product codename **Haunt** (a venue as a place people "haunt", i.e. keep coming back to). The public pages (Next.js) and the fan client (Web/Expo) must be **visually consistent** — via shared design tokens, not by each writing its own set.

> ⚠️ This skill is a skeleton. **The formal visual spec (brand palette, typography, logo, spacing scale) is TBD** — once defined, fill in the placeholders below and delete this line. Until then, use the principles below + neutral defaults for new UI; do not invent brand colors.

## 1. Design tokens (single source of truth)

- All colors, type, spacing, radii, and shadows are defined as **tokens**, exported in one place, shared by Web and App (in line with §11-1's shared TS types).
- Components **only reference tokens** — magic values (`#hex`, hardcoded `16px`) are forbidden.
- Suggested layering: `primitive` (raw color ramps/scales) → `semantic` (named roles like `bg.surface`, `text.muted`, `accent`) → components consume semantic. Theming changes only the semantic mapping.

### Token placeholders (fill in once the brand is finalized)
```text
color:    TBD — use a neutral gray ramp + a single accent for now; do not hardcode brand colors
font:     TBD — one family each for headings/body
space:    a 4-based scale (4/8/12/16/24/32/48)
radius:   TBD
```

## 2. Visual character (known direction, constrains generation)

- The product is about **real live shows, local scenes, and a venue's "character"** — the feel leans **editorial/magazine**, not a generic SaaS template.
- A venue's `vibe_desc` + `hero_media` are the star of the page; the layout must let the **venue's personality** stand up.
- Live notes are one line, lightweight, human — don't build them as a cold star-rating UI.

## 3. Component conventions

- Component-library choice is **TBD** (e.g. Web on a Radix/shadcn-style + App on the RN equivalent) — once chosen, pin it here to avoid multiple component systems in one project.
- Component naming, prop conventions, and variant (variant/size) patterns are unified across the project.
- The **OG image** (see [public-pages](../public-pages/SKILL.md) §3) also uses the same tokens — share-card visuals = on-site visuals.

## 4. Cross-platform consistency

- The same semantic element (button, card, tag) **visually corresponds** on Web and App, achieved via shared tokens — don't tune a separate set of colors per platform.
- Dark/light: if supported, switch via semantic tokens, not conditional branches scattered through components.

## 5. Related

- Public pages / OG: [public-pages](../public-pages/SKILL.md) · Fan client: [mobile-app](../mobile-app/SKILL.md)
- Plan: `docs/venue-first-tech-plan.md`
