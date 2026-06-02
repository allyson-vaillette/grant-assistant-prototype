"use client"

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import {
  ChevronDown, ChevronRight, Copy, FileText, Plus, Paperclip, Pencil, Trash2, X,
  Flag, Share2, Sparkles, Loader2,
} from "lucide-react"
import { NewProposalModal } from "@/components/proposals/NewProposalModal"

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "overview" | "tasks" | "budget" | "reports" | "notes" | "files"
type TaskStatus = "To Do" | "In Progress" | "Done"
type Stage = "Tracking" | "Active" | "Submitted" | "Awarded" | "Reporting" | "Complete" | "Declined"
type LinkedObject = "Proposal" | "Budget" | "Report"

interface Note { id: string; text: string; date: string; author: string }
interface Proposal {
  id: string; name: string; status: "Draft" | "Final" | "Submitted"
  created: string; lastEdited: string; author: string
}

interface Task {
  id: string
  name: string
  assigneeId: string | null
  assigneeName: string | null
  dueDate: string | null
  status: TaskStatus
  done: boolean
  notes: string
  linkedObject: LinkedObject | null
}

interface Expense {
  id: string; date: string; description: string; category: string
  amount: number; receiptName: string | null
}

interface LessonsLearned { worked: string; didntWork: string; tryNext: string }

interface OpportunityReport {
  id: string
  name: string
  type: "Interim" | "Final" | "Progress"
  status: "Draft" | "In Review" | "Submitted"
  dueDate: string | null
  periodStart: string
  periodEnd: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const AWARDED_AMOUNT = 75000
const DEFAULT_EXPENSE_CATEGORIES = ["Personnel", "Supplies", "Travel", "Indirect Costs", "Program Expenses", "Other"]

const TEAMMATES = [
  { id: "taylor", name: "Taylor S.", initials: "TS" },
  { id: "marcus", name: "Marcus R.", initials: "MR" },
  { id: "jamie",  name: "Jamie K.",  initials: "JK" },
  { id: "alex",   name: "Alex M.",   initials: "AM" },
]

const KNOWN_NOTES: Note[] = [
  { id: "opp-note-1", text: "Spoke with program officer on May 5 — emphasized community engagement outcomes. She seemed receptive to the data-sharing angle.", date: "May 5, 2026", author: "Taylor S." },
  { id: "opp-note-2", text: "LOI submitted Mar 12. Received confirmation email Mar 14.", date: "Mar 12, 2026", author: "Taylor S." },
]

const KNOWN_PROPOSALS: Proposal[] = [
  { id: "submitted-1", name: "Equitable Futures — Final Submission", status: "Submitted", created: "Mar 1, 2026", lastEdited: "Apr 15, 2026", author: "Taylor S." },
  { id: "draft-1",     name: "Equitable Futures — Draft 1",          status: "Draft",     created: "Apr 3, 2026", lastEdited: "May 10, 2026", author: "Taylor S." },
]

const KNOWN_REPORTS_FOR_OPP: OpportunityReport[] = [
  {
    id: "eq-interim-h1-2026",
    name: "Equitable Futures Grant 2026 - Interim report - Jan 2026 - Jun 2026",
    type: "Interim",
    status: "Draft",
    dueDate: "2026-07-15",
    periodStart: "2026-01-01",
    periodEnd: "2026-06-30",
  },
]

const SIBLING_OPPORTUNITIES = [
  { id: "civic-tech-seed-2026", name: "Civic Tech Seed Fund 2026" },
  { id: "housing-equity-2026",  name: "Housing Equity Initiative 2026" },
]

const KNOWN_TASKS: Task[] = [
  { id: "t1", name: "Complete narrative section",       assigneeId: "taylor", assigneeName: "Taylor S.", dueDate: "2026-05-15", status: "To Do",       done: false, notes: "Need to add outcome data from Q1 report", linkedObject: "Proposal" },
  { id: "t2", name: "Get budget sign-off from finance", assigneeId: "taylor", assigneeName: "Taylor S.", dueDate: "2026-05-22", status: "In Progress", done: false, notes: "Waiting on Marcus to review", linkedObject: null },
  { id: "t3", name: "Collect letters of support",       assigneeId: null,     assigneeName: null,         dueDate: "2026-06-01", status: "To Do",       done: false, notes: "", linkedObject: null },
  { id: "t4", name: "Review budget allocation",         assigneeId: "marcus", assigneeName: "Marcus R.", dueDate: "2026-06-10", status: "To Do",       done: false, notes: "", linkedObject: null },
  { id: "t5", name: "Submit letter of intent",          assigneeId: "taylor", assigneeName: "Taylor S.", dueDate: "2026-04-01", status: "Done",        done: true,  notes: "Submitted on time, received confirmation Apr 3", linkedObject: null },
]

const KNOWN_EXPENSES: Expense[] = [
  { id: "e1", date: "2026-05-01", description: "Program staff salary (May)",     category: "Personnel",        amount: 4200, receiptName: null },
  { id: "e2", date: "2026-05-05", description: "Community meeting venue rental", category: "Program Expenses", amount: 350,  receiptName: null },
  { id: "e3", date: "2026-05-12", description: "Travel to partner site visit",   category: "Travel",           amount: 180,  receiptName: null },
  { id: "e4", date: "2026-05-15", description: "Office supplies",                category: "Supplies",         amount: 95,   receiptName: null },
]

const SUGGESTED_TASKS_BY_STAGE: Partial<Record<Stage, Array<{ name: string; linkedObject: LinkedObject | null }>>> = {
  Tracking:  [
    { name: "Research funder priorities", linkedObject: null },
    { name: "Schedule intro call", linkedObject: null },
    { name: "Review past grants", linkedObject: null },
  ],
  Active: [
    { name: "Write proposal", linkedObject: "Proposal" },
    { name: "Gather supporting documents", linkedObject: null },
    { name: "Get internal sign-off", linkedObject: null },
  ],
  Submitted: [
    { name: "Follow up with program officer", linkedObject: null },
    { name: "Log submission confirmation", linkedObject: null },
  ],
  Awarded: [
    { name: "Set up budget", linkedObject: "Budget" },
    { name: "Schedule reporting calendar", linkedObject: null },
    { name: "Notify team", linkedObject: null },
  ],
  Reporting: [
    { name: "Collect evidence", linkedObject: null },
    { name: "Write report", linkedObject: "Report" },
    { name: "Submit report", linkedObject: "Report" },
  ],
  Complete: [
    { name: "Archive materials", linkedObject: null },
    { name: "Debrief with team", linkedObject: null },
  ],
}

// ── Stage config ───────────────────────────────────────────────────────────

const STAGE_ORDER: Stage[] = ["Tracking", "Active", "Submitted", "Awarded", "Reporting", "Complete"]
const TERMINAL_STAGES: Stage[] = ["Declined", "Complete"]
const UNLOCK_STAGES: Stage[] = ["Awarded", "Reporting", "Complete"]
const LOCKED_TABS: TabId[] = ["budget", "reports"]

function isTabLocked(tabId: TabId, stage: Stage): boolean {
  return LOCKED_TABS.includes(tabId) && !UNLOCK_STAGES.includes(stage)
}

const STAGE_DOT: Record<Stage, string> = {
  Tracking: "#A6B3C5", Active: "#6B819E", Submitted: "#AD9DAE",
  Awarded: "#3C5E4C", Reporting: "#D19A66", Complete: "#A6B3C5", Declined: "#E0E0E0",
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
  "To Do":       { bg: "#EBF0F5", color: "#4A6080" },
  "In Progress": { bg: "#FEF3DC", color: "#C47A10" },
  "Done":        { bg: "#E0EDE6", color: "#3C5E4C" },
}

const PROPOSAL_STATUS_STYLE: Record<Proposal["status"], { bg: string; color: string }> = {
  Draft:     { bg: "#EBF0F5", color: "#4A6080" },
  Final:     { bg: "#E0EDE6", color: "#3C5E4C" },
  Submitted: { bg: "#F2EDF3", color: "#7A5F7E" },
}

const LINKED_OBJECT_STYLE: Record<LinkedObject, { bg: string; color: string }> = {
  Proposal: { bg: "#EBF0F5", color: "#4A6080" },
  Budget:   { bg: "#E0EDE6", color: "#3C5E4C" },
  Report:   { bg: "#F5EAD8", color: "#8B5E30" },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatDueShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.done || task.status === "Done") return false
  return task.dueDate < todayISO()
}

// ── Core sub-components ────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%",
      transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(12px)",
      opacity: visible ? 1 : 0, transition: "transform 0.2s ease, opacity 0.2s ease",
      backgroundColor: "#FFFFFF", border: "var(--border-subtle)", borderRadius: 12,
      padding: "10px 20px", boxShadow: "var(--elevation-card)",
      fontSize: 13, color: "var(--ink)", zIndex: 100, pointerEvents: "none", whiteSpace: "nowrap",
    }}>
      {message}
    </div>
  )
}

function StageControl({ stage, onChange }: { stage: Stage; onChange: (s: Stage) => void }) {
  const [open, setOpen] = useState(false)
  const badge = STAGE_BADGE[stage]
  const dot = STAGE_DOT[stage]
  const nextStages = STAGE_ORDER.filter((s) => s !== stage && !TERMINAL_STAGES.includes(s))
    .concat(["Declined"]).filter((s) => s !== stage)

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button type="button" onClick={() => setOpen((v) => !v)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 8, border: "var(--border-subtle)", backgroundColor: "var(--surface-white)", cursor: "pointer", transition: "background-color 150ms" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-white)" }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dot, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 500, borderRadius: 20, padding: "2px 8px", backgroundColor: badge.bg, color: badge.color }}>{stage}</span>
        <ChevronDown size={12} color="var(--ink-tertiary)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, backgroundColor: "var(--surface-white)", border: "var(--border-subtle)", borderRadius: 10, boxShadow: "var(--elevation-raised)", zIndex: 50, minWidth: 160, overflow: "hidden" }}>
          {nextStages.map((s) => {
            const b = STAGE_BADGE[s]
            return (
              <button key={s} type="button" onClick={() => { onChange(s); setOpen(false) }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background-color 100ms" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: STAGE_DOT[s], flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, borderRadius: 20, padding: "2px 8px", backgroundColor: b.bg, color: b.color }}>{s}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gradient-avatar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>{initials}</span>
    </div>
  )
}

function UnassignedAvatar() {
  return (
    <div style={{ width: 22, height: 22, borderRadius: "50%", border: "1.5px dashed var(--ink-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 10, color: "var(--ink-tertiary)", lineHeight: 1 }}>—</span>
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

// ── Stage Change Modal ─────────────────────────────────────────────────────

function StageChangeModal({ open, pendingStage, onConfirm, onAddTasks, onSkip, onCancel }: {
  open: boolean
  pendingStage: Stage | null
  onConfirm: () => void
  onAddTasks: (tasks: Task[]) => void
  onSkip: () => void
  onCancel: () => void
}) {
  const [step, setStep] = useState<"confirm" | "suggest">("confirm")
  const suggestions = pendingStage ? (SUGGESTED_TASKS_BY_STAGE[pendingStage] ?? []) : []
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (open) {
      setStep("confirm")
      const init: Record<number, boolean> = {}
      suggestions.forEach((_, i) => { init[i] = true })
      setChecked(init)
    }
  }, [open, pendingStage]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !pendingStage) return null

  function handleConfirm() {
    onConfirm()
    if (suggestions.length > 0) { setStep("suggest") } else { onSkip() }
  }

  function handleAddTasks() {
    const tasks: Task[] = suggestions
      .filter((_, i) => checked[i] !== false)
      .map((s, i) => ({
        id: `suggested-${Date.now()}-${i}`,
        name: s.name,
        assigneeId: null,
        assigneeName: null,
        dueDate: null,
        status: "To Do" as TaskStatus,
        done: false,
        notes: "",
        linkedObject: s.linkedObject,
      }))
    onAddTasks(tasks)
  }

  const badge = STAGE_BADGE[pendingStage]

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(42,42,42,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{ width: 440, backgroundColor: "#FFFFFF", borderRadius: 14, boxShadow: "var(--elevation-overlay)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {step === "confirm" ? (
          <>
            <div style={{ padding: "20px 24px", borderBottom: "var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-lora)" }}>
                  Move to{" "}
                  <span style={{ borderRadius: 20, padding: "2px 10px", fontSize: 15, backgroundColor: badge.bg, color: badge.color }}>{pendingStage}</span>
                  ?
                </h2>
                <button type="button" onClick={onCancel} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "var(--border-subtle)", backgroundColor: "transparent", cursor: "pointer", flexShrink: 0 }}>
                  <X size={14} color="var(--ink-secondary)" />
                </button>
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>
                This will update the stage for this opportunity.{" "}
                {pendingStage === "Awarded" && "Budget and report tracking will unlock."}
                {pendingStage === "Declined" && "This opportunity will be marked as declined."}
              </p>
            </div>
            <div style={{ padding: "16px 24px 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={onCancel}
                style={{ padding: "8px 18px", borderRadius: 8, border: "var(--border-subtle)", backgroundColor: "transparent", fontSize: 13, color: "var(--ink)", cursor: "pointer", transition: "background-color 150ms" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
              >
                Cancel
              </button>
              <button type="button" onClick={handleConfirm}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: "var(--slate-primary)", fontSize: 13, fontWeight: 500, color: "#FFFFFF", cursor: "pointer" }}>
                Move to {pendingStage}
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: "20px 24px 12px", borderBottom: "var(--border-subtle)" }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-lora)" }}>
                Suggested tasks for {pendingStage}
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--ink-secondary)" }}>
                These tasks are commonly needed at this stage. Uncheck any you don&apos;t want.
              </p>
            </div>
            <div style={{ padding: "12px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestions.map((s, i) => (
                <label key={i}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, border: "var(--border-subtle)", cursor: "pointer", backgroundColor: checked[i] !== false ? "var(--slate-tint)" : "var(--surface-white)", transition: "background-color 150ms" }}
                >
                  <input
                    type="checkbox"
                    checked={checked[i] !== false}
                    onChange={(e) => setChecked(prev => ({ ...prev, [i]: e.target.checked }))}
                    style={{ width: 14, height: 14, cursor: "pointer", accentColor: "var(--slate-primary)", flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, fontSize: 13, color: "var(--ink)" }}>{s.name}</span>
                  {s.linkedObject && (
                    <span style={{ borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 500, backgroundColor: LINKED_OBJECT_STYLE[s.linkedObject].bg, color: LINKED_OBJECT_STYLE[s.linkedObject].color, flexShrink: 0 }}>
                      {s.linkedObject}
                    </span>
                  )}
                </label>
              ))}
            </div>
            <div style={{ padding: "12px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "var(--border-subtle)" }}>
              <button type="button" onClick={onSkip}
                style={{ background: "none", border: "none", fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer", padding: 0 }}>
                Skip
              </button>
              <button type="button" onClick={handleAddTasks}
                style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: "var(--slate-primary)", fontSize: 13, fontWeight: 500, color: "#FFFFFF", cursor: "pointer" }}>
                Add tasks
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Share Modal ────────────────────────────────────────────────────────────

function ShareModal({ open, onClose, onShare }: {
  open: boolean; onClose: () => void; onShare: (teammate: string) => void
}) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<typeof TEAMMATES[number] | null>(null)
  const [note, setNote] = useState("")
  const [listOpen, setListOpen] = useState(false)

  useEffect(() => { if (open) { setQuery(""); setSelected(null); setNote(""); setListOpen(false) } }, [open])

  const filtered = TEAMMATES.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))
  if (!open) return null

  function handleSelect(t: typeof TEAMMATES[number]) { setSelected(t); setQuery(t.name); setListOpen(false) }

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(42,42,42,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: 400, backgroundColor: "#FFFFFF", borderRadius: 14, boxShadow: "var(--elevation-overlay)", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-lora)" }}>Share this opportunity</h2>
          <button type="button" onClick={onClose} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "var(--border-subtle)", backgroundColor: "transparent", cursor: "pointer" }}>
            <X size={14} color="var(--ink-secondary)" />
          </button>
        </div>
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ marginBottom: 16, position: "relative" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>Teammate</label>
            <input type="text" value={query} onChange={(e) => { setQuery(e.target.value); setSelected(null); setListOpen(true) }} onFocus={() => setListOpen(true)} onBlur={() => setTimeout(() => setListOpen(false), 150)} placeholder="Search by name..."
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "var(--border-subtle)", fontSize: 13, color: "var(--ink)", outline: "none", boxSizing: "border-box" as const }}
            />
            {listOpen && filtered.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, backgroundColor: "#FFFFFF", border: "var(--border-subtle)", borderRadius: 10, boxShadow: "var(--elevation-raised)", zIndex: 300, overflow: "hidden" }}>
                {filtered.map((t) => (
                  <button key={t.id} type="button" onMouseDown={() => handleSelect(t)}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                  >
                    <Avatar initials={t.initials} />
                    <span style={{ fontSize: 13, color: "var(--ink)" }}>{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
              Note <span style={{ fontWeight: 400, color: "var(--ink-tertiary)" }}>(optional)</span>
            </label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a message..." rows={3}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "var(--border-subtle)", fontSize: 13, color: "var(--ink)", outline: "none", resize: "none" as const, lineHeight: "19px", boxSizing: "border-box" as const, fontFamily: "inherit" }}
            />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 20px", borderTop: "var(--border-subtle)" }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, border: "var(--border-subtle)", backgroundColor: "transparent", fontSize: 13, color: "var(--ink)", cursor: "pointer" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >Cancel</button>
          <button type="button" disabled={!selected} onClick={() => { if (selected) { onShare(selected.name); onClose() } }}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: selected ? "var(--slate-primary)" : "var(--slate-tint)", fontSize: 13, fontWeight: 500, color: selected ? "#FFFFFF" : "var(--ink-tertiary)", cursor: selected ? "pointer" : "not-allowed" }}
          >Share</button>
        </div>
      </div>
    </div>
  )
}

// ── Coaching Section ───────────────────────────────────────────────────────

function CoachingSection({ lessons, onLessonsChange }: { lessons: LessonsLearned; onLessonsChange: (l: LessonsLearned) => void }) {
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved] = useState(false)

  const textareaStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: 8, border: "var(--border-subtle)",
    backgroundColor: "var(--surface-white)", fontSize: 13, color: "var(--ink)", outline: "none",
    resize: "vertical" as const, lineHeight: "19px", boxSizing: "border-box" as const, fontFamily: "inherit", minHeight: 72,
  }

  function handleGenerate() {
    setGenerating(true)
    setTimeout(() => {
      onLessonsChange({
        worked: "Strong alignment with the funder's focus on community-led solutions. Our outcome data was compelling.",
        didntWork: "Budget justification was not detailed enough for this funder's standards.",
        tryNext: "Request a pre-submission call at least 6 weeks before the deadline.",
      })
      setGenerating(false)
    }, 1600)
  }

  return (
    <div style={{ backgroundColor: "var(--canvas)", borderBottom: "var(--border-subtle)", padding: "24px 32px" }}>
      <style>{`@keyframes ga-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <p style={{ ...sectionLabelStyle, marginBottom: 4 }}>Lessons learned</p>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>
        This opportunity was declined. Capture what you learned so the next one goes better.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
        {(["worked", "didntWork", "tryNext"] as const).map((field) => (
          <div key={field}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
              {field === "worked" ? "What worked" : field === "didntWork" ? "What didn't work" : "What to try next time"}
            </label>
            <textarea value={lessons[field]} onChange={(e) => onLessonsChange({ ...lessons, [field]: e.target.value })} rows={3} style={textareaStyle} />
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" onClick={handleGenerate} disabled={generating}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "var(--border-subtle)", backgroundColor: "var(--surface-white)", fontSize: 13, fontWeight: 500, color: "var(--slate-primary)", cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.7 : 1 }}
          >
            {generating ? <Loader2 size={13} style={{ animation: "ga-spin 1s linear infinite" }} /> : <Sparkles size={13} />}
            {generating ? "Generating..." : "Generate insights with AI"}
          </button>
          <button type="button" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: saved ? "var(--evergreen)" : "var(--slate-primary)", fontSize: 13, fontWeight: 500, color: "#FFFFFF", cursor: "pointer", transition: "background-color 200ms" }}
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── TasksTab ───────────────────────────────────────────────────────────────

function TasksTab({ tasks, onAddTask, onUpdateTask, proposals, stage, onNavigateToTab }: {
  tasks: Task[]
  onAddTask: (task: Task) => void
  onUpdateTask: (task: Task) => void
  proposals: Proposal[]
  stage: Stage
  onNavigateToTab: (tab: TabId) => void
}) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Task | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [addName, setAddName] = useState("")
  const [addExpanded, setAddExpanded] = useState(false)
  const [addDraft, setAddDraft] = useState<Partial<Task>>({ assigneeId: null, assigneeName: null, dueDate: null, notes: "", linkedObject: null })
  const [doneCollapsed, setDoneCollapsed] = useState(true)
  const [dismissedDuePrompt, setDismissedDuePrompt] = useState<Set<string>>(new Set())
  const addInputRef = useRef<HTMLInputElement>(null)

  const availableLinkedObjects: LinkedObject[] = [
    ...(proposals.length > 0 ? ["Proposal" as LinkedObject] : []),
    ...(UNLOCK_STAGES.includes(stage) ? ["Budget" as LinkedObject, "Report" as LinkedObject] : []),
  ]

  const activeTasks = tasks.filter(t => !t.done && t.status !== "Done")
  const doneTasks = tasks.filter(t => t.done || t.status === "Done")

  const overdueTasks = activeTasks.filter(t => isOverdue(t))
  const todoTasks = activeTasks.filter(t => t.status === "To Do" && !isOverdue(t))
  const inProgressTasks = activeTasks.filter(t => t.status === "In Progress" && !isOverdue(t))

  useEffect(() => { if (isAdding) addInputRef.current?.focus() }, [isAdding])

  function startAdding() {
    setIsAdding(true)
    setAddName("")
    setAddExpanded(false)
    setAddDraft({ assigneeId: null, assigneeName: null, dueDate: null, notes: "", linkedObject: null })
  }

  function cancelAdding() { setIsAdding(false); setAddName(""); setAddExpanded(false) }

  function commitAdd() {
    const name = addName.trim()
    if (!name) return cancelAdding()
    const tm = TEAMMATES.find(t => t.id === addDraft.assigneeId)
    onAddTask({
      id: `task-${Date.now()}`,
      name,
      assigneeId: addDraft.assigneeId ?? null,
      assigneeName: tm?.name ?? null,
      dueDate: addDraft.dueDate ?? null,
      status: "To Do",
      done: false,
      notes: addDraft.notes ?? "",
      linkedObject: addDraft.linkedObject ?? null,
    })
    setIsAdding(false)
    setAddName("")
    setAddExpanded(false)
  }

  function startEdit(task: Task) {
    setEditingId(task.id)
    setEditDraft({ ...task })
  }

  function saveEdit() {
    if (!editDraft) return
    onUpdateTask(editDraft)
    setEditingId(null)
    setEditDraft(null)
  }

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px", borderRadius: 7, border: "var(--border-subtle)",
    fontSize: 13, color: "var(--ink)", backgroundColor: "var(--surface-white)", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box" as const,
  }

  function renderLinkedChip(obj: LinkedObject | null, onNavigate: () => void) {
    if (!obj) return null
    const s = LINKED_OBJECT_STYLE[obj]
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); onNavigate() }}
        style={{ borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 500, backgroundColor: s.bg, color: s.color, border: "none", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}
      >
        {obj}
        <ChevronRight size={10} />
      </button>
    )
  }

  function handleLinkedNavigation(obj: LinkedObject | null) {
    if (!obj) return
    if (obj === "Proposal") router.push(`/proposals/equitable-futures-2026-draft`)
    else if (obj === "Budget") onNavigateToTab("budget")
    else if (obj === "Report") onNavigateToTab("reports")
  }

  function renderTaskRow(task: Task, isLast: boolean) {
    const overdue = isOverdue(task)
    const isEditing = editingId === task.id
    const showDuePrompt = !task.dueDate && !task.done && !dismissedDuePrompt.has(task.id)

    if (isEditing && editDraft) {
      return (
        <div key={task.id} style={{ borderBottom: isLast ? "none" : "var(--border-subtle)" }}>
          <div style={{ padding: "14px 18px", backgroundColor: "var(--canvas)", display: "flex", flexDirection: "column", gap: 10 }}>
            <input type="text" value={editDraft.name} onChange={(e) => setEditDraft(p => p ? { ...p, name: e.target.value } : p)}
              style={{ ...inputStyle, fontSize: 14, fontWeight: 500, width: "100%" }} autoFocus
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              <div style={{ display: "flex", flexDirection: "column", flex: "0 0 160px" }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 3 }}>Assignee</label>
                <select value={editDraft.assigneeId ?? ""}
                  onChange={(e) => { const t = TEAMMATES.find(x => x.id === e.target.value); setEditDraft(p => p ? { ...p, assigneeId: t?.id ?? null, assigneeName: t?.name ?? null } : p) }}
                  style={{ ...inputStyle, width: "100%" }}
                >
                  <option value="">Unassigned</option>
                  {TEAMMATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", flex: "0 0 160px" }}>
                <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 3 }}>Due date</label>
                <input type="date" value={editDraft.dueDate ?? ""} onChange={(e) => setEditDraft(p => p ? { ...p, dueDate: e.target.value || null } : p)} style={{ ...inputStyle, width: "100%" }} />
              </div>
              {availableLinkedObjects.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", flex: "0 0 148px" }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 3 }}>Link to...</label>
                  <select value={editDraft.linkedObject ?? ""} onChange={(e) => setEditDraft(p => p ? { ...p, linkedObject: (e.target.value || null) as LinkedObject | null } : p)} style={{ ...inputStyle, width: "100%" }}>
                    <option value="">None</option>
                    {availableLinkedObjects.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              )}
            </div>
            {/* Status segmented control */}
            <div style={{ display: "flex", gap: 4 }}>
              {(["To Do", "In Progress", "Done"] as TaskStatus[]).map(s => {
                const st = TASK_STATUS_STYLE[s]
                const isActive = editDraft.status === s
                return (
                  <button key={s} type="button" onClick={() => setEditDraft(p => p ? { ...p, status: s, done: s === "Done" } : p)}
                    style={{ padding: "4px 12px", borderRadius: 6, border: `1.5px solid ${isActive ? st.color : "var(--border-default)"}`, backgroundColor: isActive ? st.bg : "transparent", fontSize: 12, fontWeight: isActive ? 600 : 400, color: isActive ? st.color : "var(--ink-tertiary)", cursor: "pointer", transition: "all 150ms" }}
                  >
                    {s}
                  </button>
                )
              })}
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 3, display: "block" }}>Notes</label>
              <textarea value={editDraft.notes} onChange={(e) => setEditDraft(p => p ? { ...p, notes: e.target.value } : p)}
                rows={2} placeholder="Add a note..." style={{ ...inputStyle, width: "100%", resize: "none" as const, lineHeight: "19px" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="button" onClick={saveEdit}
                style={{ padding: "6px 14px", borderRadius: 7, border: "none", backgroundColor: "var(--slate-primary)", color: "#FFFFFF", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                Save
              </button>
              <button type="button" onClick={() => { setEditingId(null); setEditDraft(null) }}
                style={{ background: "none", border: "none", fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer", padding: 0 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )
    }

    const statusStyle = TASK_STATUS_STYLE[task.status]
    return (
      <div key={task.id}>
        <div
          onClick={() => startEdit(task)}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom: (isLast && !showDuePrompt) ? "none" : "var(--border-subtle)", opacity: task.done ? 0.5 : 1, cursor: "pointer", transition: "background-color 150ms" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--canvas)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
        >
          {/* Overdue indicator */}
          {overdue && <div style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "var(--error)", flexShrink: 0 }} />}

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 4px", fontSize: 14, color: "var(--ink)", textDecoration: task.done ? "line-through" : "none", lineHeight: "18px" }}>{task.name}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
              {task.dueDate && (
                <span style={{ fontSize: 12, color: overdue ? "var(--error)" : "var(--ink-tertiary)", fontWeight: overdue ? 500 : 400 }}>
                  {overdue ? "Overdue · " : ""}{formatDueShort(task.dueDate)}
                </span>
              )}
              {overdue && (
                <span style={{ borderRadius: 4, padding: "1px 6px", fontSize: 11, fontWeight: 600, backgroundColor: "#FDE8E8", color: "#8B2020" }}>Overdue</span>
              )}
              {task.notes && <span style={{ fontSize: 12, color: "var(--ink-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{task.notes}</span>}
            </div>
          </div>

          {/* Linked object chip */}
          {task.linkedObject && renderLinkedChip(task.linkedObject, () => handleLinkedNavigation(task.linkedObject))}

          {/* Assignee avatar */}
          {task.assigneeId
            ? <Avatar initials={TEAMMATES.find(t => t.id === task.assigneeId)?.initials ?? "?"} />
            : <UnassignedAvatar />
          }
          {task.assigneeName
            ? <span style={{ fontSize: 12, color: "var(--ink-tertiary)", whiteSpace: "nowrap", flexShrink: 0 }}>{task.assigneeName}</span>
            : <span style={{ fontSize: 12, color: "var(--ink-tertiary)", whiteSpace: "nowrap", flexShrink: 0, fontStyle: "italic" }}>Unassigned</span>
          }

          <span style={{ flexShrink: 0, borderRadius: 20, padding: "3px 10px", backgroundColor: statusStyle.bg, fontSize: 11, fontWeight: 500, color: statusStyle.color }}>
            {task.status}
          </span>
        </div>

        {/* Due date soft prompt */}
        {showDuePrompt && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 18px 8px", borderBottom: isLast ? "none" : "var(--border-subtle)" }}>
            <button type="button" onClick={(e) => { e.stopPropagation(); startEdit(task) }}
              style={{ background: "none", border: "none", fontSize: 12, color: "var(--ink-tertiary)", cursor: "pointer", padding: 0, textDecoration: "underline", textDecorationStyle: "dotted" }}
            >
              Add a due date?
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); setDismissedDuePrompt(prev => new Set([...Array.from(prev), task.id])) }}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <X size={11} color="var(--ink-tertiary)" />
            </button>
          </div>
        )}
      </div>
    )
  }

  function renderSection(label: string, sectionTasks: Task[], accent?: string) {
    if (sectionTasks.length === 0) return null
    return (
      <div>
        <div style={{ padding: "8px 18px 4px", backgroundColor: "var(--canvas)", borderBottom: "var(--border-subtle)" }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: accent ?? "var(--ink-tertiary)" }}>
            {label} · {sectionTasks.length}
          </span>
        </div>
        {sectionTasks.map((t, i) => renderTaskRow(t, i === sectionTasks.length - 1))}
      </div>
    )
  }

  const hasActiveTasks = overdueTasks.length + todoTasks.length + inProgressTasks.length > 0

  return (
    <div>
      {/* Add task inline form */}
      {isAdding ? (
        <div style={{ marginBottom: 12, padding: "12px 16px", borderRadius: 10, backgroundColor: "var(--surface-white)", border: "var(--border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: addExpanded ? 10 : 0 }}>
            <input ref={addInputRef} type="text" value={addName} onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commitAdd() } if (e.key === "Escape") cancelAdding() }}
              placeholder="Task name..."
              style={{ ...inputStyle, flex: 1, fontSize: 14 }}
            />
            <button type="button" onClick={() => setAddExpanded(v => !v)}
              style={{ background: "none", border: "none", fontSize: 12, color: "var(--slate-secondary)", cursor: "pointer", padding: "4px 6px", borderRadius: 4, whiteSpace: "nowrap", flexShrink: 0 }}>
              {addExpanded ? "Less" : "Add details"}
            </button>
          </div>

          {addExpanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                <div style={{ display: "flex", flexDirection: "column", flex: "0 0 160px" }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 3 }}>Assignee</label>
                  <select value={addDraft.assigneeId ?? ""}
                    onChange={(e) => { const t = TEAMMATES.find(x => x.id === e.target.value); setAddDraft(p => ({ ...p, assigneeId: t?.id ?? null, assigneeName: t?.name ?? null })) }}
                    style={{ ...inputStyle, width: "100%" }}
                  >
                    <option value="">Unassigned</option>
                    {TEAMMATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", flex: "0 0 160px" }}>
                  <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 3 }}>Due date</label>
                  <input type="date" value={addDraft.dueDate ?? ""} onChange={(e) => setAddDraft(p => ({ ...p, dueDate: e.target.value || null }))} style={{ ...inputStyle, width: "100%" }} />
                </div>
                {availableLinkedObjects.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", flex: "0 0 148px" }}>
                    <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 3 }}>Link to...</label>
                    <select value={addDraft.linkedObject ?? ""} onChange={(e) => setAddDraft(p => ({ ...p, linkedObject: (e.target.value || null) as LinkedObject | null }))} style={{ ...inputStyle, width: "100%" }}>
                      <option value="">None</option>
                      {availableLinkedObjects.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 3, display: "block" }}>Notes</label>
                <textarea value={addDraft.notes ?? ""} onChange={(e) => setAddDraft(p => ({ ...p, notes: e.target.value }))}
                  rows={2} placeholder="Add a note..." style={{ ...inputStyle, width: "100%", resize: "none" as const, lineHeight: "19px" }}
                />
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
            <button type="button" onClick={commitAdd}
              style={{ padding: "6px 14px", borderRadius: 7, border: "none", backgroundColor: "var(--slate-primary)", color: "#FFFFFF", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              Add task
            </button>
            <button type="button" onClick={cancelAdding}
              style={{ background: "none", border: "none", fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer", padding: 0 }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={startAdding}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "8px 0", marginBottom: 8, fontSize: 13, fontWeight: 500, color: "var(--slate-secondary)", cursor: "pointer", borderRadius: 6, transition: "background-color 150ms" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
        >
          <Plus size={13} />
          Add task
        </button>
      )}

      {/* Task list */}
      {!hasActiveTasks && doneTasks.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>No tasks yet. Add one above.</p>
      ) : (
        <div style={{ borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", overflow: "hidden", boxShadow: "var(--elevation-card)" }}>
          {/* Overdue */}
          {overdueTasks.length > 0 && renderSection("Overdue", overdueTasks, "#8B2020")}
          {/* To Do */}
          {todoTasks.length > 0 && renderSection("To Do", todoTasks)}
          {/* In Progress */}
          {inProgressTasks.length > 0 && renderSection("In Progress", inProgressTasks, "#C47A10")}

          {/* Done (collapsed) */}
          {doneTasks.length > 0 && (
            <div>
              <button type="button" onClick={() => setDoneCollapsed(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "8px 18px", background: "var(--canvas)", border: "none", borderTop: hasActiveTasks ? "var(--border-subtle)" : "none", cursor: "pointer", textAlign: "left" }}>
                <ChevronRight size={12} color="var(--ink-tertiary)" style={{ transform: doneCollapsed ? "none" : "rotate(90deg)", transition: "transform 150ms" }} />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "var(--evergreen)" }}>
                  Done · {doneTasks.length}
                </span>
              </button>
              {!doneCollapsed && doneTasks.map((t, i) => renderTaskRow(t, i === doneTasks.length - 1))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── BudgetTab ──────────────────────────────────────────────────────────────

function BudgetTab({ awardedAmount, expenses, onAddExpense, onUpdateExpense, onDeleteExpense }: {
  awardedAmount: number; expenses: Expense[]
  onAddExpense: (e: Expense) => void; onUpdateExpense: (e: Expense) => void; onDeleteExpense: (id: string) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Expense | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const allCategories = [...DEFAULT_EXPENSE_CATEGORIES, ...customCategories]
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const remaining = awardedAmount - totalSpent
  const isOverspent = remaining < 0

  function startNew() { setEditingId("new"); setDraft({ id: `e${Date.now()}`, date: todayISO(), description: "", category: "Personnel", amount: 0, receiptName: null }); setDeletingId(null) }
  function cancelEdit() { setEditingId(null); setDraft(null) }
  function saveEdit() {
    if (!draft) return
    if (!DEFAULT_EXPENSE_CATEGORIES.includes(draft.category) && !customCategories.includes(draft.category) && draft.category.trim()) setCustomCategories(prev => [...prev, draft.category])
    if (editingId === "new") onAddExpense(draft); else onUpdateExpense(draft)
    setEditingId(null); setDraft(null)
  }

  const editInputStyle: React.CSSProperties = { padding: "6px 10px", borderRadius: 6, border: "var(--border-subtle)", fontSize: 13, color: "var(--ink)", backgroundColor: "var(--surface-white)", outline: "none", width: "100%", boxSizing: "border-box" as const }

  function renderEditRow(borderBottom: string) {
    if (!draft) return null
    return (
      <div style={{ padding: "14px 18px", backgroundColor: "var(--canvas)", borderBottom, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: "0 0 140px" }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 2 }}>Date</span>
            <input type="date" value={draft.date} onChange={(e) => setDraft(p => p ? { ...p, date: e.target.value } : null)} style={editInputStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 2 }}>Description</span>
            <input type="text" value={draft.description} onChange={(e) => setDraft(p => p ? { ...p, description: e.target.value } : null)} placeholder="e.g. Program supplies" style={editInputStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: "0 0 164px" }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 2 }}>Category</span>
            <input list="expense-categories" value={draft.category} onChange={(e) => setDraft(p => p ? { ...p, category: e.target.value } : null)} style={editInputStyle} />
            <datalist id="expense-categories">{allCategories.map(c => <option key={c} value={c} />)}</datalist>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: "0 0 120px" }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 2 }}>Amount</span>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink-secondary)", pointerEvents: "none" }}>$</span>
              <input type="number" min="0" step="1" value={draft.amount || ""} onChange={(e) => setDraft(p => p ? { ...p, amount: parseFloat(e.target.value) || 0 } : null)} placeholder="0" style={{ ...editInputStyle, paddingLeft: 24 }} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--slate-secondary)", cursor: "pointer", borderRadius: 6, padding: "5px 10px", border: "var(--border-subtle)", backgroundColor: "transparent" }}>
            <input type="file" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) setDraft(p => p ? { ...p, receiptName: file.name } : null) }} />
            <Paperclip size={13} /> Attach receipt
          </label>
          {draft.receiptName && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ink-secondary)" }}>
              <span>{draft.receiptName}</span>
              <button type="button" onClick={() => setDraft(p => p ? { ...p, receiptName: null } : null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
                <X size={12} color="var(--ink-tertiary)" />
              </button>
            </div>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" onClick={saveEdit} style={{ padding: "6px 14px", borderRadius: 7, border: "none", backgroundColor: "var(--slate-primary)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Save</button>
            <button type="button" onClick={cancelEdit} style={{ background: "none", border: "none", fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer", textDecoration: "underline" }}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  const statCardStyle: React.CSSProperties = { borderRadius: 10, padding: "14px 16px", backgroundColor: "var(--canvas)", border: "var(--border-subtle)" }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <p style={sectionLabelStyle}>Awarded</p>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em" }}>{formatCurrency(awardedAmount)}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div style={statCardStyle}><p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "var(--ink-tertiary)" }}>Awarded</p><p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>{formatCurrency(awardedAmount)}</p></div>
        <div style={statCardStyle}><p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "var(--ink-tertiary)" }}>Spent</p><p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>{formatCurrency(totalSpent)}</p></div>
        <div style={statCardStyle}><p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "var(--ink-tertiary)" }}>Remaining</p><p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: isOverspent ? "#D97706" : "var(--ink)" }}>{formatCurrency(remaining)}</p></div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ ...sectionLabelStyle, margin: 0 }}>Expenses</p>
          <button type="button" onClick={startNew} style={{ background: "none", border: "none", fontSize: 13, fontWeight: 500, color: "var(--slate-secondary)", cursor: "pointer", padding: "4px 8px", borderRadius: 6, transition: "background-color 150ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >+ Add expense</button>
        </div>
        {expenses.length === 0 && editingId !== "new" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--ink-secondary)" }}>No expenses recorded yet.</p>
            <button type="button" onClick={startNew} style={{ marginTop: 4, padding: "7px 16px", borderRadius: 7, border: "none", backgroundColor: "var(--slate-primary)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Add expense</button>
          </div>
        ) : (
          <div style={{ borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", overflow: "hidden", boxShadow: "var(--elevation-card)" }}>
            {expenses.map((expense, i) => {
              const isEditing = editingId === expense.id
              const isDeleting = deletingId === expense.id
              const isLast = i === expenses.length - 1
              const borderBottom = (isLast && editingId !== "new") ? "none" : "var(--border-subtle)"
              if (isEditing && draft) return <div key={expense.id}>{renderEditRow(borderBottom)}</div>
              return (
                <div key={expense.id}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderBottom, backgroundColor: isDeleting ? "var(--canvas)" : "var(--surface-white)", transition: "background-color 150ms" }}
                  onMouseEnter={() => { if (!isDeleting) setHoveredRow(expense.id) }}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {isDeleting ? (
                    <>
                      <span style={{ flex: 1, fontSize: 13, color: "var(--ink-secondary)" }}>Delete &ldquo;{expense.description}&rdquo;?</span>
                      <button type="button" onClick={() => { onDeleteExpense(expense.id); setDeletingId(null) }} style={{ padding: "5px 12px", borderRadius: 6, border: "none", backgroundColor: "#DC2626", color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Delete</button>
                      <button type="button" onClick={() => setDeletingId(null)} style={{ padding: "5px 12px", borderRadius: 6, border: "var(--border-subtle)", backgroundColor: "transparent", fontSize: 12, fontWeight: 500, cursor: "pointer", color: "var(--ink)" }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: "0 0 110px", fontSize: 13, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>{formatDate(expense.date)}</span>
                      <span style={{ flex: 1, fontSize: 14, color: "var(--ink)" }}>{expense.description}</span>
                      <span style={{ flexShrink: 0, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 500, backgroundColor: "#F0F2F5", color: "var(--ink-secondary)" }}>{expense.category}</span>
                      <span style={{ flex: "0 0 80px", textAlign: "right", fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{formatCurrency(expense.amount)}</span>
                      <Paperclip size={14} color={expense.receiptName ? "var(--ink-secondary)" : "var(--ink-tertiary)"} style={{ flexShrink: 0 }} />
                      <div style={{ display: "flex", gap: 4, opacity: hoveredRow === expense.id ? 1 : 0, transition: "opacity 150ms", flexShrink: 0 }}>
                        <button type="button" onClick={() => { setEditingId(expense.id); setDraft({ ...expense }); setDeletingId(null) }} style={{ width: 28, height: 28, borderRadius: 6, border: "var(--border-subtle)", backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Pencil size={13} color="var(--ink-secondary)" /></button>
                        <button type="button" onClick={() => { setDeletingId(expense.id); setHoveredRow(null) }} style={{ width: 28, height: 28, borderRadius: 6, border: "var(--border-subtle)", backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={13} color="var(--ink-secondary)" /></button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
            {editingId === "new" && draft && renderEditRow("none")}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Notes components ───────────────────────────────────────────────────────

function NoteEditor({ initialText = "", placeholder = "Add a note...", saveLabel, onSave, onCancel }: {
  initialText?: string; placeholder?: string; saveLabel: string; onSave: (text: string) => void; onCancel: () => void
}) {
  const [text, setText] = useState(initialText)
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onCancel() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onCancel])
  return (
    <div>
      <textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (text.trim()) onSave(text.trim()) } }}
        placeholder={placeholder} rows={3}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "var(--border-subtle)", backgroundColor: "var(--surface-white)", fontSize: 13, color: "var(--ink)", outline: "none", resize: "none" as const, lineHeight: "19px", boxSizing: "border-box" as const, fontFamily: "inherit" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <button type="button" onClick={() => { if (text.trim()) onSave(text.trim()) }}
          style={{ padding: "5px 14px", borderRadius: 7, border: "none", backgroundColor: "var(--slate-primary)", fontSize: 12, fontWeight: 500, color: "#FFFFFF", cursor: "pointer" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
        >{saveLabel}</button>
        <button type="button" onClick={onCancel} style={{ background: "none", border: "none", fontSize: 12, color: "var(--ink-secondary)", cursor: "pointer", padding: "5px 0" }}>Cancel</button>
      </div>
    </div>
  )
}

function NotesTab({ notes, composerOpen, onComposerChange, onAddNote, onEditNote }: {
  notes: Note[]; composerOpen: boolean; onComposerChange: (open: boolean) => void; onAddNote: (text: string) => void; onEditNote: (id: string, text: string) => void
}) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null)
  useEffect(() => { if (composerOpen) setEditingNoteId(null) }, [composerOpen])
  const handleSave = useCallback((text: string) => { onAddNote(text); onComposerChange(false) }, [onAddNote, onComposerChange])
  const handleCancelComposer = useCallback(() => onComposerChange(false), [onComposerChange])

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ ...sectionLabelStyle, margin: 0 }}>Notes ({notes.length})</p>
        <button type="button" onClick={() => { setEditingNoteId(null); onComposerChange(!composerOpen) }}
          style={{ background: "none", border: "none", padding: "0 2px", fontSize: 12, fontWeight: 500, color: "var(--slate-secondary)", cursor: "pointer", lineHeight: "16px" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "none" }}
        >+ Add note</button>
      </div>
      {composerOpen && (
        <div style={{ marginBottom: 12, padding: "14px 16px", borderRadius: 10, backgroundColor: "var(--surface-white)", border: "var(--border-subtle)" }}>
          <NoteEditor placeholder="Add a note..." saveLabel="Save note" onSave={handleSave} onCancel={handleCancelComposer} />
        </div>
      )}
      {notes.length === 0 && !composerOpen ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>No notes yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notes.map((note) => (
            <div key={note.id} style={{ position: "relative" }} onMouseEnter={() => setHoveredNoteId(note.id)} onMouseLeave={() => setHoveredNoteId(null)}>
              {editingNoteId === note.id ? (
                <div style={{ padding: "14px 16px", borderRadius: 10, backgroundColor: "var(--surface-white)", border: "var(--border-subtle)" }}>
                  <NoteEditor initialText={note.text} saveLabel="Save" onSave={(text) => { onEditNote(note.id, text); setEditingNoteId(null) }} onCancel={() => setEditingNoteId(null)} />
                </div>
              ) : (
                <div onClick={() => { onComposerChange(false); setEditingNoteId(note.id) }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 10, backgroundColor: "var(--canvas)", border: "var(--border-subtle)", cursor: "text" }}
                >
                  <div style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 7, backgroundColor: "var(--slate-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText size={14} color="var(--slate-secondary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--ink)", lineHeight: "19px" }}>{note.text}</p>
                    <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{note.date} · {note.author}</span>
                  </div>
                  {hoveredNoteId === note.id && <div style={{ flexShrink: 0, opacity: 0.5, marginTop: 2 }}><Pencil size={12} color="var(--ink-tertiary)" /></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ReportSetupModal ───────────────────────────────────────────────────────

function ReportSetupModal({
  opportunityName,
  opportunityId,
  proposals,
  onClose,
}: {
  opportunityName: string
  opportunityId: string
  proposals: Proposal[]
  onClose: () => void
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [reportType, setReportType] = useState<"Interim" | "Final" | "Progress" | null>(null)
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [reportName, setReportName] = useState("")
  const [nameEdited, setNameEdited] = useState(false)

  const [templateTab, setTemplateTab] = useState<"file" | "text" | "url">("file")
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [templateDragOver, setTemplateDragOver] = useState(false)
  const [templateText, setTemplateText] = useState("")
  const [templateUrl, setTemplateUrl] = useState("")

  const [rollupOpen, setRollupOpen] = useState(false)
  const [alsoCoversIds, setAlsoCoversIds] = useState<string[]>([])
  const [startFromProposal, setStartFromProposal] = useState(false)

  const [errors, setErrors] = useState<{ type?: string; period?: string; dueDate?: string }>({})
  const [submitted, setSubmitted] = useState(false)

  const submittedProposal = proposals.find((p) => p.status === "Submitted")

  function formatPeriodLabel(start: string, end: string): string {
    if (!start || !end) return ""
    try {
      const s = new Date(start + "T12:00:00")
      const e = new Date(end + "T12:00:00")
      const fmt = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" })
      return `${fmt.format(s)} - ${fmt.format(e)}`
    } catch {
      return ""
    }
  }

  // Auto-generate name unless user has manually edited it
  useEffect(() => {
    if (nameEdited) return
    if (!reportType || !periodStart || !periodEnd) { setReportName(""); return }
    const period = formatPeriodLabel(periodStart, periodEnd)
    setReportName(`${opportunityName} - ${reportType} report - ${period}`)
  }, [reportType, periodStart, periodEnd, nameEdited, opportunityName])

  function validate() {
    const errs: typeof errors = {}
    if (!reportType) errs.type = "Report type is required."
    if (!periodStart || !periodEnd) errs.period = "Both period dates are required."
    if (!dueDate) errs.dueDate = "Due date is required."
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleCreate() {
    setSubmitted(true)
    if (!validate()) return

    const params = new URLSearchParams({
      reportName: reportName || `${opportunityName} - ${reportType} report`,
      reportType: reportType!,
      opportunityName,
      opportunityId,
      periodStart,
      periodEnd,
      dueDate,
    })
    if (templateFile) {
      params.set("templateName", templateFile.name)
      params.set("templateKind", "file")
    } else if (templateTab === "text" && templateText.trim()) {
      params.set("templateName", "Pasted template")
      params.set("templateKind", "text")
    } else if (templateTab === "url" && templateUrl.trim()) {
      params.set("templateName", templateUrl)
      params.set("templateKind", "url")
    }
    if (startFromProposal && submittedProposal) {
      params.set("startFromProposalId", submittedProposal.id)
    }

    const reportId = `report-${Date.now()}`
    router.push(`/reports/${reportId}?${params.toString()}`)
    onClose()
  }

  function handleFileSelect(file: File) {
    setTemplateFile(file)
  }

  const reportTypes = ["Interim", "Final", "Progress"] as const

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(28,24,64,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, overflowY: "auto", padding: "32px 16px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{ width: 520, backgroundColor: "#FFFFFF", borderRadius: 16, boxShadow: "var(--elevation-overlay)", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 64px)", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <div>
            <h2 style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-lora)" }}>New report</h2>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)" }}>Set up a post-award report for this Opportunity.</p>
          </div>
          <button type="button" onClick={onClose} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "var(--border-subtle)", backgroundColor: "transparent", cursor: "pointer" }}>
            <X size={14} color="var(--ink-secondary)" />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* Owning Opportunity (read-only) */}
          <div style={{ marginBottom: 18, padding: "10px 14px", borderRadius: 9, backgroundColor: "var(--canvas)", border: "var(--border-subtle)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>Reporting on</span>
            <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{opportunityName}</p>
          </div>

          {/* Start from submitted proposal (quiet affordance) */}
          {submittedProposal && (
            <label
              style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18, cursor: "pointer", padding: "10px 14px", borderRadius: 9, backgroundColor: startFromProposal ? "var(--slate-tint)" : "transparent", border: "var(--border-subtle)", transition: "background-color 150ms" }}
            >
              <input
                type="checkbox"
                checked={startFromProposal}
                onChange={(e) => setStartFromProposal(e.target.checked)}
                style={{ marginTop: 1, accentColor: "var(--slate-primary)", flexShrink: 0 }}
              />
              <div>
                <p style={{ margin: "0 0 1px", fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>Start from the submitted proposal</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)" }}>{submittedProposal.name}</p>
              </div>
            </label>
          )}

          {/* Report Type — segmented control */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
              Report type <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <div
              style={{ display: "flex", border: `1px solid ${submitted && errors.type ? "var(--error)" : "var(--border-default)"}`, borderRadius: 9, overflow: "hidden", backgroundColor: "var(--surface-white)" }}
            >
              {reportTypes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setReportType(t); setErrors((e) => ({ ...e, type: undefined })) }}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    fontSize: 13,
                    fontWeight: reportType === t ? 600 : 400,
                    color: reportType === t ? "var(--slate-primary)" : "var(--ink-secondary)",
                    backgroundColor: reportType === t ? "var(--slate-tint)" : "transparent",
                    border: "none",
                    borderRight: t !== "Progress" ? "var(--border-subtle)" : "none",
                    cursor: "pointer",
                    transition: "background-color 150ms, color 150ms",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            {submitted && errors.type && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--error)" }}>{errors.type}</p>}
          </div>

          {/* Reporting period */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
              Reporting period <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => { setPeriodStart(e.target.value); setErrors((er) => ({ ...er, period: undefined })) }}
                style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${submitted && errors.period ? "var(--error)" : "var(--border-default)"}`, fontSize: 13, color: "var(--ink)", outline: "none", backgroundColor: "var(--surface-white)" }}
              />
              <span style={{ fontSize: 13, color: "var(--ink-tertiary)", flexShrink: 0 }}>to</span>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => { setPeriodEnd(e.target.value); setErrors((er) => ({ ...er, period: undefined })) }}
                style={{ flex: 1, padding: "9px 12px", borderRadius: 9, border: `1px solid ${submitted && errors.period ? "var(--error)" : "var(--border-default)"}`, fontSize: 13, color: "var(--ink)", outline: "none", backgroundColor: "var(--surface-white)" }}
              />
            </div>
            {submitted && errors.period && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--error)" }}>{errors.period}</p>}
          </div>

          {/* Due date */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
              Due date <span style={{ color: "var(--error)" }}>*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => { setDueDate(e.target.value); setErrors((er) => ({ ...er, dueDate: undefined })) }}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: `1px solid ${submitted && errors.dueDate ? "var(--error)" : "var(--border-default)"}`, fontSize: 13, color: "var(--ink)", outline: "none", boxSizing: "border-box" as const, backgroundColor: "var(--surface-white)" }}
            />
            {submitted && errors.dueDate && <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--error)" }}>{errors.dueDate}</p>}
          </div>

          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>Name</label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => { setReportName(e.target.value); setNameEdited(true) }}
              placeholder="Report name (auto-filled from type and period)"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "var(--border-subtle)", fontSize: 13, color: "var(--ink)", outline: "none", boxSizing: "border-box" as const, backgroundColor: "var(--surface-white)" }}
            />
          </div>

          {/* Funder report template */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>
              Funder report template{" "}
              <span style={{ fontWeight: 400, color: "var(--ink-tertiary)" }}>(optional)</span>
            </label>
            {/* Template mode tabs */}
            <div style={{ display: "flex", gap: 0, border: "var(--border-subtle)", borderRadius: "9px 9px 0 0", overflow: "hidden", borderBottom: "none" }}>
              {(["file", "text", "url"] as const).map((mode) => {
                const labels: Record<typeof mode, string> = { file: "Upload file", text: "Paste text", url: "URL" }
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTemplateTab(mode)}
                    style={{ flex: 1, padding: "7px 0", fontSize: 12, fontWeight: templateTab === mode ? 600 : 400, color: templateTab === mode ? "var(--slate-primary)" : "var(--ink-secondary)", backgroundColor: templateTab === mode ? "var(--slate-tint)" : "var(--canvas)", border: "none", borderRight: mode !== "url" ? "var(--border-subtle)" : "none", cursor: "pointer", transition: "background-color 150ms" }}
                  >
                    {labels[mode]}
                  </button>
                )
              })}
            </div>
            <div style={{ border: "var(--border-subtle)", borderRadius: "0 0 9px 9px", overflow: "hidden" }}>
              {templateTab === "file" && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx"
                    style={{ display: "none" }}
                    onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]) }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setTemplateDragOver(true) }}
                    onDragLeave={() => setTemplateDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setTemplateDragOver(false); if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]) }}
                    style={{ padding: "20px 16px", textAlign: "center", cursor: "pointer", backgroundColor: templateDragOver ? "var(--slate-tint)" : "var(--canvas)", transition: "background-color 150ms", borderTop: "var(--border-subtle)" }}
                  >
                    {templateFile ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Paperclip size={14} color="var(--slate-secondary)" />
                        <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{templateFile.name}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setTemplateFile(null) }}
                          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 2 }}
                        >
                          <X size={12} color="var(--ink-tertiary)" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Paperclip size={18} color="var(--ink-tertiary)" style={{ marginBottom: 6 }} />
                        <p style={{ margin: "0 0 2px", fontSize: 13, color: "var(--ink-secondary)" }}>
                          Drop a PDF or DOCX here, or{" "}
                          <span style={{ color: "var(--slate-primary)", fontWeight: 500 }}>browse</span>
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>The template will be parsed into report sections.</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              {templateTab === "text" && (
                <textarea
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  placeholder="Paste the funder's report template text here..."
                  rows={6}
                  style={{ width: "100%", padding: "12px 14px", border: "none", borderTop: "var(--border-subtle)", fontSize: 13, color: "var(--ink)", outline: "none", resize: "vertical", lineHeight: "19px", boxSizing: "border-box" as const, fontFamily: "inherit", backgroundColor: "var(--canvas)" }}
                />
              )}
              {templateTab === "url" && (
                <input
                  type="url"
                  value={templateUrl}
                  onChange={(e) => setTemplateUrl(e.target.value)}
                  placeholder="https://..."
                  style={{ width: "100%", padding: "12px 14px", border: "none", borderTop: "var(--border-subtle)", fontSize: 13, color: "var(--ink)", outline: "none", boxSizing: "border-box" as const, backgroundColor: "var(--canvas)" }}
                />
              )}
            </div>
          </div>

          {/* "This report also covers" — collapsed by default */}
          <div style={{ marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setRollupOpen((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontSize: 13, color: "var(--ink-tertiary)", fontWeight: 400 }}
            >
              <ChevronRight
                size={14}
                color="var(--ink-tertiary)"
                style={{ transition: "transform 150ms", transform: rollupOpen ? "rotate(90deg)" : "rotate(0deg)" }}
              />
              This report also covers…
            </button>
            {rollupOpen && (
              <div style={{ marginTop: 8, padding: "12px 14px", borderRadius: 9, border: "var(--border-subtle)", backgroundColor: "var(--canvas)" }}>
                <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "17px" }}>
                  Select additional Opportunities in the same Engagement covered by this report.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {SIBLING_OPPORTUNITIES.map((opp) => (
                    <label key={opp.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={alsoCoversIds.includes(opp.id)}
                        onChange={(e) => {
                          setAlsoCoversIds((prev) =>
                            e.target.checked ? [...prev, opp.id] : prev.filter((id) => id !== opp.id)
                          )
                        }}
                        style={{ accentColor: "var(--slate-primary)" }}
                      />
                      <span style={{ fontSize: 13, color: "var(--ink)" }}>{opp.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 20px", borderTop: "var(--border-subtle)" }}>
          <button type="button" onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, border: "var(--border-subtle)", backgroundColor: "transparent", fontSize: 13, color: "var(--ink)", cursor: "pointer" }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            style={{ padding: "8px 20px", borderRadius: 8, border: "none", backgroundColor: "var(--slate-primary)", fontSize: 13, fontWeight: 500, color: "#FFFFFF", cursor: "pointer", transition: "background-color 150ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
          >
            Create report
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ReportsTab ─────────────────────────────────────────────────────────────

function ReportsTab({
  reports,
  opportunityName,
  opportunityId,
  onNewReport,
}: {
  reports: OpportunityReport[]
  opportunityName: string
  opportunityId: string
  onNewReport: () => void
}) {
  const router = useRouter()

  function formatDate(iso: string | null): string {
    if (!iso) return "—"
    try {
      return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    } catch { return iso }
  }

  function formatPeriod(start: string, end: string): string {
    try {
      const s = new Date(start + "T12:00:00")
      const e = new Date(end + "T12:00:00")
      const fmt = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" })
      return `${fmt.format(s)} - ${fmt.format(e)}`
    } catch { return `${start} to ${end}` }
  }

  const REPORT_STATUS_STYLE: Record<OpportunityReport["status"], { bg: string; color: string }> = {
    "Draft":     { bg: "var(--slate-tint)",  color: "var(--slate-primary)"  },
    "In Review": { bg: "var(--plum-tint)",   color: "var(--plum-soft)"      },
    "Submitted": { bg: "var(--evergreen-tint)", color: "var(--evergreen)"   },
  }

  const REPORT_TYPE_STYLE: Record<OpportunityReport["type"], { bg: string; color: string }> = {
    "Interim":  { bg: "var(--terracotta-tint)", color: "var(--terracotta)" },
    "Final":    { bg: "var(--slate-tint)",      color: "var(--slate-secondary)" },
    "Progress": { bg: "var(--canvas)",          color: "var(--ink-secondary)" },
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={sectionLabelStyle}>Reports</p>
        <button
          type="button"
          onClick={onNewReport}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", backgroundColor: "var(--slate-primary)", fontSize: 13, fontWeight: 500, color: "#FFFFFF", cursor: "pointer", transition: "background-color 150ms" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
        >
          <Plus size={13} /> New report
        </button>
      </div>

      {reports.length === 0 ? (
        <div style={{ padding: "40px 24px", textAlign: "center", borderRadius: 12, border: "1px dashed var(--border-default)", backgroundColor: "var(--canvas)" }}>
          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>No reports yet</p>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>Create a report to document outcomes and fund usage.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {reports.map((report) => {
            const statusStyle = REPORT_STATUS_STYLE[report.status]
            const typeStyle = REPORT_TYPE_STYLE[report.type]
            return (
              <div
                key={report.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderRadius: 12, backgroundColor: "var(--surface-white)", border: "var(--border-subtle)", boxShadow: "var(--elevation-card)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, backgroundColor: "var(--slate-tint)", border: "var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={14} color="var(--slate-secondary)" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{report.name}</span>
                      <span style={{ borderRadius: 20, padding: "2px 8px", backgroundColor: typeStyle.bg, fontSize: 11, fontWeight: 500, color: typeStyle.color }}>{report.type}</span>
                      <span style={{ borderRadius: 20, padding: "2px 8px", backgroundColor: statusStyle.bg, fontSize: 11, fontWeight: 500, color: statusStyle.color }}>{report.status}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
                      {formatPeriod(report.periodStart, report.periodEnd)}
                      {report.dueDate ? ` · Due ${formatDate(report.dueDate)}` : ""}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams({
                        reportName: report.name,
                        reportType: report.type,
                        opportunityName,
                        opportunityId,
                        periodStart: report.periodStart,
                        periodEnd: report.periodEnd,
                        ...(report.dueDate ? { dueDate: report.dueDate } : {}),
                      })
                      router.push(`/reports/${report.id}?${params.toString()}`)
                    }}
                    style={{ padding: "7px 14px", borderRadius: 7, backgroundColor: "transparent", border: "var(--border-subtle)", fontSize: 13, color: "var(--ink)", cursor: "pointer", transition: "background-color 150ms" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                  >
                    Open in editor
                  </button>
                </div>
              </div>
            )
          })}
          <button
            type="button"
            onClick={onNewReport}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "4px 8px", fontSize: 13, fontWeight: 500, color: "var(--slate-secondary)", cursor: "pointer", borderRadius: 6, transition: "background-color 150ms", textAlign: "left" as const }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <Plus size={13} /> New report
          </button>
        </div>
      )}
    </div>
  )
}

// ── OverviewTab ────────────────────────────────────────────────────────────

function OverviewTab({ proposals, onNewProposal }: { proposals: Proposal[]; onNewProposal: () => void }) {
  const router = useRouter()
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <p style={sectionLabelStyle}>Proposals</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {proposals.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>No proposals yet.</p>
          ) : proposals.map((p) => {
            const badge = PROPOSAL_STATUS_STYLE[p.status]
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", boxShadow: "var(--elevation-card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, backgroundColor: "var(--slate-tint)", border: "var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={14} color="var(--slate-secondary)" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{p.name}</span>
                      <span style={{ borderRadius: 20, padding: "2px 8px", backgroundColor: badge.bg, fontSize: 11, fontWeight: 500, color: badge.color }}>{p.status}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>Created {p.created} · Last edited {p.lastEdited} · {p.author}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button type="button" onClick={() => router.push(`/proposals/${p.id === "draft-1" ? "equitable-futures-2026-draft" : p.id}`)}
                    style={{ padding: "7px 14px", borderRadius: 7, backgroundColor: "transparent", border: "var(--border-subtle)", fontSize: 13, color: "var(--ink)", cursor: "pointer", transition: "background-color 150ms" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                  >Open in editor</button>
                  <button type="button" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: "transparent", border: "var(--border-subtle)", cursor: "pointer" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                  ><Copy size={13} color="var(--ink-tertiary)" /></button>
                </div>
              </div>
            )
          })}
          <button type="button" onClick={onNewProposal}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "4px 8px", fontSize: 13, fontWeight: 500, color: "var(--slate-secondary)", cursor: "pointer", borderRadius: 6, transition: "background-color 150ms", textAlign: "left" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          ><Plus size={13} /> New proposal</button>
        </div>
      </div>
    </div>
  )
}

// ── Style helpers ──────────────────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-tertiary)", margin: "0 0 12px 0",
}

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Proposals" }, { id: "tasks", label: "Tasks" },
  { id: "budget",   label: "Budget"    }, { id: "reports",  label: "Reports"   },
  { id: "notes",    label: "Notes"     }, { id: "files",    label: "Files"     },
]

// ── Inner page ─────────────────────────────────────────────────────────────

function OpportunityDetailContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const opportunityId = params.opportunityId as string
  const isKnown = opportunityId === "equitable-futures"

  const opportunityName = isKnown ? "Equitable Futures Grant 2026"  : (searchParams.get("name") ?? "New Opportunity")
  const engagementName  = isKnown ? "Ford Foundation"               : (searchParams.get("engagementName") ?? "Portfolio")
  const chipStage       = isKnown ? "Awarded"                       : (searchParams.get("stage") ?? "Tracking")
  const chipAmount      = isKnown ? "$75,000"                       : (searchParams.get("amount") ?? "—")
  const chipDeadline    = isKnown ? "Awarded Jun 15, 2026"          : null

  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [tasks, setTasks] = useState<Task[]>(isKnown ? KNOWN_TASKS : [])
  const [proposals] = useState<Proposal[]>(isKnown ? KNOWN_PROPOSALS : [])
  const [stage, setStage] = useState<Stage>(chipStage as Stage)
  const [expenses, setExpenses] = useState<Expense[]>(isKnown ? KNOWN_EXPENSES : [])
  const [notes, setNotes] = useState<Note[]>(isKnown ? KNOWN_NOTES : [])
  const [noteComposerOpen, setNoteComposerOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: "", visible: false })
  const [modalOpen, setModalOpen] = useState(false)
  const [reportSetupOpen, setReportSetupOpen] = useState(false)
  const [opportunityReports] = useState<OpportunityReport[]>(isKnown ? KNOWN_REPORTS_FOR_OPP : [])
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [lockedHover, setLockedHover] = useState<TabId | null>(null)
  const [lessons, setLessons] = useState<LessonsLearned>({ worked: "", didntWork: "", tryNext: "" })

  // Stage change confirmation
  const [pendingStage, setPendingStage] = useState<Stage | null>(null)
  const [stageModalOpen, setStageModalOpen] = useState(false)

  const showCoaching = stage === "Declined"
  const attentionFlag: "overdue" | null = (() => {
    if (stage === "Declined" || stage === "Complete") return null
    if (tasks.some((t) => !t.done && t.dueDate && t.dueDate < todayISO())) return "overdue"
    return null
  })()

  useEffect(() => { setActiveTab((prev) => isTabLocked(prev, stage) ? "overview" : prev) }, [stage])
  useEffect(() => { if (activeTab !== "notes") setNoteComposerOpen(false) }, [activeTab])

  function showToast(msg: string) {
    setToast({ msg, visible: true })
    setTimeout(() => setToast((v) => ({ ...v, visible: false })), 3000)
  }

  function handleStageChange(s: Stage) {
    setPendingStage(s)
    setStageModalOpen(true)
  }

  function handleStageConfirmed() {
    // Stage confirmed but not yet applied — wait for suggested tasks step
  }

  function handleStageFinalizeWithTasks(newTasks: Task[]) {
    if (pendingStage) {
      setStage(pendingStage)
      setTasks(prev => [...prev, ...newTasks])
      showToast(`Stage: ${pendingStage}`)
    }
    setPendingStage(null)
    setStageModalOpen(false)
    setActiveTab("tasks")
  }

  function handleStageSkip() {
    if (pendingStage) {
      setStage(pendingStage)
      showToast(`Stage: ${pendingStage}`)
    }
    setPendingStage(null)
    setStageModalOpen(false)
  }

  function handleStageCancel() {
    setPendingStage(null)
    setStageModalOpen(false)
  }

  function handleShare(teammate: string) { showToast(`Opportunity shared with ${teammate}`) }

  function handleAddNote(text: string) {
    const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    setNotes(prev => [{ id: `note-${Date.now()}`, text, date: dateStr, author: "Taylor S." }, ...prev])
  }

  function handleEditNote(id: string, text: string) {
    const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text, date: dateStr } : n))
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--surface-white)" }}>
      <Toast message={toast.msg} visible={toast.visible} />
      <NewProposalModal open={modalOpen} onClose={() => setModalOpen(false)} opportunityName={opportunityName} opportunityId={opportunityId} />
      <ShareModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} onShare={handleShare} />
      {reportSetupOpen && (
        <ReportSetupModal
          opportunityName={opportunityName}
          opportunityId={opportunityId}
          proposals={proposals}
          onClose={() => setReportSetupOpen(false)}
        />
      )}
      <StageChangeModal
        open={stageModalOpen}
        pendingStage={pendingStage}
        onConfirm={handleStageConfirmed}
        onAddTasks={handleStageFinalizeWithTasks}
        onSkip={handleStageSkip}
        onCancel={handleStageCancel}
      />

      {/* Breadcrumb */}
      <div style={{ padding: "12px 32px", borderBottom: "var(--border-subtle)", backgroundColor: "var(--surface-white)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Link href="/home" style={{ fontSize: 13, color: "var(--ink-tertiary)", textDecoration: "none" }}>Home</Link>
          <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>›</span>
          <Link href="/portfolio" style={{ fontSize: 13, color: "var(--ink-secondary)", textDecoration: "none" }}>{engagementName}</Link>
          <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>›</span>
          <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{opportunityName}</span>
        </div>
        <Link href="/portfolio" style={{ fontSize: 13, color: "var(--slate-secondary)", textDecoration: "none", fontWeight: 500 }}>‹ {engagementName}</Link>
      </div>

      {/* Page header */}
      <div style={{ padding: "24px 32px 0", backgroundColor: "var(--surface-white)", borderBottom: "var(--border-subtle)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: "32px", color: "var(--ink)", fontFamily: "var(--font-lora)" }}>
            {opportunityName}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginTop: 2 }}>
            <StageControl stage={stage} onChange={handleStageChange} />
            <button type="button" onClick={() => setModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", backgroundColor: "var(--slate-primary)", fontSize: 13, fontWeight: 500, color: "#FFFFFF", cursor: "pointer", transition: "background-color 150ms" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
            ><Plus size={13} /> New proposal</button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, flexWrap: "wrap" as const }}>
          <span style={{ borderRadius: 20, padding: "4px 12px", fontSize: 13, border: "var(--border-subtle)", backgroundColor: "var(--canvas)", color: "var(--ink-secondary)" }}>{engagementName}</span>
          <span style={{ borderRadius: 20, padding: "4px 12px", fontSize: 13, border: "var(--border-subtle)", backgroundColor: "var(--evergreen-tint)", color: "var(--evergreen)" }}>{chipStage}</span>
          {chipDeadline && (
            <span style={{ borderRadius: 20, padding: "4px 12px", fontSize: 13, border: "var(--border-subtle)", backgroundColor: "var(--evergreen-tint)", color: "var(--evergreen)" }}>{chipDeadline}</span>
          )}
          <span style={{ borderRadius: 20, padding: "4px 12px", fontSize: 13, border: "var(--border-subtle)", backgroundColor: "var(--canvas)", color: "var(--ink-secondary)" }}>{chipAmount}</span>
          {attentionFlag && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 20, padding: "4px 12px", fontSize: 13, border: "1px solid rgba(185,28,28,0.3)", backgroundColor: "#FDE8E8", color: "#8B2020" }}>
              <Flag size={11} /> Overdue
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <button type="button" onClick={() => { setActiveTab("notes"); setNoteComposerOpen(true) }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, backgroundColor: "transparent", border: "var(--border-subtle)", fontSize: 13, color: "var(--ink)", cursor: "pointer", transition: "background-color 150ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          ><Plus size={13} /> Add note</button>
          <button type="button" onClick={() => setShareModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, backgroundColor: "transparent", border: "var(--border-subtle)", fontSize: 13, color: "var(--ink)", cursor: "pointer", transition: "background-color 150ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          ><Share2 size={13} /> Share</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(({ id, label }) => {
            const isActive = activeTab === id
            const locked = isTabLocked(id, stage)
            return (
              <div key={id} style={{ position: "relative" }} onMouseEnter={() => { if (locked) setLockedHover(id) }} onMouseLeave={() => setLockedHover(null)}>
                <button type="button" onClick={() => { if (!locked) setActiveTab(id) }}
                  style={{ position: "relative", padding: "8px 14px", background: "none", border: "none", cursor: locked ? "not-allowed" : "pointer", opacity: locked ? 0.4 : 1, fontSize: 14, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--slate-primary)" : "var(--ink-secondary)", transition: "color 150ms" }}
                >
                  {label}
                  {isActive && !locked && <div style={{ position: "absolute", bottom: 0, left: 14, right: 14, height: 2, borderRadius: 1, backgroundColor: "var(--slate-primary)" }} />}
                </button>
                {locked && lockedHover === id && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", backgroundColor: "#1C2E26", color: "#FFFFFF", fontSize: 12, padding: "6px 10px", borderRadius: 6, whiteSpace: "nowrap", zIndex: 200, pointerEvents: "none" }}>
                    Available once this opportunity is awarded
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {showCoaching && <CoachingSection lessons={lessons} onLessonsChange={setLessons} />}

      <div style={{ padding: "28px 32px", maxWidth: 960 }}>
        {activeTab === "overview" && <OverviewTab proposals={proposals} onNewProposal={() => setModalOpen(true)} />}
        {activeTab === "tasks" && (
          <TasksTab
            tasks={tasks}
            onAddTask={(t) => setTasks(prev => [...prev, t])}
            onUpdateTask={(t) => setTasks(prev => prev.map(x => x.id === t.id ? t : x))}
            proposals={proposals}
            stage={stage}
            onNavigateToTab={setActiveTab}
          />
        )}
        {activeTab === "budget" && (
          isKnown
            ? <BudgetTab awardedAmount={AWARDED_AMOUNT} expenses={expenses} onAddExpense={(e) => setExpenses(prev => [...prev, e])} onUpdateExpense={(e) => setExpenses(prev => prev.map(x => x.id === e.id ? e : x))} onDeleteExpense={(id) => setExpenses(prev => prev.filter(x => x.id !== id))} />
            : <EmptyTab label="Budget" />
        )}
        {activeTab === "reports" && (
          <ReportsTab
            reports={opportunityReports}
            opportunityName={opportunityName}
            opportunityId={opportunityId}
            onNewReport={() => setReportSetupOpen(true)}
          />
        )}
        {activeTab === "notes" && <NotesTab notes={notes} composerOpen={noteComposerOpen} onComposerChange={setNoteComposerOpen} onAddNote={handleAddNote} onEditNote={handleEditNote} />}
        {activeTab === "files" && <EmptyTab label="Files" />}
      </div>
    </div>
  )
}

export default function OpportunityDetailPage() {
  return (
    <Suspense fallback={null}>
      <OpportunityDetailContent />
    </Suspense>
  )
}
