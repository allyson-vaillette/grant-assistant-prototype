"use client"

import React, { useState } from "react"
import { Search, Plus } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type Initiative = "Rescue & Intake" | "Foster Program" | "Neutering & Spay" | "Org-wide"
type SourceType = "Internal data" | "External source" | "Program data" | "Partnership records"

interface UsageEntry {
  grant: string
  funder: string
  date: string
}

interface EvidenceItem {
  id: string
  title: string
  usageCount: number | null
  source: string
  sourceDate: string
  sourceType: SourceType
  initiative: Initiative
  content: string
  usageEntries: UsageEntry[]
  aiNote: string
}

// ── Data ──────────────────────────────────────────────────────────────────

const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: "cats-placed",
    title: "4,200+ cats placed since 2014",
    usageCount: 3,
    source: "Whisker Haven Impact Data",
    sourceDate: "Last updated January 2026",
    sourceType: "Internal data",
    initiative: "Rescue & Intake",
    content:
      "Since our founding in 2014, Whisker Haven has successfully placed 4,200+ cats into permanent, loving homes across Los Angeles County. This figure represents cats rescued from streets, surrendered by owners, and transferred from overcrowded municipal shelters.",
    usageEntries: [
      { grant: "Equitable Futures Grant 2026",   funder: "Ford Foundation", date: "May 2026" },
      { grant: "Community Voice Initiative",      funder: "Ford Foundation", date: "Mar 2026" },
      { grant: "Animal Welfare General Support",  funder: "ASPCA",           date: "Jan 2026" },
    ],
    aiNote:
      "This evidence item is automatically surfaced by the AI assistant when writing Need Statement and Organization Overview sections for Animal Welfare opportunities.",
  },
  {
    id: "spay-neuter",
    title: "12,000 animals served via spay/neuter annually",
    usageCount: 5,
    source: "Program Stats",
    sourceDate: "Updated Mar 2026",
    sourceType: "Program data",
    initiative: "Neutering & Spay",
    content:
      "Whisker Haven's spay/neuter clinics serve approximately 12,000 animals annually across Los Angeles County, including owned pets from low-income households and community cats through our trap-neuter-return program. This represents a 34% increase since 2022.",
    usageEntries: [
      { grant: "Saving Cats & Kittens Grant",   funder: "PetSmart Charities",         date: "Apr 2026" },
      { grant: "Advancing Wellness Grant",       funder: "CA Wellness Foundation",     date: "Mar 2026" },
      { grant: "Animal Welfare General Support", funder: "ASPCA",                      date: "Feb 2026" },
    ],
    aiNote:
      "Surfaced automatically for Community Health and Spay/Neuter program sections. High relevance score for California Wellness Foundation opportunities.",
  },
  {
    id: "adoption-rate",
    title: "94% adoption success rate over 5 years",
    usageCount: 2,
    source: "Whisker Haven Impact Data",
    sourceDate: "Last updated January 2026",
    sourceType: "Internal data",
    initiative: "Rescue & Intake",
    content:
      "Whisker Haven maintains a 94% adoption success rate, meaning 94% of cats who enter our adoption program are successfully placed in permanent homes within 60 days. This figure reflects a consistent 5-year trend and places us in the top 8% of California animal welfare organizations.",
    usageEntries: [
      { grant: "Equitable Futures Grant 2026", funder: "Ford Foundation", date: "May 2026" },
      { grant: "Lost & Found Grant 2025",      funder: "Petco Love",      date: "Jan 2026" },
    ],
    aiNote:
      "Used when writing Organizational Capacity and Track Record sections. AI prioritizes this stat for funders that require demonstrated outcomes.",
  },
  {
    id: "foster-caregivers",
    title: "300+ trained foster caregivers in LA County",
    usageCount: 4,
    source: "Foster Network Report",
    sourceDate: "Updated Feb 2026",
    sourceType: "Internal data",
    initiative: "Foster Program",
    content:
      "Our foster network includes over 300 trained caregivers across Los Angeles County, providing temporary homes for cats and kittens awaiting adoption. Caregivers complete a 4-hour training program and receive ongoing support from our foster coordination team.",
    usageEntries: [
      { grant: "Equitable Futures Grant 2026",  funder: "Ford Foundation",  date: "May 2026" },
      { grant: "Foster Program Support Grant",  funder: "PetSmart Charities",date: "Apr 2026" },
      { grant: "Lost & Found Grant 2025",       funder: "Petco Love",        date: "Jan 2026" },
    ],
    aiNote:
      "Automatically used in Community Engagement and Program Capacity sections. Particularly relevant for funders focused on volunteer-driven models.",
  },
  {
    id: "los-reduced",
    title: "Average length of stay reduced 23% since 2022",
    usageCount: 1,
    source: "Internal Program Data",
    sourceDate: "Updated Dec 2025",
    sourceType: "Internal data",
    initiative: "Rescue & Intake",
    content:
      "Through operational improvements and expanded foster network capacity, Whisker Haven has reduced the average length of stay from 18 days (2022) to 13.8 days (2025), a 23% improvement. Shorter stays reduce stress for animals and free capacity for incoming rescues.",
    usageEntries: [
      { grant: "Community Voice Initiative", funder: "Ford Foundation", date: "Mar 2026" },
    ],
    aiNote:
      "Surfaced for Efficiency and Organizational Improvement sections. AI flags this as high-value evidence for capacity-building grant applications.",
  },
  {
    id: "shelter-partnerships",
    title: "14 municipal shelter partnerships active",
    usageCount: null,
    source: "Partnership Records",
    sourceDate: "Updated Apr 2026",
    sourceType: "Partnership records",
    initiative: "Rescue & Intake",
    content:
      "Whisker Haven maintains active formal partnerships with 14 municipal shelters across Los Angeles and Orange County. These partnerships include overflow intake agreements, shared medical protocols, and joint adoption events. Two additional partnerships are in negotiation.",
    usageEntries: [],
    aiNote:
      "Not yet used in proposals. AI recommends adding this to Community Partnerships sections — it supports both geographic reach and collaboration claims.",
  },
  {
    id: "community-cats",
    title: "LA County has 3.2M estimated community cats",
    usageCount: 2,
    source: "LA Animal Services Report 2025",
    sourceDate: "External source",
    sourceType: "External source",
    initiative: "Org-wide",
    content:
      "According to the Los Angeles County Department of Animal Care and Control's 2025 report, LA County has an estimated 3.2 million community (unowned) cats. This population drives shelter intake pressure and requires sustained TNR intervention to stabilize over time.",
    usageEntries: [
      { grant: "Advancing Wellness Grant",      funder: "CA Wellness Foundation", date: "Mar 2026" },
      { grant: "Animal Welfare General Support",funder: "ASPCA",                  date: "Jan 2026" },
    ],
    aiNote:
      "Used in Need Statement sections to establish community-level problem scale. Cited as external third-party data, which increases credibility with reviewers.",
  },
  {
    id: "underserved-intake",
    title: "Underserved communities account for 67% of intake volume",
    usageCount: 3,
    source: "Internal Intake Data",
    sourceDate: "Updated Mar 2026",
    sourceType: "Internal data",
    initiative: "Rescue & Intake",
    content:
      "Analysis of our intake records shows that 67% of cats we receive originate from zip codes classified as underserved by the California Health Places Index. This concentration reflects both the higher rate of unaltered animals in low-income areas and the lack of affordable veterinary access.",
    usageEntries: [
      { grant: "Advancing Wellness Grant",      funder: "CA Wellness Foundation", date: "Mar 2026" },
      { grant: "Equitable Futures Grant 2026",  funder: "Ford Foundation",        date: "May 2026" },
      { grant: "Community Voice Initiative",    funder: "Ford Foundation",        date: "Mar 2026" },
    ],
    aiNote:
      "High-priority evidence for equity-focused funders. AI surfaces this automatically for any opportunity tagged Community Development or Health Equity.",
  },
]

const ALL_INITIATIVES: Initiative[] = ["Rescue & Intake", "Foster Program", "Neutering & Spay", "Org-wide"]

// ── Left list row ──────────────────────────────────────────────────────────

function EvidenceRow({
  item,
  isSelected,
  onClick,
}: {
  item: EvidenceItem
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 5,
        width: "calc(100% - 16px)",
        margin: "0 8px",
        padding: "12px 14px",
        borderRadius: 10,
        backgroundColor: isSelected ? "#FFFFFF" : "transparent",
        border: isSelected ? "1px solid var(--border-color)" : "1px solid transparent",
        borderLeft: isSelected ? "3px solid var(--olive-mid)" : "3px solid transparent",
        boxShadow: isSelected ? "0px 1px 4px rgba(28,24,64,0.06)" : "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 150ms",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.5)"
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
      }}
    >
      {/* Title + usage */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink)",
            lineHeight: "18px",
            letterSpacing: "-0.01em",
          }}
        >
          {item.title}
        </span>
        <span
          style={{
            flexShrink: 0,
            fontSize: 11,
            color: item.usageCount === null ? "var(--ink-tertiary)" : "var(--olive-mid)",
            fontWeight: 500,
            whiteSpace: "nowrap",
            lineHeight: "18px",
          }}
        >
          {item.usageCount === null ? "Not yet used" : `Used in ${item.usageCount} proposal${item.usageCount !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Source + date */}
      <span style={{ fontSize: 12, color: "var(--ink-tertiary)", lineHeight: "16px" }}>
        {item.source} · {item.sourceDate}
      </span>

      {/* Initiative tag */}
      <span
        style={{
          alignSelf: "flex-start",
          borderRadius: "var(--radius-pill)",
          padding: "2px 9px",
          backgroundColor: "var(--subtle)",
          border: "1px solid var(--border-color)",
          fontSize: 11,
          color: "var(--ink-secondary)",
        }}
      >
        {item.initiative}
      </span>
    </button>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────

function DetailPanel({ item }: { item: EvidenceItem }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "28px 40px",
        backgroundColor: "#FFFFFF",
        borderLeft: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Title row */}
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            margin: "0 0 12px 0",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: "var(--ink)",
            lineHeight: "28px",
          }}
        >
          {item.title}
        </h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                borderRadius: "var(--radius-pill)",
                padding: "4px 12px",
                backgroundColor: "var(--olive-pale)",
                border: "1px solid rgba(90,138,53,0.2)",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--olive-dark)",
              }}
            >
              {item.initiative}
            </span>
            <button
              type="button"
              style={{
                padding: "5px 14px",
                borderRadius: "var(--radius-button)",
                border: "1px solid var(--border-color)",
                backgroundColor: "transparent",
                fontSize: 13,
                color: "var(--ink)",
                cursor: "pointer",
                transition: "background-color 150ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F3F0EA" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
            >
              Edit
            </button>
          </div>
          <button
            type="button"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: "#C0302A",
              padding: "4px 8px",
              borderRadius: 6,
              transition: "background-color 150ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FEEAEA" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            Delete
          </button>
        </div>
      </div>

      <Divider />

      {/* Content */}
      <Section label="Content">
        <p style={{ margin: 0, fontSize: 13, color: "var(--ink)", lineHeight: "20px" }}>
          {item.content}
        </p>
      </Section>

      <Divider />

      {/* Source */}
      <Section label="Source">
        <p style={{ margin: "0 0 2px 0", fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
          {item.source}
        </p>
        <p style={{ margin: "0 0 8px 0", fontSize: 13, color: "var(--ink-secondary)" }}>
          {item.sourceDate}
        </p>
        <span
          style={{
            borderRadius: "var(--radius-pill)",
            padding: "3px 10px",
            backgroundColor: "var(--subtle)",
            border: "1px solid var(--border-color)",
            fontSize: 12,
            color: "var(--ink-secondary)",
          }}
        >
          {item.sourceType}
        </span>
      </Section>

      <Divider />

      {/* Initiative */}
      <Section label="Initiative">
        <span
          style={{
            borderRadius: "var(--radius-pill)",
            padding: "5px 14px",
            backgroundColor: "var(--olive-dark)",
            fontSize: 13,
            fontWeight: 500,
            color: "#FFFFFF",
          }}
        >
          {item.initiative}
        </span>
      </Section>

      <Divider />

      {/* Usage */}
      <Section label={`Usage (${item.usageCount ?? 0} proposal${item.usageCount !== 1 ? "s" : ""})`}>
        {item.usageEntries.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-tertiary)", fontStyle: "italic" }}>
            Not yet used in any proposals.
          </p>
        ) : (
          <div
            style={{
              borderRadius: "var(--radius-card)",
              border: "1px solid var(--border-color)",
              overflow: "hidden",
            }}
          >
            {item.usageEntries.map((entry, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  alignItems: "center",
                  padding: "10px 16px",
                  gap: 12,
                  borderBottom:
                    i < item.usageEntries.length - 1
                      ? "1px solid var(--border-color)"
                      : "none",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
                  {entry.grant}
                </span>
                <span style={{ fontSize: 13, color: "var(--ink-secondary)" }}>
                  {entry.funder}
                </span>
                <span style={{ fontSize: 12, color: "var(--ink-tertiary)", whiteSpace: "nowrap" }}>
                  {entry.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Divider />

      {/* AI Usage Note */}
      <Section label="AI Usage Note">
        <div
          style={{
            padding: "14px 16px",
            borderRadius: "var(--radius-card)",
            backgroundColor: "var(--olive-pale)",
            border: "1px solid rgba(90,138,53,0.15)",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)", lineHeight: "19px" }}>
            {item.aiNote}
          </p>
        </div>
      </Section>
    </div>
  )
}

// ── Shared primitives ──────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ paddingBottom: 20 }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-tertiary)",
          margin: "0 0 10px 0",
        }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, backgroundColor: "var(--border-color)", margin: "4px 0 20px 0" }} />
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function EvidencePage() {
  const [selectedId, setSelectedId] = useState("cats-placed")
  const [query, setQuery] = useState("")
  const [activeInitiatives, setActiveInitiatives] = useState<Set<Initiative>>(new Set())

  function toggleInitiative(init: Initiative) {
    setActiveInitiatives((prev) => {
      const next = new Set(prev)
      if (next.has(init)) {
        next.delete(init)
      } else {
        next.add(init)
      }
      return next
    })
  }

  function clearFilters() {
    setActiveInitiatives(new Set())
    setQuery("")
  }

  const filtered = EVIDENCE_ITEMS.filter((item) => {
    const matchesQuery =
      query === "" || item.title.toLowerCase().includes(query.toLowerCase())
    const matchesInitiative =
      activeInitiatives.size === 0 || activeInitiatives.has(item.initiative)
    return matchesQuery && matchesInitiative
  })

  const selected =
    filtered.find((i) => i.id === selectedId) ?? filtered[0] ?? EVIDENCE_ITEMS[0]

  return (
    <div className="flex flex-col flex-1" style={{ overflow: "hidden", minHeight: 0 }}>
      {/* Page header */}
      <div
        style={{
          flexShrink: 0,
          padding: "20px 32px",
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 4px 0",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
            }}
          >
            Evidence Library
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)" }}>
            Evergreen proof points that power your proposals. Referenced automatically by the AI assistant.
          </p>
        </div>
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 18px",
            borderRadius: "var(--radius-button)",
            backgroundColor: "#C4511A",
            border: "none",
            fontSize: 14,
            fontWeight: 500,
            color: "#FFFFFF",
            cursor: "pointer",
            flexShrink: 0,
            transition: "background-color 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#A8421A" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#C4511A" }}
        >
          <Plus size={15} style={{ flexShrink: 0 }} />
          New evidence item
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1" style={{ overflow: "hidden", minHeight: 0 }}>
        {/* Left column */}
        <aside
          style={{
            width: 268,
            flexShrink: 0,
            backgroundColor: "#F3F0EA",
            borderRight: "1px solid var(--border-color)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Search */}
          <div style={{ padding: "12px 16px 0 16px", flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: "var(--radius-input)",
                backgroundColor: "#FFFFFF",
                border: "1px solid var(--border-color)",
              }}
            >
              <Search size={13} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search evidence..."
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  color: "var(--ink)",
                }}
              />
            </div>
          </div>

          {/* Filter pills */}
          <div
            style={{
              flexShrink: 0,
              padding: "10px 16px",
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            <button
              type="button"
              onClick={clearFilters}
              style={{
                borderRadius: "var(--radius-pill)",
                padding: "4px 12px",
                border: activeInitiatives.size === 0 && query === ""
                  ? "none"
                  : "1px solid var(--border-color)",
                backgroundColor: activeInitiatives.size === 0 && query === ""
                  ? "var(--olive-dark)"
                  : "transparent",
                fontSize: 12,
                fontWeight: activeInitiatives.size === 0 && query === "" ? 600 : 400,
                color: activeInitiatives.size === 0 && query === "" ? "#FFFFFF" : "var(--ink-secondary)",
                cursor: "pointer",
                transition: "background-color 150ms",
              }}
            >
              All
            </button>

            {ALL_INITIATIVES.map((init) => {
              const isActive = activeInitiatives.has(init)
              return (
                <button
                  key={init}
                  type="button"
                  onClick={() => toggleInitiative(init)}
                  style={{
                    borderRadius: "var(--radius-pill)",
                    padding: "4px 12px",
                    border: isActive ? "none" : "1px solid var(--border-color)",
                    backgroundColor: isActive ? "var(--olive-dark)" : "transparent",
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#FFFFFF" : "var(--ink-secondary)",
                    cursor: "pointer",
                    transition: "background-color 150ms",
                  }}
                >
                  {init}
                </button>
              )
            })}
          </div>

          {/* Count */}
          <p style={{ margin: "0 0 6px 24px", fontSize: 12, color: "var(--ink-tertiary)", flexShrink: 0 }}>
            {filtered.length} evidence item{filtered.length !== 1 ? "s" : ""}
          </p>

          {/* Rows */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, paddingBottom: 12 }}>
            {filtered.map((item) => (
              <EvidenceRow
                key={item.id}
                item={item}
                isSelected={item.id === selected.id}
                onClick={() => setSelectedId(item.id)}
              />
            ))}
          </div>
        </aside>

        {/* Right detail */}
        <DetailPanel item={selected} />
      </div>
    </div>
  )
}
