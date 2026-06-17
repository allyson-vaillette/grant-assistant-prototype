import React from "react"

export function ContentContainer({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", ...style }}>
      {children}
    </div>
  )
}
