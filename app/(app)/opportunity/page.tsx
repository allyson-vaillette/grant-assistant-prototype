"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Copy, FileText } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type TabId = "proposals" | "tasks" | "budget" | "notes" | "files"
type TaskStatus = "To Do" | "In Progress" | "Done"

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
    author: "Allyson W.",
  },
]

const TASKS: Task[] = [
  {
    id: "t1",
    name: "Complete narrative section",
    due: "Due May 20",
    assignee: "AW",
    status: "To Do",
    done: false,
  },
  {
    id: "t2",
    name: "Get budget sign-off from finance",
    due: "Due May 22",
    assignee: "AW",
    status: "In Progress",
    done: false,
  },
  {
    id: "t3",
    name: "Collect letters of support",
    due: "Due Jun 1",
    assignee: "AW",
    status: "To Do",
    done: false,
  },
]

// ── Style helpers ──────────────────────────────────────────────────────────

const TASK_STATUS_STYLE: Record<TaskStatus, { bg: string; color: string }> = {
  "To Do":       { bg: "var(--slate-light)", color: "var(--slate)" },
  "In Progress": { bg: "var(--amber-light)", color: "var(--amber)" },
  "Done":        { bg: "var(--olive-pale)",  color: "var(--olive-dark)" },
}

const PROPOSAL_STATUS_STYLE: Record<Proposal["status"], { bg: string; color: string }> = {
  Draft:     { bg: "var(--slate-light)", color: "var(--slate)" },
  Final:     { bg: "var(--olive-pale)",  color: "var(--olive-dark)" },
  Submitted: { bg: "var(--blue-light)",  color: "var(--blue)" },
}

// ── Tab content ────────────────────────────────────────────────────────────

function ProposalsTab() {
  const [tasks, setTasks] = useState(TASKS)

  function toggleDone(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: !t.done, status: !t.done ? "Done" : "To Do" } : t
      )
    )
  }

  const openTasks = tasks.filter((t) => !t.done)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Proposals section */}
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
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border-color)",
                  boxShadow: "0px 1px 3px rgba(28,24,64,0.04)",
                }}
              >
                {/* Left: icon + name + meta */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--radius-icon-tile)",
                      backgroundColor: "var(--subtle)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={14} color="var(--ink-secondary)" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                        {p.name}
                      </span>
                      <span
                        style={{
                          borderRadius: "var(--radius-pill)",
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

                {/* Right: actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    style={{
                      padding: "7px 16px",
                      borderRadius: "var(--radius-button)",
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border-color)",
                      fontSize: 13,
                      fontWeight: 400,
                      color: "var(--ink)",
                      cursor: "pointer",
                    }}
                  >
                    Open in editor
                  </button>
                  <button
                    type="button"
                    style={{
                      width: 32,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "var(--radius-button)",
                      backgroundColor: "transparent",
                      border: "1px solid var(--border-color)",
                      cursor: "pointer",
                    }}
                  >
                    <Copy size={13} color="var(--ink-secondary)" />
                  </button>
                </div>
              </div>
            )
          })}

          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              padding: "4px 0",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--olive-mid)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            + New proposal
          </button>
        </div>
      </div>

      {/* Open tasks section */}
      <div>
        <p style={sectionLabelStyle}>Open Tasks ({openTasks.length})</p>
        <div
          style={{
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--surface)",
            border: "1px solid var(--border-color)",
            overflow: "hidden",
          }}
        >
          {tasks.map((task, i) => {
            const badge = TASK_STATUS_STYLE[task.status]
            return (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 20px",
                  borderBottom:
                    i < tasks.length - 1 ? "1px solid var(--border-color)" : "none",
                  opacity: task.done ? 0.45 : 1,
                  transition: "opacity 150ms",
                }}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleDone(task.id)}
                  style={{
                    width: 16,
                    height: 16,
                    flexShrink: 0,
                    borderRadius: 4,
                    border: task.done
                      ? "1.5px solid var(--olive-mid)"
                      : "1.5px solid var(--ink-tertiary)",
                    backgroundColor: task.done ? "var(--olive-mid)" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background-color 150ms, border-color 150ms",
                  }}
                >
                  {task.done && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5l2 2L7.5 2"
                        stroke="#fff"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                {/* Task info */}
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: 14,
                      color: "var(--ink)",
                      textDecoration: task.done ? "line-through" : "none",
                    }}
                  >
                    {task.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>{task.due}</span>
                    <span style={{ fontSize: 12, color: "var(--border-color)" }}>·</span>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        backgroundColor: "var(--olive-pale)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "var(--olive-dark)",
                          lineHeight: 1,
                        }}
                      >
                        {task.assignee}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <span
                  style={{
                    flexShrink: 0,
                    borderRadius: "var(--radius-pill)",
                    padding: "3px 10px",
                    backgroundColor: badge.bg,
                    fontSize: 11,
                    fontWeight: 500,
                    color: badge.color,
                  }}
                >
                  {task.status}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TasksTab() {
  const [tasks, setTasks] = useState(TASKS)

  function toggleDone(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, done: !t.done, status: !t.done ? "Done" : "To Do" } : t
      )
    )
  }

  return (
    <div>
      <p style={sectionLabelStyle}>All Tasks ({tasks.length})</p>
      <div
        style={{
          borderRadius: "var(--radius-card)",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border-color)",
          overflow: "hidden",
        }}
      >
        {tasks.map((task, i) => {
          const badge = TASK_STATUS_STYLE[task.status]
          return (
            <div
              key={task.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px",
                borderBottom:
                  i < tasks.length - 1 ? "1px solid var(--border-color)" : "none",
                opacity: task.done ? 0.45 : 1,
                transition: "opacity 150ms",
              }}
            >
              <button
                type="button"
                onClick={() => toggleDone(task.id)}
                style={{
                  width: 16,
                  height: 16,
                  flexShrink: 0,
                  borderRadius: 4,
                  border: task.done
                    ? "1.5px solid var(--olive-mid)"
                    : "1.5px solid var(--ink-tertiary)",
                  backgroundColor: task.done ? "var(--olive-mid)" : "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background-color 150ms, border-color 150ms",
                }}
              >
                {task.done && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path
                      d="M1.5 4.5l2 2L7.5 2"
                      stroke="#fff"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>

              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: 14,
                    color: "var(--ink)",
                    textDecoration: task.done ? "line-through" : "none",
                  }}
                >
                  {task.name}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>{task.due}</span>
                  <span style={{ fontSize: 12, color: "var(--border-color)" }}>·</span>
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      backgroundColor: "var(--olive-pale)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--olive-dark)", lineHeight: 1 }}>
                      {task.assignee}
                    </span>
                  </div>
                </div>
              </div>

              <span
                style={{
                  flexShrink: 0,
                  borderRadius: "var(--radius-pill)",
                  padding: "3px 10px",
                  backgroundColor: badge.bg,
                  fontSize: 11,
                  fontWeight: 500,
                  color: badge.color,
                }}
              >
                {task.status}
              </span>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        style={{
          background: "none",
          border: "none",
          padding: "12px 0 0 0",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--olive-mid)",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        + Add task
      </button>
    </div>
  )
}

function EmptyTab({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 0",
        gap: 8,
      }}
    >
      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-secondary)", margin: 0 }}>
        No {label.toLowerCase()} yet
      </p>
      <p style={{ fontSize: 13, color: "var(--ink-tertiary)", margin: 0 }}>
        {label} for this opportunity will appear here.
      </p>
    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink-tertiary)",
  margin: "0 0 12px 0",
}

// ── Page ───────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: "proposals", label: "Proposals" },
  { id: "tasks",     label: "Tasks"     },
  { id: "budget",    label: "Budget"    },
  { id: "notes",     label: "Notes"     },
  { id: "files",     label: "Files"     },
]

export default function OpportunityDetailPage() {
  const [activeTab, setActiveTab] = useState<TabId>("proposals")

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ backgroundColor: "var(--canvas)" }}
    >
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 32px",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--surface)",
        }}
      >
        <button
          type="button"
          style={{
            width: 22,
            height: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "var(--radius-icon-tile)",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--surface)",
            cursor: "pointer",
          }}
        >
          <ChevronLeft size={12} color="var(--ink-secondary)" />
        </button>
        <Link href="/home" style={{ fontSize: 13, color: "var(--ink-secondary)", textDecoration: "none" }}>
          Home
        </Link>
        <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>/</span>
        <span style={{ fontSize: 13, color: "var(--ink-secondary)" }}>Ford Foundation</span>
        <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>/</span>
        <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
          Equitable Futures Grant 2026
        </span>
      </div>

      {/* Page header */}
      <div
        style={{
          padding: "24px 32px 0 32px",
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        {/* Title row */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: "34px",
              background: "linear-gradient(135deg, var(--olive-dark), var(--olive-mid))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            Equitable Futures Grant 2026
          </h1>

          {/* Stage control */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-button)",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                padding: "7px 14px",
                fontSize: 13,
                color: "var(--ink)",
                borderRight: "1px solid var(--border-color)",
              }}
            >
              Stage: Active
            </span>
            <button
              type="button"
              style={{
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                borderRight: "1px solid var(--border-color)",
                cursor: "pointer",
              }}
            >
              <ChevronRight size={13} color="var(--ink-secondary)" />
            </button>
            <button
              type="button"
              style={{
                width: 30,
                height: 30,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={13} color="var(--ink-secondary)" style={{ transform: "rotate(180deg)" }} />
            </button>
          </div>
        </div>

        {/* Meta chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          {[
            { label: "Ford Foundation", style: { backgroundColor: "var(--subtle)", color: "var(--ink-secondary)" } },
            { label: "Active",          style: { backgroundColor: "var(--olive-pale)", color: "var(--olive-dark)" } },
            { label: "Due Jun 15, 2026",style: { backgroundColor: "var(--subtle)", color: "var(--ink-secondary)" } },
            { label: "$75,000",          style: { backgroundColor: "var(--subtle)", color: "var(--ink-secondary)" } },
          ].map(({ label, style }) => (
            <span
              key={label}
              style={{
                borderRadius: "var(--radius-pill)",
                padding: "4px 12px",
                fontSize: 13,
                fontWeight: 400,
                border: "1px solid var(--border-color)",
                ...style,
              }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <button
            type="button"
            style={{
              padding: "8px 18px",
              borderRadius: "var(--radius-button)",
              backgroundColor: "var(--amber)",
              border: "none",
              fontSize: 14,
              fontWeight: 500,
              color: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            New proposal
          </button>
          {["Add task", "Add note"].map((label) => (
            <button
              key={label}
              type="button"
              style={{
                padding: "7px 14px",
                borderRadius: "var(--radius-button)",
                backgroundColor: "transparent",
                border: "1px solid var(--border-color)",
                fontSize: 13,
                fontWeight: 400,
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
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
                  position: "relative",
                  padding: "8px 14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--olive-dark)" : "var(--ink-secondary)",
                  transition: "color 150ms",
                }}
              >
                {label}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 14,
                      right: 14,
                      height: 2,
                      borderRadius: 1,
                      backgroundColor: "var(--olive-dark)",
                    }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: "28px 32px", maxWidth: 960 }}>
        {activeTab === "proposals" && <ProposalsTab />}
        {activeTab === "tasks"     && <TasksTab />}
        {activeTab === "budget"    && <EmptyTab label="Budget" />}
        {activeTab === "notes"     && <EmptyTab label="Notes" />}
        {activeTab === "files"     && <EmptyTab label="Files" />}
      </div>
    </div>
  )
}
