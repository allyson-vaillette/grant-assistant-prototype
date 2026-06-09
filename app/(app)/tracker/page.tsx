"use client"

import Link from "next/link"
import { Telescope } from "lucide-react"
import {
  ORG,
  FUNDERS,
  OPPORTUNITIES,
  PIPELINE_OPPORTUNITIES,
} from "@/lib/mock-data"
import type { PipelineOpportunity, PipelineStatus } from "@/lib/types"

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_BADGE: Record<PipelineStatus, { bg: string; color: string; label: string }> = {
  researching: { bg: "var(--slate-tint)",    color: "var(--ink-tertiary)",   label: "Researching"  },
  applying:    { bg: "var(--slate-light)",   color: "var(--slate-primary)",  label: "Applying"     },
  submitted:   { bg: "var(--plum-tint)",     color: "var(--plum-soft)",      label: "Submitted"    },
  awarded:     { bg: "var(--evergreen-tint)",color: "var(--evergreen)",      label: "Awarded"      },
  denied:      { bg: "#F1F1F2",              color: "#6B6B7E",               label: "Denied"       },
}

const STATUS_GROUPS: { status: PipelineStatus; label: string; alwaysShow: boolean }[] = [
  { status: "researching", label: "Researching", alwaysShow: true  },
  { status: "applying",    label: "Applying",    alwaysShow: true  },
  { status: "submitted",   label: "Submitted",   alwaysShow: true  },
  { status: "awarded",     label: "Awarded",     alwaysShow: false },
  { status: "denied",      label: "Denied",      alwaysShow: false },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function getFunder(id: string) { return FUNDERS.find(f => f.id === id) }
function getOpportunity(id: string) { return OPPORTUNITIES.find(o => o.id === id) }

function pipelineStats() {
  const total = PIPELINE_OPPORTUNITIES.length
  const inPlay = PIPELINE_OPPORTUNITIES.reduce((sum, p) => {
    const opp = getOpportunity(p.opportunityId)
    const amt = opp?.amount?.replace(/[^0-9]/g, "")
    return sum + (amt ? parseInt(amt) : 0)
  }, 0)
  const submitted = PIPELINE_OPPORTUNITIES.filter(p =>
    ["submitted","awarded","denied"].includes(p.status)
  ).reduce((sum, p) => {
    const opp = getOpportunity(p.opportunityId)
    const amt = opp?.amount?.replace(/[^0-9]/g, "")
    return sum + (amt ? parseInt(amt) : 0)
  }, 0)
  return { total, inPlay, submitted }
}

function formatDollars(n: number) {
  return "$" + n.toLocaleString()
}

// ── Pipeline card ──────────────────────────────────────────────────────────

function PursuitCard({ pip }: { pip: PipelineOpportunity }) {
  const funder = getFunder(pip.funderId)
  const opp = getOpportunity(pip.opportunityId)
  const badge = STATUS_BADGE[pip.status]

  return (
    <Link href={`/pursuit/${pip.opportunityId}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--hair-2)",
          borderRadius: 12,
          padding: "16px 20px",
          cursor: "pointer",
          transition: "box-shadow 150ms, border-color 150ms",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.boxShadow = "0 2px 12px rgba(28,24,64,0.08)"
          el.style.borderColor = "rgba(74,96,128,0.25)"
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.boxShadow = "none"
          el.style.borderColor = "var(--hair-2)"
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 3px", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-tertiary)", lineHeight: 1 }}>
              {funder?.name}
            </p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: "19px" }}>
              {opp?.name}
            </p>
          </div>
          <span style={{ flexShrink: 0, display: "inline-block", padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: badge.bg, color: badge.color, lineHeight: "16px" }}>
            {badge.label}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
          {opp?.amount && (
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--slate-primary)" }}>{opp.amount}</span>
          )}
          {opp?.deadline && (
            <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
              {pip.status === "submitted" ? `Submitted ${pip.submittedAt}` : `Due ${opp.deadline}`}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const stats = pipelineStats()

  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--canvas)" }}>
      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        backgroundColor: "var(--canvas)",
        borderBottom: "1px solid var(--hair)",
        padding: "0 32px",
        height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>Tracker</span>
          <span style={{ fontSize: 13, color: "var(--ink-tertiary)", marginLeft: 8 }}>{ORG.name}</span>
        </div>
        <Link href="/discover" style={{ textDecoration: "none" }}>
          <button
            type="button"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 8,
              backgroundColor: "var(--slate-primary)", border: "none",
              fontSize: 12, fontWeight: 600, color: "#FFFFFF", cursor: "pointer",
              transition: "background-color 150ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
          >
            <Telescope size={13} />
            Discover opportunities
          </button>
        </Link>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 32px 64px" }}>
        {/* Stats */}
        <div style={{
          display: "flex", gap: 1,
          backgroundColor: "var(--surface)", border: "1px solid var(--hair-2)", borderRadius: 12, overflow: "hidden",
          marginBottom: 40,
        }}>
          {[
            { label: "In pipeline", value: String(stats.total) },
            { label: "Total in play", value: formatDollars(stats.inPlay) },
            { label: "Submitted", value: formatDollars(stats.submitted) },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: "16px 20px",
              borderRight: i < 2 ? "1px solid var(--hair)" : "none",
            }}>
              <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Pipeline grouped by status */}
        {STATUS_GROUPS.map(({ status, label, alwaysShow }) => {
          const items = PIPELINE_OPPORTUNITIES.filter(p => p.status === status)
          if (!alwaysShow && items.length === 0) return null
          return (
            <section key={status} style={{ marginBottom: 36 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase",
                  color: "var(--ink-tertiary)",
                }}>
                  {label}
                </span>
                <div style={{ flex: 1, height: 1, backgroundColor: "var(--hair)" }} />
                <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{items.length}</span>
              </div>

              {items.length === 0 ? (
                <div style={{
                  backgroundColor: "var(--surface-sunk)", border: "1px dashed var(--hair-2)",
                  borderRadius: 12, padding: "20px 24px",
                  textAlign: "center",
                }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>
                    No pursuits here yet.{" "}
                    <Link href="/discover" style={{ color: "var(--slate-secondary)", textDecoration: "none", fontWeight: 500 }}>
                      Discover opportunities →
                    </Link>
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map(pip => <PursuitCard key={pip.id} pip={pip} />)}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
