"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import {
  Home,
  LayoutList,
  Telescope,
  Layers,
  Database,
  Settings,
  Sparkles,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { NewProposalModal } from "@/components/proposals/NewProposalModal"

const SIDEBAR_WIDTH = 216
const SIDEBAR_COLLAPSED_WIDTH = 64

const MAIN_NAV = [
  { label: "Home",        href: "/home",        icon: Home       },
  { label: "Engagements", href: "/portfolio",    icon: LayoutList },
  { label: "Discover",    href: "/discover",     icon: Telescope  },
] as const

const WORKSPACE_NAV = [
  { label: "Initiatives", href: "/initiatives",  icon: Layers    },
  { label: "Evidence",    href: "/evidence",     icon: Database  },
  { label: "Settings",    href: "/settings",     icon: Settings  },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const [aiInput, setAiInput] = useState("")
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed")
    if (stored !== null) setCollapsed(stored === "true")
  }, [])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
  }

  function isActive(href: string) {
    if (href === "/home") return pathname === "/" || pathname === "/home" || pathname.startsWith("/home/")
    return pathname === href || pathname.startsWith(href + "/")
  }

  const navPadding = collapsed ? "4px 8px" : "4px 8px"

  return (
    <aside
      style={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        background: "var(--gradient-ai-sidebar)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 40,
        transition: "width 200ms ease-in-out",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "18px 16px 14px 16px",
          flexShrink: 0,
          display: "flex",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <Link
          href="/home"
          style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}
          title={collapsed ? "Grant Assistant" : undefined}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>G</span>
          </div>
          {!collapsed && (
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
                lineHeight: "18px",
                whiteSpace: "nowrap",
              }}
            >
              Grant Assistant
            </span>
          )}
        </Link>
      </div>

      {/* Nav groups */}
      <nav
        style={{
          flex: 1,
          padding: navPadding,
          display: "flex",
          flexDirection: "column",
          gap: 0,
          overflowY: "auto",
        }}
      >
        {/* MAIN group label */}
        {!collapsed ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              padding: "10px 8px 6px 8px",
              display: "block",
            }}
          >
            Main
          </span>
        ) : (
          <div style={{ height: 10 }} />
        )}

        {MAIN_NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? 0 : 10,
                padding: collapsed ? "8px 0" : "8px 10px",
                borderRadius: 8,
                textDecoration: "none",
                backgroundColor: active ? "rgba(255,255,255,0.12)" : "transparent",
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.07)"
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"
              }}
            >
              <Icon size={16} style={{ flexShrink: 0, color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)" }} />
              {!collapsed && (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#FFFFFF" : "rgba(255,255,255,0.65)",
                    lineHeight: "16px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              )}
            </Link>
          )
        })}

        {/* WORKSPACE group label */}
        {!collapsed ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
              padding: "14px 8px 6px 8px",
              display: "block",
            }}
          >
            Workspace
          </span>
        ) : (
          <div
            style={{
              margin: "10px 4px",
              borderTop: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        )}

        {WORKSPACE_NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? 0 : 10,
                padding: collapsed ? "8px 0" : "8px 10px",
                borderRadius: 8,
                textDecoration: "none",
                backgroundColor: active ? "rgba(255,255,255,0.12)" : "transparent",
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.07)"
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"
              }}
            >
              <Icon size={16} style={{ flexShrink: 0, color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)" }} />
              {!collapsed && (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#FFFFFF" : "rgba(255,255,255,0.65)",
                    lineHeight: "16px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* New Proposal affordance — sits directly above the Ask Anything input */}
      <NewProposalButton collapsed={collapsed} />

      {/* AI Bar */}
      <div
        style={{
          padding: collapsed ? "0 8px 12px 8px" : "0 10px 12px 10px",
          flexShrink: 0,
        }}
      >
        {collapsed ? (
          <button
            type="button"
            title="Ask Grant Assistant"
            onClick={toggleCollapsed}
            style={{
              width: "100%",
              height: 40,
              borderRadius: 10,
              border: "0.5px solid rgba(173,157,174,0.3)",
              background: "rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Sparkles size={16} style={{ color: "#AD9DAE" }} />
          </button>
        ) : (
          <div
            style={{
              borderRadius: 10,
              border: "0.5px solid rgba(173,157,174,0.3)",
              background: "rgba(255,255,255,0.06)",
              padding: "10px 12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={14} style={{ color: "#AD9DAE", flexShrink: 0 }} />
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask anything..."
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: "16px",
                }}
              />
            </div>
            {aiInput && (
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  borderRadius: 7,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: "17px",
                }}
              >
                I can help you with grant writing, discovering opportunities, and managing your portfolio. What would you like to know?
              </div>
            )}
          </div>
        )}
      </div>

      {/* User footer */}
      <div
        style={{
          flexShrink: 0,
          padding: collapsed ? "10px 0 16px 0" : "10px 14px 16px 14px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-start",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--gradient-avatar)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          title={collapsed ? "Taylor S. — Whisker Haven" : undefined}
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>TS</span>
        </div>
        {!collapsed && (
          <div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#FFFFFF", lineHeight: "15px" }}>Taylor S.</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: "14px" }}>Whisker Haven</p>
          </div>
        )}
      </div>

      {/* Collapse / expand toggle */}
      <button
        type="button"
        onClick={toggleCollapsed}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          flexShrink: 0,
          width: "100%",
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-end",
          padding: collapsed ? 0 : "0 16px",
          background: "rgba(255,255,255,0.04)",
          border: "none",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer",
          color: "rgba(255,255,255,0.4)",
          transition: "background-color 150ms, color 150ms",
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.backgroundColor = "rgba(255,255,255,0.08)"
          btn.style.color = "rgba(255,255,255,0.7)"
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget as HTMLButtonElement
          btn.style.backgroundColor = "rgba(255,255,255,0.04)"
          btn.style.color = "rgba(255,255,255,0.4)"
        }}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </aside>
  )
}

// ── New Proposal affordance ────────────────────────────────────────────────

function NewProposalButton({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        style={{
          padding: collapsed ? "0 8px 8px 8px" : "0 10px 8px 10px",
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={collapsed ? "New Proposal" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: collapsed ? 0 : 10,
            width: "100%",
            padding: collapsed ? "8px 0" : "8px 10px",
            borderRadius: 8,
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            transition: "background-color 150ms",
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(173,157,174,0.15)"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
          }}
        >
          <PlusCircle size={16} style={{ flexShrink: 0, color: "var(--plum-soft)" }} />
          {!collapsed && (
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--plum-soft)",
                lineHeight: "16px",
                whiteSpace: "nowrap",
              }}
            >
              New proposal
            </span>
          )}
        </button>
      </div>
      <NewProposalModal
        open={open}
        onClose={() => setOpen(false)}
        opportunityName="New Proposal"
      />
    </>
  )
}
