"use client"

import React from "react"
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
  open: boolean
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
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: "0 0 7px",
      fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)",
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      {children}
    </p>
  )
}

function PanelSelect({ value, onChange, children }: {
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
        border: "1px solid var(--hair-2)", backgroundColor: "var(--surface)",
        fontSize: 12, color: value ? "var(--ink)" : "var(--ink-secondary)",
        outline: "none", cursor: "pointer",
      }}
    >
      {children}
    </select>
  )
}

export function FiltersPanel({
  open,
  typeFilter, focusAreaFilter, geographyFilter, awardRangeFilter, deadlineFilter,
  allFocusAreas, allGeographies,
  onTypeChange, onFocusAreaChange, onGeographyChange, onAwardRangeChange, onDeadlineChange,
}: FiltersPanelProps) {
  if (!open) return null

  return (
    <div style={{
      border: "1px solid var(--hair-2)",
      borderRadius: 12,
      backgroundColor: "var(--surface)",
      padding: "18px 20px",
      marginBottom: 12,
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: "0 16px",
    }}>
      <div>
        <FilterLabel>Funder type</FilterLabel>
        <PanelSelect value={typeFilter} onChange={(v) => onTypeChange(v as FunderType | "")}>
          <option value="">All types</option>
          {(Object.keys(FUNDER_TYPE_LABELS) as FunderType[]).map(t => (
            <option key={t} value={t}>{FUNDER_TYPE_LABELS[t]}</option>
          ))}
        </PanelSelect>
      </div>

      <div>
        <FilterLabel>Focus area</FilterLabel>
        <PanelSelect value={focusAreaFilter} onChange={onFocusAreaChange}>
          <option value="">All focus areas</option>
          {allFocusAreas.map(fa => (
            <option key={fa} value={fa}>{fa}</option>
          ))}
        </PanelSelect>
      </div>

      <div>
        <FilterLabel>Geography</FilterLabel>
        <PanelSelect value={geographyFilter} onChange={onGeographyChange}>
          <option value="">All geographies</option>
          {allGeographies.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </PanelSelect>
      </div>

      <div>
        <FilterLabel>Award size</FilterLabel>
        <PanelSelect value={awardRangeFilter} onChange={onAwardRangeChange}>
          <option value="">Any size</option>
          <option value="under-25k">Up to $25k</option>
          <option value="25k-50k">$25k to $50k</option>
          <option value="over-50k">Over $50k</option>
        </PanelSelect>
      </div>

      <div>
        <FilterLabel>Deadline</FilterLabel>
        <PanelSelect value={deadlineFilter} onChange={onDeadlineChange}>
          <option value="">Any deadline</option>
          <option value="30">Within 30 days</option>
          <option value="60">Within 60 days</option>
          <option value="90">Within 90 days</option>
        </PanelSelect>
      </div>
    </div>
  )
}
