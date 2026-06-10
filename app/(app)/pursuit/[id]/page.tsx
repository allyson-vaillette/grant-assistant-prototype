"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileText, Paperclip, CheckSquare, Square, ExternalLink, ChevronDown, Plus } from "lucide-react"
import {
  FUNDERS, OPPORTUNITIES,
  getArtifactsForPipeline, getAttachmentsForPipeline, getTasksForPipeline,
  getPipelineForOpportunity, createArtifact,
} from "@/lib/mock-data"
import type { PipelineStatus, PipelinePhase, ArtifactStage, AttachmentCategory } from "@/lib/types"
import { phaseFromStatus } from "@/lib/types"

// ── Phase + status config ──────────────────────────────────────────────────

const PHASES_ORDER: PipelinePhase[] = ["researching", "applications", "awards"]

const PHASE_LABEL: Record<PipelinePhase, string> = {
  researching:  "Researching",
  applications: "Applications",
  awards:       "Awards",
}

const PHASE_COLOR: Record<PipelinePhase, { bg: string; dot: string; text: string }> = {
  researching:  { bg: "var(--slate-tint)",     dot: "var(--ink-tertiary)", text: "var(--ink-tertiary)" },
  applications: { bg: "var(--plum-tint)",      dot: "var(--plum-soft)",   text: "var(--plum-soft)"   },
  awards:       { bg: "var(--evergreen-tint)", dot: "var(--evergreen)",   text: "var(--evergreen)"   },
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
  "awarded-active":           "Awarded — Active",
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

const STAGE_BADGE: Record<ArtifactStage, { label: string; bg: string; color: string }> = {
  "pre-apply":  { label: "Pre-apply",  bg: "var(--terracotta-tint)", color: "var(--terracotta)"      },
  "apply":      { label: "Apply",      bg: "var(--slate-tint)",      color: "var(--slate-secondary)" },
  "post-apply": { label: "Post-apply", bg: "var(--evergreen-tint)",  color: "var(--evergreen)"       },
}

const ARTIFACT_TYPE_LABEL: Record<string, string> = {
  proposal: "Proposal",
  loi:      "Letter of inquiry",
  report:   "Report",
  budget:   "Budget",
  other:    "Document",
}

const CATEGORY_LABEL: Record<AttachmentCategory, string> = {
  rfp:            "RFP",
  prior_proposal: "Prior proposal",
  report:         "Report",
  contact_notes:  "Contact notes",
  other:          "File",
}

// ── Phase indicator ────────────────────────────────────────────────────────

function PhaseIndicator({ current }: { current: PipelinePhase }) {
  const currentIdx = PHASES_ORDER.indexOf(current)

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {PHASES_ORDER.map((phase, i) => {
        const done    = i < currentIdx
        const active  = i === currentIdx
        const pending = i > currentIdx
        const cfg     = PHASE_COLOR[phase]
        return (
          <div key={phase} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 20,
              backgroundColor: active ? cfg.bg : "transparent",
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: "50%",
                backgroundColor: active || done ? cfg.dot : "transparent",
                border: active || done ? "none" : "1.5px solid var(--hair-2)",
                opacity: done ? 0.5 : 1,
              }} />
              <span style={{
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                color: active ? cfg.text : pending ? "var(--hair-2)" : "var(--ink-tertiary)",
                opacity: done ? 0.65 : 1,
              }}>
                {PHASE_LABEL[phase]}
              </span>
            </div>
            {i < PHASES_ORDER.length - 1 && (
              <div style={{ width: 20, height: 1, backgroundColor: done ? cfg.dot : "var(--hair-2)", opacity: done ? 0.3 : 1 }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Status picker (dropdown) ───────────────────────────────────────────────

function StatusPicker({
  status,
  onStatusChange,
}: {
  status: PipelineStatus
  onStatusChange: (s: PipelineStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const phase = phaseFromStatus(status)
  const cfg   = PHASE_COLOR[phase]

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 10px 5px 12px", borderRadius: 8,
          border: "1px solid var(--hair-2)",
          backgroundColor: "var(--canvas)",
          cursor: "pointer",
          fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)",
          transition: "background-color 120ms, border-color 120ms",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.backgroundColor = "var(--surface)"
          el.style.borderColor = "rgba(74,96,128,0.3)"
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement
          el.style.backgroundColor = "var(--canvas)"
          el.style.borderColor = "var(--hair-2)"
        }}
      >
        <span style={{
          display: "inline-block", width: 7, height: 7, borderRadius: "50%",
          backgroundColor: cfg.dot, flexShrink: 0,
        }} />
        {STATUS_LABEL[status]}
        <ChevronDown size={11} style={{ color: "var(--ink-tertiary)" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          width: 240, zIndex: 200,
          backgroundColor: "var(--surface)",
          border: "1px solid var(--hair-2)",
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(28,24,64,0.12)",
          overflow: "hidden",
        }}>
          {STATUS_GROUPS_FOR_DROPDOWN.map((group, gi) => (
            <div key={group.phase}>
              {gi > 0 && <div style={{ height: 1, backgroundColor: "var(--hair)" }} />}
              <p style={{
                margin: 0, padding: "8px 12px 4px",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "var(--ink-tertiary)",
              }}>
                {group.label}
              </p>
              {group.statuses.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { onStatusChange(s); setOpen(false) }}
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

// ── Tabs ───────────────────────────────────────────────────────────────────

type Tab = "artifacts" | "attachments" | "tasks"

function TabBar({ active, onChange, counts }: {
  active: Tab
  onChange: (t: Tab) => void
  counts: Record<Tab, number>
}) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--hair)" }}>
      {(["artifacts", "attachments", "tasks"] as Tab[]).map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          style={{
            padding: "10px 18px", border: "none", background: "none", cursor: "pointer",
            fontSize: 13, fontWeight: active === t ? 600 : 400,
            color: active === t ? "var(--ink)" : "var(--ink-tertiary)",
            borderBottom: active === t ? "2px solid var(--slate-primary)" : "2px solid transparent",
            marginBottom: -1, transition: "color 120ms",
          }}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
          <span style={{
            marginLeft: 6, padding: "1px 6px", borderRadius: 10, fontSize: 11,
            backgroundColor: active === t ? "var(--slate-tint)" : "var(--canvas)",
            color: active === t ? "var(--slate-primary)" : "var(--ink-tertiary)",
          }}>
            {counts[t]}
          </span>
        </button>
      ))}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

function todayStr() {
  const d = new Date()
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

// params.id is the opportunity ID
export default function PursuitPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("artifacts")

  const initialPip = getPipelineForOpportunity(params.id)
  const [currentStatus, setCurrentStatus] = useState<PipelineStatus>(
    initialPip?.status ?? "researching"
  )
  const [submittedAt, setSubmittedAt] = useState<string | undefined>(initialPip?.submittedAt)

  const pip    = initialPip
  const opp    = OPPORTUNITIES.find(o => o.id === params.id)
  const funder = pip ? FUNDERS.find(f => f.id === pip.funderId) : null

  if (!pip || !funder || !opp) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", backgroundColor: "var(--canvas)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--ink-tertiary)", marginBottom: 16 }}>Pursuit not found.</p>
          <Link href="/tracker" style={{ fontSize: 13, color: "var(--slate-secondary)", textDecoration: "none" }}>← Back to Tracker</Link>
        </div>
      </div>
    )
  }

  function handleStatusChange(s: PipelineStatus) {
    setCurrentStatus(s)
    if (s === "application-submitted" && !submittedAt) {
      setSubmittedAt(todayStr())
    }
  }

  const artifacts   = getArtifactsForPipeline(pip.id)
  const attachments = getAttachmentsForPipeline(pip.id)
  const tasks       = getTasksForPipeline(pip.id)
  const openTasks   = tasks.filter(t => !t.completed)
  const doneTasks   = tasks.filter(t => t.completed)
  const currentPhase = phaseFromStatus(currentStatus)
  const phaseCfg     = PHASE_COLOR[currentPhase]

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "var(--canvas)" }}>

      {/* Top bar */}
      <div style={{
        flexShrink: 0,
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--hair)",
        padding: "0 28px", height: 52,
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          type="button"
          onClick={() => router.push("/tracker")}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: "var(--ink-tertiary)", padding: 0,
            transition: "color 120ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)" }}
        >
          <ArrowLeft size={14} /> Tracker
        </button>
        <span style={{ color: "var(--hair-2)", fontSize: 16 }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{funder.name}</span>
        <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>→</span>
        <span style={{ fontSize: 13, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {opp.name}
        </span>
      </div>

      {/* Opportunity header */}
      <div style={{
        flexShrink: 0,
        padding: "20px 28px 0",
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--hair)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                {funder.name}
              </p>
              <span style={{
                padding: "2px 9px", borderRadius: 20,
                fontSize: 11, fontWeight: 600,
                backgroundColor: phaseCfg.bg, color: phaseCfg.text,
              }}>
                {PHASE_LABEL[currentPhase]}
              </span>
            </div>
            <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 700, color: "var(--ink)", lineHeight: "25px", letterSpacing: "-0.01em" }}>
              {opp.name}
            </h1>
            <div style={{ display: "flex", gap: 12 }}>
              {opp.amount && <span style={{ fontSize: 14, fontWeight: 600, color: "var(--slate-primary)" }}>{opp.amount}</span>}
              {submittedAt ? (
                <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>Submitted {submittedAt}</span>
              ) : opp.deadline ? (
                <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>Due {opp.deadline}</span>
              ) : null}
            </div>
          </div>
          <Link href={`/opportunity/${params.id}`} style={{ textDecoration: "none" }}>
            <button
              type="button"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 7,
                border: "1px solid var(--hair-2)", backgroundColor: "transparent",
                fontSize: 12, color: "var(--ink-tertiary)", cursor: "pointer",
                transition: "background-color 120ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
            >
              <ExternalLink size={11} /> Opportunity details
            </button>
          </Link>
        </div>

        {/* Phase indicator + status picker */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14 }}>
          <PhaseIndicator current={currentPhase} />
          <StatusPicker status={currentStatus} onStatusChange={handleStatusChange} />
        </div>

        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          counts={{ artifacts: artifacts.length, attachments: attachments.length, tasks: tasks.length }}
        />
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

        {/* Artifacts */}
        {activeTab === "artifacts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => { const a = createArtifact(pip.id); router.push(`/pursuit/${params.id}/artifact/${a.id}`) }}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "7px 14px", borderRadius: "var(--radius-button)",
                  border: "none", backgroundColor: "var(--slate-primary)", color: "#fff",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                <Plus size={13} /> New document
              </button>
            </div>
            {artifacts.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>No documents yet — create one above to get started.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {artifacts.map(art => {
                  const stageCfg = STAGE_BADGE[art.stage]
                  return (
                    <Link
                      key={art.id}
                      href={`/pursuit/${params.id}/artifact/${art.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        style={{
                          display: "flex", alignItems: "center", gap: 14,
                          padding: "14px 16px", borderRadius: 10,
                          backgroundColor: "var(--surface)", border: "1px solid var(--hair-2)",
                          cursor: "pointer", transition: "box-shadow 150ms, border-color 150ms",
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLDivElement
                          el.style.boxShadow = "0 2px 10px rgba(28,24,64,0.07)"
                          el.style.borderColor = "rgba(74,96,128,0.3)"
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLDivElement
                          el.style.boxShadow = "none"
                          el.style.borderColor = "var(--hair-2)"
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          backgroundColor: "var(--slate-tint)",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <FileText size={16} style={{ color: "var(--slate-primary)" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{art.name}</p>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{ARTIFACT_TYPE_LABEL[art.type]}</span>
                            <span style={{
                              padding: "1px 7px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                              backgroundColor: stageCfg.bg, color: stageCfg.color,
                            }}>
                              {stageCfg.label}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>Updated {art.updatedAt}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--slate-secondary)", flexShrink: 0 }}>Open →</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Attachments */}
        {activeTab === "attachments" && (
          <div>
            {attachments.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>No attachments yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {attachments.map(att => {
                  const stageCfg = STAGE_BADGE[att.stage]
                  return (
                    <div
                      key={att.id}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px", borderRadius: 10,
                        backgroundColor: "var(--surface)", border: "1px solid var(--hair-2)",
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 7,
                        backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Paperclip size={13} style={{ color: "var(--ink-tertiary)" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {att.filename}
                        </p>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontSize: 11, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>{att.fileType}</span>
                          <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>·</span>
                          <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{CATEGORY_LABEL[att.category]}</span>
                          <span style={{
                            padding: "1px 6px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                            backgroundColor: stageCfg.bg, color: stageCfg.color,
                          }}>
                            {stageCfg.label}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--ink-tertiary)", flexShrink: 0 }}>{att.uploadDate}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Tasks */}
        {activeTab === "tasks" && (
          <div>
            {tasks.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>No tasks yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {openTasks.map(task => (
                  <div key={task.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "11px 14px", borderRadius: 9,
                    backgroundColor: "var(--surface)", border: "1px solid var(--hair-2)",
                  }}>
                    <Square size={15} style={{ color: "var(--ink-tertiary)", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{task.title}</p>
                      {task.dueDate && (
                        <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>Due {task.dueDate}</p>
                      )}
                    </div>
                  </div>
                ))}
                {doneTasks.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                      Completed
                    </p>
                    {doneTasks.map(task => (
                      <div key={task.id} style={{
                        display: "flex", alignItems: "flex-start", gap: 10,
                        padding: "11px 14px", borderRadius: 9,
                        backgroundColor: "transparent", border: "1px solid var(--hair)",
                        opacity: 0.65,
                      }}>
                        <CheckSquare size={15} style={{ color: "var(--evergreen)", flexShrink: 0, marginTop: 1 }} />
                        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", textDecoration: "line-through" }}>{task.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
