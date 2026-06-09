"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { X, ExternalLink } from "lucide-react"
import { FUNDERS, OPPORTUNITIES, getMatchForOpportunity } from "@/lib/mock-data"
import type { FunderType, MatchStrength } from "@/lib/types"

const FUNDER_TYPE_LABELS: Record<FunderType, string> = {
  private_foundation:   "Private foundation",
  community_foundation: "Community foundation",
  government:           "Government",
  corporate_foundation: "Corporate foundation",
  public_charity:       "Public charity",
}

const MATCH_COLORS: Record<MatchStrength, string> = {
  strong:  "var(--evergreen)",
  good:    "var(--slate-primary)",
  partial: "var(--ink-tertiary)",
}

const MATCH_DOTS: Record<MatchStrength, number> = { strong: 5, good: 4, partial: 3 }

function MatchDots({ strength }: { strength: MatchStrength }) {
  const dots = MATCH_DOTS[strength]
  const color = MATCH_COLORS[strength]
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: i < dots ? color : "var(--hair-2)" }} />
      ))}
    </span>
  )
}

interface Props {
  funderId: string
  onClose: () => void
  onOppClick?: (oppId: string) => void
}

export function FunderPeekPanel({ funderId, onClose, onOppClick }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [visible, setVisible] = useState(false)

  const funder = FUNDERS.find(f => f.id === funderId)
  const opps = OPPORTUNITIES.filter(o => o.funderId === funderId)

  useEffect(() => {
    requestAnimationFrame(() => {
      setVisible(true)
      closeButtonRef.current?.focus()
    })
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

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

  if (!funder) return null

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          backgroundColor: "rgba(28, 24, 64, 0.10)",
          zIndex: 10,
          opacity: visible ? 1 : 0,
          transition: "opacity 220ms",
          cursor: "default",
        }}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="peek-funder-title"
        onKeyDown={handleKeyDown}
        style={{
          position: "absolute", top: 0, right: 0, bottom: 0,
          width: 480,
          backgroundColor: "var(--surface)",
          borderLeft: "1px solid var(--hair)",
          boxShadow: "-6px 0 28px rgba(28, 24, 64, 0.10)",
          display: "flex", flexDirection: "column",
          zIndex: 20,
          transform: visible ? "translateX(0)" : "translateX(100%)",
          transition: "transform 220ms cubic-bezier(.32,.72,0,1)",
        }}
      >
        {/* Header */}
        <div style={{ flexShrink: 0, padding: "18px 20px 16px", borderBottom: "1px solid var(--hair)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: 8 }}>
                <span style={{
                  display: "inline-block", padding: "2px 8px", borderRadius: 20,
                  fontSize: 11, fontWeight: 500,
                  backgroundColor: "var(--slate-tint)", color: "var(--slate-secondary)",
                }}>
                  {FUNDER_TYPE_LABELS[funder.type]}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2
                  id="peek-funder-title"
                  style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}
                >
                  {funder.name}
                </h2>
                {funder.website && (
                  <a
                    href={funder.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--slate-secondary)", display: "flex", alignItems: "center", flexShrink: 0 }}
                    aria-label={`Visit ${funder.name} website`}
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              aria-label="Close funder panel"
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
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 24px" }}>

          {/* Meta */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px", padding: "0 0 16px", borderBottom: "1px solid var(--hair)", marginBottom: 20 }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Geography</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink)" }}>{funder.geography}</p>
            </div>
            {funder.fundingRange && (
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Funding range</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--ink)" }}>{funder.fundingRange}</p>
              </div>
            )}
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Unsolicited</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink)" }}>{funder.acceptsUnsolicited ? "Yes" : "No — LOI required"}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Focus areas</p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink)", lineHeight: "17px" }}>{funder.focusAreas.join(" · ")}</p>
            </div>
          </div>

          {/* About */}
          {funder.description && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 7px", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>About</h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>{funder.description}</p>
            </div>
          )}

          {/* Open opportunities */}
          {opps.length > 0 && (
            <div>
              <h3 style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                Open {opps.length === 1 ? "opportunity" : "opportunities"}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {opps.map(opp => {
                  const match = getMatchForOpportunity(opp.id)
                  const clickable = !!onOppClick
                  return (
                    <div
                      key={opp.id}
                      role={clickable ? "button" : undefined}
                      tabIndex={clickable ? 0 : undefined}
                      onClick={() => clickable && onOppClick(opp.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" && clickable) onOppClick!(opp.id) }}
                      style={{
                        padding: "12px 14px", borderRadius: 10,
                        backgroundColor: "var(--canvas)", border: "1px solid var(--hair)",
                        cursor: clickable ? "pointer" : "default",
                        transition: "border-color 150ms, box-shadow 150ms",
                      }}
                      onMouseEnter={(e) => {
                        if (!clickable) return
                        const el = e.currentTarget as HTMLDivElement
                        el.style.borderColor = "var(--slate-light)"
                        el.style.boxShadow = "var(--lift-2)"
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLDivElement
                        el.style.borderColor = "var(--hair)"
                        el.style.boxShadow = "none"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--ink)", lineHeight: "17px" }}>{opp.name}</p>
                        {match && <MatchDots strength={match.matchStrength} />}
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        {opp.amount && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--slate-primary)" }}>{opp.amount}</span>}
                        {opp.deadline && (
                          <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
                            {opp.deadline === "Rolling" ? "Rolling deadline" : `Due ${opp.deadline}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
