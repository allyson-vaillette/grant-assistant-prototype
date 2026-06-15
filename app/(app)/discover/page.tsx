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
import type { Opportunity, Funder, FunderType, MatchStrength, Match } from "@/lib/types"
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
  return `${short} · ${days}d left`
}

// ── Catalogue card (Matches > Opportunities) ───────────────────────────────

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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {funder && <FunderAvatar name={funder.name} size={32} />}
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
        {match && cfg && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <MatchDots strength={match.matchStrength} />
            <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, whiteSpace: "nowrap" }}>{cfg.label}</span>
          </div>
        )}
      </div>

      <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: "18px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {opp.name}
      </p>

      {match && primaryReason && (
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 10 }}>
          <Check size={12} style={{ color: "var(--evergreen)", flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {primaryReason}
          </span>
        </div>
      )}

      <div style={{ borderTop: "0.5px solid var(--hair)", margin: `${match && primaryReason ? 0 : 10}px 0 10px` }} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 8 }}>
        {opp.amount && (
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{opp.amount}</span>
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

      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {tags.map(tag => (
            <span key={tag} style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", padding: "2px 8px", borderRadius: 20, backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)" }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: "auto" }}>
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
          onClick={(e) => { e.stopPropagation(); if (pipeline) { router.push(`/pursuit/${opp.id}`) } else { onTrack(opp.id) } }}
          style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid var(--slate-primary)", backgroundColor: "var(--slate-primary)", fontSize: 12, fontWeight: 600, color: "#ffffff", cursor: "pointer", transition: "background-color 120ms, border-color 120ms" }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = "var(--slate-secondary)"; el.style.borderColor = "var(--slate-secondary)" }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = "var(--slate-primary)"; el.style.borderColor = "var(--slate-primary)" }}
        >
          {pipeline ? "Open" : "Track"}
        </button>
      </div>
    </div>
  )
}

// ── Matched funder card (Matches > Funders) ────────────────────────────────

function MatchedFunderCard({ match, funder, onFunderClick }: {
  match: Match
  funder: Funder
  onFunderClick: (funderId: string) => void
}) {
  const cfg = MATCH_CONFIG[match.matchStrength]
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
        <FunderAvatar name={funder.name} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {funder.name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {FUNDER_TYPE_LABELS[funder.type]}{funder.location ? ` · ${funder.location}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <MatchDots strength={match.matchStrength} />
          <span style={{ fontSize: 10, fontWeight: 600, color: cfg.color, whiteSpace: "nowrap" }}>{cfg.label}</span>
        </div>
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

// ── Explore opportunity row (Explore > Opportunities) ──────────────────────

function ExploreOpportunityRow({ opp, isFirst, onOppClick, onTrack }: {
  opp: Opportunity
  isFirst: boolean
  onOppClick: (oppId: string, el: HTMLElement) => void
  onTrack: (oppId: string) => void
}) {
  const router = useRouter()
  const funder = getFunder(opp.funderId)
  const match = getMatchForOpportunity(opp.id)
  const pipeline = getPipelineForOpportunity(opp.id)
  const cfg = match ? MATCH_CONFIG[match.matchStrength] : null
  const focusTags = opp.focusAreas ?? []
  const visibleTags = focusTags.slice(0, 2)
  const overflowCount = Math.max(0, focusTags.length - 2)

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
        display: "flex", alignItems: "center", gap: 16,
        padding: "12px 8px",
        borderTop: !isFirst ? "0.5px solid var(--hair)" : "none",
        cursor: "pointer",
        transition: "background-color 120ms",
        borderRadius: 6,
        marginLeft: -8, marginRight: -8,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--surface)" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
    >
      {/* Left: title + funder */}
      <div style={{ flex: "0 0 260px", minWidth: 0 }}>
        <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {opp.name}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {funder?.name}{funder ? ` · ${FUNDER_TYPE_LABELS[funder.type]}` : ""}
        </p>
      </div>

      {/* Middle: focus area tags */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, overflow: "hidden" }}>
        {visibleTags.map(tag => (
          <span key={tag} style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", padding: "2px 8px", borderRadius: 20, backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)", whiteSpace: "nowrap", flexShrink: 0 }}>
            {tag}
          </span>
        ))}
        {overflowCount > 0 && (
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)", padding: "2px 8px", borderRadius: 20, backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)", whiteSpace: "nowrap", flexShrink: 0 }}>
            +{overflowCount}
          </span>
        )}
      </div>

      {/* Right cluster */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {cfg && (
          <span style={{ fontSize: 11, fontWeight: 500, color: cfg.color, padding: "2px 7px", borderRadius: 20, backgroundColor: cfg.bg, whiteSpace: "nowrap" }}>
            {cfg.label.replace(" match", "")}
          </span>
        )}
        {opp.amount && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-secondary)", whiteSpace: "nowrap" }}>
            {opp.amount}
          </span>
        )}
        {opp.deadline && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
            <CalendarDays size={11} />
            {daysLabel(opp.deadline)}
          </span>
        )}
        {opp.eligibilityLabel && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: eligColor, whiteSpace: "nowrap" }}>
            <Check size={11} />
            {opp.eligibilityLabel}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOppClick(opp.id, e.currentTarget as HTMLElement) }}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "var(--slate-secondary)", padding: "0 2px", textDecoration: "underline", textUnderlineOffset: 2, whiteSpace: "nowrap", transition: "color 120ms" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--slate-primary)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--slate-secondary)" }}
        >
          View details
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (pipeline) { router.push(`/pursuit/${opp.id}`) } else { onTrack(opp.id) } }}
          style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--hair-2)", backgroundColor: "transparent", fontSize: 12, fontWeight: 600, color: "var(--slate-secondary)", cursor: "pointer", whiteSpace: "nowrap", transition: "background-color 120ms, border-color 120ms" }}
          onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = "var(--slate-tint)"; el.style.borderColor = "var(--slate-light)" }}
          onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.backgroundColor = "transparent"; el.style.borderColor = "var(--hair-2)" }}
        >
          {pipeline ? "Open" : "Track"}
        </button>
      </div>
    </div>
  )
}

// ── Explore funder row (Explore > Funders) ─────────────────────────────────

function ExploreFunderRow({ funder, isFirst, onFunderClick }: {
  funder: Funder
  isFirst: boolean
  onFunderClick: (funderId: string) => void
}) {
  const match = MATCHES.find(m => m.funderId === funder.id)
  const cfg = match ? MATCH_CONFIG[match.matchStrength] : null
  const oppCount = matchedOppCount(funder.id)
  const visibleFocus = funder.focusAreas.slice(0, 2)
  const overflowCount = Math.max(0, funder.focusAreas.length - 2)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onFunderClick(funder.id)}
      onKeyDown={(e) => e.key === "Enter" && onFunderClick(funder.id)}
      style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "12px 8px",
        borderTop: !isFirst ? "0.5px solid var(--hair)" : "none",
        cursor: "pointer",
        transition: "background-color 120ms",
        borderRadius: 6,
        marginLeft: -8, marginRight: -8,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--surface)" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
    >
      {/* Left: funder identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 280px", minWidth: 0 }}>
        <FunderAvatar name={funder.name} size={32} />
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {funder.name}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {FUNDER_TYPE_LABELS[funder.type]}{funder.location ? ` · ${funder.location}` : ""}
          </p>
        </div>
      </div>

      {/* Middle: focus areas */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, overflow: "hidden" }}>
        {visibleFocus.map(fa => (
          <span key={fa} style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", padding: "2px 8px", borderRadius: 20, backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)", whiteSpace: "nowrap", flexShrink: 0 }}>
            {fa}
          </span>
        ))}
        {overflowCount > 0 && (
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)", padding: "2px 8px", borderRadius: 20, backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)", whiteSpace: "nowrap", flexShrink: 0 }}>
            +{overflowCount}
          </span>
        )}
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        {cfg && (
          <span style={{ fontSize: 11, fontWeight: 500, color: cfg.color, padding: "2px 7px", borderRadius: 20, backgroundColor: cfg.bg, whiteSpace: "nowrap" }}>
            {cfg.label.replace(" match", "")}
          </span>
        )}
        {oppCount > 0 && (
          <span style={{ fontSize: 12, color: "var(--slate-secondary)", fontWeight: 500, whiteSpace: "nowrap" }}>
            {oppCount} matched {oppCount === 1 ? "opportunity" : "opportunities"}
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFunderClick(funder.id) }}
          style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--hair-2)", backgroundColor: "transparent", fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", cursor: "pointer", whiteSpace: "nowrap", transition: "background-color 120ms" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
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
  const { scopeLabel, selectedProjectId } = useScope()

  // objectType persists across primary tab switches
  const [primaryTab, setPrimaryTab] = useState<"matches" | "explore">("matches")
  const [objectType, setObjectType] = useState<"opportunities" | "funders">("opportunities")

  // Explore filters
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
  }, [primaryTab, objectType])

  const handleOppClick = useCallback((oppId: string, el: HTMLElement) => {
    lastFocusedRef.current = el
    router.push(`/discover?opp=${oppId}`)
  }, [router])

  const handleClose = useCallback(() => {
    router.push("/discover")
  }, [router])

  const handleFunderClick = useCallback((_funderId: string) => {
    // funder detail route placeholder
  }, [])

  const handleTrack = useCallback((oppId: string) => {
    const pip = createPipelineOpportunity(oppId, selectedProjectId ?? "proj-general")
    router.push(`/pursuit/${pip.opportunityId}`)
  }, [router, selectedProjectId])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Filtered + sorted opportunities
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

  const sortedOpps = [...filtered].sort((a, b) => {
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
    if (focusAreaFilter && !funder.focusAreas.includes(focusAreaFilter)) return false
    if (geographyFilter && funder.geography !== geographyFilter) return false
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

  const sortedMatchedOpps = [...filteredMatchedOpps].sort((a, b) => {
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
    if (focusAreaFilter && !funder.focusAreas.includes(focusAreaFilter)) return false
    if (geographyFilter && funder.geography !== geographyFilter) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      const searchable = [funder.name, funder.description ?? "", ...funder.focusAreas, funder.geography].join(" ").toLowerCase()
      if (!searchable.includes(q)) return false
    }
    return true
  })

  const hasActiveFilters = !!(typeFilter || focusAreaFilter || geographyFilter || awardRangeFilter || deadlineFilter)

  function clearFilters() {
    setTypeFilter(""); setFocusAreaFilter(""); setGeographyFilter("")
    setAwardRangeFilter(""); setDeadlineFilter("")
  }

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    typeFilter       ? { key: "type",     label: `Funder type: ${FUNDER_TYPE_LABELS[typeFilter]}`,  onRemove: () => setTypeFilter("") }      : null,
    focusAreaFilter  ? { key: "focus",    label: `Focus area: ${focusAreaFilter}`,                   onRemove: () => setFocusAreaFilter("") } : null,
    geographyFilter  ? { key: "geo",      label: `Geography: ${geographyFilter}`,                    onRemove: () => setGeographyFilter("") } : null,
    awardRangeFilter ? { key: "award",    label: `Award: ${AWARD_RANGE_LABELS[awardRangeFilter]}`,   onRemove: () => setAwardRangeFilter("") }: null,
    deadlineFilter   ? { key: "deadline", label: DEADLINE_LABELS[deadlineFilter],                    onRemove: () => setDeadlineFilter("") }  : null,
  ].filter((c): c is NonNullable<typeof c> => c !== null)

  // Segment counts shown in Matches mode only
  const segmentOppCount = primaryTab === "matches" ? STRONG_MATCHES.length : null
  const segmentFunderCount = primaryTab === "matches" ? MATCHED_FUNDERS.length : null

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
                  {tab === "matches" ? "Matches" : "Explore"}
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
            {/* Search */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: "var(--radius-input)", border: "1px solid var(--hair-2)", backgroundColor: "var(--surface)", marginBottom: 8 }}>
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

            {/* Filters + sort */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: activeChips.length > 0 ? 8 : 0 }}>
              {objectType === "opportunities" && (
                <FilterSelect value={typeFilter} onChange={(v) => setTypeFilter(v as FunderType | "")}>
                  <option value="">Funder type</option>
                  {(Object.keys(FUNDER_TYPE_LABELS) as FunderType[]).map(t => (
                    <option key={t} value={t}>{FUNDER_TYPE_LABELS[t]}</option>
                  ))}
                </FilterSelect>
              )}

              <FilterSelect value={focusAreaFilter} onChange={setFocusAreaFilter}>
                <option value="">Focus area</option>
                {ALL_FOCUS_AREAS.map(fa => <option key={fa} value={fa}>{fa}</option>)}
              </FilterSelect>

              <FilterSelect value={geographyFilter} onChange={setGeographyFilter}>
                <option value="">Geography</option>
                {ALL_GEOGRAPHIES.map(g => <option key={g} value={g}>{g}</option>)}
              </FilterSelect>

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

              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
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
                {activeChips.length >= 2 && (
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
                    <CatalogueCard key={opp.id} opp={opp} onOppClick={handleOppClick} onTrack={handleTrack} />
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
                  {filteredMatchedFunders.map(({ match, funder }) => (
                    <MatchedFunderCard key={funder.id} match={match} funder={funder} onFunderClick={handleFunderClick} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Explore > Opportunities */}
          {primaryTab === "explore" && objectType === "opportunities" && (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--ink-tertiary)" }}>
                {sortedOpps.length} {sortedOpps.length === 1 ? "opportunity" : "opportunities"}
              </p>
              {sortedOpps.length > 0 ? (
                <div>
                  {sortedOpps.map((opp, i) => (
                    <ExploreOpportunityRow
                      key={opp.id}
                      opp={opp}
                      isFirst={i === 0}
                      onOppClick={handleOppClick}
                      onTrack={handleTrack}
                    />
                  ))}
                </div>
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
              <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--ink-tertiary)" }}>
                {sortedFunders.length} {sortedFunders.length === 1 ? "funder" : "funders"}
              </p>
              {sortedFunders.length > 0 ? (
                <div>
                  {sortedFunders.map((funder, i) => (
                    <ExploreFunderRow
                      key={funder.id}
                      funder={funder}
                      isFirst={i === 0}
                      onFunderClick={handleFunderClick}
                    />
                  ))}
                </div>
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
