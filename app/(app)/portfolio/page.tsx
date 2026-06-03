"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { INITIAL_ENGAGEMENTS, STAGE_DOT, STAGE_BADGE, type OpportunityStage } from "@/lib/engagements-data"

type PortfolioItem = {
  id: string
  name: string
  funderName: string
  engagementId: string
  stage: OpportunityStage
  amount: string
  sub: string
}

const ACTIVE_AWARD_STAGES: OpportunityStage[] = ["Awarded", "Reporting"]
const PAST_AWARD_STAGES: OpportunityStage[] = ["Complete"]

export default function PortfolioPage() {
  const router = useRouter()
  const [pastExpanded, setPastExpanded] = useState(false)

  const allItems: PortfolioItem[] = INITIAL_ENGAGEMENTS.flatMap((eng) =>
    eng.opportunities
      .filter((opp) => ([...ACTIVE_AWARD_STAGES, ...PAST_AWARD_STAGES] as OpportunityStage[]).includes(opp.stage))
      .map((opp) => ({
        id: opp.id,
        name: opp.name,
        funderName: eng.name,
        engagementId: eng.id,
        stage: opp.stage,
        amount: opp.amount,
        sub: opp.sub,
      }))
  )

  const activeItems = allItems.filter((i) => (ACTIVE_AWARD_STAGES as OpportunityStage[]).includes(i.stage))
  const pastItems = allItems.filter((i) => (PAST_AWARD_STAGES as OpportunityStage[]).includes(i.stage))

  const totalAwarded = INITIAL_ENGAGEMENTS.reduce((sum, eng) => {
    const n = parseInt(eng.stats.awardedLifetime.replace(/[^0-9]/g, ""), 10)
    return sum + (isNaN(n) ? 0 : n)
  }, 0)
  const totalAwardedStr = `$${(totalAwarded / 1000).toFixed(0)}k`

  function OppRow({ item }: { item: PortfolioItem }) {
    const badge = STAGE_BADGE[item.stage]
    const dot = STAGE_DOT[item.stage]
    return (
      <div
        onClick={() => {
          const qp = new URLSearchParams({
            name: item.name,
            stage: item.stage,
            amount: item.amount,
            engagementId: item.engagementId,
            engagementName: item.funderName,
          })
          router.push(`/opportunity/${item.id}?${qp.toString()}`)
        }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", borderRadius: 10, backgroundColor: "#FFFFFF",
          border: "1px solid var(--hair)", boxShadow: "none", cursor: "pointer",
          transition: "border-color 150ms, box-shadow 150ms", gap: 12,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--hair-2)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--lift-1)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--hair)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dot, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{item.name}</span>
              <span style={{ flexShrink: 0, borderRadius: 20, padding: "2px 9px", fontSize: 11, fontWeight: 500, backgroundColor: badge.bg, color: badge.color }}>
                {item.stage}
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-tertiary)" }}>
              {item.funderName}{item.sub ? ` · ${item.sub}` : ""}
            </p>
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", flexShrink: 0 }}>{item.amount}</span>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--canvas)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 32px 64px 32px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: "34px", color: "var(--ink)", fontFamily: "var(--font-lora)" }}>
            Portfolio
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)" }}>
            Your awarded grants and active reporting obligations
          </p>
        </div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
          <StatCard label="Total awarded" value={totalAwardedStr} sub="lifetime" />
          <StatCard
            label="Active awards"
            value={String(activeItems.length)}
            sub={`${activeItems.filter((i) => i.stage === "Reporting").length} in reporting`}
          />
          <StatCard label="Past awards" value={String(pastItems.length)} sub="completed" />
        </div>

        {/* Active awards */}
        {activeItems.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={sectionLabel}>Active awards ({activeItems.length})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {activeItems.map((item) => <OppRow key={item.id} item={item} />)}
            </div>
          </div>
        )}

        {activeItems.length === 0 && (
          <div style={{ padding: "28px 20px", textAlign: "center", borderRadius: 10, border: "var(--border-subtle)", marginBottom: 28 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)" }}>No active awards at the moment.</p>
          </div>
        )}

        {/* Past awards (collapsed) */}
        {pastItems.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setPastExpanded((v) => !v)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "8px 4px", border: "none", background: "none",
                cursor: "pointer", textAlign: "left",
              }}
            >
              <span style={{ ...sectionLabel, margin: 0 }}>Past awards ({pastItems.length})</span>
              <span style={{ fontSize: 14, color: "var(--ink-tertiary)", display: "inline-block", transition: "transform 150ms", transform: pastExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
            </button>
            {pastExpanded && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                {pastItems.map((item) => <OppRow key={item.id} item={item} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ borderRadius: 10, padding: "14px 16px", backgroundColor: "#FFFFFF", border: "1px solid var(--hair)" }}>
      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--ink-tertiary)" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.02em" }}>{value}</p>
      {sub && <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--ink-tertiary)" }}>{sub}</p>}
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
  color: "var(--ink-tertiary)", margin: "0 0 10px 0",
}
