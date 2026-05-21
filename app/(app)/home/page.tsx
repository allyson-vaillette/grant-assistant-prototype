"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Telescope, FileText } from "lucide-react"
import { NewProposalModal } from "@/components/proposals/NewProposalModal"

// ── Types ──────────────────────────────────────────────────────────────────

interface Task {
  id: string
  name: string
  engagement: string
  opportunity: string
  dueLabel: string
  dueCategory: "today" | "week" | "twoweeks"
  done: boolean
}

interface Deadline {
  name: string
  funder: string
  stage: string
  daysLeft: number
  dotColor: string
}

// ── Mock data ──────────────────────────────────────────────────────────────

const INITIAL_TASKS: Task[] = [
  {
    id: "t1",
    name: "Complete narrative section",
    engagement: "Ford Foundation",
    opportunity: "Equitable Futures Grant",
    dueLabel: "Due today",
    dueCategory: "today",
    done: false,
  },
  {
    id: "t2",
    name: "Get budget sign-off from finance",
    engagement: "Ford Foundation",
    opportunity: "Equitable Futures Grant",
    dueLabel: "Due today",
    dueCategory: "today",
    done: false,
  },
  {
    id: "t3",
    name: "Collect letters of support",
    engagement: "Ford Foundation",
    opportunity: "Equitable Futures Grant",
    dueLabel: "Due Jun 1",
    dueCategory: "week",
    done: false,
  },
  {
    id: "t4",
    name: "Review draft with program director",
    engagement: "Kresge Foundation",
    opportunity: "Housing Equity Initiative",
    dueLabel: "Due Jun 3",
    dueCategory: "week",
    done: false,
  },
  {
    id: "t5",
    name: "Upload Q1 outcomes data",
    engagement: "W.K. Kellogg",
    opportunity: "Community Resilience",
    dueLabel: "Due Jun 10",
    dueCategory: "twoweeks",
    done: false,
  },
]

const DEADLINES: Deadline[] = [
  { name: "Equitable Futures Grant 2026",    funder: "Ford Foundation",     stage: "Active",    daysLeft: 6,  dotColor: "#6B819E" },
  { name: "Housing Equity Initiative",       funder: "Kresge Foundation",   stage: "Active",    daysLeft: 9,  dotColor: "#6B819E" },
  { name: "Community Resilience Interim Report", funder: "W.K. Kellogg",   stage: "Reporting", daysLeft: 12, dotColor: "#D19A66" },
  { name: "Civic Engagement Seed Fund",      funder: "Ford Foundation",     stage: "Tracking",  daysLeft: 14, dotColor: "#A6B3C5" },
]

const ACTIVE_ENGAGEMENTS = [
  { name: "Ford Foundation Equitable Futures", funder: "Ford Foundation",   status: "Active"   },
  { name: "Housing Equity Initiative",         funder: "Kresge Foundation", status: "Active"   },
  { name: "Community Resilience Fund",         funder: "W.K. Kellogg",      status: "Active"   },
  { name: "Civic Engagement Seed Fund",        funder: "Ford Foundation",   status: "Tracking" },
  { name: "Youth Development Initiative",      funder: "MacArthur Foundation", status: "Active" },
  { name: "Digital Equity Program",            funder: "Gates Foundation",  status: "Active"   },
]

const IN_PROGRESS_PROPOSALS = [
  { name: "Equitable Futures Grant 2026", engagement: "Ford Foundation",   deadline: "Jun 1",  urgent: true  },
  { name: "Housing Equity Initiative",    engagement: "Kresge Foundation", deadline: "Jun 3",  urgent: true  },
  { name: "Community Resilience Interim", engagement: "W.K. Kellogg",      deadline: "Jun 10", urgent: false },
  { name: "Civic Engagement Proposal",    engagement: "Ford Foundation",   deadline: "Jun 14", urgent: false },
]

const SUBMITTED_PROPOSALS = [
  { name: "Digital Equity Program 2025",    funder: "Gates Foundation",    submittedDate: "Apr 4"  },
  { name: "Youth Arts Access Initiative",   funder: "MacArthur Foundation", submittedDate: "Apr 17" },
  { name: "Climate Justice Fund Proposal",  funder: "Packard Foundation",  submittedDate: "May 2"  },
]

const AWARDED_ENGAGEMENTS = [
  { engagement: "Community Resilience Fund",     amount: "$120k", date: "Feb 2026" },
  { engagement: "Digital Equity Program",        amount: "$85k",  date: "Jan 2026" },
  { engagement: "Youth Development Initiative",  amount: "$92k",  date: "Nov 2025" },
  { engagement: "Arts Access Collaborative",     amount: "$50k",  date: "Aug 2025" },
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
  if (dueTodayCount > 0) {
    return `You've got ${dueTodayCount} task${dueTodayCount > 1 ? "s" : ""} due today and a deadline in 6 days. Let's make some progress.`
  }
  return "Nothing urgent today. A good day to get ahead."
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  }).toUpperCase()
}

function dueBadgeStyle(cat: Task["dueCategory"]): React.CSSProperties {
  if (cat === "today")    return { backgroundColor: "#FDE8E8", color: "#8B2020" }
  if (cat === "week")     return { backgroundColor: "#FFF3E0", color: "#7A4A10" }
  return { backgroundColor: "#E8ECF0", color: "#4A6080" }
}

function daysBadgeStyle(days: number): React.CSSProperties {
  if (days <= 6)  return { backgroundColor: "#FDE8E8", color: "#8B2020" }
  if (days <= 13) return { backgroundColor: "#FFF3E0", color: "#7A4A10" }
  return { backgroundColor: "#E8ECF0", color: "#4A6080" }
}

function engagementStatusStyle(status: string): React.CSSProperties {
  if (status === "Active")    return { backgroundColor: "#E8F0EC", color: "#2A5040" }
  if (status === "Reporting") return { backgroundColor: "#F5EAD8", color: "#7A4A10" }
  return { backgroundColor: "var(--slate-tint)", color: "var(--slate-primary)" }
}

// ── Spark line SVG with gradient fill ─────────────────────────────────────

function SparkLine() {
  return (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" aria-hidden>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="4" x2="0" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#3C5E4C" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#3C5E4C" stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path
        d="M 0,20 L 10,16 L 20,18 L 30,12 L 40,10 L 50,6 L 60,4 L 60,24 L 0,24 Z"
        fill="url(#sparkGrad)"
      />
      <polyline
        points="0,20 10,16 20,18 30,12 40,10 50,6 60,4"
        stroke="#3C5E4C"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  )
}

// ── Checkbox ───────────────────────────────────────────────────────────────

function TaskCheckbox({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      style={{
        width: 18,
        height: 18,
        flexShrink: 0,
        borderRadius: "50%",
        border: done ? "1.5px solid var(--evergreen)" : "1.5px solid var(--ink-tertiary)",
        backgroundColor: done ? "var(--evergreen)" : "transparent",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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

// ── Stat card hover wrapper ────────────────────────────────────────────────

function StatCardWithHover({
  children,
  hoverContent,
  popoverAlign = "left",
}: {
  children: React.ReactNode
  hoverContent: React.ReactNode
  popoverAlign?: "left" | "right"
}) {
  const [hovered, setHovered] = useState(false)
  const side = popoverAlign === "left" ? { left: 0 } : { right: 0 }
  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered && (
        <>
          {/* Transparent bridge covers the 6px gap so the hover zone is continuous */}
          <div style={{ position: "absolute", top: "100%", ...side, width: 280, height: 6, zIndex: 49 }} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              ...side,
              width: 280,
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              boxShadow: "0 4px 20px rgba(28,24,64,0.12), 0 1px 4px rgba(28,24,64,0.06)",
              border: "1px solid var(--border-default)",
              padding: "14px 16px",
              zIndex: 50,
            }}
          >
            {hoverContent}
          </div>
        </>
      )}
    </div>
  )
}

// ── Hover panel label ──────────────────────────────────────────────────────

function HoverPanelLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 10px 0",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: "var(--ink-tertiary)",
        lineHeight: "13px",
      }}
    >
      {children}
    </p>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function HomeDashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [collapsing, setCollapsing] = useState<Set<string>>(new Set())
  const [hoveredTask, setHoveredTask] = useState<string | null>(null)
  const [hoveredDeadline, setHoveredDeadline] = useState<number | null>(null)
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false)

  const dueTodayCount = tasks.filter((t) => t.dueCategory === "today" && !t.done).length
  const allDone = tasks.every((t) => t.done)

  function handleCheck(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: true } : t))
    )
    setCollapsing((prev) => new Set(Array.from(prev).concat(id)))
    setTimeout(() => {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      setCollapsing((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 550)
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ backgroundColor: "var(--canvas)" }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 64px 32px" }}>

        {/* ── Top bar ── */}
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              margin: "0 0 6px 0",
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              lineHeight: "34px",
              color: "var(--ink)",
              fontFamily: "var(--font-lora)",
            }}
          >
            {getGreeting()}, Taylor.
          </h1>
          <p style={{ margin: "0 0 4px 0", fontSize: 14, color: "var(--ink-secondary)", lineHeight: "20px" }}>
            {getSubline(dueTodayCount, allDone)}
          </p>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 500, letterSpacing: "0.07em", color: "var(--ink-tertiary)" }}>
            {todayLabel()}
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {/* Active engagements */}
          <StatCardWithHover
            popoverAlign="left"
            hoverContent={
              <>
                <HoverPanelLabel>Active engagements</HoverPanelLabel>
                {ACTIVE_ENGAGEMENTS.slice(0, 4).map((eng, i) => (
                  <div
                    key={i}
                    onClick={() => router.push("/portfolio")}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--slate-tint)"; (e.currentTarget as HTMLDivElement).style.borderRadius = "6px" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "6px 4px",
                      margin: "0 -4px",
                      borderBottom: i < 3 ? "1px solid var(--border-default)" : "none",
                      cursor: "pointer",
                      transition: "background-color 100ms",
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {eng.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px" }}>
                        {eng.funder}
                      </p>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontSize: 10,
                        fontWeight: 600,
                        ...engagementStatusStyle(eng.status),
                      }}
                    >
                      {eng.status}
                    </span>
                  </div>
                ))}
              </>
            }
          >
            <StatCard
              label="Active engagements"
              value="6"
              sub="1 added this month"
              subColor="var(--evergreen)"
            />
          </StatCardWithHover>

          {/* Proposals in progress */}
          <StatCardWithHover
            popoverAlign="left"
            hoverContent={
              <>
                <HoverPanelLabel>Proposals in progress</HoverPanelLabel>
                {IN_PROGRESS_PROPOSALS.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => router.push("/editor")}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--slate-tint)"; (e.currentTarget as HTMLDivElement).style.borderRadius = "6px" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "6px 4px",
                      margin: "0 -4px",
                      borderBottom: i < IN_PROGRESS_PROPOSALS.length - 1 ? "1px solid var(--border-default)" : "none",
                      cursor: "pointer",
                      transition: "background-color 100ms",
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px" }}>
                        {p.engagement}
                      </p>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontSize: 10,
                        fontWeight: 600,
                        ...(p.urgent
                          ? { backgroundColor: "#FDE8E8", color: "#8B2020" }
                          : { backgroundColor: "#FFF3E0", color: "#7A4A10" }),
                      }}
                    >
                      {p.deadline}
                    </span>
                  </div>
                ))}
              </>
            }
          >
            <StatCard
              label="Proposals in progress"
              value="4"
              sub="2 due within 14 days"
              subColor="#C47A10"
            />
          </StatCardWithHover>

          {/* Submitted awaiting decision */}
          <StatCardWithHover
            popoverAlign="right"
            hoverContent={
              <>
                <HoverPanelLabel>Submitted, awaiting decision</HoverPanelLabel>
                {SUBMITTED_PROPOSALS.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => router.push("/opportunity")}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--slate-tint)"; (e.currentTarget as HTMLDivElement).style.borderRadius = "6px" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "6px 4px",
                      margin: "0 -4px",
                      borderBottom: i < SUBMITTED_PROPOSALS.length - 1 ? "1px solid var(--border-default)" : "none",
                      cursor: "pointer",
                      transition: "background-color 100ms",
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px" }}>
                        {p.funder}
                      </p>
                    </div>
                    <span style={{ flexShrink: 0, fontSize: 11, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
                      Submitted {p.submittedDate}
                    </span>
                  </div>
                ))}
              </>
            }
          >
            <StatCard
              label="Submitted, awaiting decision"
              value="3"
              sub="Avg. 47 days waiting"
              subColor="var(--ink-tertiary)"
            />
          </StatCardWithHover>

          {/* Awarded */}
          <StatCardWithHover
            popoverAlign="right"
            hoverContent={
              <>
                <HoverPanelLabel>Awarded (rolling 12mo.)</HoverPanelLabel>
                {AWARDED_ENGAGEMENTS.map((a, i) => (
                  <div
                    key={i}
                    onClick={() => router.push("/portfolio")}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--slate-tint)"; (e.currentTarget as HTMLDivElement).style.borderRadius = "6px" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      padding: "6px 4px",
                      margin: "0 -4px",
                      borderBottom: i < AWARDED_ENGAGEMENTS.length - 1 ? "1px solid var(--border-default)" : "none",
                      cursor: "pointer",
                      transition: "background-color 100ms",
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.engagement}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px" }}>
                        {a.date}
                      </p>
                    </div>
                    <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: "var(--evergreen)" }}>
                      {a.amount}
                    </span>
                  </div>
                ))}
              </>
            }
          >
            <div
              style={{
                borderRadius: "var(--radius-card)",
                backgroundColor: "var(--surface-white)",
                border: "1px solid var(--border-default)",
                padding: "16px 18px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <p style={labelStyle}>Awarded (rolling 12mo.)</p>
              <p style={{ margin: "6px 0 4px", fontSize: 28, fontWeight: 700, color: "var(--ink)", lineHeight: "34px", letterSpacing: "-0.03em" }}>
                $347k
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--evergreen)" }}>
                vs $290k prior period
              </p>
              <div style={{ position: "absolute", bottom: 14, right: 14 }}>
                <SparkLine />
              </div>
            </div>
          </StatCardWithHover>
        </div>

        {/* ── Main two-column area ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>

          {/* Tasks */}
          <div
            style={{
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--surface-white)",
              border: "1px solid var(--border-default)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderBottom: "1px solid var(--border-default)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>My tasks</span>
                {tasks.length > 0 && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: "var(--slate-tint)",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--slate-primary)",
                    }}
                  >
                    {tasks.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                style={{ background: "none", border: "none", fontSize: 12, color: "var(--slate-secondary)", cursor: "pointer", fontWeight: 500 }}
                onClick={() => router.push("/opportunity")}
              >
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
                  const isHovered = hoveredTask === task.id && !isCollapsing
                  return (
                    <div
                      key={task.id}
                      onClick={() => router.push("/opportunity")}
                      onMouseEnter={() => setHoveredTask(task.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 18px",
                        borderBottom: "1px solid var(--border-default)",
                        opacity: isCollapsing ? 0 : 1,
                        maxHeight: isCollapsing ? 0 : 80,
                        overflow: "hidden",
                        transition: isCollapsing
                          ? "opacity 0.35s ease, max-height 0.55s ease, padding 0.55s ease"
                          : "background-color 150ms",
                        paddingTop: isCollapsing ? 0 : 11,
                        paddingBottom: isCollapsing ? 0 : 11,
                        backgroundColor: isHovered ? "var(--canvas)" : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <TaskCheckbox done={task.done} onClick={() => handleCheck(task.id)} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: "0 0 2px 0",
                            fontSize: 13,
                            fontWeight: 500,
                            color: task.done ? "var(--ink-tertiary)" : "var(--ink)",
                            textDecoration: task.done ? "line-through" : "none",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            transition: "color 450ms ease-in-out",
                          }}
                        >
                          {task.name}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {task.engagement} · {task.opportunity}
                        </p>
                      </div>
                      <span
                        style={{
                          flexShrink: 0,
                          borderRadius: 6,
                          padding: "2px 8px",
                          fontSize: 11,
                          fontWeight: 500,
                          ...dueBadgeStyle(task.dueCategory),
                        }}
                      >
                        {task.dueLabel}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div
            style={{
              borderRadius: "var(--radius-card)",
              backgroundColor: "var(--surface-white)",
              border: "1px solid var(--border-default)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 18px",
                borderBottom: "1px solid var(--border-default)",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Upcoming deadlines</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: "var(--slate-tint)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--slate-primary)",
                }}
              >
                {DEADLINES.length}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {DEADLINES.map((dl, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredDeadline(i)}
                  onMouseLeave={() => setHoveredDeadline(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 18px",
                    borderBottom: i < DEADLINES.length - 1 ? "1px solid var(--border-default)" : "none",
                    cursor: "pointer",
                    backgroundColor: hoveredDeadline === i ? "var(--canvas)" : "transparent",
                    transition: "background-color 150ms",
                  }}
                  onClick={() => router.push("/opportunity")}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: dl.dotColor,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px 0", fontSize: 13, fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {dl.name}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px" }}>
                      {dl.funder} · {dl.stage}
                    </p>
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      borderRadius: 6,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 500,
                      ...daysBadgeStyle(dl.daysLeft),
                    }}
                  >
                    {dl.daysLeft} days
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div>
          <p style={sectionLabelStyle}>Quick actions</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
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

      </div>

      <NewProposalModal
        open={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        opportunityName="New Proposal"
      />
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub, subColor }: { label: string; value: string; sub: string; subColor: string }) {
  return (
    <div
      style={{
        borderRadius: "var(--radius-card)",
        backgroundColor: "var(--surface-white)",
        border: "1px solid var(--border-default)",
        padding: "16px 18px",
      }}
    >
      <p style={labelStyle}>{label}</p>
      <p style={{ margin: "6px 0 4px", fontSize: 28, fontWeight: 700, color: "var(--ink)", lineHeight: "34px", letterSpacing: "-0.03em" }}>
        {value}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: subColor }}>
        {sub}
      </p>
    </div>
  )
}

function QuickAction({
  icon,
  iconBg,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  sub: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 10,
        padding: "16px",
        borderRadius: "var(--radius-card)",
        backgroundColor: "var(--surface-white)",
        border: "1px solid var(--border-default)",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 150ms, box-shadow 150ms",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = "rgba(74,96,128,0.3)"
        el.style.boxShadow = "0 2px 8px rgba(42,42,42,0.07)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.borderColor = "var(--border-default)"
        el.style.boxShadow = "none"
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          backgroundColor: iconBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ margin: "0 0 3px 0", fontSize: 13, fontWeight: 600, color: "var(--ink)", lineHeight: "16px" }}>
          {label}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "16px" }}>
          {sub}
        </p>
      </div>
    </button>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  margin: 0,
  lineHeight: "14px",
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  margin: "0 0 10px 0",
}
