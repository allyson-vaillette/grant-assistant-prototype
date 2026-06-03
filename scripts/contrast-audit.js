#!/usr/bin/env node
/**
 * GA 2.0 WCAG 2.1 Contrast Audit — post-fix verification
 * Reads resolved hex values from updated globals.css tokens.
 * No dependencies beyond Node.js.
 */

const TOKENS = {
  // Surfaces
  canvas:         "#F9F6F1",
  surfaceWhite:   "#FFFFFF",
  surfaceBeige:   "#F0E6D2",

  // Slate accent
  slatePrimary:   "#4A6080",
  slateSecondary: "#4D6585",   // fixed
  slateSoft:      "#738498",   // fixed
  slateTint:      "#EBF0F5",
  slateLight:     "#E0E8F2",

  // Supporting accents
  evergreen:      "#3C5E4C",
  evergreenTint:  "#E0EDE6",
  terracotta:     "#7A521C",   // fixed
  terracottaTint: "#F5EAD8",
  plumSoft:       "#7B5E7C",   // fixed
  plumTint:       "#F2EDF3",

  // AI gradient stops (widened)
  gradientStart:  "#1B3060",   // new
  gradientEnd:    "#4C1E5C",   // new

  // Status / semantic
  amber:          "#895412",   // fixed
  amberLight:     "#FEF3DC",
  error:          "#B91C1C",
  errorLight:     "#FDE8E8",

  // Text
  ink:            "#2A2A2A",
  inkSecondary:   "#4D6585",   // fixed
  inkTertiary:    "#738498",   // fixed

  // Borders
  borderDefault:  "#8B8598",   // fixed (meaningful UI borders)
  borderSubtle:   "#E0DBE1",   // decorative only

  white:          "#FFFFFF",
}

function hexToRgb(hex) {
  const h = hex.replace("#", "")
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  }
}
function linearize(c) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}
function luminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)
}
function contrast(hex1, hex2) {
  const l1 = luminance(hex1), l2 = luminance(hex2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}
function level(ratio, large, ui) {
  const min = (ui || large) ? 3 : 4.5
  if (ratio >= 7) return "AAA"
  if (ratio >= 4.5) return (ui || large) ? "AAA (large)" : "AA"
  if (ratio >= 3) return (ui || large) ? "AA" : "AA (large only)"
  return "FAIL"
}
function passes(ratio, large, ui) {
  return ratio >= ((ui || large) ? 3 : 4.5)
}

const PAIRINGS = [
  // Primary text
  { fg: "ink",          bg: "canvas",        ctx: "Body text on canvas",                  large: false, ui: false },
  { fg: "ink",          bg: "surfaceWhite",  ctx: "Body text on white card",              large: false, ui: false },

  // Secondary text
  { fg: "inkSecondary", bg: "canvas",        ctx: "Secondary text on canvas",             large: false, ui: false },
  { fg: "inkSecondary", bg: "surfaceWhite",  ctx: "Secondary text on white card",         large: false, ui: false },

  // Tertiary / placeholder (3:1 per spec)
  { fg: "inkTertiary",  bg: "canvas",        ctx: "Placeholder on canvas (3:1 spec)",     large: false, ui: true  },
  { fg: "inkTertiary",  bg: "surfaceWhite",  ctx: "Placeholder on white (3:1 spec)",      large: false, ui: true  },

  // Slate links
  { fg: "slatePrimary",   bg: "canvas",      ctx: "Slate primary link on canvas",         large: false, ui: false },
  { fg: "slateSecondary", bg: "canvas",      ctx: "Slate secondary as text on canvas",    large: false, ui: false },
  { fg: "slateSecondary", bg: "surfaceWhite",ctx: "Slate secondary as text on white",     large: false, ui: false },

  // White on solid fills
  { fg: "white", bg: "slatePrimary",   ctx: "White on slate button",                     large: false, ui: false },
  { fg: "white", bg: "gradientStart",  ctx: "White on AI gradient start (#1B3060)",      large: false, ui: false },
  { fg: "white", bg: "gradientEnd",    ctx: "White on AI gradient end (#4C1E5C)",         large: false, ui: false },

  // Badge text on tints
  { fg: "evergreen",  bg: "evergreenTint",  ctx: "Awarded badge text on tint",            large: false, ui: false },
  { fg: "terracotta", bg: "terracottaTint", ctx: "Reporting badge text on tint",          large: false, ui: false },
  { fg: "plumSoft",   bg: "plumTint",       ctx: "Submitted badge text on tint",          large: false, ui: false },
  { fg: "slatePrimary", bg: "slateTint",    ctx: "Active badge text on slate tint",       large: false, ui: false },
  { fg: "amber",      bg: "amberLight",     ctx: "Warning text on amber bg",              large: false, ui: false },
  { fg: "error",      bg: "errorLight",     ctx: "Error text on error bg",                large: false, ui: false },

  // UI components (3:1)
  { fg: "slatePrimary",  bg: "canvas",      ctx: "Focus ring on canvas",                 large: false, ui: true  },
  { fg: "slateSoft",     bg: "canvas",      ctx: "Stage dots (slate soft) on canvas",    large: false, ui: true  },
  { fg: "borderDefault", bg: "canvas",      ctx: "Input/card border on canvas",          large: false, ui: true  },
  { fg: "borderDefault", bg: "surfaceWhite",ctx: "Input/card border on white",           large: false, ui: true  },

  // Sidebar
  { fg: "white", bg: "gradientStart",       ctx: "Sidebar nav text on sidebar bg",       large: false, ui: false },

  // Display headings (large text: 22px = 3:1 threshold)
  { fg: "ink",          bg: "canvas",       ctx: "Lora display heading on canvas (22px)",large: true,  ui: false },
  { fg: "inkSecondary", bg: "canvas",       ctx: "Sub-heading (16px 500w) on canvas",    large: true,  ui: false },
]

// inkTertiary alias for slateSoft in UI check
TOKENS.slateSoft = TOKENS.inkTertiary

console.log("GA 2.0 WCAG 2.1 Contrast Audit — POST-FIX\n")
console.log("=".repeat(80))

let pass = 0, fail = 0
const failures = []

for (const p of PAIRINGS) {
  const fgHex = TOKENS[p.fg]
  const bgHex = TOKENS[p.bg]
  if (!fgHex || !bgHex) { console.log(`  ⚠ SKIP: ${p.fg} or ${p.bg} not found`); continue }
  const ratio = contrast(fgHex, bgHex)
  const lv    = level(ratio, p.large, p.ui)
  const ok    = passes(ratio, p.large, p.ui)
  const min   = (p.ui || p.large) ? "3.0" : "4.5"

  console.log(`${ok ? "✓" : "✗"} [${lv.padEnd(12)}] ${ratio.toFixed(2).padStart(5)}:1 (≥${min})  ${p.ctx}`)

  if (ok) pass++
  else { fail++; failures.push({ ...p, fgHex, bgHex, ratio, min }) }
}

console.log("\n" + "=".repeat(80))
console.log(`SUMMARY: ${pass} pass  |  ${fail} fail`)

if (failures.length) {
  console.log("\n── REMAINING FAILURES ─────────────────────────────────────────────────────")
  failures.forEach(r => {
    console.log(`  ✗ ${r.ctx}`)
    console.log(`    ${r.fgHex} on ${r.bgHex} → ${r.ratio.toFixed(2)}:1 (need ≥${r.min})`)
  })
}
