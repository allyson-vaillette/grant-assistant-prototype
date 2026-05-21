"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Telescope, FileText, Sparkles } from "lucide-react"

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

// ── Spark line SVG ─────────────────────────────────────────────────────────

function SparkLine() {
  return (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" aria-hidden>
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
      onClick={onClick}
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

// ── Page ───────────────────────────────────────────────────────────────────

export default function HomeDashboard() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [collapsing, setCollapsing] = useState<Set<string>>(new Set())

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
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
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

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => router.push("/discover")}
              style={{
                padding: "8px 18px",
                borderRadius: 20,
                border: "1px solid var(--border-default)",
                backgroundColor: "transparent",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ink)",
                cursor: "pointer",
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-tint)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
            >
              Find opportunities
            </button>
            <button
              type="button"
              onClick={() => router.push("/portfolio")}
              style={{
                padding: "8px 18px",
                borderRadius: 20,
                backgroundColor: "var(--slate-primary)",
                border: "none",
                fontSize: 13,
                fontWeight: 500,
                color: "#FFFFFF",
                cursor: "pointer",
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
            >
              New engagement
            </button>
          </div>
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
          <StatCard
            label="Active engagements"
            value="6"
            sub="1 added this month"
            subColor="var(--evergreen)"
          />
          {/* Proposals in progress */}
          <StatCard
            label="Proposals in progress"
            value="4"
            sub="2 due within 14 days"
            subColor="#C47A10"
          />
          {/* Submitted */}
          <StatCard
            label="Submitted, awaiting decision"
            value="3"
            sub="Avg. 47 days waiting"
            subColor="var(--ink-tertiary)"
          />
          {/* Awarded */}
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
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "11px 18px",
                        borderBottom: "1px solid var(--border-default)",
                        opacity: isCollapsing ? 0 : 1,
                        maxHeight: isCollapsing ? 0 : 80,
                        overflow: "hidden",
                        transition: isCollapsing ? "opacity 0.35s ease, max-height 0.55s ease, padding 0.55s ease" : "none",
                        paddingTop: isCollapsing ? 0 : 11,
                        paddingBottom: isCollapsing ? 0 : 11,
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
                            transition: "color 150ms",
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 18px",
                    borderBottom: i < DEADLINES.length - 1 ? "1px solid var(--border-default)" : "none",
                    cursor: "pointer",
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
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
              onClick={() => router.push("/portfolio")}
            />
            <QuickAction
              icon={<Sparkles size={18} color="#FFFFFF" />}
              iconBg="var(--slate-primary)"
              label="Ask Grant Assistant"
              sub="Get help with any part of your work"
              onClick={() => {}}
            />
          </div>
        </div>

      </div>
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
