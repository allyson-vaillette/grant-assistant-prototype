"use client"

import React, { useState, useRef } from "react"
import Link from "next/link"
import { ChevronRight, Bell, Telescope, Plus, FilePlus } from "lucide-react"
import {
  USER, TEAMMATES,
  PIPELINE_OPPORTUNITIES, OPPORTUNITIES, FUNDERS, TASKS,
} from "@/lib/mock-data"
import { useScope } from "@/lib/scope-context"
import { phaseFromStatus } from "@/lib/types"
import type { PipelineOpportunity, Opportunity, Funder, PipelinePhase } from "@/lib/types"

// ── Status strip config ────────────────────────────────────────────────────────

const PIPELINE_STRIP: { phase: PipelinePhase; label: string; activeColor: string }[] = [
  { phase: "researching",  label: "Researching",  activeColor: "var(--ink-tertiary)" },
  { phase: "applications", label: "Applications", activeColor: "var(--plum-soft)"    },
  { phase: "awards",       label: "Awards",       activeColor: "var(--evergreen)"    },
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
    .filter(p => !["application-submitted", "declined", "abandoned", "awarded-active", "awarded-closed"].includes(p.status))
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
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-tertiary)", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: "var(--hair)" }} />
    </div>
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

function QuickActionCard({
  icon,
  label,
  href,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
}) {
  const inner = (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "13px 16px",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--hair-2)",
        borderRadius: 12,
        transition: "box-shadow 150ms, border-color 150ms",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = "var(--lift-2)"
        el.style.borderColor = "var(--slate-light)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.boxShadow = "none"
        el.style.borderColor = "var(--hair-2)"
      }}
    >
      <div style={{ color: "var(--slate-secondary)", flexShrink: 0, display: "flex" }}>
        {icon}
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", flex: 1, lineHeight: "18px" }}>
        {label}
      </span>
      <ChevronRight size={14} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
    </div>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none", display: "block" }}>
        {inner}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "none", border: "none", padding: 0, margin: 0,
        cursor: "pointer", width: "100%", display: "block", textAlign: "left",
      }}
    >
      {inner}
    </button>
  )
}

function AddTaskModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd: (title: string) => void
}) {
  const [title, setTitle] = useState("")
  const [dueDate, setDueDate] = useState("")

  function submit() {
    if (title.trim()) onAdd(title.trim())
  }

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(42,42,42,0.35)" }}
        onClick={onClose}
      />
      <div style={{
        position: "fixed", top: "50%", left: "50%", zIndex: 201,
        transform: "translate(-50%, -50%)",
        backgroundColor: "var(--surface)", borderRadius: 16,
        padding: "28px 32px", width: 440, maxWidth: "90vw",
        boxShadow: "0 8px 16px rgba(42,42,42,0.08), 0 30px 60px rgba(42,42,42,0.15)",
      }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 16, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          Add task
        </h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-secondary)", marginBottom: 6 }}>
            Task
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") submit() }}
            style={{
              width: "100%", padding: "9px 12px",
              borderRadius: "var(--radius-input)",
              border: "1px solid var(--hair-2)",
              backgroundColor: "var(--canvas)",
              fontSize: 14, color: "var(--ink)", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-secondary)", marginBottom: 6 }}>
            Due date{" "}
            <span style={{ fontWeight: 400, color: "var(--ink-tertiary)" }}>(optional)</span>
          </label>
          <input
            type="text"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            placeholder="Jun 15, 2026"
            style={{
              width: "100%", padding: "9px 12px",
              borderRadius: "var(--radius-input)",
              border: "1px solid var(--hair-2)",
              backgroundColor: "var(--canvas)",
              fontSize: 14, color: "var(--ink)", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px", borderRadius: 8,
              border: "1px solid var(--hair-2)", backgroundColor: "transparent",
              fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!title.trim()}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              backgroundColor: title.trim() ? "var(--slate-primary)" : "var(--hair-2)",
              fontSize: 13, fontWeight: 600,
              color: title.trim() ? "#fff" : "var(--ink-tertiary)",
              cursor: title.trim() ? "pointer" : "not-allowed",
              transition: "background-color 150ms",
            }}
          >
            Add task
          </button>
        </div>
      </div>
    </>
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
          borderRadius: 10, padding: "8px 14px", cursor: "pointer", transition: "box-shadow 150ms",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(28,24,64,0.07)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600, color: "var(--ink)", lineHeight: "20px" }}>
              {task.title}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "var(--slate-primary)", lineHeight: "18px" }}>
              {funder?.name}
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
      borderRadius: 10, padding: "8px 14px",
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
        <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600, color: "var(--ink)", lineHeight: "20px" }}>
          {task.title}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: "var(--slate-primary)", lineHeight: "18px" }}>
          {task.teammate.name}
          {funder && <span> · {funder.name}</span>}
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
          <span style={{ fontSize: 14, color: "var(--ink-secondary)", whiteSpace: "nowrap" }}>
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
          borderRadius: 10, padding: "8px 14px", cursor: "pointer", transition: "box-shadow 150ms",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(28,24,64,0.07)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 600, color: "var(--ink)", lineHeight: "20px" }}>
              {funder?.name}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "var(--slate-primary)", lineHeight: "18px" }}>
              {opp?.name}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {opp?.deadline && (
              <span style={{ fontSize: 14, color: "var(--ink-secondary)", whiteSpace: "nowrap" }}>
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
  phase: _phase,
  label,
  activeColor,
  pursuits,
  isFirst,
  isLast,
}: {
  phase: PipelinePhase
  label: string
  activeColor: string
  pursuits: StatusPursuit[]
  isFirst: boolean
  isLast: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const count = pursuits.length

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
        if (!containerRef.current?.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <div
        style={{
          padding: "20px",
          borderRight: !isLast ? "1px solid var(--hair)" : "none",
          borderRadius,
          backgroundColor: open ? "var(--surface-sunk)" : "transparent",
          transition: "background-color 150ms",
        }}
      >
        <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "var(--ink-tertiary)" }}>
          {label}
        </p>
        <Link
          href="/tracker"
          style={{ textDecoration: "none", display: "block", outline: "none" }}
          aria-label={`${count} ${label} — view in Tracker`}
        >
          <p style={{
            margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1,
            color: count > 0 ? activeColor : "var(--hair)",
            fontFamily: "var(--font-lora), Georgia, serif",
          }}>
            {count}
          </p>
        </Link>
      </div>

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
            <p style={{ margin: 0, padding: "14px 16px", fontSize: 13, color: "var(--ink-tertiary)", textAlign: "center" }}>
              No pursuits here yet
            </p>
          ) : (
            <div>
              {pursuits.map(({ pip, opp, funder }, i) => (
                <Link key={pip.id} href={`/pursuit/${pip.opportunityId}`} style={{ textDecoration: "none", display: "block" }}>
                  <div
                    style={{
                      padding: "11px 16px",
                      borderTop: i > 0 ? "1px solid var(--hair)" : "none",
                      transition: "background-color 150ms",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--surface-sunk)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
                  >
                    <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 600, color: "var(--ink)", lineHeight: "16px" }}>
                      {funder?.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 400, color: "var(--ink-secondary)", lineHeight: "17px" }}>
                      {opp?.name}
                    </p>
                    {opp?.deadline && (
                      <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px" }}>
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
  const { scopeLabel, selectedProjectId } = useScope()
  const [toast, setToast] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const firstName = USER.name.split(" ")[0]

  const scopedPipelines = selectedProjectId
    ? PIPELINE_OPPORTUNITIES.filter(p => p.projectId === selectedProjectId)
    : PIPELINE_OPPORTUNITIES

  const scopedPipelineIds = new Set(scopedPipelines.map(p => p.id))

  const tasks = getTodayTasks().filter(t => scopedPipelineIds.has(t.pipelineOpportunityId))
  const teamTasks = getTeamTasks().filter(t => scopedPipelineIds.has(t.pipelineOpportunityId))
  const deadlines = getUpcomingDeadlines().filter(({ pip }) => scopedPipelineIds.has(pip.id))

  const phasePursuits = Object.fromEntries(
    PIPELINE_STRIP.map(s => [
      s.phase,
      scopedPipelines
        .filter(p => phaseFromStatus(p.status) === s.phase)
        .map(pip => ({
          pip,
          opp: getOpportunity(pip.opportunityId),
          funder: getFunder(pip.funderId),
        })),
    ])
  ) as Record<PipelinePhase, StatusPursuit[]>

  function showToast(msg: string) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  function nudge(name: string) { showToast(`Reminder sent to ${name}`) }

  function handleAddTask(title: string) {
    setShowAddTask(false)
    showToast(`Task "${title}" added`)
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--canvas)" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 40px 48px" }}>

        {/* Greeting */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "var(--ink)",
            letterSpacing: "-0.01em", lineHeight: 1.25,
          }}>
            {greeting()}, {firstName}.
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>{scopeLabel}</p>
        </div>

        {/* Stat strip */}
        <div style={{
          display: "flex",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--hair-2)",
          borderRadius: 12,
          marginBottom: 16,
        }}>
          {PIPELINE_STRIP.map((s, i) => (
            <StatusCard
              key={s.phase}
              phase={s.phase}
              label={s.label}
              activeColor={s.activeColor}
              pursuits={phasePursuits[s.phase] ?? []}
              isFirst={i === 0}
              isLast={i === PIPELINE_STRIP.length - 1}
            />
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
          <QuickActionCard
            icon={<Telescope size={16} />}
            label="Discover"
            href="/discover"
          />
          <QuickActionCard
            icon={<Plus size={16} />}
            label="Add task"
            onClick={() => setShowAddTask(true)}
          />
          <QuickActionCard
            icon={<FilePlus size={16} />}
            label="Start new application"
            href="/discover"
          />
        </div>

        {/* Upcoming deadlines */}
        <section style={{ marginBottom: 20 }}>
          <SectionHeader label="Upcoming deadlines" />
          {deadlines.length === 0 ? (
            <EmptyState message="No upcoming deadlines in your pipeline." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {deadlines.map(({ pip, opp, funder }) => (
                <DeadlineRow key={pip.id} pip={pip} opp={opp} funder={funder} />
              ))}
            </div>
          )}
        </section>

        {/* Your tasks */}
        <section style={{ marginBottom: 20 }}>
          <SectionHeader label="Your tasks" />
          {tasks.length === 0 ? (
            <EmptyState message="No tasks due today. You're all caught up." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tasks.map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          )}
        </section>

        {/* Tasks pending with team */}
        <section style={{ marginBottom: 20 }}>
          <SectionHeader label="Tasks pending with team" />
          {teamTasks.length === 0 ? (
            <EmptyState message="No open tasks waiting on teammates." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {teamTasks.map(t => (
                <TeamTaskRow key={t.id} task={t} onNudge={nudge} />
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Nudge / task toast */}
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

      {/* Add task modal */}
      {showAddTask && (
        <AddTaskModal
          onClose={() => setShowAddTask(false)}
          onAdd={handleAddTask}
        />
      )}
    </div>
  )
}
