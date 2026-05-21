"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Home,
  LayoutList,
  Telescope,
  Layers,
  Database,
  Settings,
  Sparkles,
  PlusCircle,
} from "lucide-react"
import { useState } from "react"
import { NewProposalModal } from "@/components/proposals/NewProposalModal"

const MAIN_NAV = [
  { label: "Home",      href: "/home",      icon: Home        },
  { label: "Engagements", href: "/portfolio", icon: LayoutList  },
  { label: "Discover",  href: "/discover",  icon: Telescope   },
] as const

const WORKSPACE_NAV = [
  { label: "Initiatives", href: "/initiatives", icon: Layers   },
  { label: "Evidence",    href: "/evidence",    icon: Database  },
  { label: "Settings",    href: "/settings",    icon: Settings  },
] as const

export function Sidebar() {
  const pathname = usePathname()
  const [aiInput, setAiInput] = useState("")

  function isActive(href: string) {
    if (href === "/home") return pathname === "/" || pathname === "/home" || pathname.startsWith("/home/")
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <aside
      style={{
        width: 216,
        flexShrink: 0,
        background: "var(--gradient-ai-sidebar)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Brand */}
      <div style={{ padding: "18px 16px 14px 16px", flexShrink: 0 }}>
        <Link
          href="/home"
          style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}
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
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
              lineHeight: "18px",
            }}
          >
            Grant Assistant
          </span>
        </Link>
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: "4px 8px", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>
        {/* MAIN group */}
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
        {MAIN_NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
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
              <Icon
                size={16}
                style={{ flexShrink: 0, color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)" }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#FFFFFF" : "rgba(255,255,255,0.65)",
                  lineHeight: "16px",
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}

        {/* New Proposal button */}
        <NewProposalButton />

        {/* WORKSPACE group */}
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
        {WORKSPACE_NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
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
              <Icon
                size={16}
                style={{ flexShrink: 0, color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)" }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#FFFFFF" : "rgba(255,255,255,0.65)",
                  lineHeight: "16px",
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* AI Bar */}
      <div style={{ padding: "0 10px 12px 10px", flexShrink: 0 }}>
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
      </div>

      {/* User footer */}
      <div
        style={{
          flexShrink: 0,
          padding: "10px 14px 16px 14px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
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
        >
          <span style={{ fontSize: 10, fontWeight: 700, color: "#FFFFFF", lineHeight: 1 }}>TS</span>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#FFFFFF", lineHeight: "15px" }}>Taylor S.</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: "14px" }}>Whisker Haven</p>
        </div>
      </div>
    </aside>
  )
}

// ── New Proposal button with modal ─────────────────────────────────────────

function NewProposalButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "8px 10px",
          margin: "8px 0 2px",
          borderRadius: 8,
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer",
          textAlign: "left",
          transition: "background-color 150ms",
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--plum-tint)"
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
        }}
      >
        <PlusCircle size={16} style={{ flexShrink: 0, color: "var(--plum-soft)" }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--plum-soft)", lineHeight: "16px" }}>
          New proposal
        </span>
      </button>
      <NewProposalModal
        open={open}
        onClose={() => setOpen(false)}
        opportunityName="New Proposal"
      />
    </>
  )
}
