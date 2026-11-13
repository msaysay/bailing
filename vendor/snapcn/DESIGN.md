# The snap-cn Design System

This document defines the visual language for the snap-cn site and docs: palette, radii, typography, and motion. It exists so future contributors can extend the UI without drifting. The look is a clean, dense, professional B2B-SaaS aesthetic — light mode is first-class, dark mode is a full peer, and the interface stays quiet so the video previews (the actual product) carry the visual interest.

> Scope: this file covers **site chrome** — layout, docs, navigation, cards, controls. The motion language for the **Remotion video components themselves** (camera model, timing tokens, transitions) lives in [MOTION.md](./MOTION.md) and is a separate system. Do not apply site-chrome rules to composition internals, and never let a chrome refactor touch a video component's animation logic.

## 1. Principles

- **Clean and dense.** Compact 14px UI text, tight headings, generous whitespace between sections. Density comes from restraint, not clutter.
- **Light mode first-class.** Design and review in light mode first; verify dark mode before shipping. Both must always work — never fix one by breaking the other.
- **Hairlines over shadows.** Structure comes from crisp 1px separators and borders. Shadows are whisper-level and used only for true elevation (popovers, subtle card lift).
- **One accent.** A single blue accent for primary actions and links. Color is functional, never decorative.
- **Fast, subtle motion.** Site chrome transitions are 150–200ms ease-out. No bounce, no springs, no theatrics outside the video canvas.
- **Tokens, not rewrites.** The system is implemented as CSS variables in `app/globals.css`. Visual changes should be token changes and lightweight class tweaks — do not restructure component JSX to restyle it.

## 2. Color Palette

Tokens are defined in `app/globals.css` (`:root` for light, `.dark` for dark) and consumed through the standard shadcn semantic names (`--background`, `--foreground`, `--card`, `--border`, `--muted-foreground`, `--primary`, …). The reference values below are the source of truth; the CSS may express them in `oklch`.

### Light (first-class)

| Role | Value | Notes |
|------|-------|-------|
| Page background | `#FAFAFA`–`#F7F8FA` | Slightly off-white so white surfaces read as surfaces |
| Surface / card / popover | `#FFFFFF` | Pure white panels on the tinted page |
| Border / separator | `#E4E7EC` | Hairline; the primary structural device |
| Text (foreground) | `#101828` | Near-black with a cool cast — never pure `#000` |
| Muted text | `#667085` | Secondary copy, captions, metadata |
| Accent (primary) | `#266DF0` | Buttons, links, active states |
| Accent hover | `#1D5BD6` | Hover/pressed shift of the accent |
| Shadow | `0 1px 2px rgba(16,24,40,.05)` | The only default shadow; anything heavier needs a reason |

### Dark

| Role | Value | Notes |
|------|-------|-------|
| Page background | `#0A0A0B` | Near-black, neutral |
| Surface / card / popover | `#141417` | One step up from the page |
| Border / separator | `#26272B` | Hairline, same structural role as light |
| Text (foreground) | `#FAFAFA` | Off-white |
| Muted text | `#A1A1AA` | Secondary copy |
| Accent (primary) | `#266DF0` | Same blue in both themes |
| Accent hover | `#1D5BD6` | Same hover shift |

### Rules

- The accent blue is the only chromatic color in the chrome. Status colors (destructive red, the "NEW" badge) are exceptions with dedicated tokens — don't invent new ones ad hoc.
- Never hardcode hex values in components; always go through the semantic tokens so both themes stay in sync.
- Dark mode is not an inversion — it uses its own surface/border steps above. Adjusting a light token means checking its dark counterpart in the same change.

## 3. Radii

Base token: `--radius` in `app/globals.css`; the Tailwind scale (`--radius-sm` … `--radius-4xl`) derives from it.

| Element | Radius |
|---------|--------|
| Cards, panels, preview frames | 10px |
| Controls (buttons, inputs, selects, tabs) | 6–8px |
| Inline code, tiny chips | 4px |
| Badges / pills (explicit badge components only) | 9999px |

Never use oversized pill radii on buttons, inputs, cards, or nav items — full rounding is reserved for explicit badge/tag components. If a control looks like a capsule, it's wrong.

## 4. Typography

- **Family:** Inter-class geometric sans (`--font-sans`), with a mono companion (`--font-mono`) for code, filenames, and technical labels. `font-feature-settings: "cv11", "ss01"` is enabled globally.
- **Base UI size:** 14px (`text-sm`) for controls, nav, tables, and dense UI. Docs prose runs at the fumadocs default.
- **Headings:** semibold (600), tight letter-spacing of **-0.01em to -0.02em** (`tracking-tight`). Tracking never goes positive on headings.
- **Weights:** 400 for body, 500 for interactive/emphasized UI, 600 for headings and labels. Avoid 700+ in chrome.
- **Micro-labels:** uppercase 11px / 600 / `0.08em` tracking, muted color — used for sidebar section headers and similar wayfinding text.
- **Whitespace:** generous vertical rhythm between sections; let 1px separators and spacing do the grouping instead of boxes-within-boxes.

## 5. Borders, Separators, Depth

- Default to a **1px solid border** in the border token — crisp hairlines, not shadow stacks.
- Section dividers may use the `.divider-soft` gradient hairline for a lighter touch.
- The only default elevation shadow is `0 1px 2px rgba(16,24,40,.05)`. Popovers/menus may add one more soft layer; nothing floats dramatically.
- No glows, no colored shadows, no heavy blur in chrome. If depth is needed, prefer a surface-step (background token change) plus a hairline.

## 6. Motion (Site Chrome)

- **Duration:** 150–200ms. Hover/focus color and border transitions at 150ms; small reveals (dropdowns, tooltips) up to 200ms.
- **Easing:** `ease-out` (or plain `ease` for color-only transitions). No spring/bounce easings in chrome — bounciness belongs exclusively inside the video canvas.
- **Properties:** animate `opacity`, `transform`, and colors. Avoid animating layout (width/height/top) in chrome.
- **Reduced motion:** respect `prefers-reduced-motion` — chrome transitions must degrade to instant.
- **Hard boundary:** the Remotion components (registry primitives, compositions, previews rendered via `@remotion/player`) own their animation logic per [MOTION.md](./MOTION.md) — frame-based `interpolate()`/`spring()` timing, camera moves, motion blur. Site-chrome motion rules never apply to them, and chrome changes must not modify them.

## 7. Do's and Don'ts

### Do

- Change look-and-feel through CSS variables in `app/globals.css` and small class tweaks.
- Keep light and dark token pairs in sync in the same commit.
- Use 1px hairlines and whitespace for structure; keep shadows at the single subtle default.
- Use the accent blue only for primary actions, links, and active states.
- Keep headings `tracking-tight` (-0.01em to -0.02em) and UI text at 14px.
- Keep chrome motion at 150–200ms ease-out.

### Don't

- Don't restructure component JSX to restyle it — restyle via tokens and classes.
- Don't hardcode colors, radii, or shadows in components.
- Don't use pill radii outside explicit badge components.
- Don't add bouncy or slow (>200ms) transitions to site chrome.
- Don't introduce new accent or decorative colors into the chrome.
- Don't touch the animation logic of Remotion video components while working on chrome.
- Don't fix a light-mode issue in a way that regresses dark mode (or vice versa).

## 7a. Gallery pattern (sanctioned exception)

The components gallery (`/docs/components`) is a design-gallery layout modeled on a
best-in-class reference. It is the **one** place these otherwise-forbidden idioms are allowed,
scoped to that route only — do not let them leak into the rest of the chrome:

- **Capsule filter/sort pills** — 9999px radius on the category filter buttons and the sort
  dropdown trigger. This overrides "pill radii only on badges" for the gallery toolbar.
- **Overlay chips** — the ~36px circular icon/arrow overlays on cards use `backdrop-blur` over
  the `--gallery-chip` token. This is the one place light blur in chrome is sanctioned.
- **Borderless flat cards** — gallery cards drop the hairline border and sit on the
  `--gallery-card` mat instead. Everywhere else keeps hairlines over fills.
- **Handwritten accent** — the `--annotation-new` (pink) scribble on the sidebar "UI" link is a
  deliberate second accent, confined to that annotation.

Tokens: `--gallery-card`, `--gallery-chip`, `--annotation-new` (all with light + dark peers in
`app/globals.css`). Style the gallery through these, never with raw hex.

## 8. Quick Reference

```
Light:  bg #FAFAFA–#F7F8FA · surface #FFFFFF · border #E4E7EC
        text #101828 · muted #667085
Dark:   bg #0A0A0B · surface #141417 · border #26272B
        text #FAFAFA · muted #A1A1AA
Accent: #266DF0 (hover #1D5BD6) — same in both themes
Shadow: 0 1px 2px rgba(16,24,40,.05) only
Radii:  10px cards · 6–8px controls · 9999px badges only
Type:   Inter-class sans · 14px UI · headings 600 / -0.01em to -0.02em
Motion: 150–200ms ease-out · no bounce in chrome · video motion → MOTION.md
```
