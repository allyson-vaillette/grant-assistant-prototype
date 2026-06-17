"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import {
  House, LayoutList, Telescope, Settings, Library,
  Sparkles, ChevronLeft, ChevronRight, ChevronDown, Bell, X, Check,
} from "lucide-react"
import { useScope } from "@/lib/scope-context"
import { ORG } from "@/lib/mock-data"

const SIDEBAR_WIDTH = 216
const SIDEBAR_COLLAPSED_WIDTH = 64

const MAIN_NAV = [
  { label: "Home",    href: "/home",    icon: House      },
  { label: "Tracker", href: "/tracker", icon: LayoutList },
  { label: "Discover", href: "/discover", icon: Telescope },
] as const

const WORKSPACE_NAV = [
  { label: "Library",  href: "/library",  icon: Library  },
  { label: "Settings", href: "/settings", icon: Settings },
] as const

// ── Notification data ──────────────────────────────────────────────────────

type NotifType = "task_assigned" | "task_due_soon" | "task_overdue" | "task_completed" | "task_reassigned"

interface Notification {
  id: string
  type: NotifType
  actorInitials?: string
  actorName?: string
  description: string
  opportunityName: string
  timestamp: string
  isToday: boolean
  read: boolean
  href: string
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1", type: "task_assigned",
    actorInitials: "MR", actorName: "Marcus R.",
    description: "Marcus R. assigned you a task on Petco Love Grant",
    opportunityName: "Petco Love Lost & Found Grant 2026",
    timestamp: "2h ago", isToday: true, read: false,
    href: "/pursuit/opp-1",
  },
  {
    id: "n2", type: "task_due_soon",
    description: "Complete narrative section is due in 48 hours",
    opportunityName: "Petco Love Lost & Found Grant 2026",
    timestamp: "4h ago", isToday: true, read: false,
    href: "/pursuit/opp-1",
  },
  {
    id: "n3", type: "task_overdue",
    description: "Get budget sign-off is overdue",
    opportunityName: "Petco Love Lost & Found Grant 2026",
    timestamp: "6h ago", isToday: true, read: false,
    href: "/pursuit/opp-1",
  },
  {
    id: "n4", type: "task_completed",
    actorInitials: "JK", actorName: "Jamie K.",
    description: "Jamie K. completed Upload 2025 annual report",
    opportunityName: "Petco Love Lost & Found Grant 2026",
    timestamp: "8h ago", isToday: true, read: false,
    href: "/pursuit/opp-1",
  },
  {
    id: "n5", type: "task_reassigned",
    actorInitials: "TS", actorName: "Taylor S.",
    description: "Follow up with program officer was reassigned to you",
    opportunityName: "ASPCA Saving Lives Grant",
    timestamp: "2d ago", isToday: false, read: true,
    href: "/pursuit/opp-2",
  },
]

function notifIcon(type: NotifType): string {
  if (type === "task_assigned")   return "assignment_ind"
  if (type === "task_due_soon")   return "schedule"
  if (type === "task_overdue")    return "warning"
  if (type === "task_completed")  return "check_circle"
  if (type === "task_reassigned") return "swap_horiz"
  return "notifications"
}

function notifIconColor(type: NotifType): string {
  if (type === "task_overdue")   return "#B91C1C"
  if (type === "task_due_soon")  return "#C47A10"
  if (type === "task_completed") return "#3C5E4C"
  return "var(--slate-secondary)"
}

// ── Notification Tray ──────────────────────────────────────────────────────

function NotificationTray({
  notifications, sidebarWidth, onClose, onMarkAllRead, onMarkRead,
}: {
  notifications: Notification[]
  sidebarWidth: number
  onClose: () => void
  onMarkAllRead: () => void
  onMarkRead: (id: string) => void
}) {
  const todayNotifs   = notifications.filter(n => n.isToday)
  const earlierNotifs = notifications.filter(n => !n.isToday)

  function NotifRow({ n }: { n: Notification }) {
    const [hovered, setHovered] = useState(false)
    return (
      <Link
        href={n.href}
        onClick={() => { onMarkRead(n.id); onClose() }}
        style={{ textDecoration: "none" }}
      >
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "10px 16px",
            backgroundColor: hovered ? "var(--canvas)" : !n.read ? "rgba(74,96,128,0.04)" : "transparent",
            borderLeft: !n.read ? "2px solid var(--slate-secondary)" : "2px solid transparent",
            transition: "background-color 150ms",
            cursor: "pointer",
          }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            backgroundColor: n.actorInitials ? "var(--slate-tint)" : "var(--canvas)",
            border: "var(--border-subtle)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {n.actorInitials ? (
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--slate-primary)", lineHeight: 1 }}>{n.actorInitials}</span>
            ) : (
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: notifIconColor(n.type), lineHeight: 1, userSelect: "none" }}>
                {notifIcon(n.type)}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 2px", fontSize: 12, color: "var(--ink)", lineHeight: "16px", fontWeight: n.read ? 400 : 500 }}>
              {n.description}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)", lineHeight: "14px" }}>
              {n.timestamp}
            </p>
          </div>
          {!n.read && (
            <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--slate-primary)", flexShrink: 0, marginTop: 5 }} />
          )}
        </div>
      </Link>
    )
  }

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 44 }} onClick={onClose} />
      <div style={{
        position: "fixed", top: 0, left: sidebarWidth,
        width: 320, height: "100vh",
        backgroundColor: "#FFFFFF",
        borderRight: "var(--border-subtle)",
        boxShadow: "var(--elevation-raised)",
        zIndex: 45, display: "flex", flexDirection: "column",
        animation: "tray-slide-in 200ms ease",
      }}>
        <style>{`@keyframes tray-slide-in { from { transform: translateX(-12px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 12px", borderBottom: "var(--border-subtle)", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Notifications</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button type="button" onClick={onMarkAllRead}
              style={{ background: "none", border: "none", fontSize: 12, color: "var(--slate-secondary)", cursor: "pointer", padding: 0, fontWeight: 500 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "underline" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = "none" }}
            >
              Mark all read
            </button>
            <button type="button" onClick={onClose}
              style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "var(--border-subtle)", backgroundColor: "transparent", cursor: "pointer" }}
            >
              <X size={13} color="var(--ink-secondary)" />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {todayNotifs.length > 0 && (
            <div>
              <p style={{ margin: 0, padding: "10px 16px 4px", fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)" }}>Today</p>
              {todayNotifs.map(n => <NotifRow key={n.id} n={n} />)}
            </div>
          )}
          {earlierNotifs.length > 0 && (
            <div>
              <p style={{ margin: 0, padding: "10px 16px 4px", fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)" }}>Earlier</p>
              {earlierNotifs.map(n => <NotifRow key={n.id} n={n} />)}
            </div>
          )}
          {notifications.length === 0 && (
            <div style={{ padding: "48px 16px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>No notifications yet.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Scope Switcher ─────────────────────────────────────────────────────────

function ScopeSwitcher({ collapsed, sidebarWidth }: { collapsed: boolean; sidebarWidth: number }) {
  const { selectedProjectId, setSelectedProjectId, hasPrograms, scopeLabel, realProjects } = useScope()
  const [open, setOpen] = useState(false)
  const [dropdownTop, setDropdownTop] = useState(0)
  const btnRef = useRef<HTMLButtonElement>(null)

  function handleToggle() {
    if (btnRef.current) {
      setDropdownTop(btnRef.current.getBoundingClientRect().bottom + 4)
    }
    setOpen(v => !v)
  }

  if (collapsed) return null

  if (!hasPrograms) {
    return (
      <div style={{ padding: "0 16px 10px" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: "14px", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {ORG.name}
        </span>
      </div>
    )
  }

  return (
    <>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "fixed",
            top: dropdownTop,
            left: 8,
            width: sidebarWidth - 16,
            backgroundColor: "#FFFFFF",
            borderRadius: 8,
            border: "1px solid var(--hair)",
            boxShadow: "var(--elevation-raised)",
            zIndex: 99,
            overflow: "hidden",
          }}>
            <button type="button" onClick={() => { setSelectedProjectId(null); setOpen(false) }}
              style={{
                width: "100%", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between",
                background: selectedProjectId === null ? "var(--slate-tint)" : "transparent",
                border: "none", cursor: "pointer", textAlign: "left", transition: "background 150ms",
              }}
              onMouseEnter={(e) => { if (selectedProjectId !== null) (e.currentTarget as HTMLButtonElement).style.background = "var(--canvas)" }}
              onMouseLeave={(e) => { if (selectedProjectId !== null) (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
            >
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", lineHeight: "16px" }}>{ORG.name}</span>
              {selectedProjectId === null && <Check size={12} style={{ color: "var(--slate-primary)", flexShrink: 0 }} />}
            </button>
            <div style={{ height: 1, backgroundColor: "var(--hair)", margin: "2px 0" }} />
            {realProjects.map(p => (
              <button key={p.id} type="button" onClick={() => { setSelectedProjectId(p.id); setOpen(false) }}
                style={{
                  width: "100%", padding: "8px 12px 8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: selectedProjectId === p.id ? "var(--slate-tint)" : "transparent",
                  border: "none", cursor: "pointer", textAlign: "left", transition: "background 150ms",
                }}
                onMouseEnter={(e) => { if (selectedProjectId !== p.id) (e.currentTarget as HTMLButtonElement).style.background = "var(--canvas)" }}
                onMouseLeave={(e) => { if (selectedProjectId !== p.id) (e.currentTarget as HTMLButtonElement).style.background = "transparent" }}
              >
                <span style={{ fontSize: 12, color: "var(--ink-secondary)", lineHeight: "16px" }}>{p.name}</span>
                {selectedProjectId === p.id && <Check size={12} style={{ color: "var(--slate-primary)", flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{ padding: "0 8px 8px" }}>
        <button ref={btnRef} type="button" onClick={handleToggle}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "5px 8px", borderRadius: 7,
            border: "1px solid rgba(255,255,255,0.14)",
            background: open ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
            cursor: "pointer", transition: "background 150ms",
          }}
          onMouseEnter={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)" }}
          onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)" }}
        >
          <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.75)", lineHeight: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, textAlign: "left" }}>
            {scopeLabel}
          </span>
          <ChevronDown size={11} style={{ color: "rgba(255,255,255,0.45)", flexShrink: 0, marginLeft: 4 }} />
        </button>
      </div>
    </>
  )
}

// ── Sidebar ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname()
  const [aiInput, setAiInput] = useState("")
  const [collapsed, setCollapsed] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS)

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed")
    if (stored !== null) setCollapsed(stored === "true")
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
    if (notifOpen) setNotifOpen(false)
  }

  function isActive(href: string) {
    if (href === "/home") return pathname === "/" || pathname === "/home"
    if (href === "/tracker") return pathname === "/tracker" || pathname.startsWith("/tracker/") || pathname.startsWith("/pursuit/")
    if (href === "/discover") return pathname === "/discover" || pathname.startsWith("/discover/") || pathname.startsWith("/funders/")
    return pathname === href || pathname.startsWith(href + "/")
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH

  return (
    <>
      {notifOpen && (
        <NotificationTray
          notifications={notifications}
          sidebarWidth={sidebarWidth}
          onClose={() => setNotifOpen(false)}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
        />
      )}

      <aside style={{
        width: sidebarWidth, flexShrink: 0,
        background: "var(--sidebar-gradient)",
        display: "flex", flexDirection: "column",
        height: "100vh", position: "sticky", top: 0,
        zIndex: 46, transition: "width 200ms ease-in-out", overflow: "hidden",
      }}>
        {/* Brand */}
        <div style={{ padding: "18px 16px 10px 16px", flexShrink: 0, display: "flex", justifyContent: collapsed ? "center" : "flex-start" }}>
          <Link href="/home" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }} title={collapsed ? "Grant Assistant" : undefined}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>G</span>
            </div>
            {!collapsed && (
              <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF", letterSpacing: "-0.01em", lineHeight: "18px", whiteSpace: "nowrap" }}>
                Grant Assistant
              </span>
            )}
          </Link>
        </div>

        {/* Scope switcher */}
        <ScopeSwitcher collapsed={collapsed} sidebarWidth={sidebarWidth} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: "4px 8px", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>
          {!collapsed ? (
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.40)", padding: "10px 8px 6px 8px", display: "block" }}>Main</span>
          ) : <div style={{ height: 10 }} />}

          {MAIN_NAV.map(({ label, href, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} title={collapsed ? label : undefined}
                style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: collapsed ? 0 : 10, padding: collapsed ? "8px 0" : "8px 10px", borderRadius: 8, textDecoration: "none", backgroundColor: active ? "rgba(255,255,255,0.10)" : "transparent", transition: "background-color 150ms" }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.07)" }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent" }}
              >
                <Icon size={16} style={{ flexShrink: 0, color: active ? "#F0EEEA" : "#A39FB0" }} />
                {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#F0EEEA" : "#A39FB0", lineHeight: "16px", whiteSpace: "nowrap" }}>{label}</span>}
              </Link>
            )
          })}

          {!collapsed ? (
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.40)", padding: "14px 8px 6px 8px", display: "block" }}>Workspace</span>
          ) : <div style={{ margin: "10px 4px", borderTop: "1px solid rgba(255,255,255,0.12)" }} />}

          {WORKSPACE_NAV.map(({ label, href, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href} title={collapsed ? label : undefined}
                style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: collapsed ? 0 : 10, padding: collapsed ? "8px 0" : "8px 10px", borderRadius: 8, textDecoration: "none", backgroundColor: active ? "rgba(255,255,255,0.10)" : "transparent", transition: "background-color 150ms" }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.07)" }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent" }}
              >
                <Icon size={16} style={{ flexShrink: 0, color: active ? "#F0EEEA" : "#A39FB0" }} />
                {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? "#F0EEEA" : "#A39FB0", lineHeight: "16px", whiteSpace: "nowrap" }}>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Notification Bell */}
        <div style={{ padding: collapsed ? "4px 8px 4px 8px" : "4px 10px 4px 10px", flexShrink: 0 }}>
          <button type="button" onClick={() => setNotifOpen(v => !v)} title={collapsed ? "Notifications" : undefined}
            style={{
              display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start",
              gap: collapsed ? 0 : 10, width: "100%", padding: collapsed ? "8px 0" : "8px 10px",
              borderRadius: 8, border: "none", backgroundColor: notifOpen ? "rgba(255,255,255,0.12)" : "transparent",
              cursor: "pointer", transition: "background-color 150ms", position: "relative",
            }}
            onMouseEnter={(e) => { if (!notifOpen) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.07)" }}
            onMouseLeave={(e) => { if (!notifOpen) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Bell size={16} style={{ color: notifOpen ? "#FFFFFF" : "rgba(255,255,255,0.55)" }} />
              {unreadCount > 0 && (
                <div style={{
                  position: "absolute", top: -5, right: -5,
                  minWidth: 14, height: 14, borderRadius: 7,
                  backgroundColor: "#DC2626", border: "1.5px solid var(--gradient-ai-sidebar)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: "#FFFFFF", lineHeight: 1, padding: "0 2px" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <span style={{ fontSize: 13, fontWeight: notifOpen ? 600 : 400, color: notifOpen ? "#FFFFFF" : "rgba(255,255,255,0.65)", lineHeight: "16px", whiteSpace: "nowrap" }}>
                Notifications
              </span>
            )}
          </button>
        </div>

        {/* AI Bar */}
        <div style={{ padding: collapsed ? "0 8px 12px 8px" : "0 10px 12px 10px", flexShrink: 0 }}>
          {collapsed ? (
            <button type="button" title="Ask Grant Assistant" onClick={toggleCollapsed}
              style={{ width: "100%", height: 40, borderRadius: 10, border: "0.5px solid rgba(173,157,174,0.3)", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Sparkles size={16} style={{ color: "#AD9DAE" }} />
            </button>
          ) : (
            <div style={{ borderRadius: 10, border: "0.5px solid rgba(173,157,174,0.3)", background: "rgba(255,255,255,0.06)", padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={14} style={{ color: "#AD9DAE", flexShrink: 0 }} />
                <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Ask anything..."
                  style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: "16px" }}
                />
              </div>
              {aiInput && (
                <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 7, backgroundColor: "rgba(255,255,255,0.08)", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: "17px" }}>
                  I can help you discover funders, draft proposals, and manage your grant pipeline. What would you like to know?
                </div>
              )}
            </div>
          )}
        </div>

        {/* User footer */}
        <div style={{ flexShrink: 0, padding: collapsed ? "10px 0 16px 0" : "10px 14px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gradient-avatar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} title={collapsed ? "Taylor S. — Whisker Haven" : undefined}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>TS</span>
          </div>
          {!collapsed && (
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#FFFFFF", lineHeight: "15px" }}>Taylor S.</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: "14px" }}>Whisker Haven</p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button type="button" onClick={toggleCollapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{ flexShrink: 0, width: "100%", height: 36, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-end", padding: collapsed ? 0 : "0 16px", background: "rgba(255,255,255,0.04)", border: "none", borderTop: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", color: "rgba(255,255,255,0.4)", transition: "background-color 150ms, color 150ms" }}
          onMouseEnter={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.backgroundColor = "rgba(255,255,255,0.08)"; b.style.color = "rgba(255,255,255,0.7)" }}
          onMouseLeave={(e) => { const b = e.currentTarget as HTMLButtonElement; b.style.backgroundColor = "rgba(255,255,255,0.04)"; b.style.color = "rgba(255,255,255,0.4)" }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  )
}
