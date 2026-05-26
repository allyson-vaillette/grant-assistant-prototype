"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, Telescope, FileText, Sparkles, Paperclip } from "lucide-react"
import { NewProposalModal } from "@/components/proposals/NewProposalModal"

// ── Types ──────────────────────────────────────────────────────────────────

interface Assignee {
  initials: string
  name: string
  isCurrentUser: boolean
}

interface Task {
  id: string
  name: string
  engagement: string
  opportunity: string
  dueLabel: string
  dueCategory: "today" | "week" | "twoweeks"
  done: boolean
  assignee: Assignee
}

interface TeamTask {
  id: string
  name: string
  engagement: string
  opportunity: string
  assignee: Assignee
  dueLabel: string
  dueCategory: "today" | "week" | "twoweeks"
  status: "To Do" | "In Progress"
}

interface Deadline {
  name: string
  funder: string
  stage: string
  daysLeft: number
  isOverdue: boolean
  dotColor: string
}

interface PipelineHoverItem {
  primary: string
  secondary: string
  trailing: string
  trailingHighlight?: boolean
}

interface PipelineStage {
  label: string
  sub: string
  count: number
  stageFilter: string
  hasUrgent: boolean
  urgentLabel?: string
  accentColor: string
  hoverLabel: string
  hoverItems: PipelineHoverItem[]
}

// ── Mock data ──────────────────────────────────────────────────────────────

const ME: Assignee = { initials: "TS", name: "Taylor S.", isCurrentUser: true }
const JORDAN: Assignee = { initials: "JM", name: "Jordan M.", isCurrentUser: false }
const PRIYA: Assignee = { initials: "PK", name: "Priya K.", isCurrentUser: false }
const SAM: Assignee = { initials: "SR", name: "Sam R.", isCurrentUser: false }

const INITIAL_TASKS: Task[] = [
  { id: "t1", name: "Complete narrative section",       engagement: "Ford Foundation",  opportunity: "Equitable Futures Grant",    dueLabel: "Due today",  dueCategory: "today",    done: false, assignee: ME },
  { id: "t2", name: "Get budget sign-off from finance", engagement: "Ford Foundation",  opportunity: "Equitable Futures Grant",    dueLabel: "Due today",  dueCategory: "today",    done: false, assignee: ME },
  { id: "t3", name: "Collect letters of support",       engagement: "Ford Foundation",  opportunity: "Equitable Futures Grant",    dueLabel: "Due Jun 1",  dueCategory: "week",     done: false, assignee: ME },
  { id: "t4", name: "Review draft with program director",engagement: "Kresge Foundation",opportunity: "Housing Equity Initiative", dueLabel: "Due Jun 3",  dueCategory: "week",     done: false, assignee: ME },
  { id: "t5", name: "Upload Q1 outcomes data",          engagement: "W.K. Kellogg",     opportunity: "Community Resilience",       dueLabel: "Due Jun 10", dueCategory: "twoweeks", done: false, assignee: ME },
]

const TEAM_TASKS: TeamTask[] = [
  { id: "tt1", name: "Upload evaluation framework",      engagement: "Ford Foundation",     opportunity: "Equitable Futures Grant",    assignee: JORDAN, dueLabel: "Due Jun 2",  dueCategory: "week",     status: "In Progress" },
  { id: "tt2", name: "Draft impact narrative",           engagement: "Kresge Foundation",   opportunity: "Housing Equity Initiative",  assignee: PRIYA,  dueLabel: "Due Jun 5",  dueCategory: "week",     status: "To Do"       },
  { id: "tt3", name: "Confirm match fund documentation", engagement: "W.K. Kellogg",        opportunity: "Community Resilience",       assignee: SAM,    dueLabel: "Due Jun 8",  dueCategory: "week",     status: "In Progress" },
  { id: "tt4", name: "Submit logic model diagram",       engagement: "MacArthur Foundation", opportunity: "100&Change Proposal",  assignee: JORDAN, dueLabel: "Due Jun 12", dueCategory: "twoweeks", status: "To Do"       },
]

const DEADLINES: Deadline[] = [
  { name: "Digital Equity Program 2024",         funder: "Gates Foundation",  stage: "Active",    daysLeft: -3, isOverdue: true,  dotColor: "#6B819E" },
  { name: "Equitable Futures Grant 2026",         funder: "Ford Foundation",   stage: "Active",    daysLeft: 6,  isOverdue: false, dotColor: "#6B819E" },
  { name: "Housing Equity Initiative",            funder: "Kresge Foundation", stage: "Active",    daysLeft: 9,  isOverdue: false, dotColor: "#6B819E" },
  { name: "Community Resilience Interim Report",  funder: "W.K. Kellogg",     stage: "Reporting", daysLeft: 12, isOverdue: false, dotColor: "#D19A66" },
  { name: "Civic Engagement Seed Fund",           funder: "Ford Foundation",   stage: "Tracking",  daysLeft: 14, isOverdue: false, dotColor: "#A6B3C5" },
]

const PIPELINE_STAGES: PipelineStage[] = [
  {
    label: "Under review", sub: "Tracking stage", count: 4, stageFilter: "Tracking",
    hasUrgent: false, accentColor: "#A6B3C5",
    hoverLabel: "Under review",
    hoverItems: [
      { primary: "Civic Engagement Seed Fund",   secondary: "Ford Foundation",      trailing: "Sep 1, 2026"  },
      { primary: "Community Development Grant",  secondary: "Kresge Foundation",    trailing: "Aug 1, 2026"  },
      { primary: "Youth Wellness Initiative",    secondary: "Robert Wood Johnson",  trailing: "Nov 1, 2026"  },
      { primary: "Rural Access Program",         secondary: "Robert Wood Johnson",  trailing: "Dec 15, 2026" },
    ],
  },
  {
    label: "In progress", sub: "Active stage", count: 5, stageFilter: "Active",
    hasUrgent: true, urgentLabel: "2 due soon", accentColor: "#4A6080",
    hoverLabel: "In progress",
    hoverItems: [
      { primary: "Equitable Futures Grant 2026", secondary: "Ford Foundation",     trailing: "Due Jun 15", trailingHighlight: true  },
      { primary: "Housing Equity Initiative",    secondary: "Kresge Foundation",   trailing: "Due Jun 9",  trailingHighlight: true  },
      { primary: "Health Equity 2026",           secondary: "Robert Wood Johnson", trailing: "Due Jul 1"                            },
      { primary: "Food Security Grant",          secondary: "W.K. Kellogg",        trailing: "Due Sep 30"                           },
      { primary: "100&Change Proposal",          secondary: "MacArthur Foundation",trailing: "Due Aug 15"                           },
    ],
  },
  {
    label: "Submitted", sub: "Awaiting decision", count: 4, stageFilter: "Submitted",
    hasUrgent: false, accentColor: "#AD9DAE",
    hoverLabel: "Submitted, awaiting decision",
    hoverItems: [
      { primary: "Community Voice Initiative",   secondary: "Ford Foundation",   trailing: "Submitted Mar 2"  },
      { primary: "Youth Services Grant",         secondary: "Annie E. Casey",    trailing: "Submitted Jan 15" },
      { primary: "Community Resilience Grant",   secondary: "Robert Wood Johnson",trailing: "Submitted Feb 20"},
      { primary: "Community Resilience",         secondary: "W.K. Kellogg",      trailing: "Submitted Apr 1" },
    ],
  },
  {
    label: "Awarded", sub: "Rolling 12 months", count: 4, stageFilter: "Awarded",
    hasUrgent: false, accentColor: "#3C5E4C",
    hoverLabel: "Awarded (rolling 12mo.)",
    hoverItems: [
      { primary: "Community Resilience Fund",    secondary: "Feb 2026", trailing: "$120k", trailingHighlight: true },
      { primary: "Digital Equity Program",       secondary: "Jan 2026", trailing: "$85k",  trailingHighlight: true },
      { primary: "Youth Development Initiative", secondary: "Nov 2025", trailing: "$92k",  trailingHighlight: true },
      { primary: "Arts Access Collaborative",    secondary: "Aug 2025", trailing: "$50k",  trailingHighlight: true },
    ],
  },
]

const AWARDED_ENGAGEMENTS = [
  { engagement: "Community Resilience Fund",    amount: "$120k", date: "Feb 2026" },
  { engagement: "Digital Equity Program",       amount: "$85k",  date: "Jan 2026" },
  { engagement: "Youth Development Initiative", amount: "$92k",  date: "Nov 2025" },
  { engagement: "Arts Access Collaborative",    amount: "$50k",  date: "Aug 2025" },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function getSubline(dueTodayCount: number, allDone: boolean) {
  if (allDone) return "All tasks cleared for today. Nice work."
  if (dueTodayCount > 0) return `You've got ${dueTodayCount} task${dueTodayCount > 1 ? "s" : ""} due today and a deadline in 6 days. Let's make some progress.`
  return "Nothing urgent today. A good day to get ahead."
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).toUpperCase()
}

function todayDateStr() {
  return new Date().toISOString().split("T")[0]
}

function dueBadgeStyle(cat: Task["dueCategory"] | TeamTask["dueCategory"]): React.CSSProperties {
  if (cat === "today")    return { backgroundColor: "#FDE8E8", color: "#8B2020" }
  if (cat === "week")     return { backgroundColor: "#FFF3E0", color: "#7A4A10" }
  return { backgroundColor: "#E8ECF0", color: "#4A6080" }
}

function daysBadgeStyle(days: number): React.CSSProperties {
  if (days <= 6)  return { backgroundColor: "#FDE8E8", color: "#8B2020" }
  if (days <= 13) return { backgroundColor: "#FFF3E0", color: "#7A4A10" }
  return { backgroundColor: "#E8ECF0", color: "#4A6080" }
}

// ── SparkLine ──────────────────────────────────────────────────────────────

function SparkLine() {
  return (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="4" x2="0" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#3C5E4C" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3C5E4C" stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d="M 0,20 L 10,16 L 20,18 L 30,12 L 40,10 L 50,6 L 60,4 L 60,24 L 0,24 Z" fill="url(#sparkGrad)" />
      <polyline points="0,20 10,16 20,18 30,12 40,10 50,6 60,4" stroke="#3C5E4C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
    </svg>
  )
}

// ── TaskCheckbox ───────────────────────────────────────────────────────────

function TaskCheckbox({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick() }}
      style={{
        width: 18, height: 18, flexShrink: 0, borderRadius: "50%",
        border: done ? "1.5px solid var(--evergreen)" : "1.5px solid var(--ink-tertiary)",
        backgroundColor: done ? "var(--evergreen)" : "transparent",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background-color 450ms ease-in-out, border-color 450ms ease-in-out",
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

// ── AvatarChip ─────────────────────────────────────────────────────────────

function AvatarChip({ assignee }: { assignee: Assignee }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%",
        background: assignee.isCurrentUser ? "var(--gradient-avatar)" : "var(--slate-tint)",
        border: "1px solid var(--border-default)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: assignee.isCurrentUser ? "#FFFFFF" : "var(--slate-primary)", lineHeight: 1 }}>
          {assignee.initials}
        </span>
      </div>
      <span style={{ fontSize: 11, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
        {assignee.isCurrentUser ? "You" : assignee.name}
      </span>
    </div>
  )
}

// ── StatCardWithHover ──────────────────────────────────────────────────────

function StatCardWithHover({ children, hoverContent, popoverAlign = "left" }: {
  children: React.ReactNode
  hoverContent: React.ReactNode
  popoverAlign?: "left" | "right"
}) {
  const [hovered, setHovered] = useState(false)
  const side = popoverAlign === "left" ? { left: 0 } : { right: 0 }
  return (
    <div style={{ position: "relative" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {children}
      {hovered && (
        <>
          <div style={{ position: "absolute", top: "100%", ...side, width: 280, height: 6, zIndex: 49 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", ...side, width: 280,
            backgroundColor: "#FFFFFF", borderRadius: 12,
            boxShadow: "0 4px 20px rgba(28,24,64,0.12), 0 1px 4px rgba(28,24,64,0.06)",
            border: "1px solid var(--border-default)", padding: "14px 16px", zIndex: 50,
          }}>
            {hoverContent}
          </div>
        </>
      )}
    </div>
  )
}

// ── HoverPanelLabel ────────────────────────────────────────────────────────

function HoverPanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 10px 0", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)", lineHeight: "13px" }}>
      {children}
    </p>
  )
}

// ── PipelineBar ────────────────────────────────────────────────────────────

function PipelineBar({ stages, onStageClick }: { stages: PipelineStage[]; onStageClick: (f: string) => void }) {
  const router = useRouter()
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 10 }}>
      {stages.map((stage, i) => (
        <div
          key={stage.stageFilter}
          style={{ position: "relative" }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          <button
            type="button"
            onClick={() => onStageClick(stage.stageFilter)}
            style={{
              width: "100%",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-card)",
              overflow: "hidden",
              background: hovered === i ? "var(--canvas)" : "var(--surface-white)",
              cursor: "pointer",
              textAlign: "left",
              transition: "background-color 150ms",
              display: "flex",
              flexDirection: "column",
              padding: 0,
            }}
          >
            {/* Accent bar — overflow:hidden clips corners flush with card radius */}
            <div style={{ height: 4, backgroundColor: stage.accentColor, flexShrink: 0 }} />
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 5 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                {stage.label}
              </p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: "38px" }}>
                {stage.count}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, minHeight: 18 }}>
                <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>{stage.sub}</span>
                {stage.hasUrgent && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 600, backgroundColor: "#FFF3E0", color: "#7A4A10" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#C47A10", display: "inline-block" }} />
                    {stage.urgentLabel}
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Hover popover */}
          {hovered === i && (
            <>
              {/* Transparent bridge keeps the hover zone continuous over the 6px gap */}
              <div style={{ position: "absolute", top: "100%", left: 0, width: "100%", height: 6, zIndex: 49 }} />
              <div style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                ...(i >= 2 ? { right: 0 } : { left: 0 }),
                width: 280,
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                boxShadow: "0 4px 20px rgba(28,24,64,0.12), 0 1px 4px rgba(28,24,64,0.06)",
                border: "1px solid var(--border-default)",
                padding: "14px 16px",
                zIndex: 50,
              }}>
                <HoverPanelLabel>{stage.hoverLabel}</HoverPanelLabel>
                {stage.hoverItems.map((item, j) => (
                  <div
                    key={j}
                    onClick={() => router.push(`/portfolio?stage=${stage.stageFilter}`)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--slate-tint)"; (e.currentTarget as HTMLDivElement).style.borderRadius = "6px" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 8, padding: "6px 4px", margin: "0 -4px",
                      borderBottom: j < stage.hoverItems.length - 1 ? "1px solid var(--border-default)" : "none",
                      cursor: "pointer", transition: "background-color 100ms",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.primary}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px" }}>
                        {item.secondary}
                      </p>
                    </div>
                    <span style={{ flexShrink: 0, fontSize: item.trailingHighlight ? 12 : 11, fontWeight: item.trailingHighlight ? 600 : 400, color: item.trailingHighlight ? "var(--evergreen)" : "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
                      {item.trailing}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function HomeDashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [collapsing, setCollapsing] = useState<Set<string>>(new Set())
  const [hoveredTask, setHoveredTask] = useState<string | null>(null)
  const [hoveredDeadline, setHoveredDeadline] = useState<number | null>(null)
  const [hoveredTeamTask, setHoveredTeamTask] = useState<string | null>(null)
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)
  const [expandingTask, setExpandingTask] = useState<string | null>(null)
  const [completionDate, setCompletionDate] = useState(todayDateStr())
  const [completionNote, setCompletionNote] = useState("")
  const [completionFile, setCompletionFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [nudgingTaskId, setNudgingTaskId] = useState<string | null>(null)
  const [nudgeNote, setNudgeNote] = useState("")

  const dueTodayCount = tasks.filter((t) => t.dueCategory === "today" && !t.done).length
  const allDone = tasks.every((t) => t.done)

  const sortedDeadlines = [...DEADLINES].sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1
    if (!a.isOverdue && b.isOverdue) return 1
    return a.daysLeft - b.daysLeft
  })

  function handleCheckboxClick(id: string) {
    if (expandingTask === id) return
    setExpandingTask(id)
    setCompletionDate(todayDateStr())
    setCompletionNote("")
    setCompletionFile(null)
  }

  function handleConfirmDone(id: string) {
    setExpandingTask(null)
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: true } : t)))
    setCollapsing((prev) => new Set([...Array.from(prev), id]))
    setTimeout(() => {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      setCollapsing((prev) => { const n = new Set(prev); n.delete(id); return n })
    }, 600)
  }

  function handleSendNudge() {
    setNudgingTaskId(null)
    setNudgeNote("")
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--canvas)" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 64px 32px" }}>

        {/* ── Greeting ── */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: "0 0 6px 0", fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: "34px", color: "var(--ink)", fontFamily: "var(--font-lora)" }}>
            {getGreeting()}, Taylor.
          </h1>
          <p style={{ margin: "0 0 4px 0", fontSize: 14, color: "var(--ink-secondary)", lineHeight: "20px" }}>
            {getSubline(dueTodayCount, allDone)}
          </p>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", color: "var(--ink-tertiary)" }}>
            {todayLabel()}
          </p>
        </div>

        {/* ── Pipeline ── */}
        <PipelineBar
          stages={PIPELINE_STAGES}
          onStageClick={(stageFilter) => router.push(`/portfolio?stage=${stageFilter}`)}
        />

        {/* ── Awarded trend card ── */}
        <div style={{ marginBottom: 28 }}>
          <StatCardWithHover
            hoverContent={
              <>
                <HoverPanelLabel>Awarded (rolling 12mo.)</HoverPanelLabel>
                {AWARDED_ENGAGEMENTS.map((a, i) => (
                  <div
                    key={i}
                    onClick={() => router.push("/portfolio?stage=Awarded")}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--slate-tint)"; (e.currentTarget as HTMLDivElement).style.borderRadius = "6px" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 4px", margin: "0 -4px", borderBottom: i < AWARDED_ENGAGEMENTS.length - 1 ? "1px solid var(--border-default)" : "none", cursor: "pointer", transition: "background-color 100ms" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.engagement}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px" }}>{a.date}</p>
                    </div>
                    <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: "var(--evergreen)" }}>{a.amount}</span>
                  </div>
                ))}
              </>
            }
          >
            <div
              onClick={() => router.push("/portfolio?stage=Awarded")}
              style={{ borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 16 }}
            >
              <div>
                <p style={labelStyle}>Awarded rolling 12 months</p>
                <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: "29px" }}>$347k</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <p style={{ margin: 0, fontSize: 12, color: "var(--evergreen)" }}>vs $290k prior period</p>
                <SparkLine />
              </div>
            </div>
          </StatCardWithHover>
        </div>

        {/* ── Quick actions (elevated for AI discoverability) ── */}
        <div style={{ marginBottom: 28 }}>
          <p style={sectionLabelStyle}>Quick actions</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            <QuickAction
              icon={<Sparkles size={18} color="#AD9DAE" />}
              iconBg="linear-gradient(135deg, rgba(74,96,128,0.10), rgba(173,157,174,0.10))"
              label="Ask Grant Assistant"
              sub="Chat about your portfolio or a funder"
              onClick={() => {}}
            />
            <QuickAction
              icon={<Plus size={18} color="var(--slate-primary)" />}
              iconBg="var(--slate-tint)"
              label="New engagement"
              sub="Start tracking a funder relationship"
              onClick={() => router.push("/portfolio")}
            />
            <QuickAction
              icon={<Telescope size={18} color="#2D5080" />}
              iconBg="var(--slate-light)"
              label="Find opportunities"
              sub="Search funders and open grants"
              onClick={() => router.push("/discover")}
            />
            <QuickAction
              icon={<FileText size={18} color="#2A5040" />}
              iconBg="var(--evergreen-tint)"
              label="Write a proposal"
              sub="Continue an in-progress draft"
              onClick={() => setIsProposalModalOpen(true)}
            />
          </div>
        </div>

        {/* ── My tasks + Upcoming deadlines ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* My tasks */}
          <div style={{ borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border-default)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>My tasks</span>
                {tasks.length > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", backgroundColor: "var(--slate-tint)", fontSize: 11, fontWeight: 600, color: "var(--slate-primary)" }}>
                    {tasks.length}
                  </span>
                )}
              </div>
              <button type="button" style={{ background: "none", border: "none", fontSize: 12, color: "var(--slate-secondary)", cursor: "pointer", fontWeight: 500 }} onClick={() => router.push("/opportunity/equitable-futures")}>
                View all
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {tasks.length === 0 ? (
                <div style={{ padding: "28px 18px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>All tasks cleared for today.</p>
                </div>
              ) : (
                tasks.map((task) => {
                  const isCollapsing = collapsing.has(task.id)
                  const isExpanding = expandingTask === task.id
                  const isHovered = hoveredTask === task.id && !isCollapsing && !isExpanding
                  return (
                    <div
                      key={task.id}
                      style={{
                        borderBottom: "1px solid var(--border-default)",
                        opacity: isCollapsing ? 0 : 1,
                        maxHeight: isCollapsing ? 0 : (isExpanding ? 320 : 100),
                        overflow: "hidden",
                        transition: isCollapsing
                          ? "opacity 0.35s ease, max-height 0.55s ease"
                          : "max-height 0.2s ease, background-color 150ms",
                        backgroundColor: isHovered || isExpanding ? "var(--canvas)" : "transparent",
                      }}
                    >
                      <div
                        onClick={() => !isExpanding && router.push("/opportunity/equitable-futures")}
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", cursor: isExpanding ? "default" : "pointer" }}
                      >
                        <TaskCheckbox done={task.done || isExpanding} onClick={() => handleCheckboxClick(task.id)} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: "0 0 2px 0", fontSize: 13, fontWeight: 500, color: isExpanding ? "var(--ink-tertiary)" : "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "color 300ms" }}>
                            {task.name}
                          </p>
                          <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {task.engagement} · {task.opportunity}
                          </p>
                        </div>
                        <AvatarChip assignee={task.assignee} />
                        <span style={{ flexShrink: 0, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 500, ...dueBadgeStyle(task.dueCategory) }}>
                          {task.dueLabel}
                        </span>
                      </div>

                      {/* Inline completion expansion */}
                      {isExpanding && (
                        <div onClick={(e) => e.stopPropagation()} style={{ padding: "0 18px 14px 18px" }}>
                          <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 9 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <label style={{ fontSize: 12, color: "var(--ink-secondary)", width: 96, flexShrink: 0 }}>Completed on</label>
                              <input
                                type="date"
                                value={completionDate}
                                onChange={(e) => setCompletionDate(e.target.value)}
                                style={{ flex: 1, padding: "5px 9px", borderRadius: 7, border: "1px solid var(--border-default)", fontSize: 12, color: "var(--ink)", outline: "none", backgroundColor: "var(--surface-white)", fontFamily: "inherit" }}
                              />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <label style={{ fontSize: 12, color: "var(--ink-secondary)", width: 96, flexShrink: 0 }}>Note</label>
                              <input
                                type="text"
                                value={completionNote}
                                onChange={(e) => setCompletionNote(e.target.value)}
                                placeholder="What happened?"
                                style={{ flex: 1, padding: "5px 9px", borderRadius: 7, border: "1px solid var(--border-default)", fontSize: 12, color: "var(--ink)", outline: "none", backgroundColor: "var(--surface-white)", fontFamily: "inherit" }}
                              />
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <label style={{ fontSize: 12, color: "var(--ink-secondary)", width: 96, flexShrink: 0 }}>Attachment</label>
                              <div style={{ flex: 1 }}>
                                <input ref={fileInputRef} type="file" onChange={(e) => setCompletionFile(e.target.files?.[0] ?? null)} style={{ display: "none" }} />
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 9px", borderRadius: 7, border: "1px dashed var(--border-default)", backgroundColor: "transparent", fontSize: 12, color: completionFile ? "var(--ink)" : "var(--ink-tertiary)", cursor: "pointer", width: "100%", fontFamily: "inherit" }}
                                >
                                  <Paperclip size={12} />
                                  {completionFile ? completionFile.name : "Attach a file"}
                                </button>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 2 }}>
                              <button
                                type="button"
                                onClick={() => handleConfirmDone(task.id)}
                                style={{ padding: "6px 14px", borderRadius: 7, border: "none", backgroundColor: "var(--evergreen)", color: "#FFFFFF", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                              >
                                Mark done
                              </button>
                              <button
                                type="button"
                                onClick={() => setExpandingTask(null)}
                                style={{ background: "none", border: "none", fontSize: 12, color: "var(--ink-secondary)", cursor: "pointer", padding: "6px 0" }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div style={{ borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border-default)" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Upcoming deadlines</span>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", backgroundColor: "var(--slate-tint)", fontSize: 11, fontWeight: 600, color: "var(--slate-primary)" }}>
                {sortedDeadlines.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {sortedDeadlines.map((dl, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredDeadline(i)}
                  onMouseLeave={() => setHoveredDeadline(null)}
                  onClick={() => router.push("/opportunity/equitable-futures")}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", borderBottom: i < sortedDeadlines.length - 1 ? "1px solid var(--border-default)" : "none", cursor: "pointer", backgroundColor: hoveredDeadline === i ? "var(--canvas)" : "transparent", transition: "background-color 150ms" }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dl.isOverdue ? "var(--error)" : dl.dotColor, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px 0", fontSize: 13, fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dl.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px" }}>{dl.funder} · {dl.stage}</p>
                  </div>
                  {dl.isOverdue ? (
                    <span style={{ flexShrink: 0, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, backgroundColor: "var(--error-light)", color: "var(--error)" }}>
                      Overdue
                    </span>
                  ) : (
                    <span style={{ flexShrink: 0, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 500, ...daysBadgeStyle(dl.daysLeft) }}>
                      {dl.daysLeft} days
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Pending with team ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid var(--border-default)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Pending with team</span>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: "50%", backgroundColor: "var(--slate-tint)", fontSize: 11, fontWeight: 600, color: "var(--slate-primary)" }}>
                  {TEAM_TASKS.length}
                </span>
              </div>
              <button type="button" style={{ background: "none", border: "none", fontSize: 12, color: "var(--slate-secondary)", cursor: "pointer", fontWeight: 500 }} onClick={() => router.push("/opportunity/equitable-futures")}>
                View all
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {TEAM_TASKS.length === 0 ? (
                <div style={{ padding: "28px 18px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>Nothing pending with the team.</p>
                </div>
              ) : (
                TEAM_TASKS.slice(0, 7).map((task, i) => {
                  const isNudging = nudgingTaskId === task.id
                  const isHovered = hoveredTeamTask === task.id
                  return (
                    <div
                      key={task.id}
                      style={{
                        borderBottom: i < Math.min(TEAM_TASKS.length, 7) - 1 ? "1px solid var(--border-default)" : "none",
                        overflow: "hidden",
                        maxHeight: isNudging ? 180 : 100,
                        transition: "max-height 0.2s ease, background-color 150ms",
                        backgroundColor: isHovered || isNudging ? "var(--canvas)" : "transparent",
                      }}
                    >
                      <div
                        onMouseEnter={() => setHoveredTeamTask(task.id)}
                        onMouseLeave={() => setHoveredTeamTask(null)}
                        onClick={() => !isNudging && router.push("/opportunity/equitable-futures")}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", cursor: isNudging ? "default" : "pointer" }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: "0 0 2px 0", fontSize: 13, fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.opportunity} · {task.engagement}</p>
                        </div>
                        <AvatarChip assignee={task.assignee} />
                        <span style={{ flexShrink: 0, borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 500, ...dueBadgeStyle(task.dueCategory) }}>
                          {task.dueLabel}
                        </span>
                        <span style={{ flexShrink: 0, borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600, border: "1px solid var(--border-default)", backgroundColor: task.status === "In Progress" ? "var(--slate-tint)" : "var(--canvas)", color: task.status === "In Progress" ? "var(--slate-primary)" : "var(--ink-tertiary)" }}>
                          {task.status}
                        </span>
                        {(isHovered || isNudging) && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setNudgingTaskId(isNudging ? null : task.id); setNudgeNote("") }}
                            title="Send nudge"
                            style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 6, border: "1px solid var(--border-default)", backgroundColor: isNudging ? "var(--slate-tint)" : "transparent", cursor: "pointer", transition: "background-color 150ms" }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 15, color: isNudging ? "var(--slate-primary)" : "var(--ink-tertiary)", lineHeight: 1, userSelect: "none" }}>campaign</span>
                          </button>
                        )}
                      </div>

                      {isNudging && (
                        <div onClick={(e) => e.stopPropagation()} style={{ padding: "0 18px 14px 18px" }}>
                          <div style={{ borderTop: "1px solid var(--border-default)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 9 }}>
                            <input
                              type="text"
                              value={nudgeNote}
                              onChange={(e) => setNudgeNote(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleSendNudge(); if (e.key === "Escape") setNudgingTaskId(null) }}
                              placeholder="Just checking in"
                              autoFocus
                              style={{ width: "100%", padding: "5px 9px", borderRadius: 7, border: "1px solid var(--border-default)", fontSize: 12, color: "var(--ink)", outline: "none", backgroundColor: "var(--surface-white)", fontFamily: "inherit", boxSizing: "border-box" }}
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <button
                                type="button"
                                onClick={handleSendNudge}
                                style={{ padding: "5px 14px", borderRadius: 7, border: "none", backgroundColor: "var(--slate-primary)", color: "#FFFFFF", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
                              >
                                Send nudge
                              </button>
                              <button
                                type="button"
                                onClick={() => setNudgingTaskId(null)}
                                style={{ background: "none", border: "none", fontSize: 12, color: "var(--ink-secondary)", cursor: "pointer", padding: "5px 0" }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

      </div>

      <NewProposalModal open={isProposalModalOpen} onClose={() => setIsProposalModalOpen(false)} opportunityName="New Proposal" />
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function QuickAction({ icon, iconBg, label, sub, onClick }: {
  icon: React.ReactNode; iconBg: string; label: string; sub: string; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10, padding: "16px", borderRadius: "var(--radius-card)", backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", cursor: "pointer", textAlign: "left", transition: "border-color 150ms, box-shadow 150ms" }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "rgba(74,96,128,0.3)"; el.style.boxShadow = "0 2px 8px rgba(42,42,42,0.07)" }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "var(--border-default)"; el.style.boxShadow = "none" }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 9, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: "0 0 3px 0", fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: "16px" }}>{label}</p>
        <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "16px" }}>{sub}</p>
      </div>
    </button>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)", margin: 0, lineHeight: "14px",
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)", margin: "0 0 10px 0",
}
