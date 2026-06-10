"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { X, Check, AlertTriangle, ChevronRight, Loader2, ExternalLink } from "lucide-react"
import {
  FUNDERS, OPPORTUNITIES, PROJECTS,
  getMatchForOpportunity,
  getPipelineForOpportunityAndProject,
  createPipelineOpportunity,
} from "@/lib/mock-data"
import type { FunderType, MatchStrength } from "@/lib/types"

const FUNDER_TYPE_LABELS: Record<FunderType, string> = {
  private_foundation:   "Private foundation",
  community_foundation: "Community foundation",
  government:           "Government",
  corporate_foundation: "Corporate foundation",
  public_charity:       "Public charity",
}

const MATCH_CONFIG: Record<MatchStrength, { label: string; color: string; dots: number }> = {
  strong:  { label: "Strong match",  color: "var(--evergreen)",     dots: 5 },
  good:    { label: "Good match",    color: "var(--slate-primary)", dots: 4 },
  partial: { label: "Partial match", color: "var(--ink-tertiary)",  dots: 3 },
}

function MatchDots({ strength }: { strength: MatchStrength }) {
  const cfg = MATCH_CONFIG[strength]
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          backgroundColor: i < cfg.dots ? cfg.color : "var(--hair-2)",
        }} />
      ))}
    </span>
  )
}

interface Props {
  oppId: string
  onClose: () => void
  onFunderClick?: (funderId: string) => void
}

export function OpportunityPeekPanel({ oppId, onClose, onFunderClick }: Props) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [visible, setVisible] = useState(false)
  const [localTracked, setLocalTracked] = useState(false)
  const [trackPhase, setTrackPhase] = useState<"idle" | "loading">("idle")

  const opp = OPPORTUNITIES.find(o => o.id === oppId)
  const funder = opp ? FUNDERS.find(f => f.id === opp.funderId) : null
  const match = opp ? getMatchForOpportunity(opp.id) : null
  const defaultProject = PROJECTS[0]
  const existingPipeline = opp
    ? getPipelineForOpportunityAndProject(opp.id, defaultProject?.id ?? "")
    : null
  const isTracked = !!existingPipeline || localTracked

  // Slide in and focus on mount
  useEffect(() => {
    requestAnimationFrame(() => {
      setVisible(true)
      closeButtonRef.current?.focus()
    })
  }, [])

  // Reset local state when switching opportunities
  useEffect(() => {
    setLocalTracked(false)
    setTrackPhase("idle")
  }, [oppId])

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return
    const panel = panelRef.current
    if (!panel) return
    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ))
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus()
    }
  }, [])

  async function handleTrack() {
    if (isTracked || trackPhase === "loading") return
    setTrackPhase("loading")
    try {
      createPipelineOpportunity(opp!.id, defaultProject?.id ?? "")
      setLocalTracked(true)
    } finally {
      setTrackPhase("idle")
    }
  }

  if (!opp || !funder) return null

  const backdropStyle: React.CSSProperties = {
    position: "absolute", inset: 0,
    backgroundColor: "rgba(28, 24, 64, 0.10)",
    zIndex: 10,
    opacity: visible ? 1 : 0,
    transition: "opacity 220ms",
    cursor: "default",
  }

  const panelStyle: React.CSSProperties = {
    position: "absolute", top: 0, right: 0, bottom: 0,
    width: 480,
    backgroundColor: "var(--surface)",
    borderLeft: "1px solid var(--hair)",
    boxShadow: "-6px 0 28px rgba(28, 24, 64, 0.10)",
    display: "flex", flexDirection: "column",
    zIndex: 20,
    transform: visible ? "translateX(0)" : "translateX(100%)",
    transition: "transform 220ms cubic-bezier(.32,.72,0,1)",
  }

  return (
    <>
      <div aria-hidden="true" onClick={onClose} style={backdropStyle} />

      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="peek-opp-title" onKeyDown={handleKeyDown} style={panelStyle}>

        {/* Header */}
        <div style={{ flexShrink: 0, padding: "18px 20px 16px", borderBottom: "1px solid var(--hair)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{
                  display: "inline-block", padding: "2px 8px", borderRadius: 20,
                  fontSize: 11, fontWeight: 500,
                  backgroundColor: "var(--slate-tint)", color: "var(--slate-secondary)",
                }}>
                  {FUNDER_TYPE_LABELS[funder.type]}
                </span>
                {onFunderClick ? (
                  <button
                    type="button"
                    onClick={() => onFunderClick(funder.id)}
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, color: "var(--slate-secondary)", transition: "color 120ms" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--slate-secondary)" }}
                  >
                    {funder.name}
                  </button>
                ) : funder.website ? (
                  <a href={funder.website} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--slate-secondary)", textDecoration: "none" }}
                  >
                    {funder.name} <ExternalLink size={11} />
                  </a>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>{funder.name}</span>
                )}
              </div>
              <h2 id="peek-opp-title" style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "var(--ink)", lineHeight: "23px", letterSpacing: "-0.01em" }}>
                {opp.name}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {opp.amount && (
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--slate-primary)", letterSpacing: "-0.01em" }}>{opp.amount}</span>
                )}
                {opp.deadline && (
                  <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
                    {opp.deadline === "Rolling" ? "Rolling deadline" : `Due ${opp.deadline}`}
                  </span>
                )}
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close detail panel"
              onClick={onClose}
              style={{
                flexShrink: 0, width: 30, height: 30, borderRadius: 8,
                border: "1px solid var(--hair-2)", backgroundColor: "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--ink-tertiary)",
                transition: "background-color 120ms, color 120ms",
              }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = "var(--canvas)"; el.style.color = "var(--ink)" }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = "transparent"; el.style.color = "var(--ink-tertiary)" }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>

          {/* Match analysis */}
          {match && (
            <div style={{ marginBottom: 20, padding: "14px 16px", borderRadius: 10, backgroundColor: "var(--canvas)", border: "1px solid var(--hair)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <MatchDots strength={match.matchStrength} />
                <span style={{ fontSize: 12, fontWeight: 600, color: MATCH_CONFIG[match.matchStrength].color }}>
                  {MATCH_CONFIG[match.matchStrength].label}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {match.reasons.positive.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Check size={12} style={{ color: "var(--evergreen)", flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>{r}</span>
                  </div>
                ))}
                {match.reasons.cautions.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <AlertTriangle size={12} style={{ color: "var(--amber)", flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", padding: "14px 0", borderTop: "1px solid var(--hair)", borderBottom: "1px solid var(--hair)", marginBottom: 20 }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)" }}>Geography</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink)" }}>{funder.geography}</p>
            </div>
            {funder.fundingRange && (
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)" }}>Funding range</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--ink)" }}>{funder.fundingRange}</p>
              </div>
            )}
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)" }}>Unsolicited</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink)" }}>{funder.acceptsUnsolicited ? "Yes" : "No — LOI required"}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)" }}>Focus areas</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink)", lineHeight: "17px" }}>{(opp.focusAreas ?? funder.focusAreas).join(" · ")}</p>
            </div>
          </div>

          {/* About this grant */}
          {opp.description && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 7px", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>About this grant</h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>{opp.description}</p>
            </div>
          )}

          {/* Eligibility */}
          {opp.eligibility && (
            <div style={{ marginBottom: 20, padding: "12px 14px", borderRadius: 10, backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)" }}>
              <p style={{ margin: "0 0 5px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)" }}>
                Eligibility requirements
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink-secondary)", lineHeight: "18px" }}>{opp.eligibility}</p>
            </div>
          )}

          {/* About funder */}
          {funder.description && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 7px", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>About {funder.name}</h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>{funder.description}</p>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div style={{ flexShrink: 0, borderTop: "1px solid var(--hair)", padding: "0 20px", height: 64, display: "flex", alignItems: "center", gap: 12, backgroundColor: "var(--surface)" }}>
          {isTracked ? (
            <>
              <button
                type="button"
                onClick={() => router.push(`/pursuit/${opp.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8,
                  backgroundColor: "var(--slate-primary)", border: "none",
                  fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer",
                  transition: "background-color 150ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
              >
                Open workspace <ChevronRight size={14} />
              </button>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--evergreen)", fontWeight: 500 }}>
                <Check size={13} /> Tracking
              </span>
            </>
          ) : (
            <button
              type="button"
              onClick={handleTrack}
              disabled={trackPhase === "loading"}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                backgroundColor: trackPhase === "loading" ? "var(--slate-tint)" : "var(--slate-primary)",
                border: "none",
                fontSize: 13, fontWeight: 600,
                color: trackPhase === "loading" ? "var(--ink-tertiary)" : "#fff",
                cursor: trackPhase === "loading" ? "default" : "pointer",
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => {
                if (trackPhase === "loading") return
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A"
              }}
              onMouseLeave={(e) => {
                if (trackPhase === "loading") return
                ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)"
              }}
            >
              {trackPhase === "loading" ? <><Loader2 size={13} className="animate-spin" /> Adding…</> : "Track"}
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push(`/opportunity/${opp.id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "8px 14px", borderRadius: 8,
              border: "1px solid var(--hair-2)", backgroundColor: "transparent",
              fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer",
              transition: "background-color 150ms, color 150ms",
            }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = "var(--canvas)"; el.style.color = "var(--ink)" }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = "transparent"; el.style.color = "var(--ink-secondary)" }}
          >
            Details <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </>
  )
}
