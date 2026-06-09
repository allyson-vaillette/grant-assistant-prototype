"use client"

import Link from "next/link"
import { Telescope, Sparkles, ChevronRight } from "lucide-react"
import {
  ORG, USER,
  PIPELINE_OPPORTUNITIES, OPPORTUNITIES, FUNDERS, TASKS,
} from "@/lib/mock-data"
import type { PipelineOpportunity, Opportunity, Funder } from "@/lib/types"

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function pipelineStats() {
  const total = PIPELINE_OPPORTUNITIES.length
  const inPlay = PIPELINE_OPPORTUNITIES.reduce((sum, p) => {
    const amt = getOpportunity(p.opportunityId)?.amount?.replace(/[^0-9]/g, "")
    return sum + (amt ? parseInt(amt) : 0)
  }, 0)
  const submitted = PIPELINE_OPPORTUNITIES
    .filter(p => ["submitted", "awarded", "denied"].includes(p.status))
    .reduce((sum, p) => {
      const amt = getOpportunity(p.opportunityId)?.amount?.replace(/[^0-9]/g, "")
      return sum + (amt ? parseInt(amt) : 0)
    }, 0)
  return { total, inPlay, submitted }
}

function formatDollars(n: number) {
  return "$" + n.toLocaleString()
}

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

// ── Shared sub-components ────────────────────────────────────────────────────

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

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      backgroundColor: "var(--surface-sunk)",
      border: "1px dashed var(--hair-2)",
      borderRadius: 10,
      padding: "18px 20px",
      textAlign: "center",
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
          borderRadius: 10,
          padding: "12px 16px",
          cursor: "pointer",
          transition: "box-shadow 150ms",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(28,24,64,0.07)"
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none"
        }}
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

function DeadlineRow({ pip, opp, funder }: {
  pip: PipelineOpportunity
  opp: Opportunity | undefined
  funder: Funder | undefined
}) {
  return (
    <Link href={`/pursuit/${pip.opportunityId}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--hair-2)",
          borderRadius: 10,
          padding: "12px 16px",
          cursor: "pointer",
          transition: "box-shadow 150ms",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(28,24,64,0.07)"
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none"
        }}
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const stats = pipelineStats()
  const tasks = getTodayTasks()
  const deadlines = getUpcomingDeadlines()
  const firstName = USER.name.split(" ")[0]

  return (
    <div style={{ flex: 1, overflowY: "auto", backgroundColor: "var(--canvas)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 32px 64px" }}>

        {/* Greeting */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            margin: "0 0 4px",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
            lineHeight: 1.25,
          }}>
            {greeting()}, {firstName}.
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>{ORG.name}</p>
        </div>

        {/* Stats glance */}
        <div style={{
          display: "flex", gap: 1,
          backgroundColor: "var(--surface)",
          border: "1px solid var(--hair-2)",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 40,
        }}>
          {[
            { label: "In pipeline", value: String(stats.total) },
            { label: "Total in play", value: formatDollars(stats.inPlay) },
            { label: "Submitted", value: formatDollars(stats.submitted) },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: "16px 20px",
              borderRight: i < 2 ? "1px solid var(--hair)" : "none",
            }}>
              <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>
                {s.label}
              </p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.02em", fontFamily: "var(--font-lora), Georgia, serif" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Today */}
        <section style={{ marginBottom: 40 }}>
          <SectionHeader label="Today" />
          {tasks.length === 0 ? (
            <EmptyState message="No tasks due today. You're all caught up." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tasks.map(t => <TaskRow key={t.id} task={t} />)}
            </div>
          )}
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

        {/* Quick actions */}
        <section>
          <SectionHeader label="Quick actions" />
          <div style={{ display: "flex", gap: 12 }}>
            <Link href="/discover" style={{ textDecoration: "none", flex: 1 }}>
              <div
                style={{
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--hair-2)",
                  borderRadius: 12,
                  padding: "20px",
                  cursor: "pointer",
                  transition: "box-shadow 150ms, border-color 150ms",
                  display: "flex", flexDirection: "column", gap: 10,
                }}
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
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  backgroundColor: "var(--slate-tint)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Telescope size={18} style={{ color: "var(--slate-primary)" }} />
                </div>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                    Discover opportunities
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)" }}>
                    Browse and match with new funders
                  </p>
                </div>
              </div>
            </Link>

            <div
              style={{
                flex: 1,
                backgroundColor: "var(--surface)",
                border: "1px solid var(--hair-2)",
                borderRadius: 12,
                padding: "20px",
                cursor: "pointer",
                transition: "box-shadow 150ms, border-color 150ms",
                display: "flex", flexDirection: "column", gap: 10,
              }}
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
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: "var(--gradient-ai-cta)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Sparkles size={18} style={{ color: "#FFFFFF" }} />
              </div>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                  Ask Grant Assistant
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)" }}>
                  Get help with proposals and strategy
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
