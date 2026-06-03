"use client"

import React, { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { INITIAL_ENGAGEMENTS, STAGE_DOT, STAGE_BADGE, type OpportunityStage } from "@/lib/engagements-data"

type PipelineItem = {
  id: string
  name: string
  funderName: string
  engagementId: string
  stage: OpportunityStage
  amount: string
  deadline?: string
  sub: string
}

const PIPELINE_STAGES: OpportunityStage[] = ["Tracking", "Active", "Submitted"]

function deadlineSortKey(deadline?: string): number {
  if (!deadline) return Number.MAX_SAFE_INTEGER
  const match = deadline.match(/(?:Due|Deadline)\s+(.+)/)
  if (!match) return Number.MAX_SAFE_INTEGER - 1
  const d = new Date(match[1])
  if (isNaN(d.getTime())) return Number.MAX_SAFE_INTEGER - 1
  return d.getTime()
}

export default function PipelinePageWrapper() {
  return (
    <Suspense>
      <PipelinePage />
    </Suspense>
  )
}

function PipelinePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const stageParam = searchParams.get("stage") as OpportunityStage | null
  const validStage = stageParam && (PIPELINE_STAGES as string[]).includes(stageParam) ? stageParam : null
  const [stageFilter, setStageFilter] = useState<OpportunityStage | null>(validStage)

  const allItems: PipelineItem[] = INITIAL_ENGAGEMENTS.flatMap((eng) =>
    eng.opportunities
      .filter((opp) => PIPELINE_STAGES.includes(opp.stage))
      .map((opp) => ({
        id: opp.id,
        name: opp.name,
        funderName: eng.name,
        engagementId: eng.id,
        stage: opp.stage,
        amount: opp.amount,
        deadline: opp.deadline,
        sub: opp.sub,
      }))
  )

  const sorted = [...allItems].sort((a, b) => deadlineSortKey(a.deadline) - deadlineSortKey(b.deadline))
  const filtered = stageFilter ? sorted.filter((i) => i.stage === stageFilter) : sorted

  const funderCount = new Set(INITIAL_ENGAGEMENTS.filter((e) => e.opportunities.some((o) => PIPELINE_STAGES.includes(o.stage))).map((e) => e.id)).size

  function handleFilter(stage: OpportunityStage | null) {
    setStageFilter(stage)
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (stage) params.set("stage", stage)
    else params.delete("stage")
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const filterOptions: { label: string; value: OpportunityStage | null }[] = [
    { label: "All", value: null },
    { label: "Tracking", value: "Tracking" },
    { label: "Active", value: "Active" },
    { label: "Submitted", value: "Submitted" },
  ]

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: "var(--canvas)" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 32px 64px 32px" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: "34px", color: "var(--ink)", fontFamily: "var(--font-lora)" }}>
            Pipeline
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)" }}>
            {allItems.length} {allItems.length === 1 ? "opportunity" : "opportunities"} in pursuit across {funderCount} {funderCount === 1 ? "funder" : "funders"}
          </p>
        </div>

        {/* Stage filter pills */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {filterOptions.map(({ label, value }) => {
            const active = stageFilter === value
            const count = value ? sorted.filter((i) => i.stage === value).length : sorted.length
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleFilter(value)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: active ? "1px solid var(--slate-primary)" : "var(--border-subtle)",
                  backgroundColor: active ? "var(--slate-tint)" : "transparent",
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--slate-primary)" : "var(--ink-secondary)",
                  cursor: "pointer",
                  transition: "background-color 150ms, border-color 150ms",
                }}
              >
                {label} {value ? `(${count})` : `(${count})`}
              </button>
            )
          })}
        </div>

        {/* Opportunity list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.length === 0 ? (
            <p style={{ padding: "32px 0", textAlign: "center", fontSize: 13, color: "var(--ink-tertiary)" }}>
              No opportunities at this stage.
            </p>
          ) : (
            filtered.map((item) => {
              const badge = STAGE_BADGE[item.stage]
              const dot = STAGE_DOT[item.stage]
              return (
                <div
                  key={item.id}
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
                        {item.funderName}{item.deadline ? ` · ${item.deadline}` : ""}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", flexShrink: 0 }}>{item.amount}</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
