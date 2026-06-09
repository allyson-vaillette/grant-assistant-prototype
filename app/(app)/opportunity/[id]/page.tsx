"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, Check, AlertTriangle, ChevronRight, Loader2, AlertCircle } from "lucide-react"
import {
  FUNDERS, OPPORTUNITIES, PROJECTS,
  getMatchForOpportunity,
  getPipelineForOpportunityAndProject,
  createPipelineOpportunity,
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

const MATCH_CONFIG: Record<MatchStrength, { label: string; color: string; bg: string; dots: number }> = {
  strong:  { label: "Strong match",  color: "var(--evergreen)",    bg: "var(--evergreen-tint)", dots: 5 },
  good:    { label: "Good match",    color: "var(--slate-primary)", bg: "var(--slate-tint)",    dots: 4 },
  partial: { label: "Partial match", color: "var(--ink-tertiary)", bg: "var(--canvas)",         dots: 3 },
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

// ── Pursue state machine ───────────────────────────────────────────────────

type PursuePhase =
  | { tag: "idle" }
  | { tag: "picking" }         // project picker open (only when PROJECTS.length > 1)
  | { tag: "loading" }
  | { tag: "error"; message: string }

// ── Page ───────────────────────────────────────────────────────────────────

export default function OpportunityPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const opp = OPPORTUNITIES.find((o) => o.id === params.id)
  const funder = opp ? FUNDERS.find((f) => f.id === opp.funderId) : null
  const match = opp ? getMatchForOpportunity(opp.id) : null

  // Default project — in a real app this would come from Tracker route context
  const defaultProject = PROJECTS[0]
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProject?.id ?? "")
  const [phase, setPhase] = useState<PursuePhase>({ tag: "idle" })

  const activeProjectId = PROJECTS.length === 1
    ? (PROJECTS[0]?.id ?? "")
    : selectedProjectId

  // Recompute after any pursue so the already-pursuing state updates
  const existingPipeline = opp
    ? getPipelineForOpportunityAndProject(opp.id, activeProjectId)
    : null

  if (!opp || !funder) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", backgroundColor: "var(--canvas)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--ink-tertiary)", marginBottom: 16 }}>Opportunity not found.</p>
          <button type="button" onClick={() => router.push("/discover")}
            style={{ fontSize: 13, color: "var(--slate-secondary)", background: "none", border: "none", cursor: "pointer" }}>
            ← Back to Discover
          </button>
        </div>
      </div>
    )
  }

  // ── Pursue handler ─────────────────────────────────────────────────────

  function handlePursueClick() {
    // If multiple projects, open picker first
    if (PROJECTS.length > 1 && phase.tag === "idle") {
      setPhase({ tag: "picking" })
      return
    }
    executePursue(activeProjectId)
  }

  async function executePursue(projectId: string) {
    if (!opp) return
    setPhase({ tag: "loading" })
    try {
      const pip = createPipelineOpportunity(opp.id, projectId)
      router.push(`/opportunity/${pip.opportunityId}/workspace`)
    } catch {
      setPhase({ tag: "error", message: "Something went wrong. Your pursuit was not created — please try again." })
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--canvas)" }}>

      {/* Top bar */}
      <div style={{
        flexShrink: 0, zIndex: 10,
        backgroundColor: "var(--canvas)",
        borderBottom: "1px solid var(--hair)",
        padding: "0 32px", height: 52,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          type="button"
          onClick={() => router.push("/discover")}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: "var(--ink-tertiary)", padding: 0,
            transition: "color 120ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)" }}
        >
          <ArrowLeft size={14} /> Discover
        </button>
        <span style={{ color: "var(--hair-2)", fontSize: 16 }}>·</span>
        <span style={{ fontSize: 13, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {funder.name}
        </span>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "36px 32px 48px" }}>

          {/* Hero */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{
                display: "inline-block", padding: "3px 9px", borderRadius: 20,
                fontSize: 11, fontWeight: 500,
                backgroundColor: "var(--slate-tint)", color: "var(--slate-secondary)",
              }}>
                {FUNDER_TYPE_LABELS[funder.type]}
              </span>
              {funder.website && (
                <a href={funder.website} target="_blank" rel="noopener noreferrer"
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

          {/* About this grant */}
          {opp.description && (
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>About this grant</h2>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ink-secondary)", lineHeight: "21px" }}>{opp.description}</p>
            </div>
          )}

          {/* Eligibility */}
          {opp.eligibility && (
            <div style={{
              marginBottom: 28, padding: "14px 18px", borderRadius: 10,
              backgroundColor: "var(--surface)", border: "1px solid var(--hair-2)",
            }}>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                Eligibility requirements
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>{opp.eligibility}</p>
            </div>
          )}

          {/* About funder */}
          {funder.description && (
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>About {funder.name}</h2>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ink-secondary)", lineHeight: "21px" }}>{funder.description}</p>
            </div>
          )}

          {/* Match analysis */}
          {match && (
            <div style={{
              marginBottom: 32, padding: "20px 22px", borderRadius: 12,
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

        </div>
      </div>

      {/* ── Bottom action bar ──────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        borderTop: "1px solid var(--hair)",
        backgroundColor: "var(--surface)",
        padding: "0 32px",
      }}>

        {/* Project picker (only when multiple projects) */}
        {PROJECTS.length > 1 && phase.tag === "picking" && (
          <div style={{
            borderBottom: "1px solid var(--hair)",
            padding: "16px 0",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <span style={{ fontSize: 13, color: "var(--ink-secondary)", whiteSpace: "nowrap" }}>Add to project</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {PROJECTS.map(proj => (
                <label key={proj.id}
                  style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--ink)" }}
                >
                  <input
                    type="radio"
                    name="project"
                    value={proj.id}
                    checked={selectedProjectId === proj.id}
                    onChange={() => setSelectedProjectId(proj.id)}
                    style={{ accentColor: "var(--slate-primary)", width: 14, height: 14 }}
                  />
                  {proj.name}
                  {proj.isDefault && (
                    <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>(default)</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Error banner */}
        {phase.tag === "error" && (
          <div style={{
            borderBottom: "1px solid var(--hair)",
            padding: "12px 0",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <AlertCircle size={15} style={{ color: "var(--error)", flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "var(--error)", flex: 1 }}>{phase.message}</span>
            <button
              type="button"
              onClick={() => executePursue(activeProjectId)}
              style={{
                padding: "6px 14px", borderRadius: 7,
                border: "1px solid var(--error)", backgroundColor: "transparent",
                fontSize: 12, fontWeight: 600, color: "var(--error)", cursor: "pointer",
                transition: "background-color 120ms",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--error-light)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Main action row */}
        <div style={{ height: 64, display: "flex", alignItems: "center", gap: 14 }}>

          {existingPipeline ? (
            // Already pursuing this opp+project
            <>
              <button
                type="button"
                onClick={() => router.push(`/opportunity/${opp.id}/workspace`)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "9px 20px", borderRadius: 9,
                  backgroundColor: "var(--slate-primary)", border: "none",
                  fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer",
                  transition: "background-color 150ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
              >
                Open workspace <ChevronRight size={15} />
              </button>
              <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>
                Already pursuing this grant
              </span>
            </>
          ) : phase.tag === "loading" ? (
            // Creating...
            <button
              type="button"
              disabled
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 20px", borderRadius: 9,
                backgroundColor: "var(--slate-tint)", border: "none",
                fontSize: 14, fontWeight: 600, color: "var(--ink-tertiary)", cursor: "default",
              }}
            >
              <Loader2 size={15} className="animate-spin" /> Creating pursuit…
            </button>
          ) : phase.tag === "picking" ? (
            // Project picker confirm/cancel
            <>
              <button
                type="button"
                onClick={() => executePursue(selectedProjectId)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "9px 20px", borderRadius: 9,
                  backgroundColor: "var(--slate-primary)", border: "none",
                  fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer",
                  transition: "background-color 150ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
              >
                Pursue <ChevronRight size={15} />
              </button>
              <button
                type="button"
                onClick={() => setPhase({ tag: "idle" })}
                style={{
                  padding: "9px 16px", borderRadius: 9,
                  border: "1px solid var(--hair-2)", backgroundColor: "transparent",
                  fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer",
                  transition: "background-color 120ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
              >
                Cancel
              </button>
            </>
          ) : (
            // Idle — primary Pursue button
            <button
              type="button"
              onClick={handlePursueClick}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "9px 20px", borderRadius: 9,
                backgroundColor: "var(--slate-primary)", border: "none",
                fontSize: 14, fontWeight: 600, color: "#fff", cursor: "pointer",
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
            >
              Pursue <ChevronRight size={15} />
            </button>
          )}

        </div>
      </div>
    </div>
  )
}
