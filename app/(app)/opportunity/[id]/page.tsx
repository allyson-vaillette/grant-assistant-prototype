"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Check, AlertTriangle, ChevronRight } from "lucide-react"
import {
  FUNDERS, OPPORTUNITIES, MATCHES,
  getMatchForOpportunity, getPipelineForOpportunity,
} from "@/lib/mock-data"
import type { FunderType, MatchStrength } from "@/lib/types"

// ── Label maps ─────────────────────────────────────────────────────────────

const FUNDER_TYPE_LABELS: Record<FunderType, string> = {
  private_foundation:   "Private foundation",
  community_foundation: "Community foundation",
  government:           "Government",
  corporate_foundation: "Corporate foundation",
  public_charity:       "Public charity",
}

const MATCH_CONFIG: Record<MatchStrength, { label: string; color: string; dots: number }> = {
  strong:  { label: "Strong match",  color: "var(--evergreen)",    dots: 5 },
  good:    { label: "Good match",    color: "var(--slate-primary)", dots: 4 },
  partial: { label: "Partial match", color: "var(--ink-tertiary)", dots: 3 },
}

function MatchDots({ strength }: { strength: MatchStrength }) {
  const cfg = MATCH_CONFIG[strength]
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{
          width: 8, height: 8, borderRadius: "50%",
          backgroundColor: i < cfg.dots ? cfg.color : "var(--hair-2)",
        }} />
      ))}
    </span>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function OpportunityPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const opp = OPPORTUNITIES.find((o) => o.id === params.id)
  const funder = opp ? FUNDERS.find((f) => f.id === opp.funderId) : null
  const match = opp ? getMatchForOpportunity(opp.id) : null
  const existingPipeline = opp ? getPipelineForOpportunity(opp.id) : null

  if (!opp || !funder) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", backgroundColor: "var(--canvas)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--ink-tertiary)", marginBottom: 16 }}>Opportunity not found.</p>
          <Link href="/discover" style={{ fontSize: 13, color: "var(--slate-secondary)", textDecoration: "none" }}>← Back to Discover</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--canvas)" }}>
      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        backgroundColor: "var(--canvas)",
        borderBottom: "1px solid var(--hair)",
        padding: "0 32px",
        height: 52,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: "var(--ink-tertiary)", padding: 0,
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <span style={{ color: "var(--hair-2)", fontSize: 16 }}>·</span>
        <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>{funder.name}</span>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 32px 80px" }}>
        {/* Funder + opportunity header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{
              display: "inline-block", padding: "3px 9px", borderRadius: 20,
              fontSize: 11, fontWeight: 500, backgroundColor: "var(--slate-tint)", color: "var(--slate-secondary)",
            }}>
              {FUNDER_TYPE_LABELS[funder.type]}
            </span>
            {funder.website && (
              <a
                href={funder.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--slate-secondary)", textDecoration: "none" }}
              >
                {funder.name} <ExternalLink size={11} />
              </a>
            )}
          </div>
          <h1 style={{ margin: "0 0 10px", fontSize: 26, fontWeight: 700, color: "var(--ink)", lineHeight: "32px", letterSpacing: "-0.02em" }}>
            {opp.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {opp.amount && (
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--slate-primary)", letterSpacing: "-0.02em" }}>{opp.amount}</span>
            )}
            {opp.deadline && (
              <span style={{ fontSize: 14, color: "var(--ink-tertiary)" }}>
                {opp.deadline === "Rolling" ? "Rolling deadline" : `Due ${opp.deadline}`}
              </span>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div style={{
          display: "flex", gap: 32, flexWrap: "wrap",
          padding: "14px 0",
          borderTop: "1px solid var(--hair)", borderBottom: "1px solid var(--hair)",
          marginBottom: 28,
        }}>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Geography</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink)" }}>{funder.geography}</p>
          </div>
          {funder.fundingRange && (
            <div>
              <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Funding range</p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink)" }}>{funder.fundingRange}</p>
            </div>
          )}
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Unsolicited</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink)" }}>{funder.acceptsUnsolicited ? "Yes" : "No — LOI required"}</p>
          </div>
          <div>
            <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Focus areas</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink)" }}>{(opp.focusAreas ?? funder.focusAreas).join(" · ")}</p>
          </div>
        </div>

        {/* About */}
        {opp.description && (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>About this grant</h2>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ink-secondary)", lineHeight: "21px" }}>{opp.description}</p>
          </div>
        )}

        {/* Eligibility */}
        {opp.eligibility && (
          <div style={{
            marginBottom: 28,
            padding: "14px 18px", borderRadius: 10,
            backgroundColor: "var(--surface)", border: "1px solid var(--hair-2)",
          }}>
            <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Eligibility requirements</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>{opp.eligibility}</p>
          </div>
        )}

        {/* Funder description */}
        {funder.description && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>About {funder.name}</h2>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ink-secondary)", lineHeight: "21px" }}>{funder.description}</p>
          </div>
        )}

        {/* Match analysis */}
        {match && (
          <div style={{
            marginBottom: 32,
            padding: "20px 22px", borderRadius: 12,
            backgroundColor: "var(--surface)", border: "1px solid var(--hair-2)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Match analysis</h2>
              <MatchDots strength={match.matchStrength} />
              <span style={{ fontSize: 13, fontWeight: 600, color: MATCH_CONFIG[match.matchStrength].color }}>
                {MATCH_CONFIG[match.matchStrength].label}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {match.reasons.positive.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Check size={14} style={{ color: "var(--evergreen)", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>{r}</span>
                </div>
              ))}
              {match.reasons.cautions.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <AlertTriangle size={14} style={{ color: "var(--amber)", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {existingPipeline ? (
            <button
              type="button"
              onClick={() => router.push(`/pursuit/${existingPipeline.id}`)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 22px", borderRadius: 9,
                backgroundColor: "var(--slate-primary)", border: "none",
                fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: "pointer",
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
            >
              Open pursuit workspace <ChevronRight size={15} />
            </button>
          ) : (
            <button
              type="button"
              style={{
                padding: "10px 22px", borderRadius: 9,
                backgroundColor: "var(--slate-primary)", border: "none",
                fontSize: 14, fontWeight: 600, color: "#FFFFFF", cursor: "pointer",
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
            >
              Track this opportunity
            </button>
          )}
          <Link href="/discover" style={{ fontSize: 13, color: "var(--slate-secondary)", textDecoration: "none" }}>
            ← Back to Discover
          </Link>
        </div>
      </div>
    </div>
  )
}
