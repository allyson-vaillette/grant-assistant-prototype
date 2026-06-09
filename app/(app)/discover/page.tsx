"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Check, ArrowRight } from "lucide-react"
import {
  OPPORTUNITIES, MATCHES, PROJECTS,
  getFunder, getMatchForOpportunity,
} from "@/lib/mock-data"
import type { Opportunity, FunderType, MatchStrength, Match } from "@/lib/types"

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

const PROJECT = PROJECTS[0]

// Only strong matches surface in the top section — bias toward precision
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

function MatchCard({ match, opp, onDismiss }: {
  match: Match
  opp: Opportunity
  onDismiss: () => void
}) {
  const router = useRouter()
  const funder = getFunder(opp.funderId)
  const cfg = MATCH_CONFIG[match.matchStrength]
  const primaryReason = match.reasons.positive[0]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/opportunity/${opp.id}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/opportunity/${opp.id}`)}
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

      {/* Opp name + funder */}
      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "var(--ink)", lineHeight: "20px", paddingRight: 24 }}>
        {opp.name}
      </p>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ink-tertiary)" }}>
        {funder?.name}
      </p>

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

function EmptyMatches({ onBrowseAll }: { onBrowseAll: () => void }) {
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
        Add program details to the {PROJECT.name} project — focus areas, geography, and eligibility criteria — so Grant Assistant can surface strong fits.
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

function CatalogueCard({ opp }: { opp: Opportunity }) {
  const router = useRouter()
  const funder = getFunder(opp.funderId)
  const match = getMatchForOpportunity(opp.id)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/opportunity/${opp.id}`)}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/opportunity/${opp.id}`)}
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
      {/* Funder type badge + match dots */}
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

      {/* Name + funder */}
      <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "var(--ink)", lineHeight: "18px" }}>
        {opp.name}
      </p>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ink-tertiary)" }}>{funder?.name}</p>

      {/* Amount + deadline */}
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

// ── Page ───────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [matchesLoaded, setMatchesLoaded] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<FunderType | "">("")
  const browseRef = useRef<HTMLDivElement>(null)

  // Matches resolve after the catalogue — simulate async analysis
  useEffect(() => {
    const t = setTimeout(() => setMatchesLoaded(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const visibleMatches = STRONG_MATCHES.filter(({ match }) => !dismissedIds.has(match.id))

  const handleDismiss = (matchId: string) => {
    setDismissedIds(prev => { const next = new Set(prev); next.add(matchId); return next })
  }

  const scrollToBrowse = () => {
    browseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const filtered = OPPORTUNITIES.filter((opp) => {
    const funder = getFunder(opp.funderId)
    if (!funder) return false
    if (typeFilter && funder.type !== typeFilter) return false
    if (query.trim()) {
      const q = query.toLowerCase()
      if (
        !opp.name.toLowerCase().includes(q) &&
        !funder.name.toLowerCase().includes(q) &&
        !(opp.focusAreas ?? []).some(fa => fa.toLowerCase().includes(q))
      ) return false
    }
    return true
  })

  return (
    <div style={{ height: "100%", overflowY: "auto", backgroundColor: "var(--canvas)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "36px 32px 80px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
            Discover
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>
            Funding opportunities for {PROJECT.name}
          </p>
        </div>

        {/* ── Matches ──────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--slate-primary)", userSelect: "none" }}>
              auto_fix_high
            </span>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
              Matched for {PROJECT.name}
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

          {!matchesLoaded ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <SkeletonMatchCard />
              <SkeletonMatchCard />
              <SkeletonMatchCard />
            </div>
          ) : visibleMatches.length === 0 ? (
            <EmptyMatches onBrowseAll={scrollToBrowse} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {visibleMatches.map(({ match, opp }) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  opp={opp}
                  onDismiss={() => handleDismiss(match.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Browse ───────────────────────────────────────────────────── */}
        <section ref={browseRef}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
              Browse
            </h2>
            <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
              {filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"}
            </span>
          </div>

          {/* Toolbar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: "var(--radius-input)",
              border: "1px solid var(--hair-2)",
              backgroundColor: "var(--surface)",
            }}>
              <Search size={13} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search opportunities and funders"
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  fontSize: 13, color: "var(--ink)", lineHeight: "17px",
                }}
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as FunderType | "")}
              style={{
                padding: "8px 12px", borderRadius: "var(--radius-input)",
                border: "1px solid var(--hair-2)", backgroundColor: "var(--surface)",
                fontSize: 12, color: "var(--ink-secondary)", outline: "none", cursor: "pointer",
              }}
            >
              <option value="">All funder types</option>
              {(Object.keys(FUNDER_TYPE_LABELS) as FunderType[]).map(t => (
                <option key={t} value={t}>{FUNDER_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          {/* Cards */}
          {filtered.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {filtered.map(opp => (
                <CatalogueCard key={opp.id} opp={opp} />
              ))}
            </div>
          ) : (
            <div style={{ padding: "56px 0", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>No results for this search.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
