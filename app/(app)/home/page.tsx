"use client"

import React, { useState, useRef } from "react"
import Link from "next/link"
import { ContentContainer } from "@/components/layout/content-container"
import {
  ChevronRight, Bell, Telescope, Plus, FilePlus,
  CheckSquare, Clock, CalendarDays, AlertTriangle,
} from "lucide-react"
import {
  USER, TEAMMATES,
  PIPELINE_OPPORTUNITIES, OPPORTUNITIES, FUNDERS, TASKS,
} from "@/lib/mock-data"
import { IncompleteProfileBanner } from "@/components/IncompleteProfileBanner"
import { useScope } from "@/lib/scope-context"
import { phaseFromStatus } from "@/lib/types"
import type { PipelineOpportunity, Opportunity, Funder, PipelinePhase } from "@/lib/types"

// ── Status strip config ────────────────────────────────────────────────────────

const PIPELINE_STRIP: { phase: PipelinePhase; label: string; activeColor: string; descriptor: string }[] = [
  { phase: "researching",  label: "Researching",  activeColor: "var(--ink-tertiary)", descriptor: "Tracking stage"     },
  { phase: "applications", label: "Applications", activeColor: "var(--plum-soft)",    descriptor: "Active stage"        },
  { phase: "awards",       label: "Awards",       activeColor: "var(--evergreen)",    descriptor: "Rolling 12 months"   },
]

const URGENT_DAYS = 21

// ── Types ─────────────────────────────────────────────────────────────────────

type FeedKind = "my-task" | "team-task" | "deadline"

type FeedItem = {
  kind: FeedKind
  id: string
  title: string
  meta: string
  dueDate: Date | null
  rawDueStr: string | undefined
  isOverdue: boolean
  isUrgent: boolean
  pursuitHref: string
  teammate?: { name: string; initials: string }
}

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

function buildFeed(scopedPipelineIds: Set<string>): FeedItem[] {
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const urgentCutoff = new Date(now.getTime() + URGENT_DAYS * 24 * 60 * 60 * 1000)
  const items: FeedItem[] = []

  // My open tasks
  TASKS
    .filter(t => !t.completed && t.assigneeId === USER.id)
    .forEach(t => {
      if (!scopedPipelineIds.has(t.pipelineOpportunityId)) return
      const pip = PIPELINE_OPPORTUNITIES.find(p => p.id === t.pipelineOpportunityId)
      const funder = pip ? getFunder(pip.funderId) : undefined
      const d = t.dueDate ? parseDate(t.dueDate) : null
      if (d) d.setHours(0, 0, 0, 0)
      items.push({
        kind: "my-task",
        id: `my-${t.id}`,
        title: t.title,
        meta: funder?.name ?? "",
        dueDate: d,
        rawDueStr: t.dueDate,
        isOverdue: d ? d < now : false,
        isUrgent: false,
        pursuitHref: pip ? `/pursuit/${pip.opportunityId}` : "#",
      })
    })

  // Team tasks pending
  TASKS
    .filter(t => !t.completed && !!t.assigneeId && t.assigneeId !== USER.id)
    .forEach(t => {
      if (!scopedPipelineIds.has(t.pipelineOpportunityId)) return
      const teammate = getTeammate(t.assigneeId!)
      if (!teammate) return
      const pip = PIPELINE_OPPORTUNITIES.find(p => p.id === t.pipelineOpportunityId)
      const funder = pip ? getFunder(pip.funderId) : undefined
      const d = t.dueDate ? parseDate(t.dueDate) : null
      if (d) d.setHours(0, 0, 0, 0)
      items.push({
        kind: "team-task",
        id: `team-${t.id}`,
        title: t.title,
        meta: funder?.name ?? "",
        dueDate: d,
        rawDueStr: t.dueDate,
        isOverdue: d ? d < now : false,
        isUrgent: false,
        pursuitHref: pip ? `/pursuit/${pip.opportunityId}` : "#",
        teammate: { name: teammate.name, initials: teammate.initials },
      })
    })

  // Application deadlines (active pursuits, upcoming only)
  PIPELINE_OPPORTUNITIES
    .filter(p =>
      scopedPipelineIds.has(p.id) &&
      !["declined", "abandoned", "awarded-active", "awarded-closed"].includes(p.status)
    )
    .forEach(pip => {
      const opp = getOpportunity(pip.opportunityId)
      const funder = getFunder(pip.funderId)
      if (!opp?.deadline) return
      const d = parseDate(opp.deadline)
      if (!d) return
      d.setHours(0, 0, 0, 0)
      if (d < now) return
      items.push({
        kind: "deadline",
        id: `deadline-${pip.id}`,
        title: funder?.name ?? "Unknown funder",
        meta: opp.name ?? "",
        dueDate: d,
        rawDueStr: opp.deadline,
        isOverdue: false,
        isUrgent: d <= urgentCutoff,
        pursuitHref: `/pursuit/${pip.opportunityId}`,
      })
    })

  return items.sort((a, b) => {
    const ta = a.dueDate ? a.dueDate.getTime() : Infinity
    const tb = b.dueDate ? b.dueDate.getTime() : Infinity
    return ta - tb
  })
}

// ── StatusCard with hover/focus/tap panel ─────────────────────────────────────

type StatusPursuit = { pip: PipelineOpportunity; opp: Opportunity | undefined; funder: Funder | undefined }

function StatusCard({
  phase: _phase,
  label,
  activeColor,
  descriptor,
  pursuits,
  dueSoonCount,
  isFirst,
  isLast,
}: {
  phase: PipelinePhase
  label: string
  activeColor: string
  descriptor: string
  pursuits: StatusPursuit[]
  dueSoonCount: number
  isFirst: boolean
  isLast: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const count = pursuits.length

  const faceBorderRadius = [
    isFirst ? "11px" : "0",
    isLast  ? "11px" : "0",
    isLast  ? "11px" : "0",
    isFirst ? "11px" : "0",
  ].join(" ")

  const accentBorderRadius = `${isFirst ? "11px" : "0"} ${isLast ? "11px" : "0"} 0 0`

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
          borderRight: !isLast ? "1px solid var(--hair)" : "none",
          borderRadius: faceBorderRadius,
          backgroundColor: open ? "var(--surface-sunk)" : "transparent",
          transition: "background-color 150ms",
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 3, backgroundColor: activeColor, borderRadius: accentBorderRadius }} />

        {/* Card content */}
        <div style={{ padding: "12px 20px 16px" }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "var(--ink-tertiary)" }}>
            {label}
          </p>
          <Link
            href="/tracker"
            style={{ textDecoration: "none", display: "block", outline: "none" }}
            aria-label={`${count} ${label} — view in Tracker`}
          >
            <p style={{
              margin: "0 0 6px", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1,
              color: count > 0 ? activeColor : "var(--hair)",
              fontFamily: "var(--font-lora), Georgia, serif",
            }}>
              {count}
            </p>
          </Link>

          {/* Descriptor + due-soon pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "16px" }}>
              {descriptor}
            </span>
            {dueSoonCount > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center",
                padding: "1px 6px", borderRadius: 20,
                backgroundColor: "var(--amber-light)", color: "var(--amber)",
                fontSize: 10, fontWeight: 600, lineHeight: "16px", whiteSpace: "nowrap",
              }}>
                {dueSoonCount} due soon
              </span>
            )}
          </div>
        </div>
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

// ── Quick action card ─────────────────────────────────────────────────────────

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

// ── Add task modal ─────────────────────────────────────────────────────────────

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

// ── Needs your attention feed ─────────────────────────────────────────────────

function TypeTag({ kind, teammate }: { kind: FeedKind; teammate?: FeedItem["teammate"] }) {
  if (kind === "my-task") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 7px", borderRadius: 4,
        backgroundColor: "var(--slate-tint)", color: "var(--slate-secondary)",
        fontSize: 11, fontWeight: 600, lineHeight: "16px", flexShrink: 0, whiteSpace: "nowrap",
      }}>
        <CheckSquare size={10} strokeWidth={2.5} />
        Task
      </span>
    )
  }
  if (kind === "deadline") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "2px 7px", borderRadius: 4,
        backgroundColor: "var(--terracotta-tint)", color: "var(--terracotta)",
        fontSize: 11, fontWeight: 600, lineHeight: "16px", flexShrink: 0, whiteSpace: "nowrap",
      }}>
        <CalendarDays size={10} strokeWidth={2.5} />
        Deadline
      </span>
    )
  }
  // team-task: show teammate name abbreviated
  const parts = teammate?.name.split(" ") ?? []
  const label = parts.length >= 2 ? `${parts[0]} ${parts[1][0]}.` : (teammate?.name ?? "")
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 7px", borderRadius: 4,
      backgroundColor: "var(--plum-tint)", color: "var(--plum-soft)",
      fontSize: 11, fontWeight: 600, lineHeight: "16px", flexShrink: 0, whiteSpace: "nowrap",
    }}>
      <Clock size={10} strokeWidth={2.5} />
      {label}
    </span>
  )
}

function AttentionRow({
  item,
  isFirst,
  onNudge,
}: {
  item: FeedItem
  isFirst: boolean
  onNudge: (name: string) => void
}) {
  const rowContent = (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "9px 16px",
        borderTop: !isFirst ? "1px solid var(--hair)" : undefined,
        transition: "background-color 120ms",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--canvas)" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
    >
      {/* Left: tag + text */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
        <TypeTag kind={item.kind} teammate={item.teammate} />
        <div style={{ minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 500, color: "var(--ink)", lineHeight: "18px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item.title}
          </p>
          {item.meta && (
            <p style={{
              margin: 0, fontSize: 12.5, color: "var(--ink-tertiary)", lineHeight: "17px",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {item.meta}
            </p>
          )}
        </div>
      </div>

      {/* Right: status + optional nudge */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {item.isOverdue ? (
          <span style={{
            padding: "2px 7px", borderRadius: 20,
            fontSize: 10, fontWeight: 600, letterSpacing: "0.03em",
            backgroundColor: "var(--error-light)", color: "var(--error)",
          }}>
            Overdue
          </span>
        ) : item.isUrgent ? (
          <>
            <AlertTriangle size={12} style={{ color: "var(--amber)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--amber)", fontWeight: 500, whiteSpace: "nowrap" }}>
              {item.rawDueStr}
            </span>
          </>
        ) : item.rawDueStr ? (
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
            {item.rawDueStr}
          </span>
        ) : null}

        {item.kind === "team-task" ? (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNudge(item.teammate!.name) }}
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
        ) : (
          <ChevronRight size={14} style={{ color: "var(--ink-tertiary)" }} />
        )}
      </div>
    </div>
  )

  return (
    <Link href={item.pursuitHref} style={{ textDecoration: "none", display: "block" }}>
      {rowContent}
    </Link>
  )
}

const FEED_LIMIT = 8

function NeedsAttentionFeed({
  items,
  onNudge,
}: {
  items: FeedItem[]
  onNudge: (name: string) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? items : items.slice(0, FEED_LIMIT)
  const overflow = items.length - FEED_LIMIT

  return (
    <section>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
          Needs your attention
        </span>
        {items.length > 0 && (
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            minWidth: 20, height: 20, padding: "0 6px",
            backgroundColor: "var(--slate-primary)", color: "#ffffff",
            borderRadius: 20, fontSize: 11, fontWeight: 600, lineHeight: 1,
          }}>
            {items.length}
          </span>
        )}
      </div>

      <div style={{
        backgroundColor: "var(--surface)",
        border: "1px solid var(--hair-2)",
        borderRadius: 12,
        overflow: "hidden",
      }}>
        {items.length === 0 ? (
          <div style={{ padding: "28px 16px", textAlign: "center" }}>
            <p style={{ margin: "0 0 14px", fontSize: 14, color: "var(--ink-secondary)", lineHeight: "20px" }}>
              You&rsquo;re all caught up.
            </p>
            <Link
              href="/discover"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)",
                fontSize: 13, fontWeight: 600, color: "var(--slate-primary)",
                textDecoration: "none", transition: "box-shadow 150ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "var(--lift-2)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none" }}
            >
              <Telescope size={14} />
              Find opportunities
            </Link>
          </div>
        ) : (
          <>
            {visible.map((item, i) => (
              <AttentionRow key={item.id} item={item} isFirst={i === 0} onNudge={onNudge} />
            ))}

            {overflow > 0 && !showAll && (
              <div style={{ borderTop: "1px solid var(--hair)", padding: "10px 16px" }}>
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  style={{
                    background: "none", border: "none", padding: 0,
                    fontSize: 13, fontWeight: 500, color: "var(--slate-secondary)",
                    cursor: "pointer",
                  }}
                >
                  Show {overflow} more
                </button>
              </div>
            )}

            {showAll && overflow > 0 && (
              <div style={{ borderTop: "1px solid var(--hair)", padding: "10px 16px" }}>
                <button
                  type="button"
                  onClick={() => setShowAll(false)}
                  style={{
                    background: "none", border: "none", padding: 0,
                    fontSize: 13, fontWeight: 500, color: "var(--slate-secondary)",
                    cursor: "pointer",
                  }}
                >
                  Show less
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
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

  const nowMs = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime() })()
  const urgentCutoffMs = nowMs + URGENT_DAYS * 24 * 60 * 60 * 1000

  function getDueSoonCount(pursuits: StatusPursuit[]): number {
    return pursuits.filter(({ opp }) => {
      if (!opp?.deadline) return false
      const d = parseDate(opp.deadline)
      if (!d) return false
      d.setHours(0, 0, 0, 0)
      const t = d.getTime()
      return t >= nowMs && t <= urgentCutoffMs
    }).length
  }

  const feed = buildFeed(scopedPipelineIds)

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
      <ContentContainer style={{ padding: "28px 40px 48px" }}>

        <IncompleteProfileBanner />

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
          {PIPELINE_STRIP.map((s, i) => {
            const pursuits = phasePursuits[s.phase] ?? []
            return (
              <StatusCard
                key={s.phase}
                phase={s.phase}
                label={s.label}
                activeColor={s.activeColor}
                descriptor={s.descriptor}
                pursuits={pursuits}
                dueSoonCount={getDueSoonCount(pursuits)}
                isFirst={i === 0}
                isLast={i === PIPELINE_STRIP.length - 1}
              />
            )
          })}
        </div>

        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
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

        {/* Needs your attention (tasks + deadlines) */}
        <NeedsAttentionFeed items={feed} onNudge={nudge} />

      </ContentContainer>

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
