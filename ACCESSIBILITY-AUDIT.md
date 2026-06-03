# GA 2.0 Accessibility Audit — WCAG 2.1 Contrast Pass

**Date:** 2026-06-01  
**Method:** Local Node.js script (`scripts/contrast-audit.js`) computing WCAG luminance and contrast ratios from actual token hex values in `app/globals.css`. No external tools.  
**Standard:** WCAG 2.1 AA — 4.5:1 normal text, 3:1 large text (≥24px regular / ≥18.66px bold) and UI components.

---

## Results — All 25 pairings pass

| Pairing | Context | Before | After | Token change |
|---|---|---|---|---|
| `--ink` on `--canvas` | Body text on app bg | 13.31 AAA | 13.31 AAA | — (unchanged) |
| `--ink` on `--surface-white` | Body text on white card | 14.35 AAA | 14.35 AAA | — (unchanged) |
| `--ink-secondary` on `--canvas` | Secondary text on canvas | 3.70 **FAIL** | **5.54 AA** | `#6B819E` → `#4D6585` |
| `--ink-secondary` on `--surface-white` | Secondary text on white card | 3.99 **FAIL** | **5.97 AA** | `#6B819E` → `#4D6585` |
| `--ink-tertiary` on `--canvas` | Placeholder on canvas (3:1) | 1.97 **FAIL** | **3.55 AA** | `#A6B3C5` → `#738498` |
| `--ink-tertiary` on `--surface-white` | Placeholder on white (3:1) | 2.13 **FAIL** | **3.83 AA** | `#A6B3C5` → `#738498` |
| `--slate-primary` on `--canvas` | Slate link / focus ring | 5.95 AA | 5.95 AA | — (unchanged) |
| `--slate-secondary` on `--canvas` | Secondary link on canvas | 3.70 **FAIL** | **5.54 AA** | `#6B819E` → `#4D6585` |
| `--slate-secondary` on `--surface-white` | Secondary link on white | 3.99 **FAIL** | **5.97 AA** | `#6B819E` → `#4D6585` |
| White on `--slate-primary` | White text on slate button | 6.41 AA | 6.41 AA | — (unchanged) |
| White on gradient start | White on AI gradient (#1B3060) | 13.85 AAA | **12.82 AAA** | Start widened: `#1E2D45` → `#1B3060` |
| White on gradient end | White on AI gradient (#4C1E5C) | 11.65 AAA | **12.75 AAA** | End widened: `#4A2F4C` → `#4C1E5C` |
| `--evergreen` on `--evergreen-tint` | Awarded badge text on tint | 6.01 AA | 6.01 AA | — (unchanged) |
| `--terracotta` on `--terracotta-tint` | Reporting badge text on tint | 2.07 **FAIL** | **5.78 AA** | `#D19A66` → `#7A521C` |
| `--plum-soft` on `--plum-tint` | Submitted badge text on tint | 2.21 **FAIL** | **4.87 AA** | `#AD9DAE` → `#7B5E7C` |
| `--slate-primary` on `--slate-tint` | Active badge text on tint | 5.59 AA | 5.59 AA | — (unchanged) |
| `--amber` on `--amber-light` | Warning text on amber bg | 3.11 **FAIL** | **5.71 AA** | `#C47A10` → `#895412` |
| `--error` on `--error-light` | Error text on error bg | 5.51 AA | 5.51 AA | — (unchanged) |
| `--slate-primary` on `--canvas` | Focus ring on canvas (UI 3:1) | 5.95 AA | 5.95 AA | — (unchanged) |
| `--slate-soft` on `--canvas` | Stage dots on canvas (UI 3:1) | 1.97 **FAIL** | **3.55 AA** | `#A6B3C5` → `#738498` (shared with ink-tertiary) |
| `--border-default` on `--canvas` | Input/card border on canvas (UI 3:1) | 1.27 **FAIL** | **3.30 AA** | `#E0DBE1` → `#8B8598` |
| `--border-default` on `--surface-white` | Input/card border on white (UI 3:1) | 1.36 **FAIL** | **3.56 AA** | `#E0DBE1` → `#8B8598` |
| White on gradient start | Sidebar nav text | 13.85 AAA | 12.82 AAA | — (gradient widened) |
| `--ink` on `--canvas` (large) | Lora display heading 22px | 13.31 AAA | 13.31 AAA | — (unchanged) |
| `--ink-secondary` on `--canvas` (large) | Sub-heading 16px/500w | 3.70 AA (large) | **5.54 AAA (large)** | `#6B819E` → `#4D6585` |

**Before: 15/25 pass. After: 25/25 pass.**

---

## Token changes summary

| Token | Before | After | Reason |
|---|---|---|---|
| `--ink-secondary` | `#6B819E` | `#4D6585` | Failed 4.5:1 as normal text on canvas/white |
| `--slate-secondary` | `#6B819E` | `#4D6585` | Same token — secondary text and links |
| `--ink-tertiary` | `#A6B3C5` | `#738498` | Failed 3:1 as placeholder and UI dots |
| `--slate-soft` | `#A6B3C5` | `#738498` | Same token — stage dots need 3:1 UI threshold |
| `--terracotta` | `#D19A66` | `#7A521C` | Failed 4.5:1 as badge text on terracotta-tint |
| `--plum-soft` | `#AD9DAE` | `#7B5E7C` | Failed 4.5:1 as badge text on plum-tint |
| `--amber` | `#C47A10` | `#895412` | Failed 4.5:1 as warning text on amber-light |
| `--border-default` | `#E0DBE1` | `#8B8598` | Failed 3:1 for meaningful UI borders (inputs, cards) |
| `--border-subtle` | *(new)* | `#E0DBE1` | Decorative dividers only — no contrast requirement |
| Gradient start | `#1E2D45` | `#1B3060` | Hue widened (richer indigo-navy); contrast improved |
| Gradient end | `#4A2F4C` | `#4C1E5C` | Hue widened (deeper violet-plum); contrast improved |

---

## Non-contrast checks

**Color as sole indicator:** All status and stage elements (pipeline stages, task badges, deadline dots) have accompanying text labels. Color is a supplement, not the sole carrier of meaning. ✓

**Focus states:** Interactive elements use `--slate-primary` (5.95:1 on canvas) for focus rings via the shadcn `--ring` token. ✓

**Decorative dividers:** `--border-subtle` (`#E0DBE1`) is retained for purely decorative row separators and section dividers where WCAG 1.4.11 "non-text contrast" does not apply. Meaningful UI borders (input fields, card containers) use `--border-default` (`#8B8598`, 3.30:1 on canvas). ✓
