#!/usr/bin/env node
/**
 * Helper: given a background hex and a minimum contrast ratio,
 * compute the minimum "darkness" needed and suggest adjusted hex values.
 */

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
  const l1 = luminance(hex1)
  const l2 = luminance(hex2)
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// ── Check proposed values ─────────────────────────────────────────────────────
const checks = [
  // [fg, bg, minRatio, label]
  // ink-secondary on canvas + white
  ["#4D6585", "#F9F6F1", 4.5, "proposed ink-secondary on canvas"],
  ["#4D6585", "#FFFFFF",  4.5, "proposed ink-secondary on white"],

  // ink-tertiary / slate-soft on canvas + white (UI: 3:1; placeholder: 3:1)
  ["#738498", "#F9F6F1", 3.0, "proposed ink-tertiary on canvas (UI/placeholder)"],
  ["#738498", "#FFFFFF",  3.0, "proposed ink-tertiary on white"],

  // terracotta badge text on terracotta-tint
  ["#7A521C", "#F5EAD8", 4.5, "proposed terracotta on terracotta-tint"],
  ["#7A521C", "#F9F6F1", 3.0, "proposed terracotta dot on canvas (UI)"],

  // plum badge text on plum-tint
  ["#7B5E7C", "#F2EDF3", 4.5, "proposed plum-soft on plum-tint"],

  // amber warning text on amber-light
  ["#895412", "#FEF3DC", 4.5, "proposed amber on amber-light"],
  ["#895412", "#F9F6F1", 3.0, "proposed amber dot on canvas (UI)"],

  // border-default on canvas + white (meaningful UI: 3:1)
  ["#8B8598", "#F9F6F1", 3.0, "proposed border-default on canvas"],
  ["#8B8598", "#FFFFFF",  3.0, "proposed border-default on white"],

  // gradient stops — white text (must pass 4.5:1)
  ["#FFFFFF", "#1E2D45", 4.5, "white on gradient start (original)"],
  ["#FFFFFF", "#4A2F4C", 4.5, "white on gradient end (original)"],

  // New gradient stops (widened)
  ["#FFFFFF", "#1B3060", 4.5, "white on NEW gradient start"],
  ["#FFFFFF", "#4C1E5C", 4.5, "white on NEW gradient end"],
]

console.log("── Proposed fix verification ────────────────────────────────────\n")
for (const [fg, bg, minRatio, label] of checks) {
  const r = contrast(fg, bg)
  const ok = r >= minRatio
  console.log(`${ok ? "✓" : "✗"} ${r.toFixed(2)}:1 (need ≥${minRatio})  ${label}`)
}
