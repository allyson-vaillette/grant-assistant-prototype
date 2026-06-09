"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { ChevronRight, Bell } from "lucide-react"
import {
  ORG, USER, TEAMMATES,
  PIPELINE_OPPORTUNITIES, OPPORTUNITIES, FUNDERS, TASKS,
} from "@/lib/mock-data"
import type { PipelineOpportunity, Opportunity, Funder, PipelineStatus } from "@/lib/types"

// ── Status strip config ────────────────────────────────────────────────────────

const PIPELINE_STRIP: { status: PipelineStatus; label: string; activeColor: string }[] = [
  { status: "researching", label: "Researching", activeColor: "var(--ink-tertiary)"  },
  { status: "applying",    label: "Applying",    activeColor: "var(--slate-primary)" },
  { status: "submitted",   label: "Submitted",   activeColor: "var(--plum-soft)"     },
  { status: "awarded",     label: "Awarded",     activeColor: "var(--evergreen)"     },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTH_INDEX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

function parseDate(str: string): Date | null {
  if (!str || str === "Rolling") return null
  const m = str.match(/^([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})$/)
  if (m) {
    const monthIdx = MONTH_INDEX[m[1]]
    if (monthIdx !== undefined) return new Date(parseInt(m[3]), monthIdx, parseInt(m[2]))
  }
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

function getFunder(id: string): Funder | undefined { return FUNDERS.find(f => f.id === id) }
function getOpportunity(id: string): Opportunity | undefined { return OPPORTUNITIES.find(o => o.id === id) }
function getTeammate(id: string) { return TEAMMATES.find(t => t.id === id) }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function getTodayTasks() {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return TASKS
    .filter(t => !t.completed && t.assigneeId === USER.id && !!t.dueDate)
    .flatMap(t => {
      const d = parseDate(t.dueDate!)
      if (!d) return []
      d.setHours(0, 0, 0, 0)
      if (d > now) return []
      return [{ ...t, isOverdue: d < now }]
    })
}

function getTeamTasks() {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return TASKS
    .filter(t => !t.completed && !!t.assigneeId && t.assigneeId !== USER.id)
    .flatMap(t => {
      const teammate = getTeammate(t.assigneeId!)
      if (!teammate) return []
      let isOverdue = false
      if (t.dueDate) {
        const d = parseDate(t.dueDate)
        if (d) { d.setHours(0, 0, 0, 0); isOverdue = d < now }
      }
      return [{ ...t, teammate, isOverdue }]
    })
    .sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1
      const da = a.dueDate ? (parseDate(a.dueDate)?.getTime() ?? Infinity) : Infinity
      const db = b.dueDate ? (parseDate(b.dueDate)?.getTime() ?? Infinity) : Infinity
      return da - db
    })
}

function getUpcomingDeadlines() {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  return PIPELINE_OPPORTUNITIES
    .filter(p => !["awarded", "denied"].includes(p.status))
    .flatMap(p => {
      const opp = getOpportunity(p.opportunityId)
      const funder = getFunder(p.funderId)
      const deadline = opp?.deadline ? parseDate(opp.deadline) : null
      if (!deadline) return []
      const d = new Date(deadline); d.setHours(0, 0, 0, 0)
      if (d < now) return []
      return [{ pip: p, opp, funder, deadline: d }]
    })
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    .slice(0, 4)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.09em",
        textTransform: "uppercase", color: "var(--ink-tertiary)", flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: "var(--hair)" }} />
    </div>
  )
}

function SubGroupLabel({ label }: { label: string }) {
  return (
    <p style={{
      margin: "0 0 8px",
      fontSize: 10, fontWeight: 700,
      letterSpacing: "0.07em", textTransform: "uppercase",
      color: "var(--ink-tertiary)",
    }}>
      {label}
    </p>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      backgroundColor: "var(--surface-sunk)", border: "1px dashed var(--hair-2)",
      borderRadius: 10, padding: "18px 20px", textAlign: "center",
    }}>
      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>{message}</p>
    </div>
  )
}

function TaskRow({ task }: { task: ReturnType<typeof getTodayTasks>[number] }) {
  const pip = PIPELINE_OPPORTUNITIES.find(p => p.id === task.pipelineOpportunityId)
  const opp = pip ? getOpportunity(pip.opportunityId) : undefined
  const funder = pip ? getFunder(pip.funderId) : undefined
  const href = pip ? `/pursuit/${pip.opportunityId}` : "#"

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          backgroundColor: "var(--surface)",
          border: `1px solid ${task.isOverdue ? "rgba(185,28,28,0.15)" : "var(--hair-2)"}`,
          borderLeft: task.isOverdue ? "3px solid var(--error)" : "1px solid var(--hair-2)",
          borderRadius: 10, padding: "12px 16px", cursor: "pointer", transition: "box-shadow 150ms",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(28,24,64,0.07)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 500, color: "var(--ink)", lineHeight: "18px" }}>
              {task.title}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "15px" }}>
              <span style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10 }}>
                {funder?.name}
              </span>
              {opp?.name && <span> · {opp.name}</span>}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {task.isOverdue && (
              <span style={{
                padding: "2px 7px", borderRadius: 20,
                fontSize: 10, fontWeight: 600, letterSpacing: "0.03em",
                backgroundColor: "var(--error-light)", color: "var(--error)",
              }}>
                Overdue
              </span>
            )}
            <ChevronRight size={14} style={{ color: "var(--ink-tertiary)" }} />
          </div>
        </div>
      </div>
    </Link>
  )
}

function TeamTaskRow({
  task,
  onNudge,
}: {
  task: ReturnType<typeof getTeamTasks>[number]
  onNudge: (name: string) => void
}) {
  const pip = PIPELINE_OPPORTUNITIES.find(p => p.id === task.pipelineOpportunityId)
  const opp = pip ? getOpportunity(pip.opportunityId) : undefined
  const funder = pip ? getFunder(pip.funderId) : undefined

  return (
    <div style={{
      backgroundColor: "var(--surface)",
      border: `1px solid ${task.isOverdue ? "rgba(185,28,28,0.15)" : "var(--hair-2)"}`,
      borderLeft: task.isOverdue ? "3px solid var(--error)" : "1px solid var(--hair-2)",
      borderRadius: 10, padding: "12px 16px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        backgroundColor: "var(--slate-tint)", border: "1px solid var(--hair)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--slate-primary)", lineHeight: 1 }}>
          {task.teammate.initials}
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 500, color: "var(--ink)", lineHeight: "18px" }}>
          {task.title}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "15px" }}>
          <span style={{ fontWeight: 600 }}>{task.teammate.name}</span>
          {funder && (
            <span> · <span style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: 10 }}>{funder.name}</span></span>
          )}
          {opp?.name && <span> · {opp.name}</span>}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {task.isOverdue ? (
          <span style={{
            padding: "2px 7px", borderRadius: 20,
            fontSize: 10, fontWeight: 600, letterSpacing: "0.03em",
            backgroundColor: "var(--error-light)", color: "var(--error)",
          }}>
            Overdue
          </span>
        ) : task.dueDate ? (
          <span style={{ fontSize: 11, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
            Due {task.dueDate}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => onNudge(task.teammate.name)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 6,
            border: "1px solid var(--hair)", backgroundColor: "var(--canvas)",
            fontSize: 11, fontWeight: 600, color: "var(--ink-secondary)",
            cursor: "pointer", transition: "background-color 150ms, border-color 150ms",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.backgroundColor = "var(--surface)"
            el.style.borderColor = "var(--ink-tertiary)"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLButtonElement
            el.style.backgroundColor = "var(--canvas)"
            el.style.borderColor = "var(--hair)"
          }}
        >
          <Bell size={11} />
          Nudge
        </button>
      </div>
    </div>
  )
}

function DeadlineRow({ pip, opp, funder }: {
  pip: PipelineOpportunity
  opp: Opportunity | undefined
  funder: Funder | undefined
}) {
  return (
    <Link href={`/pursuit/${pip.opportunityId}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          backgroundColor: "var(--surface)", border: "1px solid var(--hair-2)",
          borderRadius: 10, padding: "12px 16px", cursor: "pointer", transition: "box-shadow 150ms",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(28,24,64,0.07)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 500, color: "var(--ink)", lineHeight: "18px" }}>
              {opp?.name}
            </p>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
              {funder?.name}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {opp?.deadline && (
              <span style={{ fontSize: 12, color: "var(--ink-secondary)", whiteSpace: "nowrap" }}>
                Due {opp.deadline}
              </span>
            )}
            <ChevronRight size={14} style={{ color: "var(--ink-tertiary)" }} />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── StatusCard with hover/focus/tap panel ─────────────────────────────────────

type StatusPursuit = { pip: PipelineOpportunity; opp: Opportunity | undefined; funder: Funder | undefined }

function StatusCard({
  status,
  label,
  activeColor,
  pursuits,
  isFirst,
  isLast,
}: {
  status: PipelineStatus
  label: string
  activeColor: string
  pursuits: StatusPursuit[]
  isFirst: boolean
  isLast: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const count = pursuits.length

  // Compensate for removed overflow:hidden on strip container
  const borderRadius = [
    isFirst ? "11px" : "0",
    isLast  ? "11px" : "0",
    isLast  ? "11px" : "0",
    isFirst ? "11px" : "0",
  ].join(" ")

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, position: "relative" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        // Keep open when focus moves to a child (e.g. a link inside the panel)
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
          setOpen(false)
        }
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          borderRight: !isLast ? "1px solid var(--hair)" : "none",
          borderRadius,
          backgroundColor: open ? "var(--surface-sunk)" : "transparent",
          transition: "background-color 150ms",
        }}
      >
        <p style={{
          margin: "0 0 4px", fontSize: 10, fontWeight: 600,
          letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)",
        }}>
          {label}
        </p>
        {/* Count routes to Tracker; always focusable so keyboard can open the panel */}
        <Link
          href="/tracker"
          style={{ textDecoration: "none", display: "inline-block", outline: "none" }}
          aria-label={`${count} ${label} — view in Tracker`}
        >
          <p style={{
            margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em",
            color: count > 0 ? activeColor : "var(--hair)",
            fontFamily: "var(--font-lora), Georgia, serif",
          }}>
            {count}
          </p>
        </Link>
      </div>

      {/* Pursuit panel */}
      {open && (
        <div
          role="region"
          aria-label={`${label} pursuits`}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: 264,
            zIndex: 50,
            backgroundColor: "var(--surface)",
            border: "1px solid var(--hair-2)",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(28,24,64,0.12)",
            overflow: "hidden",
          }}
        >
          {pursuits.length === 0 ? (
            <p style={{
              margin: 0, padding: "14px 16px",
              fontSize: 13, color: "var(--ink-tertiary)", textAlign: "center",
            }}>
              No pursuits here yet
            </p>
          ) : (
            <div>
              {pursuits.map(({ pip, opp, funder }, i) => (
                <Link
                  key={pip.id}
                  href={`/pursuit/${pip.opportunityId}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <div
                    style={{
                      padding: "11px 16px",
                      borderTop: i > 0 ? "1px solid var(--hair)" : "none",
                      transition: "background-color 150ms",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--surface-sunk)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
                  >
                    <p style={{
                      margin: "0 0 1px", fontSize: 12, fontWeight: 600,
                      color: "var(--ink)", lineHeight: "16px",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                    }}>
                      {funder?.name}
                    </p>
                    <p style={{
                      margin: 0, fontSize: 13, fontWeight: 400,
                      color: "var(--ink-secondary)", lineHeight: "17px",
                    }}>
                      {opp?.name}
                    </p>
                    {opp?.deadline && (
                      <p style={{
                        margin: "3px 0 0", fontSize: 11,
                        color: "var(--ink-tertiary)", lineHeight: "14px",
                      }}>
                        Due {opp.deadline}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tasks = getTodayTasks()
  const teamTasks = getTeamTasks()
  const deadlines = getUpcomingDeadlines()
  const firstName = USER.name.split(" ")[0]

  // Pre-group pipeline opportunities by status for the strip panels
  const statusPursuits = Object.fromEntries(
    PIPELINE_STRIP.map(s => [
      s.status,
      PIPELINE_OPPORTUNITIES
        .filter(p => p.status === s.status)
        .map(pip => ({
          pip,
          opp: getOpportunity(pip.opportunityId),
          funder: getFunder(pip.funderId),
        })),
    ])
  ) as Record<PipelineStatus, StatusPursuit[]>

  function nudge(name: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(`Reminder sent to ${name}`)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--canvas)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 32px 64px" }}>

        {/* Greeting */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "var(--ink)",
            letterSpacing: "-0.01em", lineHeight: 1.25,
          }}>
            {greeting()}, {firstName}.
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>{ORG.name}</p>
        </div>

        {/* Pipeline at a glance — interactive status strip */}
        <div style={{
          display: "flex",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--hair-2)",
          borderRadius: 12,
          marginBottom: 40,
          // overflow:hidden removed so panels can escape; first/last cards carry the corner radius
        }}>
          {PIPELINE_STRIP.map((s, i) => (
            <StatusCard
              key={s.status}
              status={s.status}
              label={s.label}
              activeColor={s.activeColor}
              pursuits={statusPursuits[s.status] ?? []}
              isFirst={i === 0}
              isLast={i === PIPELINE_STRIP.length - 1}
            />
          ))}
        </div>

        {/* Tasks — Yours + Waiting on the team */}
        <section style={{ marginBottom: 40 }}>
          <SectionHeader label="Tasks" />

          <div style={{ marginBottom: 24 }}>
            <SubGroupLabel label="Yours" />
            {tasks.length === 0 ? (
              <EmptyState message="No tasks due today. You're all caught up." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tasks.map(t => <TaskRow key={t.id} task={t} />)}
              </div>
            )}
          </div>

          <div>
            <SubGroupLabel label="Waiting on the team" />
            {teamTasks.length === 0 ? (
              <EmptyState message="No open tasks waiting on teammates." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {teamTasks.map(t => (
                  <TeamTaskRow key={t.id} task={t} onNudge={nudge} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Upcoming deadlines */}
        <section style={{ marginBottom: 40 }}>
          <SectionHeader label="Upcoming deadlines" />
          {deadlines.length === 0 ? (
            <EmptyState message="No upcoming deadlines in your pipeline." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {deadlines.map(({ pip, opp, funder }) => (
                <DeadlineRow key={pip.id} pip={pip} opp={opp} funder={funder} />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Nudge toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          backgroundColor: "var(--ink)", color: "#FFFFFF",
          padding: "10px 16px", borderRadius: 10,
          fontSize: 13, fontWeight: 500, lineHeight: "18px",
          boxShadow: "0 4px 16px rgba(28,24,64,0.25)",
          pointerEvents: "none",
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
