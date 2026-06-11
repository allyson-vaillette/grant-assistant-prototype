"use client"

import React from "react"
import Link from "next/link"
import { useProfile } from "@/lib/profile-context"

export function IncompleteProfileBanner() {
  const { isProfileComplete, isBannerDismissed, dismissBanner } = useProfile()

  if (isProfileComplete || isBannerDismissed) return null

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px 10px 16px",
        marginBottom: 20,
        borderRadius: 10,
        backgroundColor: "var(--slate-tint)",
        border: "1px solid rgba(91,69,200,0.15)",
      }}
    >
      <p
        style={{
          flex: 1,
          margin: 0,
          fontSize: 13,
          color: "var(--ink-secondary)",
          lineHeight: "18px",
        }}
      >
        Finish your profile to refine your matches.
      </p>
      <Link
        href="/onboarding"
        style={{
          flexShrink: 0,
          padding: "6px 14px",
          borderRadius: 8,
          backgroundColor: "var(--slate-primary)",
          color: "#ffffff",
          fontSize: 12,
          fontWeight: 600,
          textDecoration: "none",
          lineHeight: "16px",
          whiteSpace: "nowrap",
        }}
      >
        Finish profile
      </Link>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismissBanner}
        style={{
          flexShrink: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          display: "flex",
          alignItems: "center",
          color: "var(--ink-tertiary)",
          borderRadius: 4,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
      </button>
    </div>
  )
}
