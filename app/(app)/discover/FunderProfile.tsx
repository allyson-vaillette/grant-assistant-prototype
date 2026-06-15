"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, ChevronRight, Plus } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, ResponsiveContainer, Legend,
} from "recharts"
import type { Funder, FunderType } from "@/lib/types"
import { getFunderIntelligence, FUNDERS } from "@/lib/mock-data"

// Slate blue ramp for charts. CSS variables don't work in recharts props.
const CLR_PRIMARY  = "#4A6080"  // --slate-primary
const CLR_MUTED    = "#9FB5C8"  // lighter slate for returning grantees
const CLR_PLUM     = "#7B5E7C"  // --plum-soft
const CLR_GRID     = "rgba(42, 42, 42, 0.06)"
const CLR_TICK     = "#738498"  // --ink-tertiary
const CLR_INK      = "#2A2A2A"
const CLR_INK_SEC  = "#4D6585"

const FUNDER_TYPE_LABELS: Record<FunderType, string> = {
  private_foundation:   "Private foundation",
  community_foundation: "Community foundation",
  government:           "Government",
  corporate_foundation: "Corporate foundation",
  public_charity:       "Public charity",
}

type Metric = "total" | "count" | "average"

const METRIC_LABELS: Record<Metric, string> = {
  total:   "Total grant value per year",
  count:   "Grant count per year",
  average: "Average grant size per year",
}

const REGIONS = ["West Coast", "National Average", "East Coast", "Midwest"]

// Deterministic multipliers per region index position (up to 5 years)
const REGION_FACTORS: Record<string, number[]> = {
  "West Coast":       [1.22, 1.18, 1.25, 1.20, 1.28],
  "National Average": [0.88, 0.85, 0.82, 0.86, 0.84],
  "East Coast":       [1.08, 1.12, 1.15, 1.10, 1.14],
  "Midwest":          [0.72, 0.75, 0.70, 0.73, 0.71],
}

function fmtCurrency(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

function GranteeTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: "#fff",
      border: "1px solid rgba(42,42,42,0.10)",
      borderRadius: 8,
      padding: "8px 12px",
      boxShadow: "0 1px 2px rgba(42,42,42,0.04), 0 4px 10px rgba(42,42,42,0.05)",
      minWidth: 130,
    }}>
      <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: CLR_TICK }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "0 0 2px", fontSize: 12, color: CLR_INK }}>
          <span style={{
            display: "inline-block", width: 8, height: 8,
            borderRadius: "50%", backgroundColor: p.color, marginRight: 6,
          }} />
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function MetricTooltip({ active, payload, label, fmt }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string | number
  fmt: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: "#fff",
      border: "1px solid rgba(42,42,42,0.10)",
      borderRadius: 8,
      padding: "8px 12px",
      boxShadow: "0 1px 2px rgba(42,42,42,0.04), 0 4px 10px rgba(42,42,42,0.05)",
      minWidth: 130,
    }}>
      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: CLR_TICK }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "0 0 2px", fontSize: 12, color: CLR_INK }}>
          <span style={{
            display: "inline-block", width: 8, height: 8,
            borderRadius: "50%", backgroundColor: p.color, marginRight: 6,
          }} />
          {payload.length > 1 ? `${p.name}: ` : ""}<strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

interface FunderProfileProps {
  funder: Funder
  onFunderSelect?: (funderId: string) => void
}

export function FunderProfile({ funder, onFunderSelect }: FunderProfileProps) {
  const router = useRouter()
  const intel = getFunderIntelligence(funder.id)
  const [descExpanded, setDescExpanded] = useState(false)
  const [metric, setMetric] = useState<Metric>("total")
  const [compareRegion, setCompareRegion] = useState("")

  const handleFunderSelect = onFunderSelect ?? ((id: string) => router.push(`/discover?funder=${id}`))

  const similarFunders = React.useMemo(() => {
    const currentFocus = new Set(funder.focusAreas)
    return FUNDERS
      .filter((f) => f.id !== funder.id)
      .sort((a, b) => {
        const aScore = a.focusAreas.filter((fa) => currentFocus.has(fa)).length
        const bScore = b.focusAreas.filter((fa) => currentFocus.has(fa)).length
        return bScore - aScore
      })
      .slice(0, 3)
  }, [funder.id, funder.focusAreas])

  const last3 = intel?.yearlyGiving.slice(-3) ?? []
  const totalNew3 = last3.reduce((s, y) => s + y.newGranteeCount, 0)
  const totalAll3 = last3.reduce((s, y) => s + y.newGranteeCount + y.repeatGranteeCount, 0)
  const newPct = totalAll3 ? Math.round((totalNew3 / totalAll3) * 100) : null

  const granteeChartData = intel?.yearlyGiving.map((y) => ({
    year: `${y.year}`,
    New: y.newGranteeCount,
    Returning: y.repeatGranteeCount,
  }))

  const fmtMetric = (v: number) => metric === "count" ? `${v}` : fmtCurrency(v)

  const metricChartData = intel?.yearlyGiving.map((y) => {
    const grantCount = y.newGranteeCount + y.repeatGranteeCount
    const primary = metric === "total" ? y.totalAmount
      : metric === "count" ? grantCount
      : grantCount > 0 ? Math.round(y.totalAmount / grantCount) : 0
    return { year: `${y.year}`, primary }
  })

  const chartData = compareRegion && metricChartData
    ? metricChartData.map((d, i) => {
        const factors = REGION_FACTORS[compareRegion] ?? [1, 1, 1, 1, 1]
        const f = factors[i % factors.length] ?? 1
        return { ...d, comparison: Math.round(d.primary * f) }
      })
    : metricChartData

  return (
    <div style={{ padding: "20px 20px 24px" }}>

      {/* EIN + website row */}
      {(funder.ein || funder.website) && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          paddingBottom: 16,
          borderBottom: "1px solid var(--hair)",
        }}>
          {funder.ein
            ? <span style={{ fontSize: 11, color: "var(--ink-tertiary)" }}>EIN {funder.ein}</span>
            : <span />
          }
          {funder.website && (
            <a
              href={funder.website}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--slate-secondary)", textDecoration: "none" }}
            >
              Funder website <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}

      {/* Description */}
      {funder.description && (
        <div style={{ marginBottom: 20 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--ink-secondary)",
              lineHeight: "20px",
              ...(descExpanded ? {} : {
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"],
              }),
            }}
          >
            {funder.description}
          </p>
          {funder.description.length > 180 && (
            <button
              type="button"
              onClick={() => setDescExpanded((v) => !v)}
              style={{
                background: "none", border: "none", padding: "5px 0 0",
                fontSize: 11, fontWeight: 500, color: "var(--slate-secondary)", cursor: "pointer",
              }}
            >
              {descExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* What they fund */}
      {!!(funder.programAreas?.length || funder.orgTypesFunded?.length || funder.locationsFunded?.length) && (
        <div style={{ marginBottom: 20, paddingTop: 20, borderTop: "1px solid var(--hair)" }}>
          <p style={{ margin: "0 0 14px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            What they fund
          </p>

          {!!funder.programAreas?.length && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 7px", fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)" }}>Program areas</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {funder.programAreas.map((area, i) => (
                  <span key={i} style={{
                    padding: "3px 10px", borderRadius: 20,
                    fontSize: 12, fontWeight: 500,
                    backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)",
                    color: "var(--ink-secondary)",
                  }}>{area}</span>
                ))}
              </div>
            </div>
          )}

          {!!funder.orgTypesFunded?.length && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ margin: "0 0 7px", fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)" }}>Organizations funded</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {funder.orgTypesFunded.map((t, i) => (
                  <span key={i} style={{
                    padding: "3px 10px", borderRadius: 20,
                    fontSize: 12, fontWeight: 500,
                    backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)",
                    color: "var(--ink-secondary)",
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {!!funder.locationsFunded?.length && (
            <div>
              <p style={{ margin: "0 0 7px", fontSize: 10, fontWeight: 600, color: "var(--ink-tertiary)" }}>Locations funded</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {funder.locationsFunded.map((loc, i) => (
                  <span key={i} style={{
                    padding: "3px 10px", borderRadius: 20,
                    fontSize: 12, fontWeight: 500,
                    backgroundColor: "var(--canvas)", border: "1px solid var(--hair-2)",
                    color: "var(--ink-secondary)",
                  }}>{loc}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grant intelligence (requires intel data) */}
      {intel && (
        <div style={{ paddingTop: 20, borderTop: "1px solid var(--hair)" }}>
          <p style={{ margin: "0 0 16px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Grant intelligence
          </p>

          {/* Median + range stat row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            marginBottom: 28,
            borderRadius: 10,
            border: "1px solid var(--hair)",
            overflow: "hidden",
          }}>
            <div style={{ flex: 1, padding: "12px 16px", backgroundColor: "var(--canvas)" }}>
              <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Median award</p>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--slate-primary)", letterSpacing: "-0.02em" }}>
                {fmtCurrency(intel.medianGrantAmount)}
              </p>
            </div>
            <div style={{ width: 1, alignSelf: "stretch", backgroundColor: "var(--hair-2)" }} />
            <div style={{ flex: 1, padding: "12px 16px", backgroundColor: "var(--canvas)" }}>
              <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Funding range</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                {funder.fundingRange ?? "Varies"}
              </p>
            </div>
          </div>

          {/* Openness to new grantees stacked bar */}
          {granteeChartData && granteeChartData.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                Openness to new grantees
              </p>
              {newPct !== null && (
                <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px" }}>
                  {newPct}% of awards went to new grantees in the last 3 years.
                </p>
              )}
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={granteeChartData} barSize={24} barCategoryGap="32%" margin={{ top: 0, right: 0, bottom: 0, left: -8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CLR_GRID} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: CLR_TICK }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: CLR_TICK }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<GranteeTooltip />} cursor={{ fill: "rgba(42,42,42,0.03)" }} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, color: CLR_INK_SEC, paddingTop: 10 }}
                    iconSize={8}
                    iconType="circle"
                  />
                  <Bar dataKey="New" stackId="a" fill={CLR_PRIMARY} name="New" />
                  <Bar dataKey="Returning" stackId="a" fill={CLR_MUTED} radius={[3, 3, 0, 0]} name="Returning" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Metric selector + giving trend chart */}
          {chartData && chartData.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {/* Selector row: metric left, compare right */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 16 }}>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as Metric)}
                  style={{
                    padding: "5px 28px 5px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--hair-2)",
                    backgroundColor: "var(--surface)",
                    fontSize: 12,
                    color: "var(--ink)",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0.5 0.5L5 5.5L9.5 0.5' stroke='%23909AA4' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 8px center",
                  }}
                >
                  {(Object.entries(METRIC_LABELS) as [Metric, string][]).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  border: "1px solid var(--hair-2)",
                  borderRadius: 6,
                  padding: "4px 8px",
                  flexShrink: 0,
                }}>
                  <Plus size={11} style={{ color: "var(--ink-tertiary)", flexShrink: 0 }} />
                  <select
                    value={compareRegion}
                    onChange={(e) => setCompareRegion(e.target.value)}
                    style={{
                      background: "none",
                      border: "none",
                      outline: "none",
                      fontSize: 12,
                      color: compareRegion ? "var(--ink)" : "var(--ink-secondary)",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <option value="">Compare region</option>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top: 0, right: 8, bottom: 0, left: -8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={CLR_GRID} />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: CLR_TICK }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: CLR_TICK }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                    tickFormatter={fmtMetric}
                  />
                  <Tooltip content={<MetricTooltip fmt={fmtMetric} />} cursor={{ stroke: "rgba(42,42,42,0.08)", strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="primary"
                    stroke={CLR_PRIMARY}
                    strokeWidth={2}
                    dot={{ fill: CLR_PRIMARY, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    name="This funder"
                  />
                  {compareRegion && (
                    <Line
                      type="monotone"
                      dataKey="comparison"
                      stroke={CLR_PLUM}
                      strokeWidth={2}
                      strokeDasharray="4 3"
                      dot={{ fill: CLR_PLUM, r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      name={compareRegion}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>

              {/* Legend: only visible when a comparison series is active */}
              {compareRegion && (
                <div style={{ display: "flex", gap: 16, paddingTop: 10, paddingLeft: 8 }}>
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
          )}
        </div>
      )}

      {/* Notable grantees (with intel) */}
      {intel?.notableGrantees && intel.notableGrantees.length > 0 && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--hair)" }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Past grantees
          </p>
          <div>
            {intel.notableGrantees.map((g, i) => (
              <div
                key={i}
                style={{
                  padding: "9px 0",
                  borderTop: i > 0 ? "1px solid var(--hair)" : undefined,
                  fontSize: 13,
                  color: "var(--ink-secondary)",
                }}
              >
                {g}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback: recent grants when no intel data */}
      {!intel && funder.recentGrants && funder.recentGrants.length > 0 && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--hair)" }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Recent grants
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {funder.recentGrants.slice(0, 5).map((grant, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: "var(--ink-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {grant.grantee}
                </span>
                <span style={{ flexShrink: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>{grant.year}</span>
                <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 600, color: "var(--ink)", minWidth: 52, textAlign: "right" }}>
                  {fmtCurrency(grant.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similar funders */}
      {similarFunders.length > 0 && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--hair)" }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 700, color: "var(--ink-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Similar funders
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {similarFunders.map((sf) => {
              const initials = sf.name
                .split(/\s+/)
                .filter((w) => /[A-Za-z]/.test(w.charAt(0)))
                .slice(0, 2)
                .map((w) => w.charAt(0).toUpperCase())
                .join("")
              return (
                <button
                  key={sf.id}
                  type="button"
                  onClick={() => handleFunderSelect(sf.id)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: "1px solid var(--hair)",
                    backgroundColor: "var(--surface-sunk)",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    transition: "border-color 120ms",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--hair-2)" }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--hair)" }}
                >
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 28, height: 28, borderRadius: "50%",
                    backgroundColor: "var(--slate-tint)", color: "var(--slate-primary)",
                    fontSize: 11, fontWeight: 700, lineHeight: 1,
                    flexShrink: 0, userSelect: "none",
                  }}>
                    {initials}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                      {sf.name}
                    </p>
                    {sf.location && (
                      <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--ink-tertiary)" }}>
                        {sf.location}
                      </p>
                    )}
                    {sf.description && (
                      <p style={{
                        margin: 0, fontSize: 12, color: "var(--ink-secondary)", lineHeight: "17px",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"],
                      }}>
                        {sf.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={14} style={{ color: "var(--ink-tertiary)", flexShrink: 0, marginTop: 6 }} />
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => router.push("/discover")}
            style={{
              marginTop: 10,
              background: "none", border: "none", padding: "4px 0", cursor: "pointer",
              fontSize: 12, fontWeight: 500, color: "var(--slate-secondary)",
              transition: "color 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--ink)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--slate-secondary)" }}
          >
            See all similar funders
          </button>
        </div>
      )}

    </div>
  )
}
