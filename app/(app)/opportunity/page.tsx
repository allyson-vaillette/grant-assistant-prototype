"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, Copy, FileText, Plus } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "overview" | "tasks" | "budget" | "reports" | "notes" | "files"
type TaskStatus = "To Do" | "In Progress" | "Done"
type Stage = "Tracking" | "Active" | "Submitted" | "Awarded" | "Reporting" | "Complete" | "Declined"

interface Proposal {
  id: string
  name: string
  status: "Draft" | "Final" | "Submitted"
  created: string
  lastEdited: string
  author: string
}

interface Task {
  id: string
  name: string
  due: string
  dueBadge: "today" | "soon" | "later"
  assignee: string
  status: TaskStatus
  done: boolean
}

// ── Data ──────────────────────────────────────────────────────────────────

const PROPOSALS: Proposal[] = [
  {
    id: "draft-1",
    name: "Equitable Futures — Draft 1",
    status: "Draft",
    created: "Apr 3, 2026",
    lastEdited: "May 10, 2026",
    author: "Taylor S.",
  },
]

const INITIAL_TASKS: Task[] = [
  { id: "t1", name: "Complete narrative section",        due: "Due May 20", dueBadge: "today", assignee: "TS", status: "To Do",       done: false },
  { id: "t2", name: "Get budget sign-off from finance",  due: "Due May 22", dueBadge: "soon",  assignee: "TS", status: "In Progress", done: false },
  { id: "t3", name: "Collect letters of support",        due: "Due Jun 1",  dueBadge: "later", assignee: "TS", status: "To Do",       done: false },
]

const STAGE_ORDER: Stage[] = ["Tracking", "Active", "Submitted", "Awarded", "Reporting", "Complete"]
const TERMINAL_STAGES: Stage[] = ["Declined", "Complete"]

const STAGE_DOT: Record<Stage, string> = {
  Tracking:  "#A6B3C5",
  Active:    "#6B819E",
  Submitted: "#AD9DAE",
  Awarded:   "#3C5E4C",
  Reporting: "#D19A66",
  Complete:  "#A6B3C5",
  Declined:  "#E0E0E0",
}

const STAGE_BADGE: Record<Stage, { bg: string; color: string }> = {
  Tracking:  { bg: "#F5F5F6", color: "#8A8A99" },
  Active:    { bg: "#EBF0F5", color: "#4A6080" },
  Submitted: { bg: "#F2EDF3", color: "#7A5F7E" },
  Awarded:   { bg: "#E0EDE6", color: "#3C5E4C" },
  Reporting: { bg: "#F5EAD8", color: "#8B5E30" },
  Complete:  { bg: "#E8ECF0", color: "#5A6575" },
  Declined:  { bg: "#F5F5F6", color: "#8A8A99" },
}

const TASK_STATUS_STYLE: Record<TaskStatus, { bg: string; color: string }> = {
  "To Do":       { bg: "#EBF0F5", color: "#4A6080"  },
  "In Progress": { bg: "#FEF3DC", color: "#C47A10"  },
  "Done":        { bg: "#E0EDE6", color: "#3C5E4C"  },
}

function dueBadgeStyle(cat: Task["dueBadge"]): React.CSSProperties {
  if (cat === "today") return { backgroundColor: "#FDE8E8", color: "#8B2020" }
  if (cat === "soon")  return { backgroundColor: "#FFF3E0", color: "#7A4A10" }
  return { backgroundColor: "#E8ECF0", color: "#4A6080" }
}

// ── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(12px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.2s ease, opacity 0.2s ease",
        backgroundColor: "#FFFFFF",
        border: "1px solid var(--border-default)",
        borderRadius: 12,
        padding: "10px 20px",
        boxShadow: "0 4px 16px rgba(42,42,42,0.12)",
        fontSize: 13,
        color: "var(--ink)",
        zIndex: 100,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  )
}

// ── Stage dropdown ─────────────────────────────────────────────────────────

function StageControl({ stage, onChange }: { stage: Stage; onChange: (s: Stage) => void }) {
  const [open, setOpen] = useState(false)
  const badge = STAGE_BADGE[stage]
  const dot = STAGE_DOT[stage]

  const nextStages = STAGE_ORDER.filter((s) => s !== stage && !TERMINAL_STAGES.includes(s))
    .concat(["Declined"])
    .filter((s) => s !== stage)

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 14px",
          borderRadius: 8,
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--surface-white)",
          cursor: "pointer",
          transition: "background-color 150ms",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-white)" }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dot, flexShrink: 0 }} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            borderRadius: 20,
            padding: "2px 8px",
            backgroundColor: badge.bg,
            color: badge.color,
          }}
        >
          {stage}
        </span>
        <ChevronDown size={12} color="var(--ink-tertiary)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            backgroundColor: "var(--surface-white)",
            border: "1px solid var(--border-default)",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(42,42,42,0.12)",
            zIndex: 50,
            minWidth: 160,
            overflow: "hidden",
          }}
        >
          {nextStages.map((s) => {
            const b = STAGE_BADGE[s]
            return (
              <button
                key={s}
                type="button"
                onClick={() => { onChange(s); setOpen(false) }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "10px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background-color 100ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: STAGE_DOT[s], flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, borderRadius: 20, padding: "2px 8px", backgroundColor: b.bg, color: b.color }}>
                  {s}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Checkbox ───────────────────────────────────────────────────────────────

function TaskCheckbox({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 16,
        height: 16,
        flexShrink: 0,
        borderRadius: 4,
        border: done ? `1.5px solid var(--evergreen)` : "1.5px solid var(--ink-tertiary)",
        backgroundColor: done ? "var(--evergreen)" : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background-color 150ms, border-color 150ms",
      }}
    >
      {done && (
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path d="M1.5 4.5l2 2L7.5 2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

// ── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ initials }: { initials: string }) {
  return (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "var(--gradient-avatar)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>{initials}</span>
    </div>
  )
}

// ── Tab content ────────────────────────────────────────────────────────────

function OverviewTab({ tasks, onToggle }: { tasks: Task[]; onToggle: (id: string) => void; stage: Stage }) {
  const router = useRouter()
  const openTasks = tasks.filter((t) => !t.done)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Proposals */}
      <div>
        <p style={sectionLabelStyle}>Proposals</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PROPOSALS.map((p) => {
            const badge = PROPOSAL_STATUS_STYLE[p.status]
            return (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderRadius: "var(--radius-card)",
                  backgroundColor: "var(--surface-white)",
                  border: "1px solid var(--border-default)",
                  boxShadow: "0 1px 3px rgba(42,42,42,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 7,
                      backgroundColor: "var(--slate-tint)",
                      border: "1px solid var(--border-default)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={14} color="var(--slate-secondary)" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{p.name}</span>
                      <span
                        style={{
                          borderRadius: 20,
                          padding: "2px 8px",
                          backgroundColor: badge.bg,
                          fontSize: 11,
                          fontWeight: 500,
                          color: badge.color,
                        }}
                      >
                        {p.status}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
                      Created {p.created} · Last edited {p.lastEdited} · {p.author}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => router.push("/editor")}
                    style={ghostBtnStyle}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                  >
                    Open in editor
                  </button>
                  <button
                    type="button"
                    style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: "transparent", border: "1px solid var(--border-default)", cursor: "pointer", transition: "background-color 150ms" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                  >
                    <Copy size={13} color="var(--ink-tertiary)" />
                  </button>
                </div>
              </div>
            )
          })}
          <button
            type="button"
            onClick={() => router.push("/editor")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "4px 8px", fontSize: 13, fontWeight: 500, color: "var(--slate-secondary)", cursor: "pointer", borderRadius: 6, transition: "background-color 150ms", textAlign: "left" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <Plus size={13} />
            New proposal
          </button>
        </div>
      </div>

      {/* Open tasks */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <p style={{ ...sectionLabelStyle, margin: 0 }}>Open tasks ({openTasks.length})</p>
          <button type="button" style={{ background: "none", border: "none", fontSize: 12, color: "var(--slate-secondary)", cursor: "pointer", fontWeight: 500 }}>
            View all tasks →
          </button>
        </div>
        <div style={{ borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", overflow: "hidden" }}>
          {tasks.slice(0, 3).map((task, i) => {
            const badge = TASK_STATUS_STYLE[task.status]
            return (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  borderBottom: i < 2 ? "1px solid var(--border-default)" : "none",
                  opacity: task.done ? 0.45 : 1,
                  transition: "opacity 150ms",
                }}
              >
                <TaskCheckbox done={task.done} onClick={() => onToggle(task.id)} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 14, color: "var(--ink)", textDecoration: task.done ? "line-through" : "none" }}>
                    {task.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>{task.due}</span>
                    <Avatar initials={task.assignee} />
                  </div>
                </div>
                <span
                  style={{ flexShrink: 0, borderRadius: 20, padding: "3px 10px", backgroundColor: badge.bg, fontSize: 11, fontWeight: 500, color: badge.color }}
                >
                  {task.status}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* At a glance */}
      <div>
        <p style={sectionLabelStyle}>At a glance</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <GlanceCard label="Deadline" value="Jun 15, 2026" sub="6 days away" subColor="#B91C1C" />
          <GlanceCard label="Target amount" value="$75,000" sub="1 draft proposal" subColor="var(--ink-tertiary)" />
          <GlanceCard label="Last activity" value="2 days ago" sub="by Taylor S." subColor="var(--ink-tertiary)" />
        </div>
      </div>
    </div>
  )
}

function TasksTab({ tasks, onToggle }: { tasks: Task[]; onToggle: (id: string) => void }) {
  return (
    <div>
      <p style={sectionLabelStyle}>All tasks ({tasks.length})</p>
      <div style={{ borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", overflow: "hidden" }}>
        {tasks.map((task, i) => {
          const badge = TASK_STATUS_STYLE[task.status]
          return (
            <div
              key={task.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                borderBottom: i < tasks.length - 1 ? "1px solid var(--border-default)" : "none",
                opacity: task.done ? 0.45 : 1,
                transition: "opacity 150ms",
              }}
            >
              <TaskCheckbox done={task.done} onClick={() => onToggle(task.id)} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 4px", fontSize: 14, color: "var(--ink)", textDecoration: task.done ? "line-through" : "none" }}>{task.name}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>{task.due}</span>
                  <Avatar initials={task.assignee} />
                  <span
                    style={{
                      borderRadius: 20,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 500,
                      ...dueBadgeStyle(task.dueBadge),
                    }}
                  >
                    {task.dueBadge === "today" ? "Due today" : task.dueBadge === "soon" ? "In progress" : ""}
                  </span>
                </div>
              </div>
              <span style={{ flexShrink: 0, borderRadius: 20, padding: "3px 10px", backgroundColor: badge.bg, fontSize: 11, fontWeight: 500, color: badge.color }}>
                {task.status}
              </span>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "8px", marginTop: 4, fontSize: 13, fontWeight: 500, color: "var(--slate-secondary)", cursor: "pointer", borderRadius: 6, transition: "background-color 150ms" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
      >
        <Plus size={13} />
        Add task
      </button>
    </div>
  )
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 8 }}>
      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-secondary)", margin: 0 }}>No {label.toLowerCase()} yet</p>
      <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>{label} for this opportunity will appear here.</p>
    </div>
  )
}

function GlanceCard({ label, value, sub, subColor }: { label: string; value: string; sub: string; subColor: string }) {
  return (
    <div style={{ borderRadius: 10, padding: "14px 16px", backgroundColor: "var(--canvas)", border: "1px solid var(--border-default)" }}>
      <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>{label}</p>
      <p style={{ margin: "0 0 3px", fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>{value}</p>
      <p style={{ margin: 0, fontSize: 12, color: subColor }}>{sub}</p>
    </div>
  )
}

// ── Style helpers ──────────────────────────────────────────────────────────

const PROPOSAL_STATUS_STYLE: Record<Proposal["status"], { bg: string; color: string }> = {
  Draft:     { bg: "#EBF0F5", color: "#4A6080" },
  Final:     { bg: "#E0EDE6", color: "#3C5E4C" },
  Submitted: { bg: "#F2EDF3", color: "#7A5F7E" },
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  margin: "0 0 12px 0",
}

const ghostBtnStyle: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: 7,
  backgroundColor: "transparent",
  border: "1px solid var(--border-default)",
  fontSize: 13,
  fontWeight: 400,
  color: "var(--ink)",
  cursor: "pointer",
  transition: "background-color 150ms",
}

// ── Page ───────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "tasks",    label: "Tasks"    },
  { id: "budget",   label: "Budget"   },
  { id: "reports",  label: "Reports"  },
  { id: "notes",    label: "Notes"    },
  { id: "files",    label: "Files"    },
]

export default function OpportunityDetailPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [stage, setStage] = useState<Stage>("Active")
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: "", visible: false })

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: !t.done, status: !t.done ? "Done" : "To Do" } : t
      )
    )
  }

  function handleStageChange(s: Stage) {
    setStage(s)
    setToast({ msg: `Stage: ${s}`, visible: true })
    setTimeout(() => setToast((v) => ({ ...v, visible: false })), 3000)
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--surface-white)" }}>
      <Toast message={toast.msg} visible={toast.visible} />

      {/* Breadcrumb */}
      <div style={{ padding: "12px 32px", borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--surface-white)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Link href="/home" style={{ fontSize: 13, color: "var(--ink-tertiary)", textDecoration: "none" }}>Home</Link>
          <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>›</span>
          <Link href="/portfolio" style={{ fontSize: 13, color: "var(--ink-secondary)", textDecoration: "none" }}>Ford Foundation</Link>
          <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>›</span>
          <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>Equitable Futures Grant 2026</span>
        </div>
        <Link href="/portfolio" style={{ fontSize: 13, color: "var(--slate-secondary)", textDecoration: "none", fontWeight: 500 }}>
          ‹ Ford Foundation
        </Link>
      </div>

      {/* Page header */}
      <div style={{ padding: "24px 32px 0", backgroundColor: "var(--surface-white)", borderBottom: "1px solid var(--border-default)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: "32px",
              color: "var(--ink)",
              fontFamily: "var(--font-lora)",
            }}
          >
            Equitable Futures Grant 2026
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginTop: 2 }}>
            <StageControl stage={stage} onChange={handleStageChange} />
            <button
              type="button"
              onClick={() => router.push("/editor")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 8, border: "none",
                backgroundColor: "var(--slate-primary)", fontSize: 13, fontWeight: 500, color: "#FFFFFF",
                cursor: "pointer", transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
            >
              <Plus size={13} />
              New proposal
            </button>
          </div>
        </div>

        {/* Meta chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
          {[
            { label: "Ford Foundation",  style: { backgroundColor: "var(--canvas)", color: "var(--ink-secondary)" } },
            { label: "Active",           style: { backgroundColor: "#EBF0F5",       color: "#4A6080"              } },
            { label: "Due Jun 15, 2026", style: { backgroundColor: "#FDE8E8",       color: "#8B2020"              } },
            { label: "$75,000",          style: { backgroundColor: "var(--canvas)", color: "var(--ink-secondary)" } },
          ].map(({ label, style }) => (
            <span
              key={label}
              style={{ borderRadius: 20, padding: "4px 12px", fontSize: 13, border: "1px solid var(--border-default)", ...style }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          {["Add task", "Add note"].map((label) => (
            <button
              key={label}
              type="button"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, backgroundColor: "transparent", border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", cursor: "pointer", transition: "background-color 150ms" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
            >
              <Plus size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(({ id, label }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                style={{
                  position: "relative", padding: "8px 14px", background: "none", border: "none",
                  cursor: "pointer", fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--slate-primary)" : "var(--ink-secondary)",
                  transition: "color 150ms",
                }}
              >
                {label}
                {isActive && (
                  <div style={{ position: "absolute", bottom: 0, left: 14, right: 14, height: 2, borderRadius: 1, backgroundColor: "var(--slate-primary)" }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: "28px 32px", maxWidth: 960 }}>
        {activeTab === "overview" && <OverviewTab tasks={tasks} onToggle={toggleTask} stage={stage} />}
        {activeTab === "tasks"    && <TasksTab tasks={tasks} onToggle={toggleTask} />}
        {activeTab === "budget"   && <EmptyTab label="Budget" />}
        {activeTab === "reports"  && <EmptyTab label="Reports" />}
        {activeTab === "notes"    && <EmptyTab label="Notes" />}
        {activeTab === "files"    && <EmptyTab label="Files" />}
      </div>
    </div>
  )
}
