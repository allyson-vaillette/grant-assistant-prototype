"use client"

import * as React from "react"

/**
 * AiIcon — the GA 2.0 AI signal sparkle (Material `auto_awesome`), ported from
 * the Respond prototype's src/icons.jsx. Shared component: use it anywhere an
 * AI action or AI-authored surface needs the gradient sparkle.
 *
 * The gradient runs slate-indigo (--ai-a #4535A0) → AI blue (--ai-b #0095D4),
 * matching the `--ai-grad` token. Pass `white` for use on dark/gradient fills.
 */
const SPARK_D =
  "M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"

let gid = 0

export function AiIcon({
  size = 13,
  white = false,
  style,
}: {
  size?: number
  white?: boolean
  style?: React.CSSProperties
}) {
  // Stable per-instance gradient id so multiple sparkles don't collide.
  const id = React.useMemo(() => `aig${++gid}`, [])
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ flex: "none", ...style }}
      aria-hidden="true"
    >
      {!white && (
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#4535A0" />
            <stop offset="1" stopColor="#0095D4" />
          </linearGradient>
        </defs>
      )}
      <path d={SPARK_D} fill={white ? "#fff" : `url(#${id})`} />
    </svg>
  )
}

export default AiIcon
