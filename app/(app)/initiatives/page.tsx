"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import {
  Search, Plus, X, Pencil, ChevronRight, ChevronDown, ChevronUp,
  Archive, ArchiveRestore, Flag, Layers, Check, Sparkles,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

type ServiceScope = "US" | "International" | "Both"
type TabId = "overview" | "goals" | "evidence" | "matched" | "sub"

interface Geography {
  serviceScope: ServiceScope
  usStates: string[]
  countries: string[]
}

interface InitiativeEvidenceItem {
  id: string
  title: string
  content: string
  source: string
  date: string
}

interface MatchedOpportunity {
  id: string
  name: string
  funder: string
  stage: string
  deadline?: string
  matchedOn: string
}

interface Initiative {
  id: string
  name: string
  description: string
  focusAreas: string[]
  subFocusAreas: string[]
  geography: Geography
  parentId: string | null
  isArchived: boolean
  matchedOpportunitiesCount: number
  evidenceItemsCount: number
  goals: string
  needStatement: string
  evaluationPlan: string
  outcomes: string
  populationServed: string
  evidenceItems: InitiativeEvidenceItem[]
  matchedOpportunities: MatchedOpportunity[]
}

// ── Taxonomy ──────────────────────────────────────────────────────────────

const FOCUS_AREAS = [
  "Animal Welfare",
  "Community Engagement",
  "Public Health",
  "Education & Outreach",
  "Environmental / Wildlife",
]

const SUB_FOCUS_AREAS: Record<string, string[]> = {
  "Animal Welfare": ["Rescue & Intake", "Foster Care", "Spay/Neuter", "Trap-Neuter-Return (TNR)", "Adoption Services", "Wildlife Rehabilitation"],
  "Community Engagement": ["Volunteer Programs", "Community Education"],
  "Public Health": ["Veterinary Access", "Zoonotic Disease Prevention"],
  "Education & Outreach": ["Youth Programs", "Humane Education"],
  "Environmental / Wildlife": ["Habitat Conservation", "Wildlife Protection"],
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming",
]

const COUNTRIES = [
  "Australia", "Brazil", "Canada", "China", "France", "Germany", "India", "Japan",
  "Mexico", "Netherlands", "New Zealand", "South Africa", "Spain", "United Kingdom",
]

// ── Initial data ──────────────────────────────────────────────────────────

const INITIAL_INITIATIVES: Initiative[] = [
  {
    id: "rescue-intake",
    name: "Rescue & Intake Program",
    description: "Street rescue, owner surrenders, and municipal shelter transfers across Southern California.",
    focusAreas: ["Animal Welfare"],
    subFocusAreas: ["Rescue & Intake", "Adoption Services"],
    geography: { serviceScope: "US", usStates: ["California"], countries: [] },
    parentId: null,
    isArchived: false,
    matchedOpportunitiesCount: 5,
    evidenceItemsCount: 8,
    goals: "Place 1,000+ cats annually into permanent homes. Reduce euthanasia rates in partner municipal shelters by 30% over the next three years through coordinated intake agreements and targeted rescue of at-risk animals.",
    needStatement: "Over 45,000 cats enter Los Angeles County shelters each year, and a significant percentage face euthanasia due to overcrowding. Community members surrender cats because of housing instability, financial hardship, and lack of accessible veterinary care. Whisker Haven fills critical gaps by accepting municipal overflow and conducting direct street rescue in underserved neighborhoods.",
    evaluationPlan: "Track intake volume, live release rate, length of stay, and recidivism. Compare quarterly against prior-year baselines. Conduct 90-day post-adoption follow-up surveys.",
    outcomes: "94% adoption success rate over 5 years. 4,200+ cats placed since 2014. Average length of stay reduced to 22 days in 2025, down from 38 days in 2022.",
    populationServed: "Cats and kittens in Los Angeles, San Bernardino, Riverside, and Orange counties. Includes owner-surrendered animals, community cats, and municipal shelter transfers.",
    evidenceItems: [
      { id: "e1", title: "4,200+ cats placed since 2014", content: "Since our founding in 2014, Whisker Haven has successfully placed 4,200+ cats into permanent, loving homes across Los Angeles County.", source: "Whisker Haven Impact Data", date: "January 2026" },
      { id: "e2", title: "94% adoption success rate over 5 years", content: "Whisker Haven maintains a 94% adoption success rate, placing cats in permanent homes within 60 days. This places us in the top 8% of California animal welfare organizations.", source: "Whisker Haven Impact Data", date: "January 2026" },
    ],
    matchedOpportunities: [
      { id: "equitable-futures", name: "Equitable Futures Grant 2026", funder: "Ford Foundation", stage: "Active", deadline: "Jun 15, 2026", matchedOn: "Animal Welfare · California" },
      { id: "aspca-rescue", name: "Animal Welfare General Support", funder: "ASPCA", stage: "Submitted", matchedOn: "Rescue & Intake · Adoption Services" },
    ],
  },
  {
    id: "community-cat",
    name: "Community Cat Program",
    description: "Trap-Neuter-Return (TNR) program stabilizing feral and community cat colonies across Los Angeles.",
    focusAreas: ["Animal Welfare", "Environmental / Wildlife"],
    subFocusAreas: ["Trap-Neuter-Return (TNR)", "Wildlife Rehabilitation"],
    geography: { serviceScope: "US", usStates: ["California"], countries: [] },
    parentId: "rescue-intake",
    isArchived: false,
    matchedOpportunitiesCount: 2,
    evidenceItemsCount: 3,
    goals: "Manage 200+ active TNR colonies across LA County. Reduce outdoor cat populations humanely through community partnerships with municipalities and property managers.",
    needStatement: "An estimated 1.5 million unowned cats live in Los Angeles County. Without TNR intervention, outdoor cat populations double every 5–7 years. Lethal control is costly, ineffective long-term, and politically opposed by communities. TNR is the evidence-based, humane alternative endorsed by the AVMA.",
    evaluationPlan: "Track number of cats trapped, neutered, and returned. Monitor colony sizes at 6 and 12 months post-enrollment. Report colony stabilization rates annually.",
    outcomes: "12,000 animals served via spay/neuter annually, including TNR cats. Colony sizes stabilize within 18 months of consistent TNR management.",
    populationServed: "Community cats (unowned/feral) and their caretakers across Los Angeles County neighborhoods.",
    evidenceItems: [
      { id: "e3", title: "12,000 animals served via spay/neuter annually", content: "Whisker Haven's spay/neuter clinics serve approximately 12,000 animals annually, including TNR cats. This represents a 34% increase since 2022.", source: "Program Stats", date: "March 2026" },
    ],
    matchedOpportunities: [
      { id: "petco-love", name: "Lost & Found Grant 2025", funder: "Petco Love", stage: "Awarded", matchedOn: "Trap-Neuter-Return (TNR) · California" },
    ],
  },
  {
    id: "foster-network",
    name: "Foster Network",
    description: "Recruiting, training, and supporting 300+ foster caregivers providing temporary homes for cats and kittens.",
    focusAreas: ["Animal Welfare", "Community Engagement"],
    subFocusAreas: ["Foster Care", "Volunteer Programs"],
    geography: { serviceScope: "US", usStates: ["California"], countries: [] },
    parentId: null,
    isArchived: false,
    matchedOpportunitiesCount: 4,
    evidenceItemsCount: 5,
    goals: "Grow the foster caregiver network to 400 trained volunteers by end of 2026. Reduce neonatal kitten mortality by ensuring adequate foster supply during peak season (March–September).",
    needStatement: "Neonatal kittens under 4 weeks old cannot survive in a shelter environment and require round-the-clock foster care. During peak kitten season, Whisker Haven receives 50–80 kittens per week and depends entirely on volunteer fosters. Without an adequately sized network, kittens face euthanasia as the only alternative.",
    evaluationPlan: "Track foster retention rate, number of animals in foster care at any time, neonatal survival rate, and time from foster intake to adoption readiness.",
    outcomes: "300+ trained foster caregivers in LA County. 85% neonatal kitten survival rate, up from 62% in 2020.",
    populationServed: "Volunteer foster caregivers across Los Angeles County and the cats and kittens in their care.",
    evidenceItems: [
      { id: "e4", title: "300+ trained foster caregivers in LA County", content: "Our foster network includes over 300 trained caregivers across Los Angeles County, providing temporary homes for cats and kittens awaiting adoption.", source: "Foster Network Report", date: "February 2026" },
    ],
    matchedOpportunities: [
      { id: "foster-support", name: "Foster Program Support Grant", funder: "PetSmart Charities", stage: "Active", deadline: "Aug 1, 2026", matchedOn: "Foster Care · Volunteer Programs" },
      { id: "equitable-futures-2", name: "Community Voice Initiative", funder: "Ford Foundation", stage: "Submitted", matchedOn: "Community Engagement · California" },
    ],
  },
  {
    id: "spay-neuter-wellness",
    name: "Spay/Neuter & Wellness Clinics",
    description: "Low-cost and free spay/neuter and basic wellness services for owned pets in underserved communities.",
    focusAreas: ["Animal Welfare", "Public Health"],
    subFocusAreas: ["Spay/Neuter", "Veterinary Access"],
    geography: { serviceScope: "US", usStates: ["Nationwide"], countries: [] },
    parentId: null,
    isArchived: false,
    matchedOpportunitiesCount: 3,
    evidenceItemsCount: 12,
    goals: "Serve 15,000 animals annually by 2027. Expand clinic access to 3 new underserved zip codes per year. Partner with community health centers to integrate human-animal wellness services.",
    needStatement: "In low-income LA County zip codes, 40–60% of owned cats are unsterilized. Cost is the primary barrier: a private veterinary spay can exceed $400. Unsterilized pets contribute to overpopulation, and their owners face financial hardship managing unexpected litters.",
    evaluationPlan: "Track animals served per clinic, geographic reach, percentage of low-income clients served, and follow-up care adherence rates.",
    outcomes: "12,000 animals served via spay/neuter annually. 34% increase in clinic volume since 2022. Program serves clients from 47 zip codes across LA County.",
    populationServed: "Low-income pet owners with owned cats across Los Angeles County and broader Southern California.",
    evidenceItems: [
      { id: "e5", title: "12,000 animals served via spay/neuter annually", content: "Whisker Haven's spay/neuter clinics serve approximately 12,000 animals annually.", source: "Program Stats", date: "March 2026" },
      { id: "e6", title: "34% increase in clinic volume since 2022", content: "Spay/neuter clinic volume has grown 34% since 2022, driven by expanded partnerships and mobile clinic days.", source: "Program Stats", date: "March 2026" },
    ],
    matchedOpportunities: [
      { id: "ca-wellness", name: "Advancing Wellness Grant", funder: "CA Wellness Foundation", stage: "Tracking", deadline: "Oct 1, 2026", matchedOn: "Spay/Neuter · Veterinary Access · Nationwide" },
      { id: "rwj-health", name: "Health Systems Grant 2023", funder: "Robert Wood Johnson Foundation", stage: "Active", deadline: "Nov 30, 2026", matchedOn: "Public Health · Veterinary Access" },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────

function geoSummary(geo: Geography): string {
  if (geo.usStates.includes("Nationwide") && geo.countries.length === 0) return "Nationwide"
  if (geo.serviceScope === "International") {
    if (geo.countries.length === 0) return "International"
    if (geo.countries.length === 1) return geo.countries[0]
    return `International (${geo.countries.length} countries)`
  }
  if (geo.serviceScope === "Both") {
    const parts: string[] = []
    if (geo.usStates.includes("Nationwide")) parts.push("Nationwide (US)")
    else if (geo.usStates.length > 0) parts.push(`${geo.usStates.length} state${geo.usStates.length !== 1 ? "s" : ""}`)
    if (geo.countries.length > 0) parts.push(`${geo.countries.length} countr${geo.countries.length !== 1 ? "ies" : "y"}`)
    return parts.join(" + ") || "Not specified"
  }
  if (geo.usStates.includes("Nationwide")) return "Nationwide"
  if (geo.usStates.length === 0) return "Not specified"
  if (geo.usStates.length === 1) return geo.usStates[0]
  if (geo.usStates.length <= 3) return geo.usStates.join(", ")
  return `${geo.usStates.length} states`
}

function computeCompleteness(init: Initiative): number {
  const fields: (keyof Initiative)[] = [
    "name", "description", "goals", "needStatement", "evaluationPlan", "outcomes", "populationServed",
  ]
  const filled = fields.filter((f) => String(init[f] ?? "").trim().length > 0).length
  return Math.round((filled / fields.length) * 100)
}

function stageColors(stage: string): { bg: string; color: string } {
  switch (stage) {
    case "Active":    return { bg: "var(--slate-tint)",     color: "var(--slate-primary)" }
    case "Submitted": return { bg: "var(--plum-tint)",      color: "var(--plum-soft)" }
    case "Awarded":   return { bg: "var(--evergreen-tint)", color: "var(--evergreen)" }
    case "Tracking":  return { bg: "var(--surface-beige)",  color: "var(--ink-secondary)" }
    default:          return { bg: "var(--slate-tint)",     color: "var(--slate-secondary)" }
  }
}

// ── Shared button primitives ──────────────────────────────────────────────

function SlateButton({
  onClick,
  children,
  disabled,
  small,
}: {
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
  small?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: small ? "6px 12px" : "8px 16px",
        borderRadius: "var(--radius-button)",
        border: "none",
        backgroundColor: disabled ? "var(--slate-soft)" : "var(--slate-primary)",
        color: "#FFFFFF",
        fontSize: small ? 12 : 13,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background-color 150ms",
        lineHeight: "16px",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#3A4F6A" }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--slate-primary)" }}
    >
      {children}
    </button>
  )
}

function GhostButton({
  onClick,
  children,
  small,
}: {
  onClick?: () => void
  children: React.ReactNode
  small?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: small ? "5px 10px" : "7px 14px",
        borderRadius: "var(--radius-button)",
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--surface-white)",
        color: "var(--ink-secondary)",
        fontSize: small ? 12 : 13,
        fontWeight: 400,
        cursor: "pointer",
        transition: "background-color 150ms",
        lineHeight: "16px",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-white)" }}
    >
      {children}
    </button>
  )
}

// ── Chips ─────────────────────────────────────────────────────────────────

function FocusChip({ label, small }: { label: string; small?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: small ? "1px 7px" : "2px 9px",
        borderRadius: "var(--radius-pill)",
        backgroundColor: "var(--slate-tint)",
        color: "var(--slate-primary)",
        fontSize: small ? 10 : 11,
        fontWeight: 500,
        lineHeight: "16px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  )
}

function GeoChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 9px",
        borderRadius: "var(--radius-pill)",
        backgroundColor: "var(--surface-beige)",
        color: "var(--ink-secondary)",
        fontSize: 11,
        fontWeight: 500,
        lineHeight: "16px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  )
}

// ── Field label ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 6px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.07em",
        textTransform: "uppercase" as const,
        color: "var(--ink-tertiary)",
      }}
    >
      {children}
    </p>
  )
}

// ── Geography input ───────────────────────────────────────────────────────

function GeographyInput({ value, onChange }: { value: Geography; onChange: (v: Geography) => void }) {
  const [stateSearch, setStateSearch] = useState("")
  const [countrySearch, setCountrySearch] = useState("")
  const [stateOpen, setStateOpen] = useState(false)
  const [countryOpen, setCountryOpen] = useState(false)
  const stateRef = useRef<HTMLDivElement>(null)
  const countryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (stateRef.current && !stateRef.current.contains(e.target as Node)) setStateOpen(false)
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountryOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const showUS = value.serviceScope === "US" || value.serviceScope === "Both"
  const showIntl = value.serviceScope === "International" || value.serviceScope === "Both"

  function toggleState(state: string) {
    if (state === "Nationwide") {
      onChange({ ...value, usStates: value.usStates.includes("Nationwide") ? [] : ["Nationwide"] })
    } else {
      const withoutNationwide = value.usStates.filter((s) => s !== "Nationwide")
      const exists = withoutNationwide.includes(state)
      onChange({ ...value, usStates: exists ? withoutNationwide.filter((s) => s !== state) : [...withoutNationwide, state] })
    }
  }

  function toggleCountry(country: string) {
    const exists = value.countries.includes(country)
    onChange({ ...value, countries: exists ? value.countries.filter((c) => c !== country) : [...value.countries, country] })
  }

  const filteredStates = ["Nationwide", ...US_STATES].filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()))
  const filteredCountries = COUNTRIES.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase()))

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    backgroundColor: "var(--surface-white)",
    border: "1px solid var(--border-default)",
    borderRadius: 8,
    boxShadow: "0 4px 16px rgba(42,42,42,0.12)",
    zIndex: 300,
    maxHeight: 240,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  }

  const triggerStyle: React.CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid var(--border-default)",
    backgroundColor: "var(--surface-white)",
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
  }

  const checkboxStyle = (selected: boolean): React.CSSProperties => ({
    width: 14,
    height: 14,
    borderRadius: 3,
    border: `1px solid ${selected ? "var(--slate-primary)" : "var(--border-default)"}`,
    backgroundColor: selected ? "var(--slate-primary)" : "transparent",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  })

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Service scope */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 6, display: "block" }}>
          Service scope
        </label>
        <div style={{ display: "flex", borderRadius: 8, border: "1px solid var(--border-default)", overflow: "hidden", width: "fit-content" }}>
          {(["US", "International", "Both"] as ServiceScope[]).map((scope, idx) => {
            const active = value.serviceScope === scope
            return (
              <button
                key={scope}
                type="button"
                onClick={() => onChange({ ...value, serviceScope: scope })}
                style={{
                  padding: "7px 14px",
                  border: "none",
                  borderRight: idx < 2 ? "1px solid var(--border-default)" : "none",
                  backgroundColor: active ? "var(--slate-primary)" : "var(--surface-white)",
                  color: active ? "#FFFFFF" : "var(--ink-secondary)",
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                  transition: "background-color 150ms, color 150ms",
                }}
              >
                {scope}
              </button>
            )
          })}
        </div>
      </div>

      {/* US states */}
      {showUS && (
        <div ref={stateRef} style={{ position: "relative" }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 4, display: "block" }}>
            US states
          </label>
          <button type="button" onClick={() => setStateOpen((o) => !o)} style={{ ...triggerStyle, color: value.usStates.length ? "var(--ink)" : "var(--ink-tertiary)" }}>
            <span>
              {value.usStates.length === 0 ? "Select states..." : value.usStates.includes("Nationwide") ? "Nationwide" : value.usStates.length <= 3 ? value.usStates.join(", ") : `${value.usStates.length} states selected`}
            </span>
            <ChevronDown size={14} color="var(--ink-tertiary)" />
          </button>
          {stateOpen && (
            <div style={dropdownStyle}>
              <div style={{ padding: "8px 8px 0" }}>
                <input placeholder="Search states..." value={stateSearch} onChange={(e) => setStateSearch(e.target.value)}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-default)", fontSize: 12, outline: "none", boxSizing: "border-box" as const, backgroundColor: "var(--canvas)" }}
                />
              </div>
              <div style={{ overflowY: "auto" as const, padding: "4px 0 6px" }}>
                {filteredStates.map((state) => {
                  const selected = value.usStates.includes(state)
                  const disabled = state !== "Nationwide" && value.usStates.includes("Nationwide")
                  return (
                    <button key={state} type="button" onClick={() => !disabled && toggleState(state)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", border: "none", backgroundColor: selected ? "var(--slate-tint)" : "transparent", fontSize: 13, color: disabled ? "var(--ink-tertiary)" : "var(--ink)", cursor: disabled ? "not-allowed" : "pointer", textAlign: "left", fontWeight: state === "Nationwide" ? 500 : 400 }}
                    >
                      <div style={checkboxStyle(selected)}>
                        {selected && <Check size={10} color="#fff" />}
                      </div>
                      {state}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Countries */}
      {showIntl && (
        <div ref={countryRef} style={{ position: "relative" }}>
          <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 4, display: "block" }}>
            Countries
          </label>
          <button type="button" onClick={() => setCountryOpen((o) => !o)} style={{ ...triggerStyle, color: value.countries.length ? "var(--ink)" : "var(--ink-tertiary)" }}>
            <span>
              {value.countries.length === 0 ? "Select countries..." : value.countries.length === 1 ? value.countries[0] : `${value.countries.length} countries selected`}
            </span>
            <ChevronDown size={14} color="var(--ink-tertiary)" />
          </button>
          {countryOpen && (
            <div style={dropdownStyle}>
              <div style={{ padding: "8px 8px 0" }}>
                <input placeholder="Search countries..." value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)}
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-default)", fontSize: 12, outline: "none", boxSizing: "border-box" as const, backgroundColor: "var(--canvas)" }}
                />
              </div>
              <div style={{ overflowY: "auto" as const, padding: "4px 0 6px" }}>
                {filteredCountries.map((country) => {
                  const selected = value.countries.includes(country)
                  return (
                    <button key={country} type="button" onClick={() => toggleCountry(country)}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", border: "none", backgroundColor: selected ? "var(--slate-tint)" : "transparent", fontSize: 13, color: "var(--ink)", cursor: "pointer", textAlign: "left" }}
                    >
                      <div style={checkboxStyle(selected)}>
                        {selected && <Check size={10} color="#fff" />}
                      </div>
                      {country}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Multi-select dropdown ─────────────────────────────────────────────────

function MultiSelectDropdown({ label, options, value, onChange, placeholder }: {
  label: string; options: string[]; value: string[]; onChange: (v: string[]) => void; placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 4, display: "block" }}>
        {label}
      </label>
      <button type="button" onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-default)", backgroundColor: "var(--surface-white)", fontSize: 13, color: value.length ? "var(--ink)" : "var(--ink-tertiary)", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {value.length === 0 ? placeholder : value.length === 1 ? value[0] : `${value.length} selected`}
        </span>
        <ChevronDown size={14} color="var(--ink-tertiary)" />
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", borderRadius: 8, boxShadow: "0 4px 16px rgba(42,42,42,0.12)", zIndex: 300, maxHeight: 220, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "8px 8px 0" }}>
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border-default)", fontSize: 12, outline: "none", boxSizing: "border-box" as const, backgroundColor: "var(--canvas)" }}
            />
          </div>
          <div style={{ overflowY: "auto" as const, padding: "4px 0 6px" }}>
            {filtered.map((opt) => {
              const selected = value.includes(opt)
              return (
                <button key={opt} type="button" onClick={() => onChange(selected ? value.filter((v) => v !== opt) : [...value, opt])}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", border: "none", backgroundColor: selected ? "var(--slate-tint)" : "transparent", fontSize: 13, color: "var(--ink)", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${selected ? "var(--slate-primary)" : "var(--border-default)"}`, backgroundColor: selected ? "var(--slate-primary)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {selected && <Check size={10} color="#fff" />}
                  </div>
                  {opt}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Create Initiative Modal ───────────────────────────────────────────────

interface CreateFormData {
  name: string
  description: string
  geography: Geography
  focusAreas: string[]
  subFocusAreas: string[]
  parentId: string | null
}

function CreateInitiativeModal({
  open,
  onClose,
  onCreate,
  initiatives,
  defaultParentId,
}: {
  open: boolean
  onClose: () => void
  onCreate: (data: CreateFormData) => void
  initiatives: Initiative[]
  defaultParentId?: string | null
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [geography, setGeography] = useState<Geography>({ serviceScope: "US", usStates: [], countries: [] })
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [subFocusAreas, setSubFocusAreas] = useState<string[]>([])
  const [parentId, setParentId] = useState<string | null>(defaultParentId ?? null)

  useEffect(() => {
    if (open) {
      setName(""); setDescription(""); setFocusAreas([]); setSubFocusAreas([])
      setGeography({ serviceScope: "US", usStates: [], countries: [] })
      setParentId(defaultParentId ?? null)
    }
  }, [open, defaultParentId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && open) onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const availableSubs = focusAreas.flatMap((fa) => SUB_FOCUS_AREAS[fa] ?? [])
  const parentOptions = initiatives.filter((i) => !i.isArchived && i.parentId === null)
  const canCreate = name.trim().length > 0

  if (!open) return null

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(42,42,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 400 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: 600, maxWidth: "90vw", maxHeight: "90vh", backgroundColor: "var(--surface-white)", borderRadius: 12, boxShadow: "0 16px 48px rgba(42,42,42,0.18)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, fontFamily: "var(--font-lora)", color: "var(--ink)", letterSpacing: "-0.01em", lineHeight: "22px" }}>
              {defaultParentId ? "New sub-initiative" : "New initiative"}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-secondary)" }}>
              Define this program area to improve Discover matching and proposal quality.
            </p>
          </div>
          <button type="button" onClick={onClose}
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid var(--border-default)", backgroundColor: "transparent", cursor: "pointer", flexShrink: 0 }}
          >
            <X size={14} color="var(--ink-secondary)" />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto" as const, padding: "20px 24px", flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Name */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 4, display: "block" }}>
                Name <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Rescue & Intake Program"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", backgroundColor: "var(--surface-white)", outline: "none", boxSizing: "border-box" as const }}
              />
            </div>

            {/* Description */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 4, display: "block" }}>
                Description <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="One sentence describing this program area"
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", backgroundColor: "var(--surface-white)", outline: "none", boxSizing: "border-box" as const }}
              />
            </div>

            {/* Focus areas */}
            <MultiSelectDropdown label="Focus areas" options={FOCUS_AREAS} value={focusAreas} onChange={setFocusAreas} placeholder="Select focus areas..." />

            {/* Sub-focus areas */}
            {availableSubs.length > 0 && (
              <MultiSelectDropdown label="Sub-focus areas (optional)" options={availableSubs} value={subFocusAreas} onChange={setSubFocusAreas} placeholder="Select sub-focus areas..." />
            )}

            {/* Geography */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 6, display: "block" }}>
                Geographic area <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <GeographyInput value={geography} onChange={setGeography} />
            </div>

            {/* Parent initiative */}
            {!defaultParentId && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", marginBottom: 4, display: "block" }}>
                  Parent initiative (optional)
                </label>
                <select
                  value={parentId ?? ""}
                  onChange={(e) => setParentId(e.target.value || null)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: 13, color: parentId ? "var(--ink)" : "var(--ink-tertiary)", backgroundColor: "var(--surface-white)", outline: "none", boxSizing: "border-box" as const, cursor: "pointer" }}
                >
                  <option value="">None — standalone initiative</option>
                  {parentOptions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, padding: "16px 24px 20px", borderTop: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <SlateButton
            onClick={() => canCreate && onCreate({ name: name.trim(), description, geography, focusAreas, subFocusAreas, parentId })}
            disabled={!canCreate}
          >
            Create initiative
          </SlateButton>
        </div>
      </div>
    </div>
  )
}

// ── Inline field edit modal ───────────────────────────────────────────────

function InlineEditModal({
  open, label, value, onSave, onClose,
}: {
  open: boolean; label: string; value: string; onSave: (v: string) => void; onClose: () => void
}) {
  const [text, setText] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (open) { setText(value); setTimeout(() => ref.current?.focus(), 60) } }, [open, value])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && open) onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(42,42,42,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: 580, backgroundColor: "var(--surface-white)", borderRadius: 12, boxShadow: "0 16px 48px rgba(42,42,42,0.18)", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border-default)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, fontFamily: "var(--font-lora)", color: "var(--ink)" }}>{label}</h3>
          <button type="button" onClick={onClose} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border-default)", backgroundColor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={14} color="var(--ink-secondary)" />
          </button>
        </div>
        <div style={{ padding: 20 }}>
          <textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)} rows={6}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", backgroundColor: "var(--canvas)", outline: "none", resize: "vertical" as const, lineHeight: "20px", boxSizing: "border-box" as const, fontFamily: "inherit" }}
          />
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <SlateButton onClick={() => { onSave(text.trim()); onClose() }}>Save</SlateButton>
        </div>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 64, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: "var(--slate-tint)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
        <Layers size={28} color="var(--slate-secondary)" />
      </div>
      <h2 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 500, fontFamily: "var(--font-lora)", color: "var(--ink)", letterSpacing: "-0.01em" }}>
        No initiatives yet
      </h2>
      <p style={{ margin: "0 0 28px", fontSize: 14, color: "var(--ink-secondary)", maxWidth: 420, lineHeight: "22px" }}>
        Initiatives are your org&rsquo;s program areas. They tell GA what work you do so it can match opportunities, build proposals, and surface evidence.
      </p>
      <SlateButton onClick={onNew}>
        <Plus size={14} />
        Create your first initiative
      </SlateButton>
    </div>
  )
}

// ── Completeness bar ──────────────────────────────────────────────────────

function CompletenessBar({ pct }: { pct: number }) {
  const barColor = pct >= 80 ? "var(--evergreen)" : pct >= 50 ? "var(--terracotta)" : "var(--amber)"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: "var(--border-default)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, backgroundColor: barColor, transition: "width 400ms ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", whiteSpace: "nowrap" }}>
        Initiative profile {pct}% complete
      </span>
    </div>
  )
}

// ── Enrichment prompt ─────────────────────────────────────────────────────

function EnrichmentPrompt({ field, hint, onAdd }: { field: string; hint: string; onAdd: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onAdd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px",
        borderRadius: 8, border: `1px dashed ${hovered ? "var(--slate-secondary)" : "var(--slate-soft)"}`,
        background: "var(--gradient-ai-wash)", cursor: "pointer", width: "100%", textAlign: "left",
        transition: "border-color 150ms",
      }}
    >
      <Sparkles size={14} style={{ color: "var(--slate-secondary)", marginTop: 1, flexShrink: 0 }} />
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--slate-primary)" }}>Add {field}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-secondary)" }}>{hint}</p>
      </div>
    </button>
  )
}

// ── FieldSection (read mode with edit button) ─────────────────────────────

function FieldSection({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <FieldLabel>{label}</FieldLabel>
        <button type="button" onClick={onEdit}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4, color: "var(--slate-secondary)", fontSize: 12 }}
        >
          <Pencil size={12} /> Edit
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--ink)", lineHeight: "21px" }}>{value}</p>
    </div>
  )
}

// ── Tab: Overview ─────────────────────────────────────────────────────────

function OverviewTab({ initiative, onEditField }: { initiative: Initiative; onEditField: (f: keyof Initiative) => void }) {
  const geo = initiative.geography

  function geoDetail(): string {
    if (geo.usStates.includes("Nationwide") && geo.countries.length === 0) return "Nationwide (US)"
    const parts: string[] = []
    if (geo.usStates.length > 0 && !geo.usStates.includes("Nationwide")) parts.push(`States: ${geo.usStates.join(", ")}`)
    if (geo.countries.length > 0) parts.push(`Countries: ${geo.countries.join(", ")}`)
    return parts.join(" · ") || "Not specified"
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <FieldSection label="Description" value={initiative.description} onEdit={() => onEditField("description")} />

      <div>
        <FieldLabel>Geographic area</FieldLabel>
        <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 500, color: "var(--ink-tertiary)", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
          Service scope: {geo.serviceScope}
        </p>
        <p style={{ margin: 0, fontSize: 14, color: "var(--ink)" }}>{geoDetail()}</p>
      </div>

      {initiative.populationServed ? (
        <FieldSection label="Population served" value={initiative.populationServed} onEdit={() => onEditField("populationServed")} />
      ) : (
        <div>
          <FieldLabel>Population served</FieldLabel>
          <EnrichmentPrompt field="population served" hint="Describe who benefits from this program area." onAdd={() => onEditField("populationServed")} />
        </div>
      )}

      <div>
        <FieldLabel>Focus areas</FieldLabel>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {initiative.focusAreas.map((fa) => <FocusChip key={fa} label={fa} />)}
          {initiative.subFocusAreas.map((sfa) => (
            <span key={sfa} style={{ display: "inline-block", padding: "2px 9px", borderRadius: "var(--radius-pill)", backgroundColor: "var(--surface-beige)", color: "var(--ink-secondary)", fontSize: 11, fontWeight: 400 }}>
              {sfa}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Goals & impact ───────────────────────────────────────────────────

function GoalsTab({ initiative, onEditField }: { initiative: Initiative; onEditField: (f: keyof Initiative) => void }) {
  const sections: { key: keyof Initiative; label: string; hint: string }[] = [
    { key: "goals", label: "Goals and objectives", hint: "A complete goals statement helps GA write stronger proposals." },
    { key: "needStatement", label: "Need statement", hint: "A complete need statement helps GA write stronger proposals." },
    { key: "evaluationPlan", label: "Evaluation plan", hint: "Describe how you measure impact. Funders value this highly." },
    { key: "outcomes", label: "Outcomes and impact", hint: "Document what you've achieved. GA surfaces these in proposals automatically." },
  ]
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {sections.map(({ key, label, hint }) => {
        const val = initiative[key] as string
        return val ? (
          <FieldSection key={key} label={label} value={val} onEdit={() => onEditField(key)} />
        ) : (
          <div key={key}>
            <FieldLabel>{label}</FieldLabel>
            <EnrichmentPrompt field={label.toLowerCase()} hint={hint} onAdd={() => onEditField(key)} />
          </div>
        )
      })}
    </div>
  )
}

// ── Tab: Evidence ─────────────────────────────────────────────────────────

function EvidenceTab({ initiative }: { initiative: Initiative }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const items = initiative.evidenceItems

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "var(--ink-secondary)" }}>
          {items.length} evidence {items.length === 1 ? "item" : "items"}
        </span>
        <GhostButton small>
          <Plus size={13} /> Add evidence item
        </GhostButton>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-tertiary)", fontSize: 13 }}>
          No evidence items yet. Add proof points, statistics, and outcomes tied to this initiative.
        </div>
      ) : (
        <div style={{ borderRadius: 10, border: "1px solid var(--border-default)", overflow: "hidden" }}>
          {items.map((item, i) => {
            const isLast = i === items.length - 1
            const isOpen = expanded === item.id
            return (
              <div key={item.id} style={{ borderBottom: isLast ? "none" : "1px solid var(--border-default)" }}>
                <button type="button" onClick={() => setExpanded(isOpen ? null : item.id)}
                  style={{ width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "14px 16px", border: "none", backgroundColor: isOpen ? "var(--canvas)" : "var(--surface-white)", cursor: "pointer", textAlign: "left", gap: 12, transition: "background-color 150ms" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{item.title}</p>
                    {!isOpen && <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ink-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.source} · {item.date}</p>}
                  </div>
                  {isOpen ? <ChevronUp size={16} color="var(--ink-tertiary)" /> : <ChevronDown size={16} color="var(--ink-tertiary)" />}
                </button>
                {isOpen && (
                  <div style={{ padding: "0 16px 16px", backgroundColor: "var(--canvas)", borderTop: "1px solid var(--border-default)" }}>
                    <p style={{ margin: "12px 0 6px", fontSize: 13, color: "var(--ink)", lineHeight: "19px" }}>{item.content}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--ink-tertiary)" }}>{item.source} · {item.date}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Tab: Matched opportunities ────────────────────────────────────────────

function MatchedTab({ initiative }: { initiative: Initiative }) {
  const opps = initiative.matchedOpportunities
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "var(--ink-secondary)" }}>
          {opps.length} matched {opps.length === 1 ? "opportunity" : "opportunities"}
        </span>
      </div>
      {opps.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-tertiary)", fontSize: 13 }}>
          No matched opportunities yet. New opportunities will appear here as they&rsquo;re discovered.
        </div>
      ) : (
        <div style={{ borderRadius: 10, border: "1px solid var(--border-default)", overflow: "hidden" }}>
          {opps.map((opp, i) => {
            const isLast = i === opps.length - 1
            const badge = stageColors(opp.stage)
            return (
              <Link key={opp.id} href={`/opportunity/${opp.id}`}
                style={{ display: "flex", alignItems: "center", padding: "14px 16px", borderBottom: isLast ? "none" : "1px solid var(--border-default)", backgroundColor: "var(--surface-white)", textDecoration: "none", gap: 12, transition: "background-color 150ms" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--canvas)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--surface-white)" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{opp.name}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ink-secondary)" }}>
                    {opp.funder}{opp.deadline ? ` · Due ${opp.deadline}` : ""}
                  </p>
                  <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--ink-tertiary)" }}>Matched on: {opp.matchedOn}</p>
                </div>
                <span style={{ flexShrink: 0, padding: "2px 10px", borderRadius: "var(--radius-pill)", fontSize: 11, fontWeight: 500, backgroundColor: badge.bg, color: badge.color }}>
                  {opp.stage}
                </span>
                <ChevronRight size={14} color="var(--ink-tertiary)" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Tab: Sub-initiatives ──────────────────────────────────────────────────

function SubInitiativesTab({ parentId, initiatives, onSelect, onNewSub }: {
  parentId: string; initiatives: Initiative[]; onSelect: (id: string) => void; onNewSub: () => void
}) {
  const children = initiatives.filter((i) => i.parentId === parentId && !i.isArchived)
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "var(--ink-secondary)" }}>
          {children.length} sub-{children.length === 1 ? "initiative" : "initiatives"}
        </span>
        <GhostButton small onClick={onNewSub}>
          <Plus size={13} /> Add sub-initiative
        </GhostButton>
      </div>
      {children.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-tertiary)", fontSize: 13 }}>
          No sub-initiatives yet. Add one to group related program areas under this initiative.
        </div>
      ) : (
        <div style={{ borderRadius: 10, border: "1px solid var(--border-default)", overflow: "hidden" }}>
          {children.map((child, i) => {
            const isLast = i === children.length - 1
            return (
              <button key={child.id} type="button" onClick={() => onSelect(child.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", border: "none", borderBottom: isLast ? "none" : "1px solid var(--border-default)", backgroundColor: "var(--surface-white)", cursor: "pointer", textAlign: "left", transition: "background-color 150ms" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--canvas)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface-white)" }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{child.name}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--ink-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{child.description}</p>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {child.focusAreas.slice(0, 1).map((fa) => <FocusChip key={fa} label={fa} small />)}
                </div>
                <ChevronRight size={14} color="var(--ink-tertiary)" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Initiative detail view ────────────────────────────────────────────────

const DETAIL_TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "goals", label: "Goals & impact" },
  { id: "evidence", label: "Evidence" },
  { id: "matched", label: "Matched opportunities" },
  { id: "sub", label: "Sub-initiatives" },
]

const FIELD_LABELS: Partial<Record<keyof Initiative, string>> = {
  description: "Description",
  goals: "Goals and objectives",
  needStatement: "Need statement",
  evaluationPlan: "Evaluation plan",
  outcomes: "Outcomes and impact",
  populationServed: "Population served",
}

function InitiativeDetail({
  initiative,
  initiatives,
  onBack,
  onArchive,
  onRestore,
  onUpdate,
  onSelectInitiative,
  onNewSub,
}: {
  initiative: Initiative
  initiatives: Initiative[]
  onBack: () => void
  onArchive: () => void
  onRestore: () => void
  onUpdate: (id: string, updates: Partial<Initiative>) => void
  onSelectInitiative: (id: string) => void
  onNewSub: () => void
}) {
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [editField, setEditField] = useState<keyof Initiative | null>(null)

  const parent = initiative.parentId ? initiatives.find((i) => i.id === initiative.parentId) ?? null : null
  const hasChildren = initiatives.some((i) => i.parentId === initiative.id && !i.isArchived)
  const pct = computeCompleteness(initiative)

  const visibleTabs = DETAIL_TABS.filter((t) => {
    if (t.id === "sub") return hasChildren || true
    return true
  })

  return (
    <div className="flex flex-1 flex-col" style={{ overflow: "hidden", minHeight: 0 }}>

      {editField && (
        <InlineEditModal
          open
          label={FIELD_LABELS[editField] ?? String(editField)}
          value={String(initiative[editField] ?? "")}
          onSave={(v) => onUpdate(initiative.id, { [editField]: v })}
          onClose={() => setEditField(null)}
        />
      )}

      {/* Header */}
      <div style={{ flexShrink: 0, borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--surface-white)", padding: "16px 32px 0" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "var(--ink-tertiary)" }}>Workspace</span>
          <ChevronRight size={12} color="var(--ink-tertiary)" />
          <button type="button" onClick={onBack} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 12, color: "var(--slate-secondary)" }}>
            Initiatives
          </button>
          <ChevronRight size={12} color="var(--ink-tertiary)" />
          <span style={{ fontSize: 12, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 280 }}>{initiative.name}</span>
        </div>

        {/* Title + actions */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 500, fontFamily: "var(--font-lora)", color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: "32px" }}>
            {initiative.name}
          </h1>
          <div style={{ display: "flex", gap: 8, flexShrink: 0, paddingTop: 4 }}>
            {initiative.isArchived ? (
              <GhostButton onClick={onRestore}>
                <ArchiveRestore size={14} /> Restore
              </GhostButton>
            ) : (
              <>
                <GhostButton onClick={() => setEditField("description")}>
                  <Pencil size={14} /> Edit
                </GhostButton>
                <GhostButton onClick={onArchive}>
                  <Archive size={14} /> Archive
                </GhostButton>
                <GhostButton onClick={onNewSub}>
                  <Plus size={14} /> New sub-initiative
                </GhostButton>
              </>
            )}
          </div>
        </div>

        {/* Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {initiative.focusAreas.map((fa) => <FocusChip key={fa} label={fa} />)}
          <GeoChip label={geoSummary(initiative.geography)} />
          {parent && (
            <button type="button" onClick={() => onSelectInitiative(parent.id)}
              style={{ padding: "2px 9px", borderRadius: "var(--radius-pill)", backgroundColor: "var(--terracotta-tint)", color: "var(--terracotta)", fontSize: 11, fontWeight: 500, border: "none", cursor: "pointer" }}
            >
              Sub-initiative of {parent.name}
            </button>
          )}
        </div>

        {/* Completeness bar */}
        {!initiative.isArchived && (
          <div style={{ marginBottom: 14, maxWidth: 500 }}>
            <CompletenessBar pct={pct} />
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 2 }}>
          {visibleTabs.map(({ id, label }) => {
            const isActive = activeTab === id
            return (
              <button key={id} type="button" onClick={() => setActiveTab(id)}
                style={{ position: "relative", padding: "8px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: isActive ? 600 : 400, color: isActive ? "var(--slate-primary)" : "var(--ink-secondary)", transition: "color 150ms", whiteSpace: "nowrap" }}
              >
                {label}
                {isActive && (
                  <div style={{ position: "absolute", bottom: 0, left: 14, right: 14, height: 2, borderRadius: 1, backgroundColor: "var(--slate-primary)" }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: "auto" as const, padding: "28px 32px", maxWidth: 900 }}>
        {activeTab === "overview" && <OverviewTab initiative={initiative} onEditField={setEditField} />}
        {activeTab === "goals" && <GoalsTab initiative={initiative} onEditField={setEditField} />}
        {activeTab === "evidence" && <EvidenceTab initiative={initiative} />}
        {activeTab === "matched" && <MatchedTab initiative={initiative} />}
        {activeTab === "sub" && (
          <SubInitiativesTab
            parentId={initiative.id}
            initiatives={initiatives}
            onSelect={onSelectInitiative}
            onNewSub={onNewSub}
          />
        )}
      </div>
    </div>
  )
}

// ── Initiative list row ───────────────────────────────────────────────────

function InitiativeRow({ initiative, onClick, onArchive, onRestore, indented }: {
  initiative: Initiative; onClick: () => void; onArchive: () => void; onRestore: () => void; indented?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const geo = geoSummary(initiative.geography)
  const visibleChips = initiative.focusAreas.slice(0, 2)
  const extra = initiative.focusAreas.length - 2

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: `14px 20px`,
        paddingLeft: indented ? 48 : 20,
        borderBottom: "1px solid var(--border-default)",
        cursor: "pointer",
        backgroundColor: hovered ? "var(--slate-tint)" : (initiative.isArchived ? "#F8F4EE" : "var(--surface-white)"),
        transition: "background-color 150ms",
        opacity: initiative.isArchived ? 0.8 : 1,
        gap: 16,
      }}
    >
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: initiative.isArchived ? "var(--ink-secondary)" : "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {initiative.name}
          </span>
          {initiative.isArchived && (
            <span style={{ fontSize: 10, fontWeight: 500, color: "var(--ink-tertiary)", backgroundColor: "var(--border-default)", padding: "1px 6px", borderRadius: 20, flexShrink: 0 }}>
              Archived
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: "var(--ink-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", marginBottom: 5, lineHeight: "16px" }}>
          {initiative.description}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {visibleChips.map((fa) => <FocusChip key={fa} label={fa} small />)}
          {extra > 0 && <span style={{ fontSize: 10, color: "var(--ink-tertiary)" }}>+{extra} more</span>}
        </div>
      </div>

      {/* Stats columns */}
      <div style={{ display: "flex", gap: 0, alignItems: "center", flexShrink: 0 }}>
        <div style={{ textAlign: "right", minWidth: 130, paddingRight: 24 }}>
          <span style={{ fontSize: 12, color: "var(--ink-secondary)" }}>{geo}</span>
        </div>
        <div style={{ textAlign: "right", minWidth: 145, paddingRight: 24 }}>
          <span style={{ fontSize: 12, color: "var(--ink-secondary)" }}>
            {initiative.matchedOpportunitiesCount} matched {initiative.matchedOpportunitiesCount === 1 ? "opportunity" : "opportunities"}
          </span>
        </div>
        <div style={{ textAlign: "right", minWidth: 110, paddingRight: 16 }}>
          <span style={{ fontSize: 12, color: "var(--ink-secondary)" }}>
            {initiative.evidenceItemsCount} evidence {initiative.evidenceItemsCount === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Row actions */}
        <div
          style={{ display: "flex", gap: 4, opacity: hovered ? 1 : 0, transition: "opacity 150ms", flexShrink: 0, width: 36 }}
          onClick={(e) => e.stopPropagation()}
        >
          {initiative.isArchived ? (
            <button type="button" title="Restore" onClick={onRestore}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid var(--border-default)", backgroundColor: "var(--surface-white)", cursor: "pointer" }}
            >
              <ArchiveRestore size={13} color="var(--evergreen)" />
            </button>
          ) : (
            <button type="button" title="Archive" onClick={onArchive}
              style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, border: "1px solid var(--border-default)", backgroundColor: "var(--surface-white)", cursor: "pointer" }}
            >
              <Archive size={13} color="var(--ink-secondary)" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Initiatives list view ─────────────────────────────────────────────────

function InitiativesList({ initiatives, onSelect, onArchive, onRestore, onNew }: {
  initiatives: Initiative[]
  onSelect: (id: string) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onNew: () => void
}) {
  const [search, setSearch] = useState("")
  const [focusFilter, setFocusFilter] = useState<string[]>([])
  const [view, setView] = useState<"active" | "archived">("active")
  const [focusOpen, setFocusOpen] = useState(false)
  const focusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (focusRef.current && !focusRef.current.contains(e.target as Node)) setFocusOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const activeList = initiatives.filter((i) => !i.isArchived)
  const archivedList = initiatives.filter((i) => i.isArchived)
  const sourceList = view === "active" ? activeList : archivedList

  const filtered = sourceList.filter((i) => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase())
    const matchFocus = focusFilter.length === 0 || i.focusAreas.some((fa) => focusFilter.includes(fa))
    return matchSearch && matchFocus
  })

  // Build ordered list: parents then their children inline
  const parents = filtered.filter((i) => i.parentId === null)
  const ordered: { initiative: Initiative; indented: boolean }[] = []
  parents.forEach((p) => {
    ordered.push({ initiative: p, indented: false })
    filtered.filter((i) => i.parentId === p.id).forEach((c) => ordered.push({ initiative: c, indented: true }))
  })
  filtered.filter((i) => i.parentId !== null && !parents.find((p) => p.id === i.parentId)).forEach((c) => ordered.push({ initiative: c, indented: false }))

  const trueEmpty = activeList.length === 0 && search === "" && focusFilter.length === 0 && view === "active"

  return (
    <div className="flex flex-1 flex-col" style={{ overflow: "hidden", minHeight: 0 }}>

      {/* Page header */}
      <div style={{ flexShrink: 0, padding: "20px 32px 14px", borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--surface-white)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 500, fontFamily: "var(--font-lora)", color: "var(--ink)", letterSpacing: "-0.02em", lineHeight: "30px" }}>
              Initiatives
            </h1>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink-secondary)", backgroundColor: "var(--slate-tint)", padding: "2px 8px", borderRadius: 20 }}>
              {activeList.length}
            </span>
          </div>
          <SlateButton onClick={onNew}>
            <Plus size={14} /> New initiative
          </SlateButton>
        </div>

        {/* Filters row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "0 0 300px" }}>
            <Search size={14} color="var(--ink-tertiary)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search initiatives..."
              style={{ width: "100%", paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, borderRadius: 8, border: "1px solid var(--border-default)", fontSize: 13, color: "var(--ink)", backgroundColor: "var(--surface-white)", outline: "none", boxSizing: "border-box" as const }}
            />
          </div>

          {/* Focus area filter */}
          <div ref={focusRef} style={{ position: "relative" }}>
            <button type="button" onClick={() => setFocusOpen((o) => !o)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 8,
                border: `1px solid ${focusFilter.length ? "var(--slate-primary)" : "var(--border-default)"}`,
                backgroundColor: focusFilter.length ? "var(--slate-tint)" : "var(--surface-white)",
                color: focusFilter.length ? "var(--slate-primary)" : "var(--ink-secondary)",
                fontSize: 13, cursor: "pointer", transition: "all 150ms",
              }}
            >
              <Flag size={13} />
              Focus area
              {focusFilter.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, backgroundColor: "var(--slate-primary)", color: "#fff", borderRadius: 20, padding: "0 5px", lineHeight: "16px" }}>
                  {focusFilter.length}
                </span>
              )}
              <ChevronDown size={13} />
            </button>
            {focusOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 210, backgroundColor: "var(--surface-white)", border: "1px solid var(--border-default)", borderRadius: 8, boxShadow: "0 4px 16px rgba(42,42,42,0.12)", zIndex: 200, padding: "4px 0" }}>
                {FOCUS_AREAS.map((fa) => {
                  const sel = focusFilter.includes(fa)
                  return (
                    <button key={fa} type="button" onClick={() => setFocusFilter(sel ? focusFilter.filter((f) => f !== fa) : [...focusFilter, fa])}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", border: "none", backgroundColor: sel ? "var(--slate-tint)" : "transparent", fontSize: 13, color: "var(--ink)", cursor: "pointer", textAlign: "left" }}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: 3, border: `1px solid ${sel ? "var(--slate-primary)" : "var(--border-default)"}`, backgroundColor: sel ? "var(--slate-primary)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {sel && <Check size={10} color="#fff" />}
                      </div>
                      {fa}
                    </button>
                  )
                })}
                {focusFilter.length > 0 && (
                  <>
                    <div style={{ height: 1, backgroundColor: "var(--border-default)", margin: "4px 0" }} />
                    <button type="button" onClick={() => setFocusFilter([])} style={{ width: "100%", padding: "6px 12px", border: "none", backgroundColor: "transparent", fontSize: 12, color: "var(--slate-secondary)", cursor: "pointer", textAlign: "left" }}>
                      Clear filter
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Active / Archived segmented control */}
          <div style={{ display: "flex", borderRadius: 8, border: "1px solid var(--border-default)", overflow: "hidden", marginLeft: "auto" }}>
            {(["active", "archived"] as const).map((v, idx) => {
              const active = view === v
              return (
                <button key={v} type="button" onClick={() => setView(v)}
                  style={{
                    padding: "7px 16px", border: "none", borderRight: idx === 0 ? "1px solid var(--border-default)" : "none",
                    backgroundColor: active ? "var(--slate-primary)" : "var(--surface-white)",
                    color: active ? "#FFFFFF" : "var(--ink-secondary)",
                    fontSize: 12, fontWeight: active ? 600 : 400, cursor: "pointer",
                    transition: "background-color 150ms, color 150ms", textTransform: "capitalize" as const,
                  }}
                >
                  {v}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* List body */}
      <div style={{ flex: 1, overflowY: "auto" as const, backgroundColor: "var(--canvas)" }}>
        {trueEmpty ? (
          <EmptyState onNew={onNew} />
        ) : ordered.length === 0 ? (
          <div style={{ padding: "48px 32px", textAlign: "center", color: "var(--ink-tertiary)", fontSize: 14 }}>
            No initiatives match your filters.
          </div>
        ) : (
          <div>
            {/* Column headers */}
            <div style={{ display: "flex", alignItems: "center", padding: "8px 20px", borderBottom: "1px solid var(--border-default)", backgroundColor: "var(--canvas)" }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "var(--ink-tertiary)" }}>Initiative</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "var(--ink-tertiary)", minWidth: 130, textAlign: "right", paddingRight: 24 }}>Geography</span>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "var(--ink-tertiary)", minWidth: 145, textAlign: "right", paddingRight: 24 }}>Matched</span>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: "var(--ink-tertiary)", minWidth: 110, textAlign: "right", paddingRight: 16 }}>Evidence</span>
                <div style={{ width: 36 }} />
              </div>
            </div>

            {/* Rows */}
            <div style={{ backgroundColor: "var(--surface-white)" }}>
              {ordered.map(({ initiative, indented }) => (
                <InitiativeRow
                  key={initiative.id}
                  initiative={initiative}
                  onClick={() => onSelect(initiative.id)}
                  onArchive={() => onArchive(initiative.id)}
                  onRestore={() => onRestore(initiative.id)}
                  indented={indented}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page root ──────────────────────────────────────────────────────────────

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>(INITIAL_INITIATIVES)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null)

  const selected = selectedId ? (initiatives.find((i) => i.id === selectedId) ?? null) : null

  const handleCreate = useCallback((data: CreateFormData) => {
    const newInit: Initiative = {
      id: `init-${Date.now()}`,
      name: data.name,
      description: data.description,
      focusAreas: data.focusAreas,
      subFocusAreas: data.subFocusAreas,
      geography: data.geography,
      parentId: data.parentId,
      isArchived: false,
      matchedOpportunitiesCount: 0,
      evidenceItemsCount: 0,
      goals: "",
      needStatement: "",
      evaluationPlan: "",
      outcomes: "",
      populationServed: "",
      evidenceItems: [],
      matchedOpportunities: [],
    }
    setInitiatives((prev) => [newInit, ...prev])
    setShowCreate(false)
    setDefaultParentId(null)
    setSelectedId(newInit.id)
  }, [])

  const handleArchive = useCallback((id: string) => {
    setInitiatives((prev) => prev.map((i) => i.id === id ? { ...i, isArchived: true } : i))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const handleRestore = useCallback((id: string) => {
    setInitiatives((prev) => prev.map((i) => i.id === id ? { ...i, isArchived: false } : i))
  }, [])

  const handleUpdate = useCallback((id: string, updates: Partial<Initiative>) => {
    setInitiatives((prev) => prev.map((i) => i.id === id ? { ...i, ...updates } : i))
  }, [])

  function openNewSub(parentId: string) {
    setDefaultParentId(parentId)
    setShowCreate(true)
  }

  return (
    <div className="flex flex-1 flex-col" style={{ overflow: "hidden", minHeight: 0 }}>
      <CreateInitiativeModal
        open={showCreate}
        onClose={() => { setShowCreate(false); setDefaultParentId(null) }}
        onCreate={handleCreate}
        initiatives={initiatives}
        defaultParentId={defaultParentId}
      />

      {selected ? (
        <InitiativeDetail
          initiative={selected}
          initiatives={initiatives}
          onBack={() => setSelectedId(null)}
          onArchive={() => handleArchive(selected.id)}
          onRestore={() => handleRestore(selected.id)}
          onUpdate={handleUpdate}
          onSelectInitiative={setSelectedId}
          onNewSub={() => openNewSub(selected.id)}
        />
      ) : (
        <InitiativesList
          initiatives={initiatives}
          onSelect={setSelectedId}
          onArchive={handleArchive}
          onRestore={handleRestore}
          onNew={() => { setDefaultParentId(null); setShowCreate(true) }}
        />
      )}
    </div>
  )
}
