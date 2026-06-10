"use client"

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X, Check, ArrowRight } from "lucide-react"
import {
  OPPORTUNITIES, MATCHES, FUNDERS,
  getFunder, getMatchForOpportunity,
} from "@/lib/mock-data"
import { useScope } from "@/lib/scope-context"
import type { Opportunity, Funder, FunderType, MatchStrength, Match } from "@/lib/types"
import { OpportunityPeekPanel } from "./OpportunityPeekPanel"
import { FunderPeekPanel } from "./FunderPeekPanel"

// ── Constants ──────────────────────────────────────────────────────────────

const FUNDER_TYPE_LABELS: Record<FunderType, string> = {
  private_foundation:   "Private foundation",
  community_foundation: "Community foundation",
  government:           "Government",
  corporate_foundation: "Corporate foundation",
  public_charity:       "Public charity",
}

const MATCH_CONFIG: Record<MatchStrength, { label: string; color: string; bg: string; dots: number }> = {
  strong:  { label: "Strong match",  color: "var(--evergreen)",     bg: "var(--evergreen-tint)",  dots: 5 },
  good:    { label: "Good match",    color: "var(--slate-primary)", bg: "var(--slate-tint)",      dots: 4 },
  partial: { label: "Partial match", color: "var(--ink-tertiary)",  bg: "var(--canvas)",          dots: 3 },
}

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

// ── Dismiss reasons ────────────────────────────────────────────────────────

type DismissReason = "off_geography" | "wrong_size" | "not_eligible" | "not_relevant"

const DISMISS_REASONS: { value: DismissReason; label: string }[] = [
  { value: "off_geography", label: "Off geography" },
  { value: "wrong_size",    label: "Wrong size"    },
  { value: "not_eligible",  label: "Not eligible"  },
  { value: "not_relevant",  label: "Not relevant"  },
]

// ── Match dots ─────────────────────────────────────────────────────────────

function MatchDots({ strength }: { strength: MatchStrength }) {
  const cfg = MATCH_CONFIG[strength]
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 6, height: 6, borderRadius: "50%",
            backgroundColor: i < cfg.dots ? cfg.color : "var(--hair-2)",
          }}
        />
      ))}
    </span>
  )
}

// ── Lens toggle ────────────────────────────────────────────────────────────

function LensToggle({ value, onChange }: {
  value: "opportunities" | "funders"
  onChange: (v: "opportunities" | "funders") => void
}) {
  return (
    <div style={{
      display: "inline-flex", borderRadius: 8,
      border: "1px solid var(--hair-2)", backgroundColor: "var(--surface)",
      padding: 3,
    }}>
      {(["opportunities", "funders"] as const).map(l => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          style={{
            padding: "5px 16px", borderRadius: 6, border: "none",
            fontSize: 13, fontWeight: value === l ? 600 : 400,
            color: value === l ? "var(--ink)" : "var(--ink-tertiary)",
            backgroundColor: value === l ? "var(--canvas)" : "transparent",
            cursor: "pointer", transition: "all 120ms",
          }}
        >
          {l === "opportunities" ? "Opportunities" : "Funders"}
        </button>
      ))}
    </div>
  )
}

// ── Skeleton card ──────────────────────────────────────────────────────────

function SkeletonMatchCard() {
  return (
    <div style={{
      padding: "16px 20px",
      backgroundColor: "var(--surface)",
      border: "1px solid var(--hair)",
      borderRadius: 12,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="animate-pulse" style={{ width: 90, height: 20, borderRadius: 10, backgroundColor: "var(--hair-2)" }} />
        <div className="animate-pulse" style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: "var(--hair-2)" }} />
      </div>
      <div className="animate-pulse" style={{ width: "70%", height: 16, borderRadius: 4, backgroundColor: "var(--hair-2)" }} />
      <div className="animate-pulse" style={{ width: "45%", height: 12, borderRadius: 4, backgroundColor: "var(--hair-2)" }} />
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <div className="animate-pulse" style={{ width: 56, height: 12, borderRadius: 4, backgroundColor: "var(--hair-2)" }} />
        <div className="animate-pulse" style={{ width: 80, height: 12, borderRadius: 4, backgroundColor: "var(--hair-2)" }} />
      </div>
      <div className="animate-pulse" style={{ width: "90%", height: 12, borderRadius: 4, backgroundColor: "var(--hair-2)", marginTop: 4 }} />
    </div>
  )
}

// ── Match card ─────────────────────────────────────────────────────────────

function MatchCard({ match, opp, onDismiss, onOppClick, onFunderClick }: {
  match: Match
  opp: Opportunity
  onDismiss: () => void
  onOppClick: (oppId: string, el: HTMLElement) => void
  onFunderClick: (funderId: string, el: HTMLElement) => void
}) {
  const funder = getFunder(opp.funderId)
  const cfg = MATCH_CONFIG[match.matchStrength]
  const primaryReason = match.reasons.positive[0]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => onOppClick(opp.id, e.currentTarget)}
      onKeyDown={(e) => e.key === "Enter" && onOppClick(opp.id, e.currentTarget as HTMLElement)}
      style={{
        padding: "16px 20px",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--hair)",
        borderRadius: 12,
        cursor: "pointer",
        position: "relative",
        transition: "border-color 150ms, box-shadow 150ms",
        display: "flex", flexDirection: "column", gap: 0,
      }}
      onMouseEnter={(e) => {
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
      {/* Dismiss */}
      <button
        type="button"
        aria-label="Dismiss this match"
        onClick={(e) => { e.stopPropagation(); onDismiss() }}
        style={{
          position: "absolute", top: 10, right: 10,
          width: 26, height: 26, borderRadius: 6,
          border: "none", backgroundColor: "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--ink-tertiary)",
          transition: "background-color 120ms, color 120ms",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.backgroundColor = "var(--canvas)"
          el.style.color = "var(--ink-secondary)"
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.backgroundColor = "transparent"
          el.style.color = "var(--ink-tertiary)"
        }}
      >
        <X size={13} />
      </button>

      {/* Match badge + dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8, paddingRight: 24 }}>
        <span style={{
          display: "inline-block", padding: "2px 8px", borderRadius: 20,
          fontSize: 11, fontWeight: 500,
          backgroundColor: cfg.bg, color: cfg.color,
        }}>
          {cfg.label}
        </span>
        <MatchDots strength={match.matchStrength} />
      </div>

      {/* Opp name */}
      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "var(--ink)", lineHeight: "20px", paddingRight: 24 }}>
        {opp.name}
      </p>

      {/* Funder name — clickable */}
      {funder && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFunderClick(funder.id, e.currentTarget) }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onFunderClick(funder.id, e.currentTarget as HTMLElement) } }}
          style={{
            background: "none", border: "none", padding: 0, margin: "0 0 10px", cursor: "pointer",
            fontSize: 12, color: "var(--ink-tertiary)", textAlign: "left",
            transition: "color 120ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--slate-secondary)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)" }}
        >
          {funder.name}
        </button>
      )}

      {/* Amount + deadline */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        {opp.amount && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--slate-primary)" }}>{opp.amount}</span>
        )}
        {opp.deadline && (
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
            {opp.deadline === "Rolling" ? "Rolling deadline" : `Due ${opp.deadline}`}
          </span>
        )}
      </div>

      {/* Top reason */}
      {primaryReason && (
        <div style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
          <Check size={12} style={{ color: "var(--evergreen)", flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>{primaryReason}</span>
        </div>
      )}
    </div>
  )
}

// ── Empty matches ──────────────────────────────────────────────────────────

function EmptyMatches({ scopeLabel, onBrowseAll }: { scopeLabel: string; onBrowseAll: () => void }) {
  return (
    <div style={{
      padding: "28px 32px",
      backgroundColor: "var(--surface)",
      border: "1px solid var(--hair)",
      borderRadius: 12,
      display: "flex", flexDirection: "column", gap: 10,
      alignItems: "flex-start",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--ink-tertiary)" }}>
          auto_fix_high
        </span>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
          Not enough to match on yet
        </p>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "20px", maxWidth: 520 }}>
        Add program details to {scopeLabel} — focus areas, geography, and eligibility criteria — so Grant Assistant can surface strong fits.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
        <button
          type="button"
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
          Enrich project profile <ArrowRight size={13} />
        </button>
        <button
          type="button"
          onClick={onBrowseAll}
          style={{
            padding: "8px 16px", borderRadius: 8,
            border: "1px solid var(--hair-2)", backgroundColor: "transparent",
            fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer",
            transition: "background-color 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
        >
          Browse all
        </button>
      </div>
    </div>
  )
}

// ── Catalogue card ─────────────────────────────────────────────────────────

function CatalogueCard({ opp, onOppClick, onFunderClick }: {
  opp: Opportunity
  onOppClick: (oppId: string, el: HTMLElement) => void
  onFunderClick: (funderId: string, el: HTMLElement) => void
}) {
  const funder = getFunder(opp.funderId)
  const match = getMatchForOpportunity(opp.id)

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
        display: "flex", flexDirection: "column", gap: 0,
        transition: "border-color 150ms, box-shadow 150ms",
      }}
      onMouseEnter={(e) => {
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        {funder && (
          <span style={{
            display: "inline-block", padding: "2px 8px", borderRadius: 20,
            fontSize: 11, fontWeight: 500,
            backgroundColor: "var(--slate-tint)", color: "var(--slate-secondary)",
          }}>
            {FUNDER_TYPE_LABELS[funder.type]}
          </span>
        )}
        {match && <MatchDots strength={match.matchStrength} />}
      </div>

      <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "var(--ink)", lineHeight: "18px" }}>
        {opp.name}
      </p>

      {funder && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFunderClick(funder.id, e.currentTarget) }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onFunderClick(funder.id, e.currentTarget as HTMLElement) } }}
          style={{
            background: "none", border: "none", padding: 0, margin: "0 0 10px", cursor: "pointer",
            fontSize: 12, color: "var(--ink-tertiary)", textAlign: "left",
            transition: "color 120ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--slate-secondary)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)" }}
        >
          {funder.name}
        </button>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {opp.amount && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--slate-primary)" }}>{opp.amount}</span>
        )}
        {opp.deadline && (
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
            {opp.deadline === "Rolling" ? "Rolling deadline" : `Due ${opp.deadline}`}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Funder card ────────────────────────────────────────────────────────────

function FunderCard({ funder, onFunderClick }: {
  funder: Funder
  onFunderClick: (funderId: string, el: HTMLElement) => void
}) {
  const opps = OPPORTUNITIES.filter(o => o.funderId === funder.id)
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => onFunderClick(funder.id, e.currentTarget)}
      onKeyDown={(e) => e.key === "Enter" && onFunderClick(funder.id, e.currentTarget as HTMLElement)}
      style={{
        padding: "16px 18px", backgroundColor: "var(--surface)",
        border: "1px solid var(--hair)", borderRadius: 12,
        cursor: "pointer", display: "flex", flexDirection: "column", gap: 0,
        transition: "border-color 150ms, box-shadow 150ms",
      }}
      onMouseEnter={(e) => {
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
      <div style={{ marginBottom: 8 }}>
        <span style={{
          display: "inline-block", padding: "2px 8px", borderRadius: 20,
          fontSize: 11, fontWeight: 500,
          backgroundColor: "var(--slate-tint)", color: "var(--slate-secondary)",
        }}>
          {FUNDER_TYPE_LABELS[funder.type]}
        </span>
      </div>
      <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: "var(--ink)", lineHeight: "20px" }}>
        {funder.name}
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "16px" }}>
        {funder.geography}
      </p>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {funder.fundingRange && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--slate-primary)" }}>{funder.fundingRange}</span>
        )}
        {opps.length > 0 && (
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
            {opps.length} open {opps.length === 1 ? "grant" : "grants"}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Filter select ──────────────────────────────────────────────────────────

function FilterSelect({
  value, onChange, children, minWidth,
}: {
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
        padding: "7px 10px", borderRadius: "var(--radius-input)",
        border: "1px solid var(--hair-2)", backgroundColor: "var(--surface)",
        fontSize: 12, color: value ? "var(--ink)" : "var(--ink-secondary)",
        outline: "none", cursor: "pointer",
        minWidth: minWidth ?? 0,
      }}
    >
      {children}
    </select>
  )
}

// ── Discover page (inner) ──────────────────────────────────────────────────

function DiscoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { scopeLabel } = useScope()
  const [matchesLoaded, setMatchesLoaded] = useState(false)

  // Lens
  const [lens, setLens] = useState<"opportunities" | "funders">("opportunities")
  const [funderQuery, setFunderQuery] = useState("")

  // Dismiss / hidden
  const [hiddenMatches, setHiddenMatches] = useState<Array<{ matchId: string; reason?: DismissReason }>>([])
  const [dismissToast, setDismissToast] = useState<{ matchId: string } | null>(null)
  const [showHidden, setShowHidden] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Browse filters
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<FunderType | "">("")
  const [focusAreaFilter, setFocusAreaFilter] = useState("")
  const [geographyFilter, setGeographyFilter] = useState("")
  const [awardRangeFilter, setAwardRangeFilter] = useState("")
  const [deadlineFilter, setDeadlineFilter] = useState("")
  const [sortBy, setSortBy] = useState<"match" | "deadline" | "award">("match")

  const browseRef = useRef<HTMLDivElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  const selectedOppId = searchParams.get("opp")
  const selectedFunderId = searchParams.get("funder")

  useEffect(() => {
    const t = setTimeout(() => setMatchesLoaded(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const prevOppIdRef = useRef<string | null>(null)
  const prevFunderIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevOppIdRef.current && !selectedOppId) lastFocusedRef.current?.focus()
    prevOppIdRef.current = selectedOppId
  }, [selectedOppId])
  useEffect(() => {
    if (prevFunderIdRef.current && !selectedFunderId) lastFocusedRef.current?.focus()
    prevFunderIdRef.current = selectedFunderId
  }, [selectedFunderId])

  const handleOppClick = useCallback((oppId: string, el: HTMLElement) => {
    lastFocusedRef.current = el
    router.push(`/discover?opp=${oppId}`)
  }, [router])

  const handleFunderClick = useCallback((funderId: string, el: HTMLElement) => {
    lastFocusedRef.current = el
    router.push(`/discover?funder=${funderId}`)
  }, [router])

  const handleClose = useCallback(() => {
    router.push("/discover")
  }, [router])

  const hiddenIds = new Set(hiddenMatches.map(m => m.matchId))
  const visibleMatches = STRONG_MATCHES.filter(({ match }) => !hiddenIds.has(match.id))

  const handleDismiss = (matchId: string) => {
    setHiddenMatches(prev => [...prev, { matchId }])
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setDismissToast({ matchId })
    toastTimerRef.current = setTimeout(() => setDismissToast(null), 6000)
  }

  const handleSetReason = (matchId: string, reason: DismissReason) => {
    setHiddenMatches(prev => prev.map(m => m.matchId === matchId ? { ...m, reason } : m))
    setDismissToast(null)
  }

  const handleUnhide = (matchId: string) => {
    setHiddenMatches(prev => prev.filter(m => m.matchId !== matchId))
  }

  const scrollToBrowse = () => {
    browseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Funders lens
  const filteredFunders = FUNDERS.filter(funder => {
    if (!funderQuery.trim()) return true
    const q = funderQuery.toLowerCase()
    return [funder.name, funder.description ?? "", ...funder.focusAreas, funder.geography]
      .join(" ").toLowerCase().includes(q)
  })

  // Opportunities lens
  const filtered: Opportunity[] = OPPORTUNITIES.filter((opp) => {
    const funder = getFunder(opp.funderId)
    if (!funder) return false
    if (typeFilter && funder.type !== typeFilter) return false
    if (focusAreaFilter) {
      const inFunder = funder.focusAreas.includes(focusAreaFilter)
      const inOpp = (opp.focusAreas ?? []).includes(focusAreaFilter)
      if (!inFunder && !inOpp) return false
    }
    if (geographyFilter && funder.geography !== geographyFilter) return false
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

  const sorted = [...filtered].sort((a, b) => {
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

  const hasActiveFilters = !!(typeFilter || focusAreaFilter || geographyFilter || awardRangeFilter || deadlineFilter)

  function clearFilters() {
    setTypeFilter(""); setFocusAreaFilter(""); setGeographyFilter("")
    setAwardRangeFilter(""); setDeadlineFilter("")
  }

  return (
    <div style={{ height: "100%", position: "relative", overflow: "hidden", backgroundColor: "var(--canvas)" }}>

      <div style={{ height: "100%", overflowY: "auto" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "36px 32px 80px" }}>

          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
              Discover
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>
              Funding opportunities for {scopeLabel}
            </p>
          </div>

          {/* Lens toggle */}
          <div style={{ marginBottom: 36 }}>
            <LensToggle value={lens} onChange={setLens} />
          </div>

          {/* ── Opportunities lens ──────────────────────────────────────── */}
          {lens === "opportunities" && (
            <>
              {/* Matches */}
              <section style={{ marginBottom: 52 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--slate-primary)", userSelect: "none" }}>
                    auto_fix_high
                  </span>
                  <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink-tertiary)" }}>
                    Matched for {scopeLabel}
                  </h2>
                  {matchesLoaded && visibleMatches.length > 0 && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      minWidth: 20, height: 20, padding: "0 6px", borderRadius: 10,
                      fontSize: 11, fontWeight: 700,
                      backgroundColor: "var(--evergreen-tint)", color: "var(--evergreen)",
                    }}>
                      {visibleMatches.length}
                    </span>
                  )}
                </div>

                {/* Dismiss reason bar */}
                {dismissToast && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                    padding: "8px 14px", borderRadius: 8,
                    backgroundColor: "var(--surface)", border: "1px solid var(--hair)",
                    marginBottom: 12,
                  }}>
                    <span style={{ fontSize: 12, color: "var(--ink-tertiary)", flexShrink: 0 }}>Why?</span>
                    {DISMISS_REASONS.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => handleSetReason(dismissToast.matchId, r.value)}
                        style={{
                          padding: "3px 10px", borderRadius: 20,
                          border: "1px solid var(--hair-2)", backgroundColor: "transparent",
                          fontSize: 11, color: "var(--ink-secondary)", cursor: "pointer",
                          transition: "background-color 120ms, border-color 120ms",
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLButtonElement
                          el.style.backgroundColor = "var(--canvas)"
                          el.style.borderColor = "var(--ink-tertiary)"
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLButtonElement
                          el.style.backgroundColor = "transparent"
                          el.style.borderColor = "var(--hair-2)"
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDismissToast(null)}
                      style={{
                        marginLeft: "auto", background: "none", border: "none",
                        cursor: "pointer", color: "var(--ink-tertiary)",
                        display: "flex", alignItems: "center", padding: 2,
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {!matchesLoaded ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    <SkeletonMatchCard /><SkeletonMatchCard /><SkeletonMatchCard />
                  </div>
                ) : visibleMatches.length === 0 ? (
                  <EmptyMatches scopeLabel={scopeLabel} onBrowseAll={scrollToBrowse} />
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {visibleMatches.map(({ match, opp }) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        opp={opp}
                        onDismiss={() => handleDismiss(match.id)}
                        onOppClick={handleOppClick}
                        onFunderClick={handleFunderClick}
                      />
                    ))}
                  </div>
                )}

                {/* Hidden matches */}
                {hiddenMatches.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => setShowHidden(s => !s)}
                      style={{
                        background: "none", border: "none", cursor: "pointer", padding: 0,
                        fontSize: 12, color: "var(--ink-tertiary)",
                      }}
                    >
                      {hiddenMatches.length} hidden · {showHidden ? "Hide" : "Show"}
                    </button>
                    {showHidden && (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                        {hiddenMatches.map(({ matchId, reason }) => {
                          const sm = STRONG_MATCHES.find(m => m.match.id === matchId)
                          if (!sm) return null
                          return (
                            <div key={matchId} style={{
                              display: "flex", alignItems: "center", gap: 12,
                              padding: "9px 14px", borderRadius: 9,
                              backgroundColor: "var(--surface)", border: "1px solid var(--hair)",
                            }}>
                              <span style={{ flex: 1, fontSize: 12, color: "var(--ink-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {sm.opp.name}
                              </span>
                              {reason && (
                                <span style={{ fontSize: 11, color: "var(--ink-tertiary)", flexShrink: 0 }}>
                                  {DISMISS_REASONS.find(r => r.value === reason)?.label}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleUnhide(matchId)}
                                style={{
                                  background: "none", border: "none", cursor: "pointer",
                                  fontSize: 12, color: "var(--slate-secondary)", padding: 0, flexShrink: 0,
                                }}
                              >
                                Unhide
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Browse */}
              <section ref={browseRef}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink-tertiary)" }}>
                    Browse
                  </h2>
                  <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
                    {sorted.length} {sorted.length === 1 ? "opportunity" : "opportunities"}
                  </span>
                </div>

                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px", borderRadius: "var(--radius-input)",
                  border: "1px solid var(--hair-2)", backgroundColor: "var(--surface)",
                  marginBottom: 10,
                }}>
                  <Search size={13} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search opportunities and funders"
                    style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: "var(--ink)", lineHeight: "17px" }}
                  />
                  {query && (
                    <button type="button" onClick={() => setQuery("")}
                      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--ink-tertiary)", padding: 0 }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                  <FilterSelect value={typeFilter} onChange={(v) => setTypeFilter(v as FunderType | "")}>
                    <option value="">All funder types</option>
                    {(Object.keys(FUNDER_TYPE_LABELS) as FunderType[]).map(t => (
                      <option key={t} value={t}>{FUNDER_TYPE_LABELS[t]}</option>
                    ))}
                  </FilterSelect>

                  <FilterSelect value={focusAreaFilter} onChange={setFocusAreaFilter}>
                    <option value="">All focus areas</option>
                    {ALL_FOCUS_AREAS.map(fa => (
                      <option key={fa} value={fa}>{fa}</option>
                    ))}
                  </FilterSelect>

                  <FilterSelect value={geographyFilter} onChange={setGeographyFilter}>
                    <option value="">All geographies</option>
                    {ALL_GEOGRAPHIES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </FilterSelect>

                  <FilterSelect value={awardRangeFilter} onChange={setAwardRangeFilter}>
                    <option value="">Any award size</option>
                    <option value="under-25k">Up to $25k</option>
                    <option value="25k-50k">$25k – $50k</option>
                    <option value="over-50k">Over $50k</option>
                  </FilterSelect>

                  <FilterSelect value={deadlineFilter} onChange={setDeadlineFilter}>
                    <option value="">Any deadline</option>
                    <option value="30">Within 30 days</option>
                    <option value="60">Within 60 days</option>
                    <option value="90">Within 90 days</option>
                  </FilterSelect>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "7px 10px", borderRadius: "var(--radius-input)",
                        border: "1px solid var(--hair-2)", backgroundColor: "transparent",
                        fontSize: 12, color: "var(--ink-tertiary)", cursor: "pointer",
                        transition: "background-color 120ms, color 120ms",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLButtonElement
                        el.style.backgroundColor = "var(--canvas)"
                        el.style.color = "var(--ink-secondary)"
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement
                        el.style.backgroundColor = "transparent"
                        el.style.color = "var(--ink-tertiary)"
                      }}
                    >
                      <X size={11} /> Clear
                    </button>
                  )}

                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>Sort</span>
                    <FilterSelect value={sortBy} onChange={(v) => setSortBy(v as "match" | "deadline" | "award")}>
                      <option value="match">Best match</option>
                      <option value="deadline">Soonest deadline</option>
                      <option value="award">Award size</option>
                    </FilterSelect>
                  </div>
                </div>

                {sorted.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    {sorted.map(opp => (
                      <CatalogueCard
                        key={opp.id}
                        opp={opp}
                        onOppClick={handleOppClick}
                        onFunderClick={handleFunderClick}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "56px 0", textAlign: "center" }}>
                    <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--ink-tertiary)" }}>No results match these filters.</p>
                    {hasActiveFilters && (
                      <button type="button" onClick={clearFilters}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--slate-secondary)", textDecoration: "underline", padding: 0 }}
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {/* ── Funders lens ───────────────────────────────────────────── */}
          {lens === "funders" && (
            <section>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink-tertiary)" }}>
                  Funders
                </h2>
                <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
                  {filteredFunders.length} {filteredFunders.length === 1 ? "funder" : "funders"}
                </span>
              </div>

              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px", borderRadius: "var(--radius-input)",
                border: "1px solid var(--hair-2)", backgroundColor: "var(--surface)",
                marginBottom: 20,
              }}>
                <Search size={13} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
                <input
                  type="text"
                  value={funderQuery}
                  onChange={(e) => setFunderQuery(e.target.value)}
                  placeholder="Search by name, focus area, or geography"
                  style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 13, color: "var(--ink)", lineHeight: "17px" }}
                />
                {funderQuery && (
                  <button type="button" onClick={() => setFunderQuery("")}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", color: "var(--ink-tertiary)", padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {filteredFunders.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {filteredFunders.map(funder => (
                    <FunderCard
                      key={funder.id}
                      funder={funder}
                      onFunderClick={handleFunderClick}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ padding: "56px 0", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>No funders match your search.</p>
                </div>
              )}
            </section>
          )}

        </div>
      </div>

      {selectedOppId && (
        <OpportunityPeekPanel
          key={selectedOppId}
          oppId={selectedOppId}
          onClose={handleClose}
          onFunderClick={(funderId) => router.push(`/discover?funder=${funderId}`)}
        />
      )}

      {selectedFunderId && (
        <FunderPeekPanel
          key={selectedFunderId}
          funderId={selectedFunderId}
          onClose={handleClose}
          onOppClick={(oppId) => router.push(`/discover?opp=${oppId}`)}
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
