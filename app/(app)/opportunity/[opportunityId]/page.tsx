"use client"

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import {
  ChevronDown, Copy, FileText, Plus, Paperclip, Pencil, Trash2, X,
  Flag, Share2, AlertTriangle, Info, Sparkles, Loader2,
} from "lucide-react"
import { NewProposalModal } from "@/components/proposals/NewProposalModal"

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "overview" | "tasks" | "budget" | "reports" | "notes" | "files"
type TaskStatus = "To Do" | "In Progress" | "Done"
type Stage = "Tracking" | "Active" | "Submitted" | "Awarded" | "Reporting" | "Complete" | "Declined"

interface Note {
  id: string
  text: string
  date: string
  author: string
}

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
  assigneeName: string
  status: TaskStatus
  done: boolean
}

interface TaskCompletionDraft {
  date: string
  note: string
  fileName: string | null
}

interface Expense {
  id: string
  date: string
  description: string
  category: string
  amount: number
  receiptName: string | null
}

interface LessonsLearned {
  worked: string
  didntWork: string
  tryNext: string
}

// ── Constants ──────────────────────────────────────────────────────────────

const AWARDED_AMOUNT = 75000

const DEFAULT_EXPENSE_CATEGORIES = [
  "Personnel", "Supplies", "Travel", "Indirect Costs", "Program Expenses", "Other",
]

const TEAMMATES = [
  { id: "taylor", name: "Taylor S.", initials: "TS" },
  { id: "marcus", name: "Marcus R.", initials: "MR" },
  { id: "jamie",  name: "Jamie K.",  initials: "JK" },
  { id: "alex",   name: "Alex M.",   initials: "AM" },
]

// ── Hardcoded data for known opportunities ─────────────────────────────────

const KNOWN_NOTES: Note[] = [
  {
    id: "opp-note-1",
    text: "Spoke with program officer on May 5 — emphasized community engagement outcomes. She seemed receptive to the data-sharing angle.",
    date: "May 5, 2026",
    author: "Taylor S.",
  },
  {
    id: "opp-note-2",
    text: "LOI submitted Mar 12. Received confirmation email Mar 14.",
    date: "Mar 12, 2026",
    author: "Taylor S.",
  },
]

const KNOWN_PROPOSALS: Proposal[] = [
  {
    id: "draft-1",
    name: "Equitable Futures — Draft 1",
    status: "Draft",
    created: "Apr 3, 2026",
    lastEdited: "May 10, 2026",
    author: "Taylor S.",
  },
]

const KNOWN_TASKS: Task[] = [
  { id: "t1", name: "Complete narrative section",       due: "Due May 20", dueBadge: "today", assignee: "TS", assigneeName: "Taylor S.", status: "To Do",       done: false },
  { id: "t2", name: "Get budget sign-off from finance", due: "Due May 22", dueBadge: "soon",  assignee: "TS", assigneeName: "Taylor S.", status: "In Progress", done: false },
  { id: "t3", name: "Collect letters of support",       due: "Due Jun 1",  dueBadge: "later", assignee: "MR", assigneeName: "Marcus R.", status: "To Do",       done: false },
]

const KNOWN_EXPENSES: Expense[] = [
  { id: "e1", date: "2026-05-01", description: "Program staff salary (May)",     category: "Personnel",        amount: 4200, receiptName: null },
  { id: "e2", date: "2026-05-05", description: "Community meeting venue rental", category: "Program Expenses", amount: 350,  receiptName: null },
  { id: "e3", date: "2026-05-12", description: "Travel to partner site visit",   category: "Travel",           amount: 180,  receiptName: null },
  { id: "e4", date: "2026-05-15", description: "Office supplies",                category: "Supplies",         amount: 95,   receiptName: null },
]

// ── Stage config ───────────────────────────────────────────────────────────

const STAGE_ORDER: Stage[] = ["Tracking", "Active", "Submitted", "Awarded", "Reporting", "Complete"]
const TERMINAL_STAGES: Stage[] = ["Declined", "Complete"]
const UNLOCK_STAGES: Stage[] = ["Awarded", "Reporting", "Complete"]
const LOCKED_TABS: TabId[] = ["budget", "reports"]
const MATCH_INSIGHTS_STAGES: Stage[] = ["Tracking", "Active", "Submitted", "Awarded", "Reporting"]

function isTabLocked(tabId: TabId, stage: Stage): boolean {
  return LOCKED_TABS.includes(tabId) && !UNLOCK_STAGES.includes(stage)
}

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

const PROPOSAL_STATUS_STYLE: Record<Proposal["status"], { bg: string; color: string }> = {
  Draft:     { bg: "#EBF0F5", color: "#4A6080" },
  Final:     { bg: "#E0EDE6", color: "#3C5E4C" },
  Submitted: { bg: "#F2EDF3", color: "#7A5F7E" },
}

function dueBadgeStyle(cat: Task["dueBadge"]): React.CSSProperties {
  if (cat === "today") return { backgroundColor: "#FDE8E8", color: "#8B2020" }
  if (cat === "soon")  return { backgroundColor: "#FFF3E0", color: "#7A4A10" }
  return { backgroundColor: "#E8ECF0", color: "#4A6080" }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// ── Core sub-components ────────────────────────────────────────────────────

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
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 8, border: "1px solid var(--border-default)", backgroundColor: "var(--surface-white)", cursor: "pointer", transition: "background-color 150ms" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-white)" }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dot, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 500, borderRadius: 20, padding: "2px 8px", backgroundColor: badge.bg, color: badge.color }}>{stage}</span>
        <ChevronDown size={12} color="var(--ink-tertiary)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }} />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", borderRadius: 10, boxShadow: "0 8px 24px rgba(42,42,42,0.12)", zIndex: 50, minWidth: 160, overflow: "hidden" }}>
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

function TaskCheckbox({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      style={{ width: 16, height: 16, flexShrink: 0, borderRadius: 4, border: done ? "1.5px solid var(--evergreen)" : "1.5px solid var(--ink-tertiary)", backgroundColor: done ? "var(--evergreen)" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 150ms, border-color 150ms" }}
    >
      {done && (
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path d="M1.5 4.5l2 2L7.5 2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--gradient-avatar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>{initials}</span>
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

// ── Share Modal ────────────────────────────────────────────────────────────

function ShareModal({ open, onClose, onShare }: {
  open: boolean
  onClose: () => void
  onShare: (teammate: string) => void
}) {
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<typeof TEAMMATES[number] | null>(null)
  const [note, setNote] = useState("")
  const [listOpen, setListOpen] = useState(false)

  useEffect(() => {
    if (open) { setQuery(""); setSelected(null); setNote(""); setListOpen(false) }
  }, [open])

  const filtered = TEAMMATES.filter(t => t.name.toLowerCase().includes(query.toLowerCase()))

  if (!open) return null

  function handleSelect(t: typeof TEAMMATES[number]) {
    setSelected(t)
    setQuery(t.name)
    setListOpen(false)
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(42,42,42,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: 400, backgroundColor: "#FFFFFF", borderRadius: 14, boxShadow: "0 16px 48px rgba(42,42,42,0.18)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 0" }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--ink)", fontFamily: "var(--font-lora)" }}>Share this opportunity</h2>
          <button type="button" onClick={onClose} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid var(--border-default)", backgroundColor: "transparent", cursor: "pointer", flexShrink: 0 }}>
            <X size={14} color="var(--ink-secondary)" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 0" }}>
          <div style={{ marginBottom: 16, position: "relative" }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>Teammate</label>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); setListOpen(true) }}
              onFocus={() => setListOpen(true)}
              onBlur={() => setTimeout(() => setListOpen(false), 150)}
              placeholder="Search by name..."
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", outline: "none", boxSizing: "border-box" as const }}
            />
            {listOpen && filtered.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, backgroundColor: "#FFFFFF", border: "1px solid var(--border-default)", borderRadius: 10, boxShadow: "0 8px 24px rgba(42,42,42,0.12)", zIndex: 300, overflow: "hidden" }}>
                {filtered.map((t) => (
                  <button key={t.id} type="button" onMouseDown={() => handleSelect(t)}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background-color 100ms" }}
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
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a message..."
              rows={3}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", outline: "none", resize: "none" as const, lineHeight: "19px", boxSizing: "border-box" as const, fontFamily: "inherit" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px 20px", borderTop: "1px solid var(--border-default)" }}>
          <button type="button" onClick={onClose}
            style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-default)", backgroundColor: "transparent", fontSize: 13, color: "var(--ink)", cursor: "pointer", transition: "background-color 150ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            Cancel
          </button>
          <button type="button" disabled={!selected}
            onClick={() => { if (selected) { onShare(selected.name); onClose() } }}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", backgroundColor: selected ? "var(--slate-primary)" : "var(--slate-tint)", fontSize: 13, fontWeight: 500, color: selected ? "#FFFFFF" : "var(--ink-tertiary)", cursor: selected ? "pointer" : "not-allowed", transition: "background-color 150ms" }}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Match Insights Section ─────────────────────────────────────────────────

function FitSignal({ label, match, detail }: { label: string; match: boolean; detail: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: 8, backgroundColor: "var(--surface-white)", border: `1px solid ${match ? "var(--border-default)" : "rgba(185,28,28,0.2)"}` }}>
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        {match ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" fill="#E0EDE6" stroke="#3C5E4C" strokeWidth="0.5" />
            <path d="M4.5 7l1.8 1.8L9.5 5.5" stroke="#3C5E4C" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <AlertTriangle size={14} color="#8B2020" />
        )}
      </div>
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: match ? "var(--evergreen)" : "#8B2020" }}>{label}</p>
        <p style={{ margin: 0, fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>{detail}</p>
      </div>
    </div>
  )
}

function MatchInsightsSection({ proposals }: { proposals: Proposal[] }) {
  const [methodologyOpen, setMethodologyOpen] = useState(false)
  const hasProposalStarted = proposals.length > 0
  const fitPct = 78

  return (
    <div style={{ backgroundColor: "var(--canvas)", borderBottom: "1px solid var(--border-default)", padding: "20px 32px" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ ...sectionLabelStyle, margin: 0 }}>Match insights</p>
        <div style={{ position: "relative" }}>
          <button type="button" onClick={() => setMethodologyOpen((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 12, color: "var(--slate-secondary)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "none" }}
          >
            <Info size={12} />
            How is this calculated?
          </button>
          {methodologyOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 280, backgroundColor: "#FFFFFF", border: "1px solid var(--border-default)", borderRadius: 10, boxShadow: "0 8px 24px rgba(42,42,42,0.14)", padding: "14px 16px", zIndex: 50 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>How match score is calculated</p>
              <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--ink-secondary)", lineHeight: "18px" }}>
                Grant Assistant analyzes your organization profile and initiative data against the funder&apos;s documented priorities, geographic focus, award range, and eligibility requirements.
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink-secondary)", lineHeight: "18px" }}>
                Scores above 70% indicate strong overall fit across four dimensions: geographic match, financial fit, focus area alignment, and eligibility.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" as const }}>
        {/* Fit score card */}
        <div style={{ flexShrink: 0, backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", borderRadius: 12, padding: "16px 20px", minWidth: 160 }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "var(--ink-tertiary)" }}>Fit score</p>
          <p style={{ margin: "0 0 12px", fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--slate-primary)", lineHeight: 1 }}>{fitPct}%</p>
          <div style={{ height: 6, borderRadius: 3, backgroundColor: "var(--slate-tint)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 3, backgroundColor: "var(--slate-primary)", width: `${fitPct}%` }} />
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--ink-secondary)" }}>Strong match</p>
        </div>

        {/* Fit signals */}
        <div style={{ flex: 1, minWidth: 260, display: "flex", flexDirection: "column", gap: 8 }}>
          <FitSignal
            label="Geographic fit"
            match
            detail="Funder funds in California, New York, and Massachusetts. Your initiative serves California, New York, and Texas. Confirmed match for 2 of 3 regions."
          />
          <FitSignal
            label="Award range"
            match
            detail="Funder typically awards $25K–$100K. Your typical ask is around $75K. Within range."
          />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: 8, backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)" }}>
            <span style={{ fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>
              Ford Foundation approved roughly <strong style={{ color: "var(--ink)" }}>30%</strong> of applications in this program area last year.
            </span>
          </div>
        </div>
      </div>

      {/* Deadline pressure warning — only when no proposal started */}
      {!hasProposalStarted && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, backgroundColor: "#FDE8E8", border: "1px solid rgba(185,28,28,0.2)" }}>
          <AlertTriangle size={14} color="#8B2020" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "#8B2020" }}>Deadline in 20 days. No proposal started yet.</span>
        </div>
      )}
    </div>
  )
}

// ── Coaching Section (Declined) ────────────────────────────────────────────

function CoachingSection({ lessons, onLessonsChange }: {
  lessons: LessonsLearned
  onLessonsChange: (l: LessonsLearned) => void
}) {
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved] = useState(false)

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid var(--border-default)",
    backgroundColor: "var(--surface-white)",
    fontSize: 13,
    color: "var(--ink)",
    outline: "none",
    resize: "vertical" as const,
    lineHeight: "19px",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    minHeight: 72,
  }

  function handleGenerate() {
    setGenerating(true)
    setTimeout(() => {
      onLessonsChange({
        worked: "Strong alignment with the funder's focus on community-led solutions. Our outcome data was compelling and the program officer expressed genuine interest during the pre-submission conversation.",
        didntWork: "Budget justification was not detailed enough for this funder's standards. We underestimated the importance of the environmental impact narrative required in Section 4.",
        tryNext: "Request a pre-submission call with the program officer at least 6 weeks before the deadline. Strengthen the environmental outcomes section and add more granular budget line items with justification.",
      })
      setGenerating(false)
    }, 1600)
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div style={{ backgroundColor: "var(--canvas)", borderBottom: "1px solid var(--border-default)", padding: "24px 32px" }}>
      <style>{`@keyframes ga-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <p style={{ ...sectionLabelStyle, marginBottom: 4 }}>Lessons learned</p>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>
        This opportunity was declined. Capture what you learned so the next one goes better.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>What worked</label>
          <textarea value={lessons.worked} onChange={(e) => onLessonsChange({ ...lessons, worked: e.target.value })} placeholder="What aspects of this application resonated with the funder?" rows={3} style={textareaStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>What didn&apos;t work</label>
          <textarea value={lessons.didntWork} onChange={(e) => onLessonsChange({ ...lessons, didntWork: e.target.value })} placeholder="What fell short or missed the mark?" rows={3} style={textareaStyle} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--ink)", marginBottom: 6 }}>What to try next time</label>
          <textarea value={lessons.tryNext} onChange={(e) => onLessonsChange({ ...lessons, tryNext: e.target.value })} placeholder="What would you do differently next cycle?" rows={3} style={textareaStyle} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" onClick={handleGenerate} disabled={generating}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border-default)", backgroundColor: "var(--surface-white)", fontSize: 13, fontWeight: 500, color: "var(--slate-primary)", cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.7 : 1, transition: "background-color 150ms" }}
            onMouseEnter={(e) => { if (!generating) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-white)" }}
          >
            {generating
              ? <Loader2 size={13} style={{ animation: "ga-spin 1s linear infinite" }} />
              : <Sparkles size={13} />
            }
            {generating ? "Generating..." : "Generate insights with AI"}
          </button>
          <button type="button" onClick={handleSave}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", backgroundColor: saved ? "var(--evergreen)" : "var(--slate-primary)", fontSize: 13, fontWeight: 500, color: "#FFFFFF", cursor: "pointer", transition: "background-color 200ms" }}
          >
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tab components ─────────────────────────────────────────────────────────

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
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", boxShadow: "0 1px 3px rgba(42,42,42,0.04)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 7, backgroundColor: "var(--slate-tint)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
                  <button type="button"
                    onClick={() => router.push(`/proposals/${p.id === "draft-1" ? "equitable-futures-2026-draft" : p.id}`)}
                    style={ghostBtnStyle}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                  >
                    Open in editor
                  </button>
                  <button type="button" style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, backgroundColor: "transparent", border: "1px solid var(--border-default)", cursor: "pointer", transition: "background-color 150ms" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                  >
                    <Copy size={13} color="var(--ink-tertiary)" />
                  </button>
                </div>
              </div>
            )
          })}
          <button type="button" onClick={onNewProposal}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "4px 8px", fontSize: 13, fontWeight: 500, color: "var(--slate-secondary)", cursor: "pointer", borderRadius: 6, transition: "background-color 150ms", textAlign: "left" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <Plus size={13} />
            New proposal
          </button>
        </div>
      </div>
    </div>
  )
}

// ── TasksTab ───────────────────────────────────────────────────────────────

function TasksTab({ tasks, onToggle }: { tasks: Task[]; onToggle: (id: string) => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, TaskCompletionDraft>>({})

  function beginComplete(id: string) {
    setExpandedId(id)
    if (!drafts[id]) {
      setDrafts((prev) => ({ ...prev, [id]: { date: todayISO(), note: "", fileName: null } }))
    }
  }

  function updateDraft(id: string, patch: Partial<TaskCompletionDraft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  function confirmComplete(id: string) {
    onToggle(id)
    setExpandedId(null)
  }

  return (
    <div>
      <p style={sectionLabelStyle}>All tasks ({tasks.length})</p>
      {tasks.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>No tasks yet.</p>
      ) : (
        <div style={{ borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", overflow: "hidden" }}>
          {tasks.map((task, i) => {
            const badge = TASK_STATUS_STYLE[task.status]
            const isExpanded = expandedId === task.id
            const draft = drafts[task.id] ?? { date: todayISO(), note: "", fileName: null }
            const isLast = i === tasks.length - 1
            const rowBorder = isLast && !isExpanded ? "none" : "1px solid var(--border-default)"

            return (
              <div key={task.id}>
                {/* Task row */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: rowBorder, opacity: task.done ? 0.45 : 1, transition: "opacity 150ms" }}>
                  <TaskCheckbox
                    done={task.done}
                    onClick={() => task.done ? onToggle(task.id) : beginComplete(task.id)}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 5px", fontSize: 14, color: "var(--ink)", textDecoration: task.done ? "line-through" : "none" }}>{task.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>{task.due}</span>
                      <Avatar initials={task.assignee} />
                      <span style={{ fontSize: 12, color: "var(--ink-secondary)" }}>{task.assigneeName}</span>
                      {task.dueBadge !== "later" && (
                        <span style={{ borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 500, ...dueBadgeStyle(task.dueBadge) }}>
                          {task.dueBadge === "today" ? "Due today" : "In progress"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, borderRadius: 20, padding: "3px 10px", backgroundColor: badge.bg, fontSize: 11, fontWeight: 500, color: badge.color }}>{task.status}</span>
                </div>

                {/* Inline completion form */}
                {isExpanded && (
                  <div style={{ padding: "14px 18px 16px", backgroundColor: "var(--canvas)", borderBottom: isLast ? "none" : "1px solid var(--border-default)", borderTop: "1px solid var(--border-default)" }}>
                    <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" as const }}>
                      <div style={{ display: "flex", flexDirection: "column", flex: "0 0 168px" }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 4 }}>Completion date</label>
                        <input type="date" value={draft.date} onChange={(e) => updateDraft(task.id, { date: e.target.value })}
                          style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", backgroundColor: "var(--surface-white)", outline: "none" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 160 }}>
                        <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 4 }}>
                          What happened? <span style={{ fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input type="text" value={draft.note} onChange={(e) => updateDraft(task.id, { note: e.target.value })} placeholder="Brief note..."
                          style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", backgroundColor: "var(--surface-white)", outline: "none", width: "100%", boxSizing: "border-box" as const }}
                        />
                      </div>
                    </div>

                    {/* File attachment */}
                    <div style={{ marginBottom: 12 }}>
                      <input type="file" id={`task-file-${task.id}`} style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) updateDraft(task.id, { fileName: file.name })
                          e.target.value = ""
                        }}
                      />
                      {draft.fileName ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-secondary)" }}>
                          <Paperclip size={12} />
                          <span>{draft.fileName}</span>
                          <button type="button" onClick={() => updateDraft(task.id, { fileName: null })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
                            <X size={12} color="var(--ink-tertiary)" />
                          </button>
                        </div>
                      ) : (
                        <label htmlFor={`task-file-${task.id}`}
                          style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontSize: 12, color: "var(--slate-secondary)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLLabelElement).style.textDecoration = "underline" }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.textDecoration = "none" }}
                        >
                          <Paperclip size={12} />
                          Attach file
                        </label>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <button type="button" onClick={() => confirmComplete(task.id)}
                        style={{ padding: "6px 14px", borderRadius: 7, border: "none", backgroundColor: "var(--slate-primary)", color: "#FFFFFF", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "background-color 150ms" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
                      >
                        Mark done
                      </button>
                      <button type="button" onClick={() => setExpandedId(null)}
                        style={{ background: "none", border: "none", fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer", padding: 0 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <button type="button"
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

// ── BudgetTab ──────────────────────────────────────────────────────────────

function BudgetTab({ awardedAmount, expenses, onAddExpense, onUpdateExpense, onDeleteExpense }: {
  awardedAmount: number
  expenses: Expense[]
  onAddExpense: (e: Expense) => void
  onUpdateExpense: (e: Expense) => void
  onDeleteExpense: (id: string) => void
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

  function startEdit(expense: Expense) { setEditingId(expense.id); setDraft({ ...expense }); setDeletingId(null) }
  function startNew() { setEditingId("new"); setDraft({ id: `e${Date.now()}`, date: todayISO(), description: "", category: "Personnel", amount: 0, receiptName: null }); setDeletingId(null) }
  function cancelEdit() { setEditingId(null); setDraft(null) }

  function saveEdit() {
    if (!draft) return
    if (!DEFAULT_EXPENSE_CATEGORIES.includes(draft.category) && !customCategories.includes(draft.category) && draft.category.trim()) {
      setCustomCategories((prev) => [...prev, draft.category])
    }
    if (editingId === "new") { onAddExpense(draft) } else { onUpdateExpense(draft) }
    setEditingId(null); setDraft(null)
  }

  const editInputStyle: React.CSSProperties = { padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", backgroundColor: "var(--surface-white)", outline: "none", width: "100%", boxSizing: "border-box" as const }
  const editLabelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 2 }

  function renderEditRow(borderBottom: string) {
    if (!draft) return null
    return (
      <div style={{ padding: "14px 18px", backgroundColor: "var(--canvas)", borderBottom, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", flex: "0 0 140px" }}>
            <span style={editLabelStyle}>Date</span>
            <input type="date" value={draft.date} onChange={(e) => setDraft((p) => p ? { ...p, date: e.target.value } : null)} style={editInputStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <span style={editLabelStyle}>Description</span>
            <input type="text" value={draft.description} onChange={(e) => setDraft((p) => p ? { ...p, description: e.target.value } : null)} placeholder="e.g. Program supplies" style={editInputStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: "0 0 164px" }}>
            <span style={editLabelStyle}>Category</span>
            <input list="expense-categories" value={draft.category} onChange={(e) => setDraft((p) => p ? { ...p, category: e.target.value } : null)} style={editInputStyle} placeholder="Select or type..." />
            <datalist id="expense-categories">{allCategories.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: "0 0 120px" }}>
            <span style={editLabelStyle}>Amount</span>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--ink-secondary)", pointerEvents: "none" }}>$</span>
              <input type="number" min="0" step="1" value={draft.amount || ""} onChange={(e) => setDraft((p) => p ? { ...p, amount: parseFloat(e.target.value) || 0 } : null)} placeholder="0" style={{ ...editInputStyle, paddingLeft: 24 }} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--slate-secondary)", cursor: "pointer", borderRadius: 6, padding: "5px 10px", border: "1px solid var(--border-default)", backgroundColor: "transparent" }}>
            <input type="file" style={{ display: "none" }} onChange={(e) => { const file = e.target.files?.[0]; if (file) setDraft((p) => p ? { ...p, receiptName: file.name } : null) }} />
            <Paperclip size={13} />
            Attach receipt
          </label>
          {draft.receiptName && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ink-secondary)" }}>
              <span>{draft.receiptName}</span>
              <button type="button" onClick={() => setDraft((p) => p ? { ...p, receiptName: null } : null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", lineHeight: 1 }}>
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

  const statCardStyle: React.CSSProperties = { borderRadius: 10, padding: "14px 16px", backgroundColor: "var(--canvas)", border: "1px solid var(--border-default)" }
  const statLabelStyle: React.CSSProperties = { margin: "0 0 6px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "var(--ink-tertiary)" }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <p style={sectionLabelStyle}>Awarded</p>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em" }}>{formatCurrency(awardedAmount)}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div style={statCardStyle}><p style={statLabelStyle}>Awarded</p><p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>{formatCurrency(awardedAmount)}</p></div>
        <div style={statCardStyle}><p style={statLabelStyle}>Spent</p><p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>{formatCurrency(totalSpent)}</p></div>
        <div style={statCardStyle}><p style={statLabelStyle}>Remaining</p><p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: isOverspent ? "#D97706" : "var(--ink)" }}>{formatCurrency(remaining)}</p></div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ ...sectionLabelStyle, margin: 0 }}>Expenses</p>
          <button type="button" onClick={startNew} style={{ background: "none", border: "none", fontSize: 13, fontWeight: 500, color: "var(--slate-secondary)", cursor: "pointer", padding: "4px 8px", borderRadius: 6, transition: "background-color 150ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            + Add expense
          </button>
        </div>
        {expenses.length === 0 && editingId !== "new" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--ink-secondary)" }}>No expenses recorded yet.</p>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>Add your first expense to start tracking.</p>
            <button type="button" onClick={startNew} style={{ marginTop: 4, padding: "7px 16px", borderRadius: 7, border: "none", backgroundColor: "var(--slate-primary)", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Add expense</button>
          </div>
        ) : (
          <div style={{ borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", overflow: "hidden" }}>
            {expenses.map((expense, i) => {
              const isEditing = editingId === expense.id
              const isDeleting = deletingId === expense.id
              const isHovered = hoveredRow === expense.id
              const isLastExpense = i === expenses.length - 1
              const borderBottom = (isLastExpense && editingId !== "new") ? "none" : "1px solid var(--border-default)"
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
                      <button type="button" onClick={() => setDeletingId(null)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border-default)", backgroundColor: "transparent", fontSize: 12, fontWeight: 500, cursor: "pointer", color: "var(--ink)" }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: "0 0 110px", fontSize: 13, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>{formatDate(expense.date)}</span>
                      <span style={{ flex: 1, fontSize: 14, color: "var(--ink)" }}>{expense.description}</span>
                      <span style={{ flexShrink: 0, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 500, backgroundColor: "#F0F2F5", color: "var(--ink-secondary)" }}>{expense.category}</span>
                      <span style={{ flex: "0 0 80px", textAlign: "right", fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{formatCurrency(expense.amount)}</span>
                      <Paperclip size={14} color={expense.receiptName ? "var(--ink-secondary)" : "var(--border-default)"} style={{ flexShrink: 0 }} />
                      <div style={{ display: "flex", gap: 4, opacity: isHovered ? 1 : 0, transition: "opacity 150ms", flexShrink: 0 }}>
                        <button type="button" onClick={() => startEdit(expense)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border-default)", backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Pencil size={13} color="var(--ink-secondary)" /></button>
                        <button type="button" onClick={() => { setDeletingId(expense.id); setHoveredRow(null) }} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border-default)", backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={13} color="var(--ink-secondary)" /></button>
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

function NoteBubble() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2.5 2A1.5 1.5 0 0 0 1 3.5v5A1.5 1.5 0 0 0 2.5 10H5v2.5L8 10h3.5A1.5 1.5 0 0 0 13 8.5v-5A1.5 1.5 0 0 0 11.5 2h-9Z" fill="var(--slate-secondary)" />
    </svg>
  )
}

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
        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-default)", backgroundColor: "var(--surface-white)", fontSize: 13, color: "var(--ink)", outline: "none", resize: "none" as const, lineHeight: "19px", boxSizing: "border-box" as const, fontFamily: "inherit" }}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
        <button type="button" onClick={() => { if (text.trim()) onSave(text.trim()) }}
          style={{ padding: "5px 14px", borderRadius: 7, border: "none", backgroundColor: "var(--slate-primary)", fontSize: 12, fontWeight: 500, color: "#FFFFFF", cursor: "pointer", transition: "background-color 150ms" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
        >
          {saveLabel}
        </button>
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
  const handleCancelEdit = useCallback(() => setEditingNoteId(null), [])

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ ...sectionLabelStyle, margin: 0 }}>Notes ({notes.length})</p>
        <button type="button" onClick={() => { setEditingNoteId(null); onComposerChange(!composerOpen) }}
          style={{ background: "none", border: "none", padding: "0 2px", fontSize: 12, fontWeight: 500, color: "var(--slate-secondary)", cursor: "pointer", lineHeight: "16px" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "none" }}
        >
          + Add note
        </button>
      </div>
      {composerOpen && (
        <div style={{ marginBottom: 12, padding: "14px 16px", borderRadius: 10, backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)" }}>
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
                <div style={{ padding: "14px 16px", borderRadius: 10, backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)" }}>
                  <NoteEditor initialText={note.text} saveLabel="Save" onSave={(text) => { onEditNote(note.id, text); setEditingNoteId(null) }} onCancel={handleCancelEdit} />
                </div>
              ) : (
                <div onClick={() => { onComposerChange(false); setEditingNoteId(note.id) }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", borderRadius: 10, backgroundColor: "var(--canvas)", border: "1px solid var(--border-default)", cursor: "text" }}
                >
                  <div style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 7, backgroundColor: "var(--slate-tint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <NoteBubble />
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

// ── Style helpers ──────────────────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-tertiary)", margin: "0 0 12px 0",
}

const ghostBtnStyle: React.CSSProperties = {
  padding: "7px 14px", borderRadius: 7, backgroundColor: "transparent", border: "1px solid var(--border-default)", fontSize: 13, fontWeight: 400, color: "var(--ink)", cursor: "pointer", transition: "background-color 150ms",
}

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Proposals" },
  { id: "tasks",    label: "Tasks"     },
  { id: "budget",   label: "Budget"    },
  { id: "reports",  label: "Reports"   },
  { id: "notes",    label: "Notes"     },
  { id: "files",    label: "Files"     },
]

// ── Inner page (uses useSearchParams) ─────────────────────────────────────

function OpportunityDetailContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const opportunityId = params.opportunityId as string
  const isKnown = opportunityId === "equitable-futures"

  const opportunityName = isKnown ? "Equitable Futures Grant 2026" : (searchParams.get("name") ?? "New Opportunity")
  const engagementName  = isKnown ? "Ford Foundation"              : (searchParams.get("engagementName") ?? "Portfolio")
  const chipStage       = isKnown ? "Active"                       : (searchParams.get("stage") ?? "Tracking")
  const chipAmount      = isKnown ? "$75,000"                      : (searchParams.get("amount") ?? "—")
  const chipDeadline    = isKnown ? "Due Jun 15, 2026"             : null

  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [tasks, setTasks] = useState<Task[]>(isKnown ? KNOWN_TASKS : [])
  const [proposals] = useState<Proposal[]>(isKnown ? KNOWN_PROPOSALS : [])
  const [stage, setStage] = useState<Stage>(chipStage as Stage)
  const [expenses, setExpenses] = useState<Expense[]>(isKnown ? KNOWN_EXPENSES : [])
  const [notes, setNotes] = useState<Note[]>(isKnown ? KNOWN_NOTES : [])
  const [noteComposerOpen, setNoteComposerOpen] = useState(false)
  const [toast, setToast] = useState<{ msg: string; visible: boolean }>({ msg: "", visible: false })
  const [modalOpen, setModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [lockedHover, setLockedHover] = useState<TabId | null>(null)
  const [lessons, setLessons] = useState<LessonsLearned>({ worked: "", didntWork: "", tryNext: "" })

  const showMatchInsights = MATCH_INSIGHTS_STAGES.includes(stage)
  const showCoaching = stage === "Declined"

  const attentionFlag: "overdue" | "attention" | null = (() => {
    if (stage === "Declined" || stage === "Complete") return null
    if (tasks.some((t) => !t.done && t.dueBadge === "today")) return "overdue"
    return null
  })()

  useEffect(() => {
    setActiveTab((prev) => isTabLocked(prev, stage) ? "overview" : prev)
  }, [stage])

  useEffect(() => {
    if (activeTab !== "notes") setNoteComposerOpen(false)
  }, [activeTab])

  function showToast(msg: string) {
    setToast({ msg, visible: true })
    setTimeout(() => setToast((v) => ({ ...v, visible: false })), 3000)
  }

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done, status: !t.done ? "Done" : "To Do" } : t))
  }

  function handleStageChange(s: Stage) { setStage(s); showToast(`Stage: ${s}`) }
  function handleShare(teammate: string) { showToast(`Opportunity shared with ${teammate}`) }

  function handleAddNote(text: string) {
    const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    setNotes((prev) => [{ id: `note-${Date.now()}`, text, date: dateStr, author: "Taylor S." }, ...prev])
  }

  function handleEditNote(id: string, text: string) {
    const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, text, date: dateStr } : n))
  }

  function addExpense(e: Expense) { setExpenses((prev) => [...prev, e]) }
  function updateExpense(e: Expense) { setExpenses((prev) => prev.map((x) => x.id === e.id ? e : x)) }
  function deleteExpense(id: string) { setExpenses((prev) => prev.filter((x) => x.id !== id)) }

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--surface-white)" }}>
      <Toast message={toast.msg} visible={toast.visible} />
      <NewProposalModal open={modalOpen} onClose={() => setModalOpen(false)} opportunityName={opportunityName} opportunityId={opportunityId} />
      <ShareModal open={shareModalOpen} onClose={() => setShareModalOpen(false)} onShare={handleShare} />

      {/* Breadcrumb */}
      <div style={{ padding: "12px 32px", borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--surface-white)" }}>
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
      <div style={{ padding: "24px 32px 0", backgroundColor: "var(--surface-white)", borderBottom: "1px solid var(--border-default)" }}>
        {/* Title row */}
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
            >
              <Plus size={13} />
              New proposal
            </button>
          </div>
        </div>

        {/* Meta chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, flexWrap: "wrap" as const }}>
          <span style={{ borderRadius: 20, padding: "4px 12px", fontSize: 13, border: "1px solid var(--border-default)", backgroundColor: "var(--canvas)", color: "var(--ink-secondary)" }}>{engagementName}</span>
          <span style={{ borderRadius: 20, padding: "4px 12px", fontSize: 13, border: "1px solid var(--border-default)", backgroundColor: "#EBF0F5", color: "#4A6080" }}>{chipStage}</span>
          {chipDeadline && (
            <span style={{ borderRadius: 20, padding: "4px 12px", fontSize: 13, border: "1px solid var(--border-default)", backgroundColor: "#FDE8E8", color: "#8B2020" }}>{chipDeadline}</span>
          )}
          <span style={{ borderRadius: 20, padding: "4px 12px", fontSize: 13, border: "1px solid var(--border-default)", backgroundColor: "var(--canvas)", color: "var(--ink-secondary)" }}>{chipAmount}</span>
          {attentionFlag && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 20, padding: "4px 12px", fontSize: 13, border: "1px solid rgba(185,28,28,0.3)", backgroundColor: "#FDE8E8", color: "#8B2020" }}>
              <Flag size={11} />
              {attentionFlag === "overdue" ? "Overdue" : "Needs attention"}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <button type="button" onClick={() => { setActiveTab("notes"); setNoteComposerOpen(true) }}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, backgroundColor: "transparent", border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", cursor: "pointer", transition: "background-color 150ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <Plus size={13} />
            Add note
          </button>
          <button type="button" onClick={() => setShareModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, backgroundColor: "transparent", border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", cursor: "pointer", transition: "background-color 150ms" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <Share2 size={13} />
            Share
          </button>
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
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: "50%", transform: "translateX(-50%)", backgroundColor: "#1C2E26", color: "#FFFFFF", fontSize: 12, padding: "6px 10px", borderRadius: 6, whiteSpace: "nowrap", zIndex: 200, pointerEvents: "none", boxShadow: "0 2px 8px rgba(28,46,38,0.2)" }}>
                    Available once this opportunity is awarded
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Match Insights / Coaching band */}
      {showMatchInsights && <MatchInsightsSection proposals={proposals} />}
      {showCoaching && <CoachingSection lessons={lessons} onLessonsChange={setLessons} />}

      {/* Tab content */}
      <div style={{ padding: "28px 32px", maxWidth: 960 }}>
        {activeTab === "overview" && <OverviewTab proposals={proposals} onNewProposal={() => setModalOpen(true)} />}
        {activeTab === "tasks" && <TasksTab tasks={tasks} onToggle={toggleTask} />}
        {activeTab === "budget" && (
          isKnown
            ? <BudgetTab awardedAmount={AWARDED_AMOUNT} expenses={expenses} onAddExpense={addExpense} onUpdateExpense={updateExpense} onDeleteExpense={deleteExpense} />
            : <EmptyTab label="Budget" />
        )}
        {activeTab === "reports" && <EmptyTab label="Reports" />}
        {activeTab === "notes" && <NotesTab notes={notes} composerOpen={noteComposerOpen} onComposerChange={setNoteComposerOpen} onAddNote={handleAddNote} onEditNote={handleEditNote} />}
        {activeTab === "files" && <EmptyTab label="Files" />}
      </div>
    </div>
  )
}

// ── Page export ────────────────────────────────────────────────────────────

export default function OpportunityDetailPage() {
  return (
    <Suspense fallback={null}>
      <OpportunityDetailContent />
    </Suspense>
  )
}
