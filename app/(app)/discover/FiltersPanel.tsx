"use client"

import React, { useState, useEffect, useRef } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import type { FunderType } from "@/lib/types"

export const FUNDER_TYPE_LABELS: Record<FunderType, string> = {
  private_foundation:   "Private foundation",
  community_foundation: "Community foundation",
  government:           "Government",
  corporate_foundation: "Corporate foundation",
  public_charity:       "Public charity",
}

export const AWARD_RANGE_LABELS: Record<string, string> = {
  "under-25k": "Up to $25k",
  "25k-50k":   "$25k to $50k",
  "over-50k":  "Over $50k",
}

export const DEADLINE_LABELS: Record<string, string> = {
  "30": "Due within 30 days",
  "60": "Due within 60 days",
  "90": "Due within 90 days",
}

interface FiltersPanelProps {
  typeFilter: FunderType | ""
  focusAreaFilter: string
  geographyFilter: string
  awardRangeFilter: string
  deadlineFilter: string
  allFocusAreas: string[]
  allGeographies: string[]
  onTypeChange: (v: FunderType | "") => void
  onFocusAreaChange: (v: string) => void
  onGeographyChange: (v: string) => void
  onAwardRangeChange: (v: string) => void
  onDeadlineChange: (v: string) => void
  onClearAll: () => void
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: "0 0 6px",
      fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)",
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      {children}
    </p>
  )
}

function PopoverSelect({ value, onChange, children }: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "7px 10px", borderRadius: "var(--radius-input)",
        border: "1px solid var(--hair-2)", backgroundColor: "var(--canvas)",
        fontSize: 12, color: value ? "var(--ink)" : "var(--ink-secondary)",
        outline: "none", cursor: "pointer",
      }}
    >
      {children}
    </select>
  )
}

export function FiltersPanel({
  typeFilter, focusAreaFilter, geographyFilter, awardRangeFilter, deadlineFilter,
  allFocusAreas, allGeographies,
  onTypeChange, onFocusAreaChange, onGeographyChange, onAwardRangeChange, onDeadlineChange,
  onClearAll,
}: FiltersPanelProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeCount = [typeFilter, focusAreaFilter, geographyFilter, awardRangeFilter, deadlineFilter]
    .filter(Boolean).length

  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 12px", borderRadius: "var(--radius-input)",
          border: "1px solid var(--hair-2)",
          backgroundColor: open ? "var(--canvas)" : "var(--surface)",
          fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)",
          cursor: "pointer", transition: "background-color 120ms",
        }}
        onMouseEnter={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)"
        }}
        onMouseLeave={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface)"
        }}
      >
        <SlidersHorizontal size={13} style={{ color: "var(--ink-tertiary)" }} />
        Filters
        {activeCount > 0 && (
          <span style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            minWidth: 18, height: 18, borderRadius: 9, padding: "0 4px",
            fontSize: 11, fontWeight: 700,
            backgroundColor: "var(--slate-primary)", color: "#fff",
          }}>
            {activeCount}
          </span>
        )}
      </button>

      {/* Popover */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0,
          zIndex: 50, width: "min(700px, calc(100vw - 80px))",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--hair-2)",
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(28,24,64,0.12)",
          padding: "16px 16px 12px",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0 16px" }}>
            <div>
              <FilterLabel>Funder type</FilterLabel>
              <PopoverSelect value={typeFilter} onChange={(v) => onTypeChange(v as FunderType | "")}>
                <option value="">All types</option>
                {(Object.keys(FUNDER_TYPE_LABELS) as FunderType[]).map(t => (
                  <option key={t} value={t}>{FUNDER_TYPE_LABELS[t]}</option>
                ))}
              </PopoverSelect>
            </div>

            <div>
              <FilterLabel>Focus area</FilterLabel>
              <PopoverSelect value={focusAreaFilter} onChange={onFocusAreaChange}>
                <option value="">All focus areas</option>
                {allFocusAreas.map(fa => (
                  <option key={fa} value={fa}>{fa}</option>
                ))}
              </PopoverSelect>
            </div>

            <div>
              <FilterLabel>Geography</FilterLabel>
              <PopoverSelect value={geographyFilter} onChange={onGeographyChange}>
                <option value="">All geographies</option>
                {allGeographies.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </PopoverSelect>
            </div>

            <div>
              <FilterLabel>Award size</FilterLabel>
              <PopoverSelect value={awardRangeFilter} onChange={onAwardRangeChange}>
                <option value="">Any size</option>
                <option value="under-25k">Up to $25k</option>
                <option value="25k-50k">$25k to $50k</option>
                <option value="over-50k">Over $50k</option>
              </PopoverSelect>
            </div>

            <div>
              <FilterLabel>Deadline</FilterLabel>
              <PopoverSelect value={deadlineFilter} onChange={onDeadlineChange}>
                <option value="">Any deadline</option>
                <option value="30">Within 30 days</option>
                <option value="60">Within 60 days</option>
                <option value="90">Within 90 days</option>
              </PopoverSelect>
            </div>
          </div>

          <div style={{
            borderTop: "1px solid var(--hair)",
            marginTop: 14, paddingTop: 10,
            display: "flex", justifyContent: "flex-end",
          }}>
            <button
              type="button"
              onClick={onClearAll}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: "3px 6px",
                fontSize: 12, color: "var(--ink-tertiary)", borderRadius: 4,
                transition: "color 120ms, background-color 120ms",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.color = "var(--ink-secondary)"
                el.style.backgroundColor = "var(--canvas)"
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.color = "var(--ink-tertiary)"
                el.style.backgroundColor = "transparent"
              }}
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
