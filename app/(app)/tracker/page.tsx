"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ContentContainer } from "@/components/layout/content-container"
import { useRouter } from "next/navigation"
import { Telescope, ChevronDown } from "lucide-react"
import {
  FUNDERS, OPPORTUNITIES, PIPELINE_OPPORTUNITIES,
} from "@/lib/mock-data"
import { useScope } from "@/lib/scope-context"
import type { PipelineOpportunity, PipelineStatus, PipelinePhase } from "@/lib/types"
import { phaseFromStatus } from "@/lib/types"

type TrackerTab = "prospecting" | "applications" | "awards"

const TAB_TO_PHASE: Record<TrackerTab, PipelinePhase> = {
  prospecting:  "researching",
  applications: "applications",
  awards:       "awards",
}

// ── Phase config ───────────────────────────────────────────────────────────

const PHASE_COLOR: Record<PipelinePhase, { bg: string; color: string }> = {
  researching:  { bg: "var(--slate-tint)",     color: "var(--ink-tertiary)" },
  applications: { bg: "var(--plum-tint)",      color: "var(--plum-soft)"   },
  awards:       { bg: "var(--evergreen-tint)", color: "var(--evergreen)"   },
}

const STATUS_LABEL: Record<PipelineStatus, string> = {
  "researching":              "Researching",
  "planned":                  "Planned",
  "loi-in-progress":          "LOI In Progress",
  "loi-submitted":            "LOI Submitted",
  "application-in-progress":  "Application In Progress",
  "application-submitted":    "Application Submitted",
  "declined":                 "Declined",
  "abandoned":                "Abandoned",
  "awarded-active":           "Awarded - Active",
  "awarded-closed":           "Awarded — Closed",
}

const STATUS_GROUPS_FOR_DROPDOWN: { phase: PipelinePhase; label: string; statuses: PipelineStatus[] }[] = [
  {
    phase: "researching",
    label: "Researching",
    statuses: ["researching"],
  },
  {
    phase: "applications",
    label: "Applications",
    statuses: [
      "planned",
      "loi-in-progress",
      "loi-submitted",
      "application-in-progress",
      "application-submitted",
      "declined",
      "abandoned",
    ],
  },
  {
    phase: "awards",
    label: "Awards",
    statuses: ["awarded-active", "awarded-closed"],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function getFunder(id: string) { return FUNDERS.find(f => f.id === id) }
function getOpportunity(id: string) { return OPPORTUNITIES.find(o => o.id === id) }

function pipelineStats(pipelines: PipelineOpportunity[]) {
  const total = pipelines.length
  const inPlay = pipelines.reduce((sum, p) => {
    const opp = getOpportunity(p.opportunityId)
    const amt = opp?.amount?.replace(/[^0-9]/g, "")
    return sum + (amt ? parseInt(amt) : 0)
  }, 0)
  const submitted = pipelines.filter(p => !!p.submittedAt).reduce((sum, p) => {
    const opp = getOpportunity(p.opportunityId)
    const amt = opp?.amount?.replace(/[^0-9]/g, "")
    return sum + (amt ? parseInt(amt) : 0)
  }, 0)
  return { total, inPlay, submitted }
}

function formatDollars(n: number) {
  return "$" + n.toLocaleString()
}

function todayStr() {
  const d = new Date()
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// ── Status badge (clickable dropdown) ─────────────────────────────────────

function StatusBadge({
  status,
  onStatusChange,
}: {
  status: PipelineStatus
  onStatusChange: (s: PipelineStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const phase = phaseFromStatus(status)
  const color = PHASE_COLOR[phase]

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  return (
    <div ref={ref} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 8px 3px 10px", borderRadius: 20,
          fontSize: 11, fontWeight: 600, lineHeight: "16px",
          backgroundColor: color.bg, color: color.color,
          border: "none", cursor: "pointer",
          transition: "opacity 120ms",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.8" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1" }}
      >
        {STATUS_LABEL[status]}
        <ChevronDown size={10} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 4px)", right: 0,
            width: 230, zIndex: 200,
            backgroundColor: "var(--surface)",
            border: "1px solid var(--hair-2)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(28,24,64,0.12)",
            overflow: "hidden",
          }}
        >
          {STATUS_GROUPS_FOR_DROPDOWN.map((group, gi) => (
            <div key={group.phase}>
              {gi > 0 && <div style={{ height: 1, backgroundColor: "var(--hair)" }} />}
              <p style={{
                margin: 0, padding: "8px 12px 4px",
                fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)",
              }}>
                {group.label}
              </p>
              {group.statuses.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onStatusChange(s); setOpen(false) }}
                  style={{
                    display: "block", width: "100%",
                    padding: "7px 12px", textAlign: "left",
                    border: "none",
                    backgroundColor: s === status ? "var(--surface-sunk)" : "transparent",
                    cursor: "pointer", fontSize: 12,
                    color: s === status ? "var(--ink)" : "var(--ink-secondary)",
                    fontWeight: s === status ? 600 : 400,
                    transition: "background-color 100ms",
                  }}
                  onMouseEnter={(e) => {
                    if (s !== status) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-sunk)"
                  }}
                  onMouseLeave={(e) => {
                    if (s !== status) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
                  }}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pursuit card ───────────────────────────────────────────────────────────

function PursuitCard({
  pip,
  onStatusChange,
}: {
  pip: PipelineOpportunity
  onStatusChange: (id: string, s: PipelineStatus) => void
}) {
  const router = useRouter()
  const funder = getFunder(pip.funderId)
  const opp    = getOpportunity(pip.opportunityId)

  return (
    <div
      style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--hair-2)",
        borderRadius: 12,
        padding: "10px 16px",
        cursor: "pointer",
        transition: "box-shadow 150ms, border-color 150ms",
      }}
      onClick={() => router.push(`/pursuit/${pip.opportunityId}`)}
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
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "var(--ink)", lineHeight: "19px" }}>
            {funder?.name}
          </p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 400, color: "var(--slate-primary)", lineHeight: "17px" }}>
            {opp?.name}
          </p>
        </div>
        <StatusBadge
          status={pip.status}
          onStatusChange={(s) => onStatusChange(pip.id, s)}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
        {opp?.amount && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--slate-primary)" }}>{opp.amount}</span>
        )}
        {pip.submittedAt ? (
          <span style={{ fontSize: 12, color: "var(--slate-primary)" }}>Submitted {pip.submittedAt}</span>
        ) : opp?.deadline ? (
          <span style={{ fontSize: 12, color: "var(--slate-primary)" }}>Due {opp.deadline}</span>
        ) : null}
        {pip.status === "awarded-active" && (
          <span style={{ fontSize: 12, color: "var(--evergreen)", fontWeight: 500 }}>Awaiting disbursement</span>
        )}
      </div>

      {pip.status === "researching" && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--hair)" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onStatusChange(pip.id, "application-in-progress")
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 8,
              backgroundColor: "var(--slate-tint)", border: "none",
              fontSize: 12, fontWeight: 600, color: "var(--slate-primary)",
              cursor: "pointer", transition: "background-color 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-light)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
          >
            Start applying
          </button>
        </div>
      )}
    </div>
  )
}

// ── Segmented control ──────────────────────────────────────────────────────

function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string; count: number }[]
}) {
  return (
    <div style={{
      display: "inline-flex",
      gap: 2,
      backgroundColor: "var(--surface-sunk)",
      border: "1px solid var(--hair-2)",
      borderRadius: 10,
      padding: 3,
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px",
            borderRadius: 7,
            border: "none",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 120ms, color 120ms, box-shadow 120ms",
            backgroundColor: value === opt.value ? "var(--surface)" : "transparent",
            color: value === opt.value ? "var(--ink)" : "var(--ink-tertiary)",
            boxShadow: value === opt.value ? "0 1px 3px rgba(28,24,64,0.08)" : "none",
          }}
        >
          {opt.label}
          <span style={{
            fontSize: 11,
            fontWeight: 500,
            color: value === opt.value ? "var(--ink-secondary)" : "var(--ink-tertiary)",
            backgroundColor: value === opt.value ? "var(--slate-tint)" : "var(--hair)",
            borderRadius: 10,
            padding: "1px 6px",
            lineHeight: "14px",
          }}>
            {opt.count}
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TrackerPage() {
  const { scopeLabel, selectedProjectId } = useScope()
  const [pipelines, setPipelines] = useState(() => [...PIPELINE_OPPORTUNITIES])
  const [activeTab, setActiveTab] = useState<TrackerTab>("applications")

  function handleStatusChange(id: string, status: PipelineStatus) {
    setPipelines(prev =>
      prev.map(p => {
        if (p.id !== id) return p
        const next: PipelineOpportunity = { ...p, status }
        if (status === "application-submitted" && !p.submittedAt) {
          next.submittedAt = todayStr()
        }
        return next
      })
    )
    // Automatically switch to Applications tab when "Start applying" is triggered
    if (status === "application-in-progress") setActiveTab("applications")
  }

  const scopedPipelines = selectedProjectId
    ? pipelines.filter(p => p.projectId === selectedProjectId)
    : pipelines

  const stats = pipelineStats(scopedPipelines)

  const tabCounts = {
    prospecting:  scopedPipelines.filter(p => phaseFromStatus(p.status) === "researching").length,
    applications: scopedPipelines.filter(p => phaseFromStatus(p.status) === "applications").length,
    awards:       scopedPipelines.filter(p => phaseFromStatus(p.status) === "awards").length,
  }

  const activeItems = scopedPipelines.filter(p => phaseFromStatus(p.status) === TAB_TO_PHASE[activeTab])

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
          <span style={{ fontSize: 13, color: "var(--ink-tertiary)", marginLeft: 8 }}>{scopeLabel}</span>
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

      <ContentContainer style={{ padding: "32px 40px 64px" }}>
        {/* Stats */}
        <div style={{
          display: "flex", gap: 1,
          backgroundColor: "var(--surface)", border: "1px solid var(--hair-2)", borderRadius: 12, overflow: "hidden",
          marginBottom: 20,
        }}>
          {[
            { label: "In pipeline", value: String(stats.total) },
            { label: "Total in play", value: formatDollars(stats.inPlay) },
            { label: "Submitted", value: formatDollars(stats.submitted) },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: "20px",
              borderRight: i < 2 ? "1px solid var(--hair)" : "none",
            }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)" }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em", fontFamily: "var(--font-lora), Georgia, serif", lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Segmented control */}
        <div style={{ marginBottom: 20 }}>
          <SegmentedControl
            value={activeTab}
            onChange={(v) => setActiveTab(v as TrackerTab)}
            options={[
              { value: "prospecting",  label: "Prospecting",  count: tabCounts.prospecting  },
              { value: "applications", label: "Applications", count: tabCounts.applications },
              { value: "awards",       label: "Awards",       count: tabCounts.awards       },
            ]}
          />
        </div>

        {/* Active tab items */}
        {activeItems.length === 0 ? (
          <div style={{
            backgroundColor: "var(--surface-sunk)", border: "1px dashed var(--hair-2)",
            borderRadius: 12, padding: "32px 24px",
            textAlign: "center",
          }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>
              {activeTab === "prospecting" ? (
                <>No pursuits being researched.{" "}
                  <Link href="/discover" style={{ color: "var(--slate-secondary)", textDecoration: "none", fontWeight: 500 }}>
                    Discover opportunities →
                  </Link>
                </>
              ) : activeTab === "applications" ? (
                <>No active applications.{" "}
                  <Link href="/discover" style={{ color: "var(--slate-secondary)", textDecoration: "none", fontWeight: 500 }}>
                    Discover opportunities →
                  </Link>
                </>
              ) : (
                "No awards yet."
              )}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeItems.map(pip => (
              <PursuitCard key={pip.id} pip={pip} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </ContentContainer>
    </div>
  )
}
