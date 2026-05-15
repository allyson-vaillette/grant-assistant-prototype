"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { label: "Discover",    href: "/discover"    },
  { label: "Home",        href: "/home"         },
  { label: "Initiatives", href: "/initiatives"  },
  { label: "Evidence",    href: "/evidence"     },
  { label: "Reports",     href: "/reports"      },
] as const

export function TopNav() {
  const pathname = usePathname()

  return (
    <header
      className="h-11 shrink-0 flex items-center px-6 gap-4"
      style={{
        backgroundColor: "var(--surface)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      {/* Brand mark */}
      <Link href="/home" className="flex items-center gap-2 mr-2">
        <div
          className="w-7 h-7 flex items-center justify-center"
          style={{
            backgroundColor: "var(--olive-dark)",
            borderRadius: "var(--radius-icon-tile)",
          }}
        >
          {/* Square icon tile — replace with SVG logo mark when available */}
          <span className="text-white text-[11px] font-semibold leading-none select-none">G</span>
        </div>
        <span
          className="text-body font-medium"
          style={{ color: "var(--ink)" }}
        >
          Grant Assistant
        </span>
      </Link>

      {/* Primary navigation */}
      <nav className="flex-1 flex items-center justify-center gap-0.5">
        {NAV_ITEMS.map(({ label, href }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1 text-body transition-colors duration-200",
                "rounded-pill",
                isActive
                  ? "font-medium"
                  : "hover:bg-subtle"
              )}
              style={
                isActive
                  ? { backgroundColor: "var(--olive-pale)", color: "var(--olive-dark)" }
                  : { color: "var(--ink-secondary)" }
              }
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User avatar */}
      <div
        className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center"
        style={{ backgroundColor: "var(--olive-dark)" }}
      >
        <span className="text-white text-[11px] font-medium leading-none select-none">AW</span>
      </div>
    </header>
  )
}
