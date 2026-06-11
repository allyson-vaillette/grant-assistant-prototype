"use client"

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ContentContainer } from "@/components/layout/content-container"
import { Search, X, Check, ArrowRight } from "lucide-react"
import {
  OPPORTUNITIES, MATCHES, FUNDERS,
  getFunder, getMatchForOpportunity,
} from "@/lib/mock-data"
import { useScope } from "@/lib/scope-context"
import type { Opportunity, FunderType, MatchStrength, Match } from "@/lib/types"
import { OpportunityPeekPanel } from "./OpportunityPeekPanel"
import { FiltersPanel, FUNDER_TYPE_LABELS, AWARD_RANGE_LABELS, DEADLINE_LABELS } from "./FiltersPanel"

// ── Constants ──────────────────────────────────────────────────────────────

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

// ── Funder avatar ─────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  { bg: "#EDE9F7", fg: "#5B45C8" },
  { bg: "#DBF0FA", fg: "#2472A4" },
  { bg: "#E0F5EB", fg: "#1F7A4C" },
  { bg: "#FEF3E7", fg: "#AF5200" },
  { bg: "#FCE8EA", fg: "#BF2B45" },
  { bg: "#F0F4E8", fg: "#4A6B22" },
]

function funderPaletteIndex(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return h % AVATAR_PALETTE.length
}

function FunderAvatar({ name, size = 26 }: { name: string; size?: number }) {
  const { bg, fg } = AVATAR_PALETTE[funderPaletteIndex(name)]
  const initials = name
    .split(/\s+/)
    .filter(w => /[A-Za-z]/.test(w.charAt(0)))
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join("")
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: size, height: size, borderRadius: "50%",
      backgroundColor: bg, color: fg,
      fontSize: Math.round(size * 0.38), fontWeight: 700, lineHeight: 1,
      flexShrink: 0, userSelect: "none",
    }}>
      {initials}
    </span>
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

function MatchCard({ match, opp, onDismiss, onOppClick }: {
  match: Match
  opp: Opportunity
  onDismiss: () => void
  onOppClick: (oppId: string, el: HTMLElement) => void
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
        padding: "12px 16px",
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
        el.style.boxShadow = "var(--shadow-sm)"
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

      {/* Funder row: avatar + name + match dots + match label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, paddingRight: 32 }}>
        {funder && <FunderAvatar name={funder.name} size={26} />}
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
          <span style={{
            fontSize: 13, fontWeight: 700, color: "var(--ink)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {funder?.name}
          </span>
          <MatchDots strength={match.matchStrength} />
          <span style={{
            fontSize: 10, fontWeight: 600, color: cfg.color,
            flexShrink: 0, lineHeight: 1,
          }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Opp name — indented under avatar */}
      <p style={{
        margin: "0 0 8px", paddingLeft: 34,
        fontSize: 12, fontWeight: 400, color: "var(--slate-primary)", lineHeight: "17px",
      }}>
        {opp.name}
      </p>

      {/* Meta row: amount + deadline + type tag */}
      <div style={{
        display: "flex", gap: 8, alignItems: "center", paddingLeft: 34, flexWrap: "wrap",
        marginBottom: primaryReason ? 8 : 0,
      }}>
        {opp.amount && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--slate-primary)" }}>{opp.amount}</span>
        )}
        {opp.deadline && (
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
            {opp.deadline === "Rolling" ? "Rolling deadline" : `Due ${opp.deadline}`}
          </span>
        )}
        {funder && (
          <span style={{
            fontSize: 10, fontWeight: 500, color: "var(--ink-tertiary)",
            padding: "1px 7px", borderRadius: 20,
            backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)",
          }}>
            {FUNDER_TYPE_LABELS[funder.type]}
          </span>
        )}
      </div>

      {/* Top reason — indented */}
      {primaryReason && (
        <div style={{ display: "flex", gap: 7, alignItems: "flex-start", paddingLeft: 34 }}>
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

function CatalogueCard({ opp, onOppClick }: {
  opp: Opportunity
  onOppClick: (oppId: string, el: HTMLElement) => void
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
        padding: "10px 14px",
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
        el.style.boxShadow = "var(--shadow-sm)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = "var(--hair)"
        el.style.boxShadow = "none"
      }}
    >
      {/* Funder row: avatar + name + match dots if matched */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
        {funder && <FunderAvatar name={funder.name} size={24} />}
        <span style={{
          flex: 1, minWidth: 0,
          fontSize: 13, fontWeight: 700, color: "var(--ink)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {funder?.name}
        </span>
        {match && <MatchDots strength={match.matchStrength} />}
      </div>

      {/* Opp name — indented under avatar */}
      <p style={{
        margin: "0 0 8px", paddingLeft: 31,
        fontSize: 12, fontWeight: 400, color: "var(--slate-primary)", lineHeight: "17px",
      }}>
        {opp.name}
      </p>

      {/* Meta row: amount + deadline + type tag */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", paddingLeft: 31, flexWrap: "wrap" }}>
        {opp.amount && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--slate-primary)" }}>{opp.amount}</span>
        )}
        {opp.deadline && (
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
            {opp.deadline === "Rolling" ? "Rolling deadline" : `Due ${opp.deadline}`}
          </span>
        )}
        {funder && (
          <span style={{
            fontSize: 10, fontWeight: 500, color: "var(--ink-tertiary)",
            padding: "1px 7px", borderRadius: 20,
            backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)",
          }}>
            {FUNDER_TYPE_LABELS[funder.type]}
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const browseToolbarSentinelRef = useRef<HTMLDivElement>(null)
  const [browseToolbarStuck, setBrowseToolbarStuck] = useState(false)

  const selectedOppId = searchParams.get("opp")

  useEffect(() => {
    const t = setTimeout(() => setMatchesLoaded(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const prevOppIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevOppIdRef.current && !selectedOppId) lastFocusedRef.current?.focus()
    prevOppIdRef.current = selectedOppId
  }, [selectedOppId])

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
  }, [])

  const handleOppClick = useCallback((oppId: string, el: HTMLElement) => {
    lastFocusedRef.current = el
    router.push(`/discover?opp=${oppId}`)
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

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    typeFilter        ? { key: "type",     label: `Funder type: ${FUNDER_TYPE_LABELS[typeFilter]}`,   onRemove: () => setTypeFilter("") }       : null,
    focusAreaFilter   ? { key: "focus",    label: `Focus area: ${focusAreaFilter}`,                    onRemove: () => setFocusAreaFilter("") }   : null,
    geographyFilter   ? { key: "geo",      label: `Geography: ${geographyFilter}`,                     onRemove: () => setGeographyFilter("") }   : null,
    awardRangeFilter  ? { key: "award",    label: `Award: ${AWARD_RANGE_LABELS[awardRangeFilter]}`,    onRemove: () => setAwardRangeFilter("") }  : null,
    deadlineFilter    ? { key: "deadline", label: DEADLINE_LABELS[deadlineFilter],                     onRemove: () => setDeadlineFilter("") }    : null,
  ].filter((c): c is NonNullable<typeof c> => c !== null)

  return (
    <div style={{ height: "100%", position: "relative", overflow: "hidden", backgroundColor: "var(--canvas)" }}>

      <div ref={scrollContainerRef} style={{ height: "100%", overflowY: "auto" }}>
        <ContentContainer style={{ padding: "36px 40px 80px" }}>

          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
              Discover
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>
              Funding opportunities for {scopeLabel}
            </p>
          </div>

          <>
              {/* Matches — AI surface with gradient band */}
              <section
                style={{
                  position: "relative",
                  isolation: "isolate",
                  overflow: "hidden",
                  marginBottom: 40,
                  padding: "20px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, rgba(91,69,200,0.07) 0%, rgba(107,168,164,0.07) 100%)",
                  border: "1px solid rgba(91,69,200,0.1)",
                }}
              >
                <div className="ai-blob" aria-hidden="true" />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      fontSize: 18, userSelect: "none",
                      background: "linear-gradient(135deg, rgb(91,69,200) 0%, rgb(107,168,164) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    auto_fix_high
                  </span>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
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

              {/* All opportunities */}
              <section ref={browseRef}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                    All opportunities
                  </h2>
                  <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
                    {sorted.length} {sorted.length === 1 ? "opportunity" : "opportunities"}
                  </span>
                </div>

                {/* Sentinel — signals when the toolbar has scrolled to the sticky position */}
                <div ref={browseToolbarSentinelRef} aria-hidden="true" style={{ height: 1, marginBottom: -1 }} />

                {/* Sticky toolbar: search bar + filters/sort + active chips */}
                <div style={{
                  position: "sticky", top: 0, zIndex: 10,
                  backgroundColor: "var(--canvas)",
                  marginLeft: -40, marginRight: -40,
                  paddingLeft: 40, paddingRight: 40,
                  paddingTop: 8, paddingBottom: browseToolbarStuck ? 10 : 8,
                  transition: "box-shadow 150ms",
                  boxShadow: browseToolbarStuck
                    ? "0 1px 0 var(--hair), 0 2px 12px rgba(28,24,64,0.06)"
                    : "none",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 12px", borderRadius: "var(--radius-input)",
                    border: "1px solid var(--hair-2)", backgroundColor: "var(--surface)",
                    marginBottom: 8,
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

                  {/* Filters + Sort bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: activeChips.length > 0 ? 8 : 0 }}>
                    <FiltersPanel
                      typeFilter={typeFilter}
                      focusAreaFilter={focusAreaFilter}
                      geographyFilter={geographyFilter}
                      awardRangeFilter={awardRangeFilter}
                      deadlineFilter={deadlineFilter}
                      allFocusAreas={ALL_FOCUS_AREAS}
                      allGeographies={ALL_GEOGRAPHIES}
                      onTypeChange={setTypeFilter}
                      onFocusAreaChange={setFocusAreaFilter}
                      onGeographyChange={setGeographyFilter}
                      onAwardRangeChange={setAwardRangeFilter}
                      onDeadlineChange={setDeadlineFilter}
                      onClearAll={clearFilters}
                    />

                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 11, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>Sort</span>
                      <FilterSelect value={sortBy} onChange={(v) => setSortBy(v as "match" | "deadline" | "award")}>
                        <option value="match">Best fit</option>
                        <option value="deadline">Soonest deadline</option>
                        <option value="award">Largest award</option>
                      </FilterSelect>
                    </div>
                  </div>

                  {/* Active filter chips */}
                  {activeChips.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {activeChips.map(chip => (
                        <button
                          key={chip.key}
                          type="button"
                          onClick={chip.onRemove}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 5,
                            padding: "4px 8px 4px 10px", borderRadius: 20,
                            backgroundColor: "var(--slate-tint)", border: "1px solid var(--hair-2)",
                            fontSize: 12, color: "var(--slate-secondary)",
                            cursor: "pointer", transition: "background-color 120ms",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--hair-2)"
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)"
                          }}
                        >
                          {chip.label}
                          <X size={11} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
                        </button>
                      ))}
                      {activeChips.length >= 2 && (
                        <button
                          type="button"
                          onClick={clearFilters}
                          style={{
                            background: "none", border: "none", cursor: "pointer", padding: "4px 6px",
                            fontSize: 12, color: "var(--ink-tertiary)",
                            transition: "color 120ms",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--slate-secondary)" }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)" }}
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Results */}
                <div style={{ marginTop: 12 }}>

                {sorted.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    {sorted.map(opp => (
                      <CatalogueCard
                        key={opp.id}
                        opp={opp}
                        onOppClick={handleOppClick}
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
                </div>
              </section>
            </>

        </ContentContainer>
      </div>

      {selectedOppId && (
        <OpportunityPeekPanel
          key={selectedOppId}
          oppId={selectedOppId}
          onClose={handleClose}
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
