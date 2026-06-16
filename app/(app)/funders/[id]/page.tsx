"use client"

import React, { useState, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft, ExternalLink, Bookmark, Phone, Globe,
  FileText, Download, ChevronRight, Search, Calendar,
  MapPin, Plus, FileDown,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend,
} from "recharts"
import {
  FUNDERS, OPPORTUNITIES,
  getFunderIntelligence, getFunderExtended,
  trackFunder, isTrackedFunder, untrackFunder,
} from "@/lib/mock-data"
import type { FunderType } from "@/lib/types"

// ── Color constants (mirrors FunderProfile) ────────────────────────────────

const CLR_PRIMARY  = "#4A6080"
const CLR_MUTED    = "#9FB5C8"
const CLR_PLUM     = "#7B5E7C"
const CLR_GRID     = "rgba(42, 42, 42, 0.06)"
const CLR_TICK     = "#738498"
const CLR_INK      = "#2A2A2A"
const CLR_INK_SEC  = "#4D6585"

const SLATE_RAMP = [
  "#EBF0F5", "#D4E1EE", "#B8CCE2", "#9CB8D6",
  "#7FA3C9", "#638EBC", "#4A6080", "#3A4F6A",
]

// ── Labels ─────────────────────────────────────────────────────────────────

const FUNDER_TYPE_LABELS: Record<FunderType, string> = {
  private_foundation:   "Private foundation",
  community_foundation: "Community foundation",
  government:           "Government",
  corporate_foundation: "Corporate foundation",
  public_charity:       "Public charity",
}

type FinancialMetric = "total" | "average" | "median" | "count" | "assets"

const FINANCIAL_METRIC_LABELS: Record<FinancialMetric, string> = {
  total:   "Total giving",
  average: "Average grant",
  median:  "Median grant",
  count:   "Number of grants",
  assets:  "Assets",
}

const REGIONS = ["West Coast", "National Average", "East Coast", "Midwest"]
const REGION_FACTORS: Record<string, number[]> = {
  "West Coast":       [1.22, 1.18, 1.25, 1.20, 1.28],
  "National Average": [0.88, 0.85, 0.82, 0.86, 0.84],
  "East Coast":       [1.08, 1.12, 1.15, 1.10, 1.14],
  "Midwest":          [0.72, 0.75, 0.70, 0.73, 0.71],
}

const TABS = [
  { key: "overview",      label: "Overview" },
  { key: "financials",    label: "Financials" },
  { key: "grant-amounts", label: "Grant amounts" },
  { key: "grantees",      label: "Grantees" },
  { key: "opportunities", label: "Opportunities" },
] as const

type TabKey = typeof TABS[number]["key"]

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtCurrency(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

function fmtFull(v: number): string {
  return "$" + v.toLocaleString()
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w.charAt(0)))
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("")
}

// ── Tooltip components ─────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, fmt }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string | number
  fmt?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  const f = fmt ?? fmtCurrency
  return (
    <div style={{
      backgroundColor: "#fff", border: "1px solid rgba(42,42,42,0.10)",
      borderRadius: 8, padding: "8px 12px",
      boxShadow: "0 1px 2px rgba(42,42,42,0.04), 0 4px 10px rgba(42,42,42,0.05)",
      minWidth: 130,
    }}>
      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: CLR_TICK }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "0 0 2px", fontSize: 12, color: CLR_INK }}>
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: p.color, marginRight: 6 }} />
          {payload.length > 1 ? `${p.name}: ` : ""}<strong>{f(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Financial stats card (shared by Overview + Financials) ─────────────────

function FinancialStatsCard({
  intel, extended, compact = false,
}: {
  intel: ReturnType<typeof getFunderIntelligence>
  extended: ReturnType<typeof getFunderExtended>
  compact?: boolean
}) {
  const [metric, setMetric] = useState<FinancialMetric>("total")
  const [compareRegion, setCompareRegion] = useState("")

  if (!intel) return null

  const fmtMetric = (v: number) => metric === "count" ? `${v}` : fmtCurrency(v)

  const metricChartData = intel.yearlyGiving.map((y, i) => {
    const grantCount = y.newGranteeCount + y.repeatGranteeCount
    let primary: number
    if (metric === "total") primary = y.totalAmount
    else if (metric === "count") primary = grantCount
    else if (metric === "average") primary = grantCount > 0 ? Math.round(y.totalAmount / grantCount) : 0
    else if (metric === "median") primary = intel.medianGrantAmount
    else primary = extended?.yearlyAssets?.[i] ?? y.totalAmount * 22
    return { year: `${y.year}`, primary }
  })

  const chartData = compareRegion
    ? metricChartData.map((d, i) => {
        const factors = REGION_FACTORS[compareRegion] ?? [1, 1, 1, 1, 1]
        const f = factors[i % factors.length] ?? 1
        return { ...d, comparison: Math.round(d.primary * f) }
      })
    : metricChartData

  const chartH = compact ? 140 : 160

  return (
    <div style={{ padding: "20px 22px", borderRadius: 12, backgroundColor: "#fff", border: "1px solid var(--hair)" }}>
      <p style={{ margin: "0 0 14px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Key financial stats
      </p>

      {/* Metric tabs */}
      <div style={{ display: "flex", gap: 2, flexWrap: "wrap", marginBottom: 12 }}>
        {(Object.keys(FINANCIAL_METRIC_LABELS) as FinancialMetric[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            style={{
              padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: metric === m ? 600 : 400,
              backgroundColor: metric === m ? "var(--slate-tint)" : "transparent",
              color: metric === m ? "var(--slate-primary)" : "var(--ink-tertiary)",
              transition: "background-color 120ms, color 120ms",
            }}
          >
            {FINANCIAL_METRIC_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Compare region control */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          border: "1px solid var(--hair-2)", borderRadius: 6, padding: "4px 8px",
        }}>
          <Plus size={11} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
          <select
            value={compareRegion}
            onChange={(e) => setCompareRegion(e.target.value)}
            style={{
              background: "none", border: "none", outline: "none",
              fontSize: 12, color: compareRegion ? "var(--ink)" : "var(--ink-secondary)", cursor: "pointer", padding: 0,
            }}
          >
            <option value="">Compare region</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartH}>
        <LineChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CLR_GRID} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: CLR_TICK }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: CLR_TICK }} axisLine={false} tickLine={false} width={44} tickFormatter={fmtMetric} />
          <Tooltip content={<ChartTooltip fmt={fmtMetric} />} cursor={{ stroke: "rgba(42,42,42,0.08)", strokeWidth: 1 }} />
          <Line type="monotone" dataKey="primary" stroke={CLR_PRIMARY} strokeWidth={2}
            dot={{ fill: CLR_PRIMARY, r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }}
            name="This funder" />
          {compareRegion && (
            <Line type="monotone" dataKey="comparison" stroke={CLR_PLUM} strokeWidth={2}
              strokeDasharray="4 3" dot={{ fill: CLR_PLUM, r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }} name={compareRegion} />
          )}
        </LineChart>
      </ResponsiveContainer>

      {compareRegion && (
        <div style={{ display: "flex", gap: 16, paddingTop: 8, paddingLeft: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: CLR_PRIMARY }} />
            <span style={{ fontSize: 11, color: CLR_INK_SEC }}>This funder</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: CLR_PLUM }} />
            <span style={{ fontSize: 11, color: CLR_INK_SEC }}>{compareRegion}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Openness card (shared by Grant Amounts) ────────────────────────────────

function OpennessCard({ intel }: { intel: ReturnType<typeof getFunderIntelligence> }) {
  if (!intel) return null
  const data = intel.yearlyGiving.map((y) => ({
    year: `${y.year}`, New: y.newGranteeCount, Returning: y.repeatGranteeCount,
  }))
  const last3 = intel.yearlyGiving.slice(-3)
  const totalNew3 = last3.reduce((s, y) => s + y.newGranteeCount, 0)
  const totalAll3 = last3.reduce((s, y) => s + y.newGranteeCount + y.repeatGranteeCount, 0)
  const newPct = totalAll3 ? Math.round((totalNew3 / totalAll3) * 100) : null

  return (
    <div style={{ padding: "20px 22px", borderRadius: 12, backgroundColor: "#fff", border: "1px solid var(--hair)" }}>
      <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
        Openness to new grantees
      </p>
      {newPct !== null && (
        <p style={{ margin: "0 0 14px", fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>
          {newPct}% of awards went to new grantees in the last 3 years.
        </p>
      )}
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} barSize={24} barCategoryGap="32%" margin={{ top: 0, right: 0, bottom: 0, left: -8 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CLR_GRID} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: CLR_TICK }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: CLR_TICK }} axisLine={false} tickLine={false} width={28} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(42,42,42,0.03)" }} />
          <Legend wrapperStyle={{ fontSize: 11, color: CLR_INK_SEC, paddingTop: 10 }} iconSize={8} iconType="circle" />
          <Bar dataKey="New" stackId="a" fill={CLR_PRIMARY} name="New" />
          <Bar dataKey="Returning" stackId="a" fill={CLR_MUTED} radius={[3, 3, 0, 0]} name="Returning" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Stat band tile ─────────────────────────────────────────────────────────

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      flex: 1, padding: "14px 18px", borderRadius: 10,
      backgroundColor: "#fff", border: "1px solid var(--hair)",
    }}>
      <p style={{ margin: "0 0 5px", fontSize: 11, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--slate-primary)", letterSpacing: "-0.02em" }}>
        {value}
      </p>
    </div>
  )
}

// ── Overview tab ───────────────────────────────────────────────────────────

function OverviewTab({
  funder, intel, extended,
}: {
  funder: NonNullable<ReturnType<typeof FUNDERS.find>>
  intel: ReturnType<typeof getFunderIntelligence>
  extended: ReturnType<typeof getFunderExtended>
}) {
  const latestYear = intel?.yearlyGiving[intel.yearlyGiving.length - 1]
  const grantCount = latestYear ? latestYear.newGranteeCount + latestYear.repeatGranteeCount : 0
  const avgGrant = latestYear && grantCount > 0 ? Math.round(latestYear.totalAmount / grantCount) : 0

  return (
    <div>
      {/* Stat band */}
      {extended?.totalAssetsEstimate && (
        <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
          <StatTile label="Total assets" value={fmtCurrency(extended.totalAssetsEstimate)} />
          <StatTile label="Total giving" value={latestYear ? fmtCurrency(latestYear.totalAmount) : "--"} />
          <StatTile label="Average grant" value={avgGrant ? fmtCurrency(avgGrant) : "--"} />
          <StatTile label="Median grant" value={intel ? fmtCurrency(intel.medianGrantAmount) : "--"} />
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>

        {/* Left aside */}
        <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Contact card */}
          <div style={{ padding: "16px 18px", borderRadius: 12, backgroundColor: "#fff", border: "1px solid var(--hair)" }}>
            <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Contact</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {funder.ein && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)", width: 40, flexShrink: 0, paddingTop: 2 }}>EIN</span>
                  <span style={{ fontSize: 13, color: "var(--ink)" }}>{funder.ein}</span>
                </div>
              )}
              {extended?.address && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)", width: 40, flexShrink: 0, paddingTop: 2 }}>Addr</span>
                  <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: "19px" }}>{extended.address}</span>
                </div>
              )}
              {extended?.phone && (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)", width: 40, flexShrink: 0 }}>Phone</span>
                  <span style={{ fontSize: 13, color: "var(--ink)" }}>{extended.phone}</span>
                </div>
              )}
              {funder.website && (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-tertiary)", width: 40, flexShrink: 0 }}>Web</span>
                  <a href={funder.website} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: "var(--slate-secondary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                    Visit site <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Key people card */}
          {extended?.keyPeople && extended.keyPeople.length > 0 && (
            <div style={{ padding: "16px 18px", borderRadius: 12, backgroundColor: "#fff", border: "1px solid var(--hair)" }}>
              <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Key people</p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {extended.keyPeople.slice(0, 4).map((person, i) => (
                  <div key={i} style={{
                    padding: "8px 0",
                    borderTop: i > 0 ? "1px solid var(--hair)" : undefined,
                    display: "flex", flexDirection: "column", gap: 2,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{person.name}</span>
                    <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>{person.title}</span>
                  </div>
                ))}
              </div>
              {extended.keyPeople.length > 4 && (
                <button type="button" style={{ marginTop: 8, background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, color: "var(--slate-secondary)" }}>
                  View all key people
                </button>
              )}
            </div>
          )}

          {/* 990 forms card */}
          {extended?.forms990 && extended.forms990.length > 0 && (
            <div style={{ padding: "16px 18px", borderRadius: 12, backgroundColor: "#fff", border: "1px solid var(--hair)" }}>
              <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>990 forms</p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {extended.forms990.map((form, i) => (
                  <a key={form.year} href={form.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 0", textDecoration: "none",
                      borderTop: i > 0 ? "1px solid var(--hair)" : undefined,
                    }}>
                    <FileText size={14} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, color: "var(--ink)" }}>{form.year} Form 990</span>
                    <Download size={13} style={{ color: "var(--ink-tertiary)" }} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right main column */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* About card */}
          {funder.description && (
            <div style={{ padding: "20px 22px", borderRadius: 12, backgroundColor: "#fff", border: "1px solid var(--hair)" }}>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>About</p>
              <p style={{ margin: 0, fontSize: 14, color: "var(--ink-secondary)", lineHeight: "21px" }}>{funder.description}</p>
            </div>
          )}

          {/* Financial stats teaser */}
          <FinancialStatsCard intel={intel} extended={extended} compact />
        </div>
      </div>
    </div>
  )
}

// ── Financials tab ─────────────────────────────────────────────────────────

function FinancialsTab({
  intel, extended,
}: {
  intel: ReturnType<typeof getFunderIntelligence>
  extended: ReturnType<typeof getFunderExtended>
}) {
  const maxAmount = useMemo(() => {
    if (!extended?.nteeBreakdown) return 1
    return Math.max(...extended.nteeBreakdown.map((n) => n.amount))
  }, [extended])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <FinancialStatsCard intel={intel} extended={extended} />

      {/* NTEE breakdown */}
      {extended?.nteeBreakdown && extended.nteeBreakdown.length > 0 && (
        <div style={{ padding: "20px 22px", borderRadius: 12, backgroundColor: "#fff", border: "1px solid var(--hair)" }}>
          <p style={{ margin: "0 0 16px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Giving by NTEE code
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {extended.nteeBreakdown.map((cat) => {
              const pct = (cat.amount / maxAmount) * 100
              return (
                <div key={cat.code} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 200, flexShrink: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>{cat.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>{cat.code}</p>
                  </div>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: "var(--slate-tint)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, backgroundColor: CLR_PRIMARY, transition: "width 300ms" }} />
                  </div>
                  <span style={{ width: 72, textAlign: "right", fontSize: 12, fontWeight: 600, color: "var(--ink)", flexShrink: 0 }}>
                    {fmtCurrency(cat.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Grant amounts tab ──────────────────────────────────────────────────────

function GrantAmountsTab({
  intel, extended,
}: {
  intel: ReturnType<typeof getFunderIntelligence>
  extended: ReturnType<typeof getFunderExtended>
}) {
  const stats = extended?.grantYearStats ?? []
  const yearKeys = stats.map((s) => s.yearKey)
  const [selectedYear, setSelectedYear] = useState<"snapshot" | number>(
    yearKeys.includes("snapshot") ? "snapshot" : (yearKeys[0] ?? "snapshot")
  )

  const activeStat = stats.find((s) => s.yearKey === selectedYear) ?? stats[0]

  const rangeWidth = activeStat ? activeStat.max - activeStat.min : 1

  function markerPct(val: number): number {
    if (!activeStat) return 0
    return ((val - activeStat.min) / (activeStat.max - activeStat.min)) * 100
  }

  const histMax = activeStat ? Math.max(...activeStat.buckets.map((b) => b.count)) : 1

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Grant amounts card */}
      <div style={{ padding: "20px 22px", borderRadius: 12, backgroundColor: "#fff", border: "1px solid var(--hair)" }}>
        <p style={{ margin: "0 0 14px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Grant amounts
        </p>

        {/* Year tabs */}
        {stats.length > 0 && (
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--hair)", marginBottom: 24, overflowX: "auto" }}>
            {stats.map((s) => (
              <button
                key={String(s.yearKey)}
                type="button"
                onClick={() => setSelectedYear(s.yearKey)}
                style={{
                  padding: "8px 16px", border: "none", background: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: selectedYear === s.yearKey ? 600 : 400,
                  color: selectedYear === s.yearKey ? "var(--slate-primary)" : "var(--ink-tertiary)",
                  borderBottom: selectedYear === s.yearKey ? "2px solid var(--slate-primary)" : "2px solid transparent",
                  marginBottom: -1, whiteSpace: "nowrap", flexShrink: 0,
                  transition: "color 120ms",
                }}
              >
                {s.yearLabel}
              </button>
            ))}
          </div>
        )}

        {activeStat && (
          <>
            {/* Grant range section */}
            <div style={{ marginBottom: 32 }}>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--ink-secondary)" }}>
                {activeStat.count} awards from {activeStat.yearKey === "snapshot" ? "2019 to 2023" : `Jan to Dec ${activeStat.yearLabel}`}.
              </p>

              <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                {/* Large median */}
                <div style={{ flexShrink: 0 }}>
                  <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Median</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "var(--slate-primary)", letterSpacing: "-0.03em" }}>
                    {fmtCurrency(activeStat.median)}
                  </p>
                </div>

                {/* Range track */}
                <div style={{ flex: 1, paddingTop: 8 }}>
                  <div style={{ position: "relative", height: 4, backgroundColor: "var(--slate-tint)", borderRadius: 2, marginBottom: 28 }}>
                    {(["min", "median", "average", "max"] as const).map((key) => {
                      const val = key === "min" ? activeStat.min : key === "max" ? activeStat.max : key === "median" ? activeStat.median : activeStat.average
                      const pct = markerPct(val)
                      return (
                        <div key={key} style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%, -50%)" }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: CLR_PRIMARY, border: "2px solid #fff", boxShadow: "0 0 0 1px rgba(74,96,128,0.3)" }} />
                          <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", textAlign: "center", whiteSpace: "nowrap" }}>
                            <p style={{ margin: "0 0 1px", fontSize: 9, fontWeight: 600, color: "var(--ink-tertiary)", textTransform: "uppercase" }}>{key}</p>
                            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>{fmtCurrency(val)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Histogram */}
            <div>
              <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>Grant sizes</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={activeStat.buckets} margin={{ top: 0, right: 0, bottom: 0, left: -8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CLR_GRID} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: CLR_TICK }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: CLR_TICK }} axisLine={false} tickLine={false} width={28} label={{ value: "Grants", angle: -90, position: "insideLeft", offset: 14, style: { fontSize: 10, fill: CLR_TICK } }} />
                  <Tooltip content={<ChartTooltip fmt={(v) => `${v}`} />} cursor={{ fill: "rgba(42,42,42,0.03)" }} />
                  <Bar dataKey="count" name="Grants">
                    {activeStat.buckets.map((_, idx) => (
                      <rect key={idx} fill={SLATE_RAMP[idx % SLATE_RAMP.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Openness card */}
      <OpennessCard intel={intel} />
    </div>
  )
}

// ── Grantees tab ───────────────────────────────────────────────────────────

const PAGE_SIZE = 10

function GranteesTab({
  extended, funderName,
}: {
  extended: ReturnType<typeof getFunderExtended>
  funderName: string
}) {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)

  const all = extended?.pastGrantees ?? []
  const filtered = useMemo(() => {
    if (!query.trim()) return all
    const q = query.toLowerCase()
    return all.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      g.purpose.toLowerCase().includes(q) ||
      g.location.toLowerCase().includes(q)
    )
  }, [all, query])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div style={{ padding: "20px 22px", borderRadius: 12, backgroundColor: "#fff", border: "1px solid var(--hair)" }}>
      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Past grantees
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, border: "1px solid var(--hair-2)", backgroundColor: "var(--canvas)", width: 220 }}>
          <Search size={12} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1) }}
            placeholder="Search grantees"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 12, color: "var(--ink)" }}
          />
        </div>
      </div>

      {/* Table header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 60px 140px 90px 1fr",
        gap: "0 12px",
        padding: "7px 0",
        borderBottom: "1px solid var(--hair-2)",
        marginBottom: 4,
      }}>
        {["Name", "Year", "Location", "Amount", "Purpose"].map((h) => (
          <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {slice.length === 0 ? (
        <p style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: "var(--ink-tertiary)" }}>No grantees found.</p>
      ) : (
        slice.map((g, i) => (
          <div key={g.id} style={{
            display: "grid",
            gridTemplateColumns: "1fr 60px 140px 90px 1fr",
            gap: "0 12px",
            padding: "10px 0",
            borderTop: i > 0 ? "1px solid var(--hair)" : undefined,
            alignItems: "start",
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{g.name}</span>
            <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>{g.year}</span>
            <span style={{ fontSize: 12, color: "var(--ink-secondary)" }}>{g.location}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{fmtCurrency(g.amount)}</span>
            <span style={{ fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>{g.purpose}</span>
          </div>
        ))
      )}

      {/* Pagination footer */}
      {filtered.length > PAGE_SIZE && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--hair)",
        }}>
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} grantees
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "5px 12px", borderRadius: 6, border: "1px solid var(--hair-2)",
                backgroundColor: "transparent", fontSize: 12, cursor: page === 1 ? "default" : "pointer",
                color: page === 1 ? "var(--ink-tertiary)" : "var(--ink-secondary)",
              }}
            >
              Prev
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "5px 12px", borderRadius: 6, border: "1px solid var(--hair-2)",
                backgroundColor: "transparent", fontSize: 12, cursor: page === totalPages ? "default" : "pointer",
                color: page === totalPages ? "var(--ink-tertiary)" : "var(--ink-secondary)",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Opportunities tab ──────────────────────────────────────────────────────

function OpportunitiesTab({ funderId, funderName }: { funderId: string; funderName: string }) {
  const router = useRouter()
  const opps = OPPORTUNITIES.filter((o) => o.funderId === funderId)

  return (
    <div style={{ padding: "20px 22px", borderRadius: 12, backgroundColor: "#fff", border: "1px solid var(--hair)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Opportunities from {funderName}
        </p>
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          minWidth: 20, height: 20, padding: "0 5px", borderRadius: 10,
          fontSize: 11, fontWeight: 700, backgroundColor: "var(--slate-tint)", color: "var(--slate-primary)",
        }}>
          {opps.length}
        </span>
      </div>

      {opps.length === 0 ? (
        <p style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: "var(--ink-tertiary)" }}>
          No open opportunities right now.
        </p>
      ) : (
        opps.map((opp, i) => (
          <button
            key={opp.id}
            type="button"
            onClick={() => router.push(`/opportunity/${opp.id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 14, width: "100%",
              padding: "14px 0", borderTop: i > 0 ? "1px solid var(--hair)" : undefined,
              background: "none", border: "none", cursor: "pointer", textAlign: "left",
              transition: "background-color 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 5px", fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: "20px" }}>{opp.name}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: opp.focusAreas?.length ? 6 : 0 }}>
                {opp.amount && (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{opp.amount}</span>
                )}
                {opp.deadline && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--ink-tertiary)" }}>
                    <Calendar size={12} />
                    {opp.deadline === "Rolling" ? "Rolling deadline" : `Due ${opp.deadline}`}
                  </span>
                )}
              </div>
              {opp.focusAreas && opp.focusAreas.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {opp.focusAreas.slice(0, 3).map((fa) => (
                    <span key={fa} style={{
                      fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)",
                      padding: "2px 8px", borderRadius: 20,
                      backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)",
                    }}>
                      {fa}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <ChevronRight size={16} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
          </button>
        ))
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

function FunderDetailPageInner({ id }: { id: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const funder = FUNDERS.find((f) => f.id === id)
  const intel  = funder ? getFunderIntelligence(id) : undefined
  const extended = funder ? getFunderExtended(id) : undefined

  const rawTab = searchParams.get("tab") as TabKey | null
  const activeTab: TabKey = rawTab && TABS.some((t) => t.key === rawTab) ? rawTab : "overview"

  const [tracked, setTracked] = useState(() => isTrackedFunder(id))
  const [bookmarked, setBookmarked] = useState(false)

  function switchTab(tab: TabKey) {
    const params = new URLSearchParams()
    params.set("tab", tab)
    router.push(`/funders/${id}?${params.toString()}`, { scroll: false } as any)
  }

  function handleTrack() {
    if (tracked) {
      untrackFunder(id)
      setTracked(false)
    } else {
      trackFunder(id)
      setTracked(true)
    }
  }

  if (!funder) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", backgroundColor: "var(--canvas)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, color: "var(--ink-tertiary)", marginBottom: 16 }}>Funder not found.</p>
          <button type="button" onClick={() => router.push("/discover")}
            style={{ fontSize: 13, color: "var(--slate-secondary)", background: "none", border: "none", cursor: "pointer" }}>
            Back to Discover
          </button>
        </div>
      </div>
    )
  }

  const initials = getInitials(funder.name)

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--canvas)" }}>

      {/* Breadcrumb top bar */}
      <div style={{
        flexShrink: 0, zIndex: 10,
        backgroundColor: "var(--canvas)",
        borderBottom: "1px solid var(--hair)",
        padding: "0 32px", height: 52,
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <button
          type="button"
          onClick={() => router.push("/discover")}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--ink-tertiary)", padding: 0, transition: "color 120ms" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-tertiary)" }}
        >
          <ArrowLeft size={14} /> Discover
        </button>
        <span style={{ color: "var(--hair-2)", fontSize: 16 }}>·</span>
        <span style={{ fontSize: 13, color: "var(--ink-tertiary)" }}>Funders</span>
        <span style={{ color: "var(--hair-2)", fontSize: 16 }}>·</span>
        <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {funder.name}
        </span>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "36px 40px 80px" }}>

          {/* Identity row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* 48px avatar */}
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 48, height: 48, borderRadius: "50%",
                backgroundColor: "var(--slate-tint)", color: "var(--slate-primary)",
                fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em",
                flexShrink: 0, userSelect: "none",
              }}>
                {initials}
              </span>
              <div>
                <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em", lineHeight: "28px" }}>
                  {funder.name}
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>
                  {FUNDER_TYPE_LABELS[funder.type]}{funder.location ? ` · ${funder.location}` : ""}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, paddingTop: 4 }}>
              <button
                type="button"
                onClick={handleTrack}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  backgroundColor: tracked ? "#3A4F6A" : "var(--slate-primary)",
                  border: "none", fontSize: 13, fontWeight: 600,
                  color: "#fff", cursor: "pointer", transition: "background-color 150ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = tracked ? "var(--slate-primary)" : "#3A4F6A" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = tracked ? "#3A4F6A" : "var(--slate-primary)" }}
              >
                {tracked ? "Tracking" : "Track"}
              </button>
              {funder.website && (
                <a
                  href={funder.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "8px 14px", borderRadius: 8,
                    border: "1px solid var(--hair-2)", backgroundColor: "transparent",
                    fontSize: 13, color: "var(--ink-secondary)", cursor: "pointer",
                    textDecoration: "none", transition: "background-color 150ms, color 150ms",
                  }}
                  onMouseEnter={(e) => { const el = e.currentTarget; el.style.backgroundColor = "var(--surface)"; el.style.color = "var(--ink)" }}
                  onMouseLeave={(e) => { const el = e.currentTarget; el.style.backgroundColor = "transparent"; el.style.color = "var(--ink-secondary)" }}
                >
                  Funder website <ExternalLink size={12} />
                </a>
              )}
              <button
                type="button"
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark funder"}
                onClick={() => setBookmarked((b) => !b)}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: "1px solid var(--hair-2)",
                  backgroundColor: bookmarked ? "var(--slate-tint)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: bookmarked ? "var(--slate-primary)" : "var(--ink-tertiary)",
                  transition: "background-color 150ms, color 150ms",
                }}
                onMouseEnter={(e) => { const el = e.currentTarget; el.style.backgroundColor = "var(--canvas)"; el.style.color = "var(--ink)" }}
                onMouseLeave={(e) => { const el = e.currentTarget; el.style.backgroundColor = bookmarked ? "var(--slate-tint)" : "transparent"; el.style.color = bookmarked ? "var(--slate-primary)" : "var(--ink-tertiary)" }}
              >
                <Bookmark size={15} fill={bookmarked ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          {/* Five-tab bar */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--hair)", marginBottom: 28 }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => switchTab(tab.key)}
                style={{
                  padding: "0 0 11px", marginRight: 28, border: "none", background: "none", cursor: "pointer",
                  fontSize: 14, fontWeight: activeTab === tab.key ? 600 : 400,
                  color: activeTab === tab.key ? "var(--slate-primary)" : "var(--ink-tertiary)",
                  borderBottom: activeTab === tab.key ? "2px solid var(--slate-primary)" : "2px solid transparent",
                  marginBottom: -1, whiteSpace: "nowrap",
                  transition: "color 120ms",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "overview" && (
            <OverviewTab funder={funder} intel={intel} extended={extended} />
          )}
          {activeTab === "financials" && (
            <FinancialsTab intel={intel} extended={extended} />
          )}
          {activeTab === "grant-amounts" && (
            <GrantAmountsTab intel={intel} extended={extended} />
          )}
          {activeTab === "grantees" && (
            <GranteesTab extended={extended} funderName={funder.name} />
          )}
          {activeTab === "opportunities" && (
            <OpportunitiesTab funderId={funder.id} funderName={funder.name} />
          )}

        </div>
      </div>
    </div>
  )
}

export default function FunderDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense>
      <FunderDetailPageInner id={params.id} />
    </Suspense>
  )
}
