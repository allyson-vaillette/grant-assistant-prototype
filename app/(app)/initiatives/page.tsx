"use client"

import React, { useState } from "react"
import { Pencil, Plus } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

interface EvidenceItem {
  title: string
  source: string
}

interface Outcome {
  value: string
  label: string
}

interface Initiative {
  id: string
  name: string
  status: "Active" | "Inactive"
  description: string
  primaryTags: string[]
  subTags: string[]
  geography: string
  geographyNational: string
  goals: string[]
  needStatement: string
  outcomes: Outcome[]
  evidenceItems: EvidenceItem[]
  matchedCount: number
  matchedSample: string[]
  activeEngagements: number
}

// ── Data ──────────────────────────────────────────────────────────────────

const INITIATIVES: Initiative[] = [
  {
    id: "rescue-intake",
    name: "Rescue & Intake",
    status: "Active",
    description:
      "Intake, medical triage, and rehabilitation of displaced and surrendered cats across LA County. We operate two intake facilities and partner with 14 municipal shelters to provide overflow capacity and medical support.",
    primaryTags: ["Animal Welfare", "Community Development"],
    subTags: ["Animal Rescue", "Shelter Support", "Foster Care"],
    geography: "California — Los Angeles County, Orange County",
    geographyNational: "United States",
    goals: [
      "Increase annual intake capacity by 40% by end of 2026",
      "Reduce average length of stay from 18 to 12 days",
      "Expand partner shelter network from 14 to 20 facilities",
    ],
    needStatement:
      "Los Angeles County faces a chronic animal shelter capacity crisis, with intake volumes consistently exceeding available resources. Underserved communities bear a disproportionate burden, with limited access to affordable veterinary care and humane disposal of community cat populations.",
    outcomes: [
      { value: "4,200+", label: "Cats placed annually" },
      { value: "94%",    label: "Adoption success rate" },
      { value: "14",     label: "Partner shelters" },
    ],
    evidenceItems: [
      { title: "4,200+ cats placed since 2014",      source: "Whisker Haven Impact Data" },
      { title: "Average LOS reduced 23% since 2022", source: "Internal Program Data" },
    ],
    matchedCount: 12,
    matchedSample: ["Petco Love Lost & Found", "ASPCA Saving Lives", "PetSmart Charities"],
    activeEngagements: 3,
  },
  {
    id: "foster-program",
    name: "Foster Program",
    status: "Active",
    description:
      "Recruiting, training, and supporting foster families to provide temporary care for cats awaiting adoption. Our network of 380+ foster homes reduces shelter crowding and improves socialization outcomes.",
    primaryTags: ["Animal Welfare"],
    subTags: ["Foster Care", "Community Outreach"],
    geography: "California — Los Angeles County",
    geographyNational: "United States",
    goals: [
      "Grow active foster network from 380 to 500 households",
      "Reduce average foster placement time from 6 to 4 days",
      "Launch dedicated foster volunteer portal by Q3 2026",
    ],
    needStatement:
      "Shelter overcrowding is most acute for kittens under 8 weeks, who require round-the-clock bottle feeding impossible to provide in a shelter environment. A robust foster network is the only scalable solution to eliminate neonatal kitten euthanasia.",
    outcomes: [
      { value: "380+", label: "Active foster homes" },
      { value: "98%",  label: "Kitten survival rate" },
      { value: "6 days", label: "Avg. placement time" },
    ],
    evidenceItems: [
      { title: "380 active fosters recruited 2023–2025", source: "Volunteer Management System" },
      { title: "Kitten mortality reduced 61% since program launch", source: "Program Outcomes Report" },
    ],
    matchedCount: 8,
    matchedSample: ["Petco Love Lost & Found", "PetSmart Charities", "ASPCA"],
    activeEngagements: 2,
  },
  {
    id: "neutering-spay",
    name: "Neutering & Spay",
    status: "Active",
    description:
      "Low-cost and free spay/neuter clinics serving owned and community cats in underserved neighborhoods. The program operates two mobile clinic units and contracts with four partner veterinary hospitals.",
    primaryTags: ["Animal Welfare", "Health"],
    subTags: ["Community Health", "Veterinary Access"],
    geography: "California — Los Angeles County",
    geographyNational: "United States",
    goals: [
      "Perform 6,000 spay/neuter surgeries in 2026",
      "Expand mobile clinic days from 3 to 5 per week",
      "Partner with 2 additional underserved community clinics",
    ],
    needStatement:
      "Uncontrolled community cat reproduction is the primary driver of shelter intake across LA County. Low-income communities lack access to affordable veterinary services, resulting in higher rates of unaltered pets and community cat colonies without TNR support.",
    outcomes: [
      { value: "5,200+", label: "Surgeries in 2025" },
      { value: "2",      label: "Mobile clinic units" },
      { value: "4",      label: "Partner hospitals" },
    ],
    evidenceItems: [
      { title: "5,200 surgeries completed in 2025", source: "Clinic Operations Report" },
      { title: "Intake from target zip codes down 18%", source: "Shelter Intake Analysis" },
    ],
    matchedCount: 5,
    matchedSample: ["California Wellness Foundation", "PetSmart Charities"],
    activeEngagements: 1,
  },
]

// ── Left card ──────────────────────────────────────────────────────────────

function InitiativeCard({
  initiative,
  isSelected,
  onClick,
}: {
  initiative: Initiative
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
        gap: 8,
        width: "calc(100% - 16px)",
        margin: "0 8px",
        padding: "14px 16px",
        borderRadius: 10,
        backgroundColor: isSelected ? "#FFFFFF" : "transparent",
        border: isSelected ? "1px solid var(--border-color)" : "1px solid transparent",
        borderLeft: isSelected ? "3px solid var(--olive-mid)" : "3px solid transparent",
        boxShadow: isSelected ? "0px 1px 4px rgba(28,24,64,0.06)" : "none",
        cursor: "pointer",
        textAlign: "left",
        transition: "background-color 150ms, box-shadow 150ms",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.5)"
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"
      }}
    >
      {/* Name + badge + pencil */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}>
            {initiative.name}
          </span>
          <span
            style={{
              borderRadius: "var(--radius-pill)",
              padding: "2px 8px",
              backgroundColor: "var(--olive-pale)",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--olive-dark)",
            }}
          >
            {initiative.status}
          </span>
        </div>
        <Pencil size={13} color="var(--ink-tertiary)" style={{ flexShrink: 0 }} />
      </div>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontSize: 12,
          color: "var(--ink-secondary)",
          lineHeight: "18px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {initiative.description}
      </p>

      {/* Focus tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {initiative.primaryTags.map((tag) => (
          <span
            key={tag}
            style={{
              borderRadius: "var(--radius-pill)",
              padding: "3px 9px",
              backgroundColor: "var(--subtle)",
              border: "1px solid var(--border-color)",
              fontSize: 11,
              color: "var(--ink-secondary)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12 }}>
        <span style={{ fontSize: 12, color: "var(--olive-mid)", fontWeight: 500 }}>
          {initiative.matchedCount} matched opportunities
        </span>
        <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>
          {initiative.activeEngagements} active engagement{initiative.activeEngagements !== 1 ? "s" : ""}
        </span>
      </div>
    </button>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────

function DetailPanel({ initiative }: { initiative: Initiative }) {
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
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              background: "linear-gradient(90deg, #3D6120, #7A9A30)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            {initiative.name}
          </h2>
          <span
            style={{
              borderRadius: "var(--radius-pill)",
              padding: "3px 10px",
              backgroundColor: "var(--olive-pale)",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--olive-dark)",
            }}
          >
            {initiative.status}
          </span>
        </div>
        <button
          type="button"
          style={{
            padding: "7px 16px",
            borderRadius: "var(--radius-button)",
            backgroundColor: "transparent",
            border: "1px solid var(--border-color)",
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

      {/* Description */}
      <Section label="Description">
        <p style={bodyTextStyle}>{initiative.description}</p>
      </Section>

      <Divider />

      {/* Focus & Geography */}
      <Section label="Focus & Geography">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {initiative.primaryTags.map((tag) => (
              <Chip key={tag} label={tag} size="lg" />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {initiative.subTags.map((tag) => (
              <Chip key={tag} label={tag} size="sm" />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--ink-secondary)" }}>{initiative.geography}</span>
            <Chip label={initiative.geographyNational} size="sm" />
          </div>
        </div>
      </Section>

      <Divider />

      {/* Goals & Objectives */}
      <Section label="Goals & Objectives">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {initiative.goals.map((goal) => (
            <div key={goal} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "var(--olive-mid)",
                  flexShrink: 0,
                  marginTop: 7,
                }}
              />
              <span style={bodyTextStyle}>{goal}</span>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* Need Statement */}
      <Section label="Need Statement">
        <p style={bodyTextStyle}>{initiative.needStatement}</p>
      </Section>

      <Divider />

      {/* Outcomes & Impact */}
      <Section label="Outcomes & Impact">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {initiative.outcomes.map((o) => (
            <div
              key={o.label}
              style={{
                padding: "16px 20px",
                borderRadius: "var(--radius-card)",
                backgroundColor: "var(--olive-pale)",
                border: "1px solid rgba(90,138,53,0.15)",
              }}
            >
              <p
                style={{
                  margin: "0 0 4px 0",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--olive-dark)",
                }}
              >
                {o.value}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink-secondary)" }}>{o.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Divider />

      {/* Evidence Items */}
      <Section label={`Evidence Items (${initiative.evidenceItems.length + 2})`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {initiative.evidenceItems.map((item) => (
            <div
              key={item.title}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderRadius: "var(--radius-button)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--canvas)",
              }}
            >
              <div>
                <p style={{ margin: "0 0 2px 0", fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                  {item.title}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--ink-tertiary)" }}>{item.source}</p>
              </div>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--olive-mid)",
                  flexShrink: 0,
                  padding: "4px 8px",
                  borderRadius: 6,
                  transition: "background-color 150ms",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F3F0EA" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
              >
                Insert
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            padding: "8px 8px 0 8px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--olive-mid)",
            textAlign: "left",
            borderRadius: 6,
            transition: "background-color 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F3F0EA" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
        >
          <Plus size={13} />
          Add evidence item
        </button>
      </Section>

      <Divider />

      {/* Matched Opportunities */}
      <Section label={`Matched Opportunities (${initiative.matchedCount})`}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {initiative.matchedSample.map((name) => (
            <Chip key={name} label={name} size="lg" />
          ))}
        </div>
        <button
          type="button"
          style={{
            background: "none",
            border: "none",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--olive-mid)",
            borderRadius: 6,
            transition: "background-color 150ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F3F0EA" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
        >
          View all {initiative.matchedCount} →
        </button>
      </Section>
    </div>
  )
}

// ── Shared primitives ──────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: "0 0 20px 0" }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-tertiary)",
          margin: "0 0 12px 0",
        }}
      >
        {label}
      </p>
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div
      style={{
        height: 1,
        backgroundColor: "var(--border-color)",
        margin: "4px 0 20px 0",
      }}
    />
  )
}

function Chip({ label, size }: { label: string; size: "sm" | "lg" }) {
  return (
    <span
      style={{
        borderRadius: "var(--radius-pill)",
        padding: size === "lg" ? "5px 12px" : "3px 9px",
        backgroundColor: size === "lg" ? "var(--olive-pale)" : "var(--subtle)",
        border: size === "lg" ? "1px solid rgba(90,138,53,0.2)" : "1px solid var(--border-color)",
        fontSize: size === "lg" ? 13 : 12,
        fontWeight: size === "lg" ? 500 : 400,
        color: size === "lg" ? "var(--olive-dark)" : "var(--ink-secondary)",
      }}
    >
      {label}
    </span>
  )
}

const bodyTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "var(--ink)",
  lineHeight: "20px",
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function InitiativesPage() {
  const [selectedId, setSelectedId] = useState("rescue-intake")
  const selected = INITIATIVES.find((i) => i.id === selectedId) ?? INITIATIVES[0]

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
            Initiatives
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-secondary)" }}>
            Your organization&apos;s program areas. Initiatives drive opportunity matching and proposal content.
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
          New initiative
        </button>
      </div>

      {/* Body: left list + right detail */}
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
            padding: "12px 0",
            gap: 4,
          }}
        >
          {INITIATIVES.map((initiative) => (
            <InitiativeCard
              key={initiative.id}
              initiative={initiative}
              isSelected={initiative.id === selectedId}
              onClick={() => setSelectedId(initiative.id)}
            />
          ))}

          <button
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              padding: "10px 24px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--olive-mid)",
              textAlign: "left",
              borderRadius: 8,
              transition: "background-color 150ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.5)" }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
          >
            <Plus size={13} />
            New initiative
          </button>
        </aside>

        {/* Right detail panel */}
        <DetailPanel initiative={selected} />
      </div>
    </div>
  )
}
