"use client"

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ContentContainer } from "@/components/layout/content-container"
import { Search, X, Check, CalendarDays, MapPin, EyeOff } from "lucide-react"
import {
  OPPORTUNITIES, MATCHES, FUNDERS, PROJECTS,
  getFunder, getMatchForOpportunity, createPipelineOpportunity, getPipelineForOpportunity,
  trackFunder,
} from "@/lib/mock-data"
import { useScope } from "@/lib/scope-context"
import { useDiscoverFilters } from "@/lib/discover-filters-context"
import type { Opportunity, Funder, FunderType, Match } from "@/lib/types"
import { OpportunityPeekPanel } from "./OpportunityPeekPanel"
import { HideOpportunityDialog, type HidePayload } from "./HideOpportunityDialog"
import { recordHideOpportunity, undoHideOpportunity } from "./actions"
import { FUNDER_TYPE_LABELS, AWARD_RANGE_LABELS, DEADLINE_LABELS } from "./FiltersPanel"
import { IncompleteProfileBanner } from "@/components/IncompleteProfileBanner"

// ── Constants ──────────────────────────────────────────────────────────────

const MONTH_INDEX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

function parseDeadlineDate(str: string): Date | null {
  if (!str || str === "Rolling") return null
  const m = str.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/)
  if (m) {
    const monthIdx = MONTH_INDEX[m[1]]
    if (monthIdx !== undefined) return new Date(parseInt(m[3]), monthIdx, parseInt(m[2]))
  }
  return null
}

function parseAmount(str: string | undefined): number | null {
  if (!str) return null
  const digits = str.replace(/[^0-9]/g, "")
  return digits ? parseInt(digits) : null
}

const ALL_FOCUS_AREAS = Array.from(new Set([
  ...FUNDERS.flatMap(f => f.focusAreas),
  ...OPPORTUNITIES.flatMap(o => o.focusAreas ?? []),
])).sort()

const ALL_GEOGRAPHIES = Array.from(new Set(FUNDERS.map(f => f.geography))).sort()

const STRONG_MATCHES = MATCHES
  .filter(m => m.matchStrength === "strong" && m.opportunityId)
  .map(m => ({ match: m, opp: OPPORTUNITIES.find(o => o.id === m.opportunityId) }))
  .filter((item): item is { match: Match; opp: Opportunity } => !!item.opp)

// One entry per funder, best match score wins
const MATCHED_FUNDERS: { match: Match; funder: Funder }[] = (() => {
  const byFunder = new Map<string, Match>()
  for (const match of MATCHES) {
    const existing = byFunder.get(match.funderId)
    if (!existing || match.matchScore > existing.matchScore) {
      byFunder.set(match.funderId, match)
    }
  }
  return Array.from(byFunder.entries())
    .map(([funderId, match]) => ({ match, funder: getFunder(funderId) }))
    .filter((item): item is { match: Match; funder: Funder } => !!item.funder)
    .sort((a, b) => b.match.matchScore - a.match.matchScore)
})()

function matchedOppCount(funderId: string): number {
  return MATCHES.filter(m => m.funderId === funderId && !!m.opportunityId).length
}

// ── Funder type icon (Part 2) ──────────────────────────────────────────────

const FUNDER_ICON_MAP: Record<FunderType, string> = {
  private_foundation:   "account_balance",
  corporate_foundation: "corporate_fare",
  public_charity:       "volunteer_activism",
  community_foundation: "groups",
  government:           "gavel",
}

function FunderTypeIcon({ type }: { type: FunderType }) {
  const icon = FUNDER_ICON_MAP[type] ?? "account_balance"
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 32, height: 32, borderRadius: "50%",
      backgroundColor: "#EEF2F6", flexShrink: 0,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#4A6080", lineHeight: 1, userSelect: "none" }}>
        {icon}
      </span>
    </span>
  )
}

// ── Program picker pill (Part 1) ───────────────────────────────────────────

function ProgramPickerPill({ activeProjectId, newCount }: { activeProjectId: string; newCount: number }) {
  const [open, setOpen] = useState(false)
  const project = PROJECTS.find(p => p.id === activeProjectId) ?? PROJECTS[0]
  const name = project?.name ?? "Spay/Neuter Program"

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 10px 6px 12px", borderRadius: 8,
          border: "1px solid rgba(42,42,42,0.1)", backgroundColor: "#fff",
          cursor: "pointer",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#4A6080", flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: "#2a2a2a", whiteSpace: "nowrap" }}>{name}</span>
        {newCount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "#3c5e4c", backgroundColor: "#EEF2F6", borderRadius: 10, padding: "1px 6px", whiteSpace: "nowrap" }}>
            {newCount} new
          </span>
        )}
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "#738498", userSelect: "none", flexShrink: 0 }}>expand_more</span>
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 29 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 30,
            backgroundColor: "#fff", border: "1px solid rgba(42,42,42,0.1)",
            borderRadius: 8, boxShadow: "0 4px 12px rgba(42,42,42,0.10)",
            minWidth: 220, overflow: "hidden",
          }}>
            {PROJECTS.map((p, i) => {
              const pNew = p.id === activeProjectId ? newCount : 0
              const pTotal = p.id === activeProjectId ? STRONG_MATCHES.length : 0
              return (
                <div key={p.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "9px 14px",
                  borderTop: i > 0 ? "1px solid rgba(42,42,42,0.06)" : "none",
                }}>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: p.id === activeProjectId ? 600 : 400, color: "#2a2a2a", minWidth: 0 }}>{p.name}</span>
                  {pNew > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#3c5e4c", backgroundColor: "#EEF2F6", borderRadius: 10, padding: "1px 6px", whiteSpace: "nowrap" }}>
                      {pNew} new
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: "#738498", whiteSpace: "nowrap" }}>{pTotal} total</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── daysLabel ──────────────────────────────────────────────────────────────

function daysLabel(deadline: string | undefined): string {
  if (!deadline) return ""
  if (deadline === "Rolling") return "Rolling"
  const date = parseDeadlineDate(deadline)
  if (!date) return deadline
  const now = new Date(); now.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const short = deadline.replace(/,\s*\d{4}$/, "")
  if (days < 0) return short
  return `${short} · ${days}d`
}

// ── Catalogue card (Matches > Opportunities) ───────────────────────────────

function CatalogueCard({ opp, onOppClick, onTrack, onHide }: {
  opp: Opportunity
  onOppClick: (oppId: string, el: HTMLElement) => void
  onTrack: (oppId: string) => void
  onHide: (oppId: string) => void
}) {
  const [cardHovered, setCardHovered] = useState(false)
  const [hideButtonFocused, setHideButtonFocused] = useState(false)
  const hideButtonVisible = cardHovered || hideButtonFocused
  const funder = getFunder(opp.funderId)
  const match = getMatchForOpportunity(opp.id)
  const matchReasons = match?.matchReasons ?? []

  const eligColor = opp.eligibilityLabel === "Likely eligible"
    ? "var(--evergreen)"
    : opp.eligibilityLabel === "Invitation required"
    ? "var(--amber)"
    : "var(--ink-tertiary)"

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => onOppClick(opp.id, e.currentTarget)}
      onKeyDown={(e) => e.key === "Enter" && onOppClick(opp.id, e.currentTarget as HTMLElement)}
      style={{
        padding: "14px 16px",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--hair)",
        borderRadius: 12,
        cursor: "pointer",
        display: "flex", flexDirection: "column",
        transition: "border-color 150ms, box-shadow 150ms",
      }}
      onMouseEnter={(e) => {
        setCardHovered(true)
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = "var(--slate-light)"
        el.style.boxShadow = "var(--shadow-sm)"
      }}
      onMouseLeave={(e) => {
        setCardHovered(false)
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = "var(--hair)"
        el.style.boxShadow = "none"
      }}
    >
      {/* Header: icon + funder identity + amount */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {funder && <FunderTypeIcon type={funder.type} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {funder?.name}
          </p>
          {funder && (
            <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {FUNDER_TYPE_LABELS[funder.type]}{funder.location ? ` · ${funder.location}` : ""}
            </p>
          )}
        </div>
        {match?.isNew && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--evergreen)", backgroundColor: "var(--evergreen-tint)", borderRadius: 10, padding: "2px 7px", flexShrink: 0, whiteSpace: "nowrap" }}>
            New
          </span>
        )}
        {opp.amount && (
          <span style={{ fontSize: 18, fontWeight: 600, color: "#2a2a2a", flexShrink: 0, letterSpacing: "-0.01em" }}>{opp.amount}</span>
        )}
      </div>

      <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: "18px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {opp.name}
      </p>

      {/* Structured match reasons list */}
      {matchReasons.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
          {matchReasons.map((reason, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, color: "#3c5e4c", flexShrink: 0, lineHeight: "17px", userSelect: "none" }}>check</span>
              <span style={{ fontSize: 12, lineHeight: "17px" }}>
                {reason.label ? (
                  <><span style={{ fontWeight: 600, color: "#2a2a2a" }}>{reason.label}:</span>{" "}<span style={{ fontWeight: 400, color: "#4d6585" }}>{reason.value}</span></>
                ) : (
                  <span style={{ fontWeight: 400, color: "#4d6585" }}>{reason.value}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ borderTop: "0.5px solid var(--hair)", margin: "0 0 10px" }} />

      {/* Meta row: deadline + eligibility only */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 8 }}>
        {opp.deadline && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ink-tertiary)" }}>
            <CalendarDays size={12} />
            {daysLabel(opp.deadline)}
          </span>
        )}
        {opp.eligibilityLabel && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: eligColor }}>
            <Check size={12} />
            {opp.eligibilityLabel}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
        {/* Hide — quiet affordance, revealed on hover or keyboard focus */}
        <button
          type="button"
          aria-label={`Hide ${opp.name}`}
          onClick={(e) => { e.stopPropagation(); onHide(opp.id) }}
          onFocus={() => setHideButtonFocused(true)}
          onBlur={() => setHideButtonFocused(false)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "none", border: "none", cursor: "pointer",
            padding: "4px 2px", marginRight: "auto",
            fontSize: 12, color: "var(--ink-tertiary)",
            opacity: hideButtonVisible ? 1 : 0,
            pointerEvents: hideButtonVisible ? "auto" : "none",
            transition: "opacity 120ms, color 120ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-secondary)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)" }}
        >
          <EyeOff size={13} />
          <span>Hide</span>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOppClick(opp.id, e.currentTarget as HTMLElement) }}
          style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--hair-2)", backgroundColor: "transparent", fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", cursor: "pointer", transition: "background-color 120ms" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
        >
          View details
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onTrack(opp.id) }}
          style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid var(--slate-primary)", backgroundColor: "var(--slate-primary)", fontSize: 12, fontWeight: 600, color: "#ffffff", cursor: "pointer", transition: "background-color 120ms, border-color 120ms" }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = "var(--slate-secondary)"; el.style.borderColor = "var(--slate-secondary)" }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = "var(--slate-primary)"; el.style.borderColor = "var(--slate-primary)" }}
        >
          Track
        </button>
      </div>
    </div>
  )
}

// ── Matched funder card (Matches > Funders) ────────────────────────────────

function MatchedFunderCard({ funder, isNew, onFunderClick }: {
  funder: Funder
  isNew?: boolean
  onFunderClick: (funderId: string) => void
}) {
  const tags = funder.focusAreas.slice(0, 3)
  const oppCount = matchedOppCount(funder.id)
  const geoShort = funder.geography === "National (U.S.)" || funder.geography === "National (U.S.) + Canada"
    ? "National"
    : funder.geography

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onFunderClick(funder.id)}
      onKeyDown={(e) => e.key === "Enter" && onFunderClick(funder.id)}
      style={{
        padding: "14px 16px",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--hair)",
        borderRadius: 12,
        cursor: "pointer",
        display: "flex", flexDirection: "column",
        transition: "border-color 150ms, box-shadow 150ms",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = "var(--slate-light)"
        el.style.boxShadow = "var(--shadow-sm)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = "var(--hair)"
        el.style.boxShadow = "none"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <FunderTypeIcon type={funder.type} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {funder.name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {FUNDER_TYPE_LABELS[funder.type]}{funder.location ? ` · ${funder.location}` : ""}
          </p>
        </div>
        {isNew && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--evergreen)", backgroundColor: "var(--evergreen-tint)", borderRadius: 10, padding: "2px 7px", flexShrink: 0, whiteSpace: "nowrap" }}>
            New
          </span>
        )}
      </div>

      {funder.description && (
        <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {funder.description}
        </p>
      )}

      <div style={{ borderTop: "0.5px solid var(--hair)", margin: "0 0 10px" }} />

      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {tags.map(tag => (
            <span key={tag} style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", padding: "2px 8px", borderRadius: 20, backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)" }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 8 }}>
        {funder.fundingRange && (
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-secondary)" }}>{funder.fundingRange}</span>
        )}
        {geoShort && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ink-tertiary)" }}>
            <MapPin size={12} />
            {geoShort}
          </span>
        )}
        {oppCount > 0 && (
          <span style={{ fontSize: 11, color: "var(--slate-secondary)", fontWeight: 500 }}>
            {oppCount} open {oppCount === 1 ? "grant" : "grants"}
          </span>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "auto" }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFunderClick(funder.id) }}
          style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--hair-2)", backgroundColor: "transparent", fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", cursor: "pointer", transition: "background-color 120ms" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
        >
          View funder
        </button>
      </div>
    </div>
  )
}

// ── Explore table layout constants ────────────────────────────────────────

const OPP_GRID_COLS = "220px 200px 80px 100px 130px 1fr auto"
const OPP_COL_GAP = 24
const FUNDER_GRID_COLS = "260px 190px 145px 130px minmax(0,1fr) auto"
const FUNDER_COL_GAP = 12
const OPP_FOCUS_COL_WIDTH = 200
const FUNDER_FOCUS_COL_WIDTH = 190
const EXPLORE_HEADER_LABEL: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "#738498", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }

// Estimates chip pixel width at 11px Inter: ~6px/char + 18px padding/border.
// Collapses chips that won't fit into +N rather than clipping their text.
function FocusChipList({ tags, colWidth }: { tags: string[]; colWidth: number }) {
  const CHAR_PX = 6
  const CHIP_OVERHEAD = 18  // 8px padding × 2 + 2px border
  const GAP = 4
  const est = (t: string) => t.length * CHAR_PX + CHIP_OVERHEAD

  let used = 0
  let visible = 0
  for (let i = 0; i < tags.length; i++) {
    const w = est(tags[i])
    const remaining = tags.length - i - 1
    // Reserve space for overflow badge if there will be hidden chips
    const overflowReserve = remaining > 0 ? GAP + est(`+${remaining}`) : 0
    if (used + (i > 0 ? GAP : 0) + w + overflowReserve <= colWidth) {
      used += (i > 0 ? GAP : 0) + w
      visible++
    } else {
      break
    }
  }

  const overflow = tags.length - visible
  const CHIP_STYLE: React.CSSProperties = {
    fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)",
    padding: "2px 8px", borderRadius: 20,
    backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)",
    whiteSpace: "nowrap", flexShrink: 0,
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: GAP }}>
      {tags.slice(0, visible).map(tag => (
        <span key={tag} style={CHIP_STYLE}>{tag}</span>
      ))}
      {overflow > 0 && (
        <span style={CHIP_STYLE}>+{overflow}</span>
      )}
    </div>
  )
}

// ── Explore opportunity row (Explore > Opportunities) ──────────────────────

function ExploreOpportunityRow({ opp, isFirst: _isFirst, onOppClick, onTrack, onHide }: {
  opp: Opportunity
  isFirst: boolean
  onOppClick: (oppId: string, el: HTMLElement) => void
  onTrack: (oppId: string) => void
  onHide: (oppId: string) => void
}) {
  const [rowHovered, setRowHovered] = useState(false)
  const [hideButtonFocused, setHideButtonFocused] = useState(false)
  const hideButtonVisible = rowHovered || hideButtonFocused
  const funder = getFunder(opp.funderId)
  const focusTags = opp.focusAreas ?? []

  const eligBg = opp.eligibilityLabel === "Likely eligible"
    ? "var(--evergreen-tint)"
    : "var(--amber-light)"
  const eligColor = opp.eligibilityLabel === "Likely eligible"
    ? "var(--evergreen)"
    : "var(--amber)"

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => onOppClick(opp.id, e.currentTarget)}
      onKeyDown={(e) => e.key === "Enter" && onOppClick(opp.id, e.currentTarget as HTMLElement)}
      style={{
        display: "grid",
        gridTemplateColumns: OPP_GRID_COLS,
        columnGap: OPP_COL_GAP,
        alignItems: "center",
        padding: "11px 16px",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--hair)",
        borderRadius: 10,
        marginBottom: 6,
        cursor: "pointer",
        transition: "border-color 120ms, box-shadow 120ms",
      }}
      onMouseEnter={(e) => {
        setRowHovered(true)
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = "var(--hair-2)"
        el.style.boxShadow = "var(--lift-1)"
      }}
      onMouseLeave={(e) => {
        setRowHovered(false)
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = "var(--hair)"
        el.style.boxShadow = "none"
      }}
    >
      {/* Col 1: Opportunity name + funder */}
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {opp.name}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {funder?.name}{funder ? ` · ${FUNDER_TYPE_LABELS[funder.type]}` : ""}
        </p>
      </div>

      {/* Col 2: Focus area chips */}
      <FocusChipList tags={focusTags} colWidth={OPP_FOCUS_COL_WIDTH} />

      {/* Col 3: Award size */}
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {opp.amount ?? ""}
      </span>

      {/* Col 4: Deadline + countdown */}
      <span style={{ fontSize: 12, color: "var(--ink-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {opp.deadline ? daysLabel(opp.deadline) : ""}
      </span>

      {/* Col 5: Eligibility chip */}
      {opp.eligibilityLabel ? (
        <span style={{ fontSize: 11, fontWeight: 500, color: eligColor, padding: "3px 9px", borderRadius: 20, backgroundColor: eligBg, whiteSpace: "nowrap", justifySelf: "start" }}>
          {opp.eligibilityLabel}
        </span>
      ) : <span />}

      {/* Col 6: Spacer (1fr) */}
      <span />

      {/* Col 7: Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          aria-label={`Hide ${opp.name}`}
          onClick={(e) => { e.stopPropagation(); onHide(opp.id) }}
          onFocus={() => setHideButtonFocused(true)}
          onBlur={() => setHideButtonFocused(false)}
          style={{
            display: "flex", alignItems: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer",
            padding: "2px 4px",
            fontSize: 11, color: "var(--ink-tertiary)",
            opacity: hideButtonVisible ? 1 : 0,
            pointerEvents: hideButtonVisible ? "auto" : "none",
            transition: "opacity 120ms, color 120ms",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-secondary)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)" }}
        >
          <EyeOff size={12} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onTrack(opp.id) }}
          style={{ padding: "5px 14px", borderRadius: 6, border: "none", backgroundColor: "var(--slate-primary)", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap", transition: "background-color 120ms" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-secondary)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
        >
          Track
        </button>
      </div>
    </div>
  )
}

// ── Explore funder row (Explore > Funders) ─────────────────────────────────

function ExploreFunderRow({ funder, isFirst: _isFirst, onFunderClick, trackedFunderIds, onTrackFunder }: {
  funder: Funder
  isFirst: boolean
  onFunderClick: (funderId: string) => void
  trackedFunderIds: Set<string>
  onTrackFunder: (funderId: string) => void
}) {
  const isFunderTracked = trackedFunderIds.has(funder.id)
  const oppCount = matchedOppCount(funder.id)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onFunderClick(funder.id)}
      onKeyDown={(e) => e.key === "Enter" && onFunderClick(funder.id)}
      style={{
        display: "grid",
        gridTemplateColumns: FUNDER_GRID_COLS,
        columnGap: FUNDER_COL_GAP,
        alignItems: "center",
        padding: "11px 16px",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--hair)",
        borderRadius: 10,
        marginBottom: 6,
        cursor: "pointer",
        transition: "border-color 120ms, box-shadow 120ms",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = "var(--hair-2)"
        el.style.boxShadow = "var(--lift-1)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = "var(--hair)"
        el.style.boxShadow = "none"
      }}
    >
      {/* Col 1: Funder name + type/location */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <FunderTypeIcon type={funder.type} />
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {funder.name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {FUNDER_TYPE_LABELS[funder.type]}{funder.location ? ` · ${funder.location}` : ""}
          </p>
        </div>
      </div>

      {/* Col 2: Focus area chips */}
      <FocusChipList tags={funder.focusAreas} colWidth={FUNDER_FOCUS_COL_WIDTH} />

      {/* Col 3: Median award size (no "Median" prefix — header carries it) */}
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {funder.fundingRange ?? ""}
      </span>

      {/* Col 4: Matched opportunities count badge */}
      {oppCount > 0 ? (
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          minWidth: 17, height: 17, padding: "0 5px",
          borderRadius: 9999,
          backgroundColor: "#e0ede6", color: "#3c5e4c",
          fontSize: 10, fontWeight: 600,
          justifySelf: "start",
        }}>
          {oppCount}
        </span>
      ) : <span />}

      {/* Col 5: Spacer (1fr) */}
      <span />

      {/* Col 6: Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (!isFunderTracked) onTrackFunder(funder.id) }}
          style={{
            padding: "5px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: isFunderTracked ? "default" : "pointer", whiteSpace: "nowrap",
            transition: "background-color 120ms, color 120ms",
            border: "1px solid var(--hair-2)",
            backgroundColor: isFunderTracked ? "var(--canvas)" : "transparent",
            color: isFunderTracked ? "var(--ink-tertiary)" : "var(--ink-secondary)",
          }}
          onMouseEnter={(e) => { if (!isFunderTracked) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)" } }}
          onMouseLeave={(e) => { if (!isFunderTracked) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-secondary)" } }}
        >
          {isFunderTracked ? "Watching" : "Track funder"}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFunderClick(funder.id) }}
          style={{ padding: "5px 14px", borderRadius: 6, border: "none", backgroundColor: "var(--slate-primary)", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", whiteSpace: "nowrap", transition: "background-color 120ms" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-secondary)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
        >
          View funder
        </button>
      </div>
    </div>
  )
}

// ── Filter select ──────────────────────────────────────────────────────────

function FilterSelect({ value, onChange, children, minWidth }: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  minWidth?: number
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "7px 30px 7px 10px",
        borderRadius: "var(--radius-input)",
        border: "1px solid var(--hair-2)",
        backgroundColor: "var(--surface)",
        fontSize: 12,
        color: value ? "var(--ink)" : "var(--ink-secondary)",
        outline: "none",
        cursor: "pointer",
        minWidth: minWidth ?? 0,
        appearance: "none",
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0.5 0.5L5 5.5L9.5 0.5' stroke='%23909AA4' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
    >
      {children}
    </select>
  )
}

// ── Multi-select filter dropdown ───────────────────────────────────────────

function MultiSelectFilter({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [open])

  const count = selected.length
  const isActive = count > 0

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "7px 10px",
          borderRadius: "var(--radius-input)",
          border: isActive ? "1px solid rgba(74,96,128,0.4)" : "1px solid var(--hair-2)",
          backgroundColor: isActive ? "var(--slate-tint)" : "var(--surface)",
          fontSize: 12,
          fontWeight: isActive ? 600 : 400,
          color: isActive ? "var(--slate-secondary)" : "var(--ink-secondary)",
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "background-color 120ms",
        }}
      >
        {label}
        {isActive ? (
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            minWidth: 16, height: 16, padding: "0 3px",
            borderRadius: 8,
            backgroundColor: "var(--slate-secondary)",
            color: "#fff",
            fontSize: 10, fontWeight: 700,
          }}>
            {count}
          </span>
        ) : (
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}>
            <path d="M0.5 0.5L5 5.5L9.5 0.5" stroke="#909AA4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
          backgroundColor: "var(--surface)",
          border: "1px solid var(--hair-2)",
          borderRadius: "var(--radius-input)",
          boxShadow: "0 4px 16px rgba(28,24,64,0.12)",
          minWidth: 200,
          padding: "4px 0",
          maxHeight: 280,
          overflowY: "auto",
        }}>
          {options.map(opt => {
            const checked = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onToggle(opt.value)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "7px 12px",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 13,
                  color: checked ? "var(--slate-secondary)" : "var(--ink)",
                  fontWeight: checked ? 600 : 400,
                  textAlign: "left",
                  transition: "background-color 80ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "" }}
              >
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 16, height: 16, flexShrink: 0,
                  borderRadius: 3,
                  border: checked ? "1.5px solid var(--slate-secondary)" : "1.5px solid var(--hair-2)",
                  backgroundColor: checked ? "var(--slate-tint)" : "transparent",
                  transition: "background-color 80ms, border-color 80ms",
                }}>
                  {checked && <Check size={11} style={{ color: "var(--slate-secondary)" }} />}
                </span>
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Undo toast ─────────────────────────────────────────────────────────────

function UndoToast({ oppName, onUndo, onDismiss }: {
  oppName: string
  onUndo: () => void
  onDismiss: () => void
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "fixed", bottom: 24, left: "50%",
        transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px",
        backgroundColor: "var(--ink)",
        borderRadius: 10,
        boxShadow: "0 4px 20px rgba(28,24,64,0.22)",
        zIndex: 200,
        whiteSpace: "nowrap",
      }}
    >
      <EyeOff size={14} style={{ color: "rgba(255,255,255,0.55)", flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: "#fff" }}>Opportunity hidden</span>
      <button
        type="button"
        onClick={onUndo}
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 13, fontWeight: 600,
          color: "var(--slate-tint)",
          padding: "0 2px",
          transition: "color 120ms",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fff" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--slate-tint)" }}
      >
        Undo
      </button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,0.45)", padding: "0 2px",
          display: "flex", alignItems: "center",
          transition: "color 120ms",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.80)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)" }}
      >
        <X size={13} />
      </button>
    </div>
  )
}

// ── Discover page (inner) ──────────────────────────────────────────────────

function DiscoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { scopeLabel, selectedProjectId } = useScope()

  const {
    primaryTab, setPrimaryTab,
    objectType, setObjectType,
    query, setQuery,
    typeFilters, toggleTypeFilter,
    focusAreaFilters, toggleFocusAreaFilter,
    geographyFilters, toggleGeographyFilter,
    awardRangeFilter, setAwardRangeFilter,
    deadlineFilter, setDeadlineFilter,
    sortBy, setSortBy,
    clearFilters, hasActiveFilters,
  } = useDiscoverFilters()

  const [hiddenOppIds, setHiddenOppIds] = useState<Set<string>>(new Set())
  const [hideDialogOpp, setHideDialogOpp] = useState<typeof OPPORTUNITIES[number] | null>(null)
  const [toast, setToast] = useState<{ oppId: string; oppName: string } | null>(null)
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const lastFocusedRef = useRef<HTMLElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const browseToolbarSentinelRef = useRef<HTMLDivElement>(null)
  const [browseToolbarStuck, setBrowseToolbarStuck] = useState(false)

  const selectedOppId = searchParams.get("opp")
  const selectedFunderId = searchParams.get("funder")
  const panelOpen = !!(selectedOppId || selectedFunderId)

  const prevPanelRef = useRef<boolean>(false)
  useEffect(() => {
    if (prevPanelRef.current && !panelOpen) lastFocusedRef.current?.focus()
    prevPanelRef.current = panelOpen
  }, [panelOpen])

  useEffect(() => {
    const sentinel = browseToolbarSentinelRef.current
    const root = scrollContainerRef.current
    if (!sentinel || !root) return
    const observer = new IntersectionObserver(
      ([entry]) => setBrowseToolbarStuck(!entry.isIntersecting),
      { root, threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [primaryTab, objectType])

  const handleOppClick = useCallback((oppId: string, el: HTMLElement) => {
    lastFocusedRef.current = el
    router.push(`/discover?opp=${oppId}`)
  }, [router])

  const handleClose = useCallback(() => {
    router.push("/discover")
  }, [router])

  const handleFunderClick = useCallback((funderId: string) => {
    router.push(`/discover?funder=${funderId}`)
  }, [router])

  const [trackedOppIds, setTrackedOppIds] = useState<Set<string>>(() => new Set())
  const [trackedFunderIds, setTrackedFunderIds] = useState<Set<string>>(() => new Set())

  const handleTrack = useCallback((oppId: string) => {
    createPipelineOpportunity(oppId, selectedProjectId ?? "proj-general")
    setTrackedOppIds(prev => new Set([...prev, oppId]))
  }, [selectedProjectId])

  const handleTrackFunder = useCallback((funderId: string) => {
    trackFunder(funderId)
    setTrackedFunderIds(prev => new Set([...prev, funderId]))
  }, [])

  const handleHideClick = useCallback((oppId: string) => {
    const opp = OPPORTUNITIES.find(o => o.id === oppId) ?? null
    setHideDialogOpp(opp)
  }, [])

  const handleHideConfirm = useCallback((payload: HidePayload) => {
    setHiddenOppIds(prev => { const next = new Set(prev); next.add(payload.opportunityId); return next })
    setHideDialogOpp(null)

    const opp = OPPORTUNITIES.find(o => o.id === payload.opportunityId)
    if (opp) {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
      setToast({ oppId: payload.opportunityId, oppName: opp.name })
      toastTimeoutRef.current = setTimeout(() => setToast(null), 6000)
    }

    recordHideOpportunity(payload)
  }, [])

  const handleHideUndo = useCallback(() => {
    if (!toast) return
    const { oppId } = toast
    setHiddenOppIds(prev => { const next = new Set(prev); next.delete(oppId); return next })
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast(null)
    undoHideOpportunity(oppId)
  }, [toast])

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast(null)
  }, [])

  const handleRestoreAll = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setHiddenOppIds(new Set())
    setToast(null)
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Filtered + sorted opportunities
  const filtered: Opportunity[] = OPPORTUNITIES.filter((opp) => {
    const funder = getFunder(opp.funderId)
    if (!funder) return false
    if (typeFilters.length > 0 && !typeFilters.includes(funder.type)) return false
    if (focusAreaFilters.length > 0) {
      const inFunder = funder.focusAreas.some(fa => focusAreaFilters.includes(fa))
      const inOpp = (opp.focusAreas ?? []).some(fa => focusAreaFilters.includes(fa))
      if (!inFunder && !inOpp) return false
    }
    if (geographyFilters.length > 0 && !geographyFilters.includes(funder.geography)) return false
    if (awardRangeFilter) {
      const amt = parseAmount(opp.amount)
      if (amt === null) return false
      if (awardRangeFilter === "under-25k" && amt >= 25000) return false
      if (awardRangeFilter === "25k-50k" && (amt < 25000 || amt > 50000)) return false
      if (awardRangeFilter === "over-50k" && amt <= 50000) return false
    }
    if (deadlineFilter) {
      const days = parseInt(deadlineFilter)
      const deadline = parseDeadlineDate(opp.deadline ?? "")
      if (!deadline) return false
      deadline.setHours(0, 0, 0, 0)
      const msPerDay = 1000 * 60 * 60 * 24
      const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / msPerDay)
      if (daysUntil < 0 || daysUntil > days) return false
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      const searchable = [
        opp.name, funder.name, funder.description ?? "", opp.description ?? "",
        ...(opp.focusAreas ?? []), ...funder.focusAreas, opp.eligibility ?? "",
      ].join(" ").toLowerCase()
      if (!searchable.includes(q)) return false
    }
    return true
  })

  const visibleOpps = filtered.filter(opp => !hiddenOppIds.has(opp.id) && !getPipelineForOpportunity(opp.id) && !trackedOppIds.has(opp.id))
  const sortedOpps = [...visibleOpps].sort((a, b) => {
    if (sortBy === "deadline") {
      const da = parseDeadlineDate(a.deadline ?? "")
      const db = parseDeadlineDate(b.deadline ?? "")
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      return da.getTime() - db.getTime()
    }
    if (sortBy === "award") {
      return (parseAmount(b.amount) ?? -1) - (parseAmount(a.amount) ?? -1)
    }
    const sa = getMatchForOpportunity(a.id)?.matchScore ?? 0
    const sb = getMatchForOpportunity(b.id)?.matchScore ?? 0
    return sb - sa
  })

  // Filtered + sorted funders
  const filteredFunders = FUNDERS.filter((funder) => {
    if (focusAreaFilters.length > 0 && !funder.focusAreas.some(fa => focusAreaFilters.includes(fa))) return false
    if (geographyFilters.length > 0 && !geographyFilters.includes(funder.geography)) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      const searchable = [funder.name, funder.description ?? "", ...funder.focusAreas, funder.geography].join(" ").toLowerCase()
      if (!searchable.includes(q)) return false
    }
    return true
  })

  const sortedFunders = [...filteredFunders].sort((a, b) => {
    const ma = MATCHES.find(m => m.funderId === a.id)?.matchScore ?? 0
    const mb = MATCHES.find(m => m.funderId === b.id)?.matchScore ?? 0
    return mb - ma
  })

  const filteredMatchedOpps = STRONG_MATCHES.filter(({ opp }) => {
    const funder = getFunder(opp.funderId)
    if (!funder) return false
    if (typeFilters.length > 0 && !typeFilters.includes(funder.type)) return false
    if (focusAreaFilters.length > 0) {
      const inFunder = funder.focusAreas.some(fa => focusAreaFilters.includes(fa))
      const inOpp = (opp.focusAreas ?? []).some(fa => focusAreaFilters.includes(fa))
      if (!inFunder && !inOpp) return false
    }
    if (geographyFilters.length > 0 && !geographyFilters.includes(funder.geography)) return false
    if (awardRangeFilter) {
      const amt = parseAmount(opp.amount)
      if (amt === null) return false
      if (awardRangeFilter === "under-25k" && amt >= 25000) return false
      if (awardRangeFilter === "25k-50k" && (amt < 25000 || amt > 50000)) return false
      if (awardRangeFilter === "over-50k" && amt <= 50000) return false
    }
    if (deadlineFilter) {
      const days = parseInt(deadlineFilter)
      const deadline = parseDeadlineDate(opp.deadline ?? "")
      if (!deadline) return false
      deadline.setHours(0, 0, 0, 0)
      const msPerDay = 1000 * 60 * 60 * 24
      const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / msPerDay)
      if (daysUntil < 0 || daysUntil > days) return false
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      const searchable = [
        opp.name, funder.name, funder.description ?? "", opp.description ?? "",
        ...(opp.focusAreas ?? []), ...funder.focusAreas, opp.eligibility ?? "",
      ].join(" ").toLowerCase()
      if (!searchable.includes(q)) return false
    }
    return true
  })

  const visibleMatchedOpps = filteredMatchedOpps.filter(({ opp }) => !hiddenOppIds.has(opp.id) && !getPipelineForOpportunity(opp.id) && !trackedOppIds.has(opp.id))
  const sortedMatchedOpps = [...visibleMatchedOpps].sort((a, b) => {
    if (sortBy === "deadline") {
      const da = parseDeadlineDate(a.opp.deadline ?? "")
      const db = parseDeadlineDate(b.opp.deadline ?? "")
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      return da.getTime() - db.getTime()
    }
    if (sortBy === "award") {
      return (parseAmount(b.opp.amount) ?? -1) - (parseAmount(a.opp.amount) ?? -1)
    }
    return b.match.matchScore - a.match.matchScore
  })

  const filteredMatchedFunders = MATCHED_FUNDERS.filter(({ funder }) => {
    if (focusAreaFilters.length > 0 && !funder.focusAreas.some(fa => focusAreaFilters.includes(fa))) return false
    if (geographyFilters.length > 0 && !geographyFilters.includes(funder.geography)) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      const searchable = [funder.name, funder.description ?? "", ...funder.focusAreas, funder.geography].join(" ").toLowerCase()
      if (!searchable.includes(q)) return false
    }
    return true
  })

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...typeFilters.map(t => ({ key: `type-${t}`, label: `Funder type: ${FUNDER_TYPE_LABELS[t]}`, onRemove: () => toggleTypeFilter(t) })),
    ...focusAreaFilters.map(fa => ({ key: `focus-${fa}`, label: `Focus area: ${fa}`, onRemove: () => toggleFocusAreaFilter(fa) })),
    ...geographyFilters.map(g => ({ key: `geo-${g}`, label: `Geography: ${g}`, onRemove: () => toggleGeographyFilter(g) })),
    awardRangeFilter ? { key: "award", label: `Award: ${AWARD_RANGE_LABELS[awardRangeFilter]}`, onRemove: () => setAwardRangeFilter("") } : null,
    deadlineFilter ? { key: "deadline", label: DEADLINE_LABELS[deadlineFilter], onRemove: () => setDeadlineFilter("") } : null,
  ].filter((c): c is NonNullable<typeof c> => c !== null)

  const segmentOppCount = primaryTab === "matches" ? sortedMatchedOpps.length : sortedOpps.length
  const segmentFunderCount = primaryTab === "matches" ? filteredMatchedFunders.length : sortedFunders.length
  const newCount = new Set([
    ...sortedMatchedOpps.filter(({ match }) => match.isNew).map(({ match }) => match.id),
    ...filteredMatchedFunders.filter(({ match }) => match.isNew).map(({ match }) => match.id),
  ]).size

  return (
    <div style={{ height: "100%", position: "relative", overflow: "hidden", backgroundColor: "var(--canvas)" }}>

      <div ref={scrollContainerRef} style={{ height: "100%", overflowY: "auto" }}>
        <ContentContainer style={{ padding: "36px 40px 80px" }}>

          <IncompleteProfileBanner />

          {/* Page header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
            <div>
              <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
                Discover
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>
                Funding opportunities for {scopeLabel}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginTop: 4 }}>
              <ProgramPickerPill
                activeProjectId={selectedProjectId ?? "proj-general"}
                newCount={newCount}
              />
              {hiddenOppIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleRestoreAll}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 8,
                    border: "1px solid var(--hair-2)", backgroundColor: "var(--surface)",
                    fontSize: 12, color: "var(--ink-secondary)", cursor: "pointer",
                    transition: "background-color 120ms, color 120ms",
                  }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = "var(--canvas)"; el.style.color = "var(--ink)" }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = "var(--surface)"; el.style.color = "var(--ink-secondary)" }}
                >
                  <EyeOff size={13} style={{ color: "var(--ink-tertiary)" }} />
                  {hiddenOppIds.size} hidden · Restore
                </button>
              )}
            </div>
          </div>

          {/* Single control band */}
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--hair)", marginBottom: 24 }}>

            {/* Left: primary underlined tabs */}
            <div style={{ display: "flex", gap: 24, flex: 1 }}>
              {(["matches", "explore"] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPrimaryTab(tab)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "none", border: "none", cursor: "pointer",
                    padding: "0 0 10px",
                    fontSize: 14,
                    fontWeight: primaryTab === tab ? 600 : 400,
                    color: primaryTab === tab ? "var(--slate-primary)" : "var(--ink-tertiary)",
                    borderBottom: primaryTab === tab ? "2px solid var(--slate-primary)" : "2px solid transparent",
                    marginBottom: -1,
                    transition: "color 120ms",
                  }}
                >
                  {tab === "matches" ? (
                    <>
                      Matches
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, backgroundColor: "#f0f3f6", borderRadius: 10, padding: "1px 6px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#3c5e4c", lineHeight: 1 }}>{newCount} New</span>
                        <span style={{ fontSize: 10, color: "#b7c0ca", lineHeight: 1 }}>|</span>
                        <span style={{ fontSize: 11, fontWeight: 400, color: "#738498", lineHeight: 1 }}>{sortedMatchedOpps.length + filteredMatchedFunders.length} Total</span>
                      </span>
                    </>
                  ) : "Explore"}
                </button>
              ))}
            </div>

            {/* Right: segmented control */}
            <div style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(28,24,64,0.06)",
              borderRadius: 8,
              padding: 3,
              gap: 1,
              marginBottom: 10,
            }}>
              {(["opportunities", "funders"] as const).map(type => {
                const isActive = objectType === type
                const count = type === "opportunities" ? segmentOppCount : segmentFunderCount
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setObjectType(type)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: isActive ? "white" : "transparent",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      padding: "4px 12px",
                      fontSize: 12,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--slate-primary)" : "var(--ink-tertiary)",
                      boxShadow: isActive ? "0 1px 3px rgba(28,24,64,0.10), 0 0 0 0.5px rgba(28,24,64,0.08)" : "none",
                      transition: "background 120ms, color 120ms, box-shadow 120ms",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {type === "opportunities" ? "Opportunities" : "Funders"}
                    {count !== null && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        minWidth: 17, height: 17, padding: "0 4px", borderRadius: 10,
                        fontSize: 10, fontWeight: 700,
                        backgroundColor: "var(--evergreen-tint)", color: "var(--evergreen)",
                      }}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Shared search + filter toolbar */}
          <div ref={browseToolbarSentinelRef} aria-hidden="true" style={{ height: 1, marginBottom: -1 }} />

          <div style={{
            position: "sticky", top: 0, zIndex: 10,
            backgroundColor: "var(--canvas)",
            marginLeft: -40, marginRight: -40,
            paddingLeft: 40, paddingRight: 40,
            paddingTop: 8, paddingBottom: browseToolbarStuck ? 10 : 8,
            transition: "box-shadow 150ms",
            boxShadow: browseToolbarStuck ? "0 1px 0 var(--hair), 0 2px 12px rgba(28,24,64,0.06)" : "none",
          }}>
            {/* Search + Sort */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "var(--radius-input)", border: "1px solid var(--hair-2)", backgroundColor: "var(--surface)" }}>
                <Search size={13} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={objectType === "opportunities" ? "Search opportunities" : "Search funders"}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: "var(--ink)", lineHeight: "17px" }}
                />
                {query && (
                  <button type="button" onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--ink-tertiary)", padding: 0 }}>
                    <X size={12} />
                  </button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>Sort</span>
                <FilterSelect value={sortBy} onChange={(v) => setSortBy(v as "match" | "deadline" | "award")}>
                  <option value="match">Best fit</option>
                  {objectType === "opportunities" && (
                    <>
                      <option value="deadline">Soonest deadline</option>
                      <option value="award">Largest award</option>
                    </>
                  )}
                </FilterSelect>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: activeChips.length > 0 ? 8 : 0 }}>
              {objectType === "opportunities" && (
                <MultiSelectFilter
                  label="Funder type"
                  options={(Object.keys(FUNDER_TYPE_LABELS) as FunderType[]).map(t => ({ value: t, label: FUNDER_TYPE_LABELS[t] }))}
                  selected={typeFilters}
                  onToggle={toggleTypeFilter as (v: string) => void}
                />
              )}

              <MultiSelectFilter
                label="Focus area"
                options={ALL_FOCUS_AREAS.map(fa => ({ value: fa, label: fa }))}
                selected={focusAreaFilters}
                onToggle={toggleFocusAreaFilter}
              />

              <MultiSelectFilter
                label="Geography"
                options={ALL_GEOGRAPHIES.map(g => ({ value: g, label: g }))}
                selected={geographyFilters}
                onToggle={toggleGeographyFilter}
              />

              {objectType === "opportunities" && (
                <>
                  <FilterSelect value={awardRangeFilter} onChange={setAwardRangeFilter}>
                    <option value="">Award size</option>
                    <option value="under-25k">Up to $25k</option>
                    <option value="25k-50k">$25k to $50k</option>
                    <option value="over-50k">Over $50k</option>
                  </FilterSelect>

                  <FilterSelect value={deadlineFilter} onChange={setDeadlineFilter}>
                    <option value="">Deadline</option>
                    <option value="30">Within 30 days</option>
                    <option value="60">Within 60 days</option>
                    <option value="90">Within 90 days</option>
                  </FilterSelect>
                </>
              )}
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {activeChips.map(chip => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.onRemove}
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 8px 4px 10px", borderRadius: 20, backgroundColor: "var(--slate-tint)", border: "1px solid var(--hair-2)", fontSize: 12, color: "var(--slate-secondary)", cursor: "pointer", transition: "background-color 120ms" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--hair-2)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
                  >
                    {chip.label}
                    <X size={11} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
                  </button>
                ))}
                {activeChips.length > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 6px", fontSize: 12, color: "var(--ink-tertiary)", transition: "color 120ms" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--slate-secondary)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)" }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Matches > Opportunities */}
          {primaryTab === "matches" && objectType === "opportunities" && (
            <section style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                  Matched opportunities
                </h2>
                <span style={{ fontSize: 14, color: "var(--hair-2)" }}>·</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-tertiary)" }}>{sortedMatchedOpps.length}</span>
              </div>

              {sortedMatchedOpps.length === 0 ? (
                <div style={{ padding: "36px 0", textAlign: "center" }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--ink-tertiary)" }}>
                    {(hasActiveFilters || query.trim()) ? "No matches fit these criteria." : "No matches yet."}
                  </p>
                  {(hasActiveFilters || query.trim()) && (
                    <button type="button" onClick={() => { clearFilters(); setQuery("") }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--slate-secondary)", textDecoration: "underline", padding: 0 }}>
                      Clear search and filters
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
                  {sortedMatchedOpps.map(({ opp }) => (
                    <CatalogueCard key={opp.id} opp={opp} onOppClick={handleOppClick} onTrack={handleTrack} onHide={handleHideClick} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Matches > Funders */}
          {primaryTab === "matches" && objectType === "funders" && (
            <section style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                  Matched funders
                </h2>
                <span style={{ fontSize: 14, color: "var(--hair-2)" }}>·</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-tertiary)" }}>{filteredMatchedFunders.length}</span>
              </div>

              {filteredMatchedFunders.length === 0 ? (
                <div style={{ padding: "36px 0", textAlign: "center" }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--ink-tertiary)" }}>
                    {(hasActiveFilters || query.trim()) ? "No matched funders fit these criteria." : "No matched funders yet."}
                  </p>
                  {(hasActiveFilters || query.trim()) && (
                    <button type="button" onClick={() => { clearFilters(); setQuery("") }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--slate-secondary)", textDecoration: "underline", padding: 0 }}>
                      Clear search and filters
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
                  {filteredMatchedFunders.map(({ funder, match }) => (
                    <MatchedFunderCard key={funder.id} funder={funder} isNew={match.isNew} onFunderClick={handleFunderClick} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Explore > Opportunities */}
          {primaryTab === "explore" && objectType === "opportunities" && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                  All opportunities
                </h2>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-tertiary)" }}>{sortedOpps.length}</span>
              </div>
              {sortedOpps.length > 0 ? (
                <>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: OPP_GRID_COLS,
                    columnGap: OPP_COL_GAP,
                    padding: "0 16px 8px",
                    borderBottom: "1px solid rgba(42,42,42,0.06)",
                    marginBottom: 6,
                  }}>
                    <span style={EXPLORE_HEADER_LABEL}>Opportunity name</span>
                    <span style={EXPLORE_HEADER_LABEL}>Focus area</span>
                    <span style={EXPLORE_HEADER_LABEL}>Award size</span>
                    <span style={EXPLORE_HEADER_LABEL}>Deadline</span>
                    <span style={EXPLORE_HEADER_LABEL}>Eligibility</span>
                    <span />
                    <span />
                  </div>
                  <div>
                    {sortedOpps.map((opp, i) => (
                      <ExploreOpportunityRow
                        key={opp.id}
                        opp={opp}
                        isFirst={i === 0}
                        onOppClick={handleOppClick}
                        onTrack={handleTrack}
                        onHide={handleHideClick}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ padding: "56px 0", textAlign: "center" }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--ink-tertiary)" }}>No results match these filters.</p>
                  {hasActiveFilters && (
                    <button type="button" onClick={clearFilters} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--slate-secondary)", textDecoration: "underline", padding: 0 }}>
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Explore > Funders */}
          {primaryTab === "explore" && objectType === "funders" && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                  All funders
                </h2>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-tertiary)" }}>{sortedFunders.length}</span>
              </div>
              {sortedFunders.length > 0 ? (
                <>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: FUNDER_GRID_COLS,
                    columnGap: FUNDER_COL_GAP,
                    padding: "0 16px 8px",
                    borderBottom: "1px solid rgba(42,42,42,0.06)",
                    marginBottom: 6,
                  }}>
                    <span style={EXPLORE_HEADER_LABEL}>Funder name</span>
                    <span style={EXPLORE_HEADER_LABEL}>Focus area</span>
                    <span style={EXPLORE_HEADER_LABEL}>Median award size</span>
                    <span style={EXPLORE_HEADER_LABEL}>Matched opportunities</span>
                    <span />
                    <span />
                  </div>
                  <div>
                    {sortedFunders.map((funder, i) => (
                      <ExploreFunderRow
                        key={funder.id}
                        funder={funder}
                        isFirst={i === 0}
                        onFunderClick={handleFunderClick}
                        trackedFunderIds={trackedFunderIds}
                        onTrackFunder={handleTrackFunder}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ padding: "56px 0", textAlign: "center" }}>
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--ink-tertiary)" }}>No funders match these filters.</p>
                  {hasActiveFilters && (
                    <button type="button" onClick={clearFilters} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--slate-secondary)", textDecoration: "underline", padding: 0 }}>
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </ContentContainer>
      </div>

      {selectedOppId && (
        <OpportunityPeekPanel
          key={selectedOppId}
          oppId={selectedOppId}
          onClose={handleClose}
          onHide={handleHideClick}
        />
      )}
      {selectedFunderId && !selectedOppId && (
        <OpportunityPeekPanel
          key={`funder-${selectedFunderId}`}
          funderId={selectedFunderId}
          onClose={handleClose}
        />
      )}

      <HideOpportunityDialog
        opp={hideDialogOpp}
        onConfirm={handleHideConfirm}
        onCancel={() => setHideDialogOpp(null)}
        onAddToPipeline={handleTrack}
      />

      {toast && (
        <UndoToast
          oppName={toast.oppName}
          onUndo={handleHideUndo}
          onDismiss={dismissToast}
        />
      )}
    </div>
  )
}

// ── Page export (Suspense required for useSearchParams) ────────────────────

export default function DiscoverPageWrapper() {
  return (
    <Suspense>
      <DiscoverPage />
    </Suspense>
  )
}
