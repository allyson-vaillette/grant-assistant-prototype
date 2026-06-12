"use client"

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ContentContainer } from "@/components/layout/content-container"
import { Search, X, Check, CalendarDays, MapPin } from "lucide-react"
import {
  OPPORTUNITIES, MATCHES, FUNDERS,
  getFunder, getMatchForOpportunity, createPipelineOpportunity, getPipelineForOpportunity,
} from "@/lib/mock-data"
import { useScope } from "@/lib/scope-context"
import type { Opportunity, FunderType, MatchStrength, Match } from "@/lib/types"
import { OpportunityPeekPanel } from "./OpportunityPeekPanel"
import { FUNDER_TYPE_LABELS, AWARD_RANGE_LABELS, DEADLINE_LABELS } from "./FiltersPanel"
import { IncompleteProfileBanner } from "@/components/IncompleteProfileBanner"

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

// ── Match row (compact list) ───────────────────────────────────────────────

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
  return `${short} · ${days}d left`
}

function MatchRow({ match, opp, isFirst, onOppClick, onTrack }: {
  match: Match
  opp: Opportunity
  isFirst: boolean
  onOppClick: (oppId: string, el: HTMLElement) => void
  onTrack: (oppId: string) => void
}) {
  const funder = getFunder(opp.funderId)
  const cfg = MATCH_CONFIG[match.matchStrength]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => onOppClick(opp.id, e.currentTarget)}
      onKeyDown={(e) => e.key === "Enter" && onOppClick(opp.id, e.currentTarget as HTMLElement)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "11px 16px",
        borderTop: !isFirst ? "0.5px solid var(--hair)" : "none",
        cursor: "pointer",
        transition: "background-color 120ms",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--surface-sunk)" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
    >
      {funder && <FunderAvatar name={funder.name} size={32} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ink)", lineHeight: "17px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {funder?.name}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "var(--slate-primary)", lineHeight: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {opp.name}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <MatchDots strength={match.matchStrength} />
        <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, whiteSpace: "nowrap" }}>{cfg.label}</span>
      </div>

      {opp.amount && (
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--slate-primary)", whiteSpace: "nowrap", flexShrink: 0 }}>
          {opp.amount}
        </span>
      )}

      <span style={{ fontSize: 11, color: "var(--ink-tertiary)", whiteSpace: "nowrap", flexShrink: 0, minWidth: 110 }}>
        {daysLabel(opp.deadline)}
      </span>

      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--evergreen)", whiteSpace: "nowrap", flexShrink: 0 }}>
        <Check size={12} />
        Eligible
      </span>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onTrack(opp.id) }}
        style={{
          padding: "5px 14px", borderRadius: 6,
          border: "1px solid var(--hair-2)", backgroundColor: "transparent",
          fontSize: 12, fontWeight: 600, color: "var(--slate-secondary)",
          cursor: "pointer", flexShrink: 0,
          transition: "background-color 120ms, border-color 120ms",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.backgroundColor = "var(--slate-tint)"
          el.style.borderColor = "var(--slate-light)"
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.backgroundColor = "transparent"
          el.style.borderColor = "var(--hair-2)"
        }}
      >
        Track
      </button>
    </div>
  )
}

// ── Catalogue card ─────────────────────────────────────────────────────────

function CatalogueCard({ opp, onOppClick, onTrack }: {
  opp: Opportunity
  onOppClick: (oppId: string, el: HTMLElement) => void
  onTrack: (oppId: string) => void
}) {
  const router = useRouter()
  const funder = getFunder(opp.funderId)
  const match = getMatchForOpportunity(opp.id)
  const pipeline = getPipelineForOpportunity(opp.id)
  const cfg = match ? MATCH_CONFIG[match.matchStrength] : null
  const primaryReason = match?.reasons.positive[0]
  const tags = (opp.focusAreas ?? []).slice(0, 3)

  const eligColor = opp.eligibilityLabel === "Likely eligible"
    ? "var(--evergreen)"
    : opp.eligibilityLabel === "Invitation required"
    ? "var(--amber)"
    : "var(--ink-tertiary)"

  const geoShort = funder?.geography === "National (U.S.)" || funder?.geography === "National (U.S.) + Canada"
    ? "National"
    : funder?.geography ?? ""

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
      {/* Header: avatar + funder name/type/location + match dots */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {funder && <FunderAvatar name={funder.name} size={32} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontSize: 13, fontWeight: 700, color: "var(--ink)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {funder?.name}
          </p>
          {funder && (
            <p style={{
              margin: 0,
              fontSize: 11, color: "var(--ink-tertiary)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {FUNDER_TYPE_LABELS[funder.type]}{funder.location ? ` · ${funder.location}` : ""}
            </p>
          )}
        </div>
        {match && cfg && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <MatchDots strength={match.matchStrength} />
            <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, whiteSpace: "nowrap" }}>
              {cfg.label}
            </span>
          </div>
        )}
      </div>

      {/* Grant name */}
      <p style={{
        margin: "0 0 6px",
        fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: "18px",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>
        {opp.name}
      </p>

      {/* Why-it-matches reason (matched opportunities only) */}
      {match && primaryReason && (
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 10 }}>
          <Check size={12} style={{ color: "var(--evergreen)", flexShrink: 0, marginTop: 2 }} />
          <span style={{
            fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {primaryReason}
          </span>
        </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: "0.5px solid var(--hair)", margin: `${match && primaryReason ? 0 : 10}px 0 10px` }} />

      {/* Meta row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 8 }}>
        {opp.amount && (
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
            {opp.amount}
          </span>
        )}
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
        {geoShort && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ink-tertiary)" }}>
            <MapPin size={12} />
            {geoShort}
          </span>
        )}
      </div>

      {/* Program-area tags */}
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {tags.map(tag => (
            <span key={tag} style={{
              fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)",
              padding: "2px 8px", borderRadius: 20,
              backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)",
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: "auto" }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOppClick(opp.id, e.currentTarget as HTMLElement) }}
          style={{
            padding: "5px 12px", borderRadius: 6,
            border: "1px solid var(--hair-2)", backgroundColor: "transparent",
            fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)",
            cursor: "pointer", transition: "background-color 120ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
        >
          View details
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (pipeline) { router.push(`/pursuit/${opp.id}`) } else { onTrack(opp.id) }
          }}
          style={{
            padding: "5px 14px", borderRadius: 6,
            border: "1px solid var(--slate-primary)", backgroundColor: "var(--slate-primary)",
            fontSize: 12, fontWeight: 600, color: "#ffffff",
            cursor: "pointer", transition: "background-color 120ms, border-color 120ms",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.backgroundColor = "var(--slate-secondary)"
            el.style.borderColor = "var(--slate-secondary)"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.backgroundColor = "var(--slate-primary)"
            el.style.borderColor = "var(--slate-primary)"
          }}
        >
          {pipeline ? "Add to tracker" : "Track"}
        </button>
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

// ── Tab stub placeholder ───────────────────────────────────────────────────

function TabStub({ message }: { message: string }) {
  return (
    <div style={{ padding: "64px 0", display: "flex", justifyContent: "center" }}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>{message}</p>
    </div>
  )
}

// ── Discover page (inner) ──────────────────────────────────────────────────

function DiscoverPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { scopeLabel, selectedProjectId } = useScope()

  // Tab state
  const [primaryTab, setPrimaryTab] = useState<"matches" | "explore">("matches")
  const [subTab, setSubTab] = useState<"opportunities" | "funders">("opportunities")

  // Browse filters
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<FunderType | "">("")
  const [focusAreaFilter, setFocusAreaFilter] = useState("")
  const [geographyFilter, setGeographyFilter] = useState("")
  const [awardRangeFilter, setAwardRangeFilter] = useState("")
  const [deadlineFilter, setDeadlineFilter] = useState("")
  const [sortBy, setSortBy] = useState<"match" | "deadline" | "award">("match")

  const lastFocusedRef = useRef<HTMLElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const browseToolbarSentinelRef = useRef<HTMLDivElement>(null)
  const [browseToolbarStuck, setBrowseToolbarStuck] = useState(false)

  const selectedOppId = searchParams.get("opp")

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
  }, [primaryTab, subTab])

  const handleOppClick = useCallback((oppId: string, el: HTMLElement) => {
    lastFocusedRef.current = el
    router.push(`/discover?opp=${oppId}`)
  }, [router])

  const handleClose = useCallback(() => {
    router.push("/discover")
  }, [router])

  const handlePrimaryTab = (tab: "matches" | "explore") => {
    setPrimaryTab(tab)
    setSubTab("opportunities")
  }

  const switchToExplore = () => {
    setPrimaryTab("explore")
    setSubTab("opportunities")
  }

  const handleTrack = useCallback((oppId: string) => {
    const pip = createPipelineOpportunity(oppId, selectedProjectId ?? "proj-general")
    router.push(`/pursuit/${pip.opportunityId}`)
  }, [router, selectedProjectId])

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

          <IncompleteProfileBanner />

          {/* Page header */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
              Discover
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>
              Funding opportunities for {scopeLabel}
            </p>
          </div>

          {/* Primary tabs */}
          <div style={{ display: "flex", gap: 24, borderBottom: "1px solid var(--hair)", marginBottom: 0 }}>
            {(["matches", "explore"] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => handlePrimaryTab(tab)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "0 0 10px",
                  fontSize: 14, fontWeight: primaryTab === tab ? 600 : 400,
                  color: primaryTab === tab ? "var(--ink)" : "var(--ink-tertiary)",
                  borderBottom: primaryTab === tab ? "2px solid var(--ink)" : "2px solid transparent",
                  marginBottom: -1,
                  transition: "color 120ms",
                }}
              >
                {tab === "matches" ? "Matches" : "Explore"}
              </button>
            ))}
          </div>

          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: 20, borderBottom: "1px solid var(--hair)", marginBottom: 24 }}>
            {(["opportunities", "funders"] as const).map(sub => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubTab(sub)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "8px 0",
                  fontSize: 12, fontWeight: subTab === sub ? 500 : 400,
                  color: subTab === sub ? "var(--ink-secondary)" : "var(--ink-tertiary)",
                  borderBottom: subTab === sub ? "1.5px solid var(--ink-secondary)" : "1.5px solid transparent",
                  marginBottom: -1,
                  transition: "color 120ms",
                }}
              >
                {sub === "opportunities" ? "Opportunities" : "Funders"}
              </button>
            ))}
          </div>

          {/* Matches > Opportunities */}
          {primaryTab === "matches" && subTab === "opportunities" && (
            <section>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
                  Matched for {scopeLabel}
                </h2>
                {STRONG_MATCHES.length > 0 && (
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    minWidth: 20, height: 20, padding: "0 6px", borderRadius: 10,
                    fontSize: 11, fontWeight: 700,
                    backgroundColor: "var(--evergreen-tint)", color: "var(--evergreen)",
                  }}>
                    {STRONG_MATCHES.length}
                  </span>
                )}
              </div>

              {STRONG_MATCHES.length === 0 ? (
                <div style={{ padding: "36px 0", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>No matches yet.</p>
                </div>
              ) : (
                <div style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--hair-2)",
                  borderRadius: 12,
                  overflow: "hidden",
                }}>
                  {STRONG_MATCHES.map(({ match, opp }, i) => (
                    <MatchRow
                      key={match.id}
                      match={match}
                      opp={opp}
                      isFirst={i === 0}
                      onOppClick={handleOppClick}
                      onTrack={handleTrack}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Matches > Funders */}
          {primaryTab === "matches" && subTab === "funders" && (
            <TabStub message="Curated funders coming next" />
          )}

          {/* Explore > Opportunities */}
          {primaryTab === "explore" && subTab === "opportunities" && (
            <section>
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

                {/* Persistent filter bar: 5 always-visible controls + sort */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: activeChips.length > 0 ? 8 : 0 }}>
                  <FilterSelect value={typeFilter} onChange={(v) => setTypeFilter(v as FunderType | "")}>
                    <option value="">Funder type</option>
                    {(Object.keys(FUNDER_TYPE_LABELS) as FunderType[]).map(t => (
                      <option key={t} value={t}>{FUNDER_TYPE_LABELS[t]}</option>
                    ))}
                  </FilterSelect>

                  <FilterSelect value={focusAreaFilter} onChange={setFocusAreaFilter}>
                    <option value="">Focus area</option>
                    {ALL_FOCUS_AREAS.map(fa => (
                      <option key={fa} value={fa}>{fa}</option>
                    ))}
                  </FilterSelect>

                  <FilterSelect value={geographyFilter} onChange={setGeographyFilter}>
                    <option value="">Geography</option>
                    {ALL_GEOGRAPHIES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </FilterSelect>

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
                        onTrack={handleTrack}
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
          )}

          {/* Explore > Funders */}
          {primaryTab === "explore" && subTab === "funders" && (
            <TabStub message="Funder search coming next" />
          )}

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
