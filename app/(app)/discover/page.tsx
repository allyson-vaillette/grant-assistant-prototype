"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, ExternalLink, Check, AlertTriangle, ChevronRight } from "lucide-react"
import {
  FUNDERS, OPPORTUNITIES, MATCHES,
  getFunder, getMatchForOpportunity, getPipelineForOpportunity,
} from "@/lib/mock-data"
import type { Opportunity, FunderType, MatchStrength } from "@/lib/types"

// ── Constants ──────────────────────────────────────────────────────────────

const FUNDER_TYPE_LABELS: Record<FunderType, string> = {
  private_foundation:   "Private foundation",
  community_foundation: "Community foundation",
  government:           "Government",
  corporate_foundation: "Corporate foundation",
  public_charity:       "Public charity",
}

const MATCH_CONFIG: Record<MatchStrength, { label: string; color: string; dots: number }> = {
  strong:  { label: "Strong match",  color: "var(--evergreen)",     dots: 5 },
  good:    { label: "Good match",    color: "var(--slate-primary)",  dots: 4 },
  partial: { label: "Partial match", color: "var(--ink-tertiary)",   dots: 3 },
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

// ── Opportunity row ────────────────────────────────────────────────────────

function OppRow({ opp, selected, onClick }: {
  opp: Opportunity
  selected: boolean
  onClick: () => void
}) {
  const funder = getFunder(opp.funderId)
  const match = getMatchForOpportunity(opp.id)

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block", width: "100%", textAlign: "left",
        padding: "12px 16px", border: "none",
        borderBottom: "1px solid var(--hair)",
        backgroundColor: selected ? "var(--slate-tint)" : "transparent",
        cursor: "pointer",
        transition: "background-color 120ms",
        borderLeft: selected ? "2px solid var(--slate-primary)" : "2px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)"
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: "17px" }}>
          {opp.name}
        </p>
        {match && <MatchDots strength={match.matchStrength} />}
      </div>
      <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--ink-tertiary)" }}>{funder?.name}</p>
      <div style={{ display: "flex", gap: 10 }}>
        {opp.amount && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--slate-primary)" }}>{opp.amount}</span>
        )}
        {opp.deadline && (
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
            {opp.deadline === "Rolling" ? "Rolling deadline" : `Due ${opp.deadline}`}
          </span>
        )}
      </div>
    </button>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────

function DetailPanel({ opp }: { opp: Opportunity }) {
  const router = useRouter()
  const funder = getFunder(opp.funderId)
  const match = getMatchForOpportunity(opp.id)
  const existingPipeline = getPipelineForOpportunity(opp.id)

  if (!funder) return null

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "24px 28px" }}>
      {/* Funder header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{
            display: "inline-block", padding: "2px 8px", borderRadius: 20,
            fontSize: 11, fontWeight: 500, backgroundColor: "var(--slate-tint)", color: "var(--slate-secondary)",
          }}>
            {FUNDER_TYPE_LABELS[funder.type]}
          </span>
          {funder.website && (
            <a href={funder.website} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--slate-secondary)", textDecoration: "none" }}
              onClick={(e) => e.stopPropagation()}
            >
              {funder.name} <ExternalLink size={10} />
            </a>
          )}
        </div>
        <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "var(--ink)", lineHeight: "22px" }}>
          {opp.name}
        </h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {opp.amount && (
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--slate-primary)" }}>{opp.amount}</span>
          )}
          {opp.deadline && (
            <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>
              {opp.deadline === "Rolling" ? "Rolling deadline" : `Due ${opp.deadline}`}
            </span>
          )}
        </div>
      </div>

      {/* Funder geography + funding range */}
      <div style={{
        display: "flex", gap: 24, padding: "12px 0",
        borderTop: "1px solid var(--hair)", borderBottom: "1px solid var(--hair)", marginBottom: 20,
      }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Geography</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ink)" }}>{funder.geography}</p>
        </div>
        {funder.fundingRange && (
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Funding range</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink)" }}>{funder.fundingRange}</p>
          </div>
        )}
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Unsolicited</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ink)" }}>{funder.acceptsUnsolicited ? "Yes" : "No — LOI required"}</p>
        </div>
      </div>

      {/* About */}
      {opp.description && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>About this grant</p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>{opp.description}</p>
        </div>
      )}

      {/* Eligibility */}
      {opp.eligibility && (
        <div style={{ marginBottom: 20, padding: "12px 14px", backgroundColor: "var(--surface-sunk)", borderRadius: 8, border: "1px solid var(--hair)" }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Eligibility</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ink-secondary)", lineHeight: "18px" }}>{opp.eligibility}</p>
        </div>
      )}

      {/* Match analysis */}
      {match && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Match analysis</p>
            <MatchDots strength={match.matchStrength} />
            <span style={{ fontSize: 12, fontWeight: 600, color: MATCH_CONFIG[match.matchStrength].color }}>
              {MATCH_CONFIG[match.matchStrength].label}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {match.reasons.positive.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Check size={13} style={{ color: "var(--evergreen)", flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>{r}</span>
              </div>
            ))}
            {match.reasons.cautions.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <AlertTriangle size={13} style={{ color: "var(--amber)", flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ display: "flex", gap: 10 }}>
        {existingPipeline ? (
          <button
            type="button"
            onClick={() => router.push(`/pursuit/${existingPipeline.id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 18px", borderRadius: 8,
              backgroundColor: "var(--slate-primary)", border: "none",
              fontSize: 13, fontWeight: 600, color: "#FFFFFF", cursor: "pointer",
              transition: "background-color 150ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
          >
            View pursuit <ChevronRight size={14} />
          </button>
        ) : (
          <>
            <Link href={`/opportunity/${opp.id}`} style={{ textDecoration: "none" }}>
              <button
                type="button"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "9px 18px", borderRadius: 8,
                  backgroundColor: "var(--slate-primary)", border: "none",
                  fontSize: 13, fontWeight: 600, color: "#FFFFFF", cursor: "pointer",
                  transition: "background-color 150ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
              >
                View opportunity
              </button>
            </Link>
          </>
        )}
        <Link href={`/opportunity/${opp.id}`} style={{ textDecoration: "none" }}>
          <button
            type="button"
            style={{
              padding: "9px 16px", borderRadius: 8,
              border: "1px solid var(--hair-2)", backgroundColor: "transparent",
              fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer",
              transition: "background-color 150ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            Full details
          </button>
        </Link>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<FunderType | "">("")
  const [selectedId, setSelectedId] = useState<string>(OPPORTUNITIES[0]?.id ?? "")

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

  const selectedOpp = OPPORTUNITIES.find(o => o.id === selectedId) ?? filtered[0]

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* Left panel */}
      <div style={{
        width: 340, flexShrink: 0,
        display: "flex", flexDirection: "column",
        borderRight: "1px solid var(--hair)",
        backgroundColor: "var(--surface)",
        height: "100%",
      }}>
        {/* Search + filter */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--hair)", flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 9,
            border: "1px solid var(--hair-2)",
            backgroundColor: "var(--canvas)",
            marginBottom: 10,
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
              width: "100%", padding: "6px 10px", borderRadius: 7,
              border: "1px solid var(--hair-2)", backgroundColor: "var(--canvas)",
              fontSize: 12, color: "var(--ink-secondary)", outline: "none", cursor: "pointer",
            }}
          >
            <option value="">All funder types</option>
            {(Object.keys(FUNDER_TYPE_LABELS) as FunderType[]).map(t => (
              <option key={t} value={t}>{FUNDER_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {/* Count */}
        <div style={{ padding: "8px 16px 4px", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>
            {filtered.length} {filtered.length === 1 ? "opportunity" : "opportunities"}
          </span>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map(opp => (
            <OppRow
              key={opp.id}
              opp={opp}
              selected={opp.id === selectedId}
              onClick={() => setSelectedId(opp.id)}
            />
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "40px 16px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>No results for this search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, backgroundColor: "var(--canvas)", overflow: "hidden" }}>
        {selectedOpp ? (
          <DetailPanel opp={selectedOpp} />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <p style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>Select an opportunity to view details.</p>
          </div>
        )}
      </div>
    </div>
  )
}
