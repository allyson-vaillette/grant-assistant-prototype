export interface PlatformFunder {
  id: string
  name: string
  type: "Private foundation" | "Community foundation" | "Government" | "Corporate foundation"
  website: string
  focusAreas: string[]
  geography: string
  fundingRange: string
}

// ── Discover Funder types ────────────────────────────────────────────────────

export type DiscoverFunderType =
  | "Private foundation"
  | "Community foundation"
  | "Government"
  | "Corporate foundation"
  | "Public charity"

export type DiscoverMatchStrength = "Strong match" | "Good match" | "Partial match"

export interface DiscoverWhyMatch {
  icon: "check" | "warning"
  text: string
}

export interface DiscoverInitiativeMatch {
  name: string
  match: DiscoverMatchStrength
}

export interface DiscoverKnownOpportunity {
  id: string
  name: string
  deadline: string
}

export interface DiscoverFunder {
  id: string
  name: string
  type: DiscoverFunderType
  website: string
  focusAreas: string[]
  geography: string
  fundingRange: string
  acceptsUnsolicited: boolean
  description: string
  matchStrength: DiscoverMatchStrength
  matchDots: number
  matchLabel: string
  whyMatches: DiscoverWhyMatch[]
  initiatives: DiscoverInitiativeMatch[]
  knownOpportunities: DiscoverKnownOpportunity[]
}

export const DISCOVER_FUNDERS: DiscoverFunder[] = [
  {
    id: "petco-love-funder",
    name: "Petco Love",
    type: "Corporate foundation",
    website: "https://petcolove.org",
    focusAreas: ["Animal Welfare", "Pet Adoption", "Community Programs"],
    geography: "National (U.S.)",
    fundingRange: "$5,000 – $50,000",
    acceptsUnsolicited: true,
    description:
      "Petco Love invests in organizations working to create communities in which no pet is unnecessarily euthanized. They fund shelters, rescues, and organizations that reduce pet overpopulation, increase adoptions, and support spay/neuter programs.",
    matchStrength: "Strong match",
    matchDots: 5,
    matchLabel: "Strong match — focus areas, geography, and eligibility all align",
    whyMatches: [
      { icon: "check", text: "Focus areas align — Animal Welfare, pet adoption, and spay/neuter directly match your Rescue & Intake, Foster, and Neutering initiatives" },
      { icon: "check", text: "Geography — Petco Love funds nationally; your California-based work is eligible" },
      { icon: "check", text: "Eligibility — 501(c)(3) required, your org size fits the grant range" },
      { icon: "warning", text: "Competitive — Petco Love receives high application volume; strong outcome data will differentiate your proposal" },
    ],
    initiatives: [
      { name: "Rescue & Intake", match: "Strong match" },
      { name: "Foster Program", match: "Strong match" },
      { name: "Neutering", match: "Good match" },
    ],
    knownOpportunities: [
      { id: "petco-love", name: "Petco Love Lost & Found Grant 2026", deadline: "Aug 15, 2026" },
    ],
  },
  {
    id: "aspca-funder",
    name: "ASPCA",
    type: "Public charity",
    website: "https://www.aspca.org/grants",
    focusAreas: ["Animal Welfare", "Shelter Support", "Anti-Cruelty", "Spay/Neuter"],
    geography: "National (U.S.)",
    fundingRange: "$5,000 – $75,000",
    acceptsUnsolicited: true,
    description:
      "The ASPCA's grantmaking focuses on reducing the number of animals euthanized in shelters and improving the lives of animals at risk. Programs support intake reduction, foster networks, community cat management, and spay/neuter services.",
    matchStrength: "Strong match",
    matchDots: 5,
    matchLabel: "Strong match — all three initiatives align with ASPCA funding priorities",
    whyMatches: [
      { icon: "check", text: "Focus areas align — Animal Welfare is ASPCA's core mission; your programs are precisely in scope" },
      { icon: "check", text: "Geography — ASPCA funds nationally; California organizations are eligible" },
      { icon: "check", text: "Spay/neuter alignment — your Neutering initiative directly matches ASPCA's community cat and population management priorities" },
      { icon: "warning", text: "Data requirements — ASPCA grants require demonstrated intake and live release rate metrics" },
    ],
    initiatives: [
      { name: "Rescue & Intake", match: "Strong match" },
      { name: "Foster Program", match: "Good match" },
      { name: "Neutering", match: "Strong match" },
    ],
    knownOpportunities: [
      { id: "aspca", name: "ASPCA Saving Lives Grant", deadline: "Sep 30, 2026" },
    ],
  },
  {
    id: "maddies-fund",
    name: "Maddie's Fund",
    type: "Private foundation",
    website: "https://www.maddiesfund.org",
    focusAreas: ["Animal Welfare", "No-Kill Initiatives", "Shelter Medicine", "Community Programs"],
    geography: "National (U.S.)",
    fundingRange: "$25,000 – $200,000",
    acceptsUnsolicited: false,
    description:
      "Maddie's Fund supports the no-kill movement by funding shelters, rescues, and coalitions working to achieve no-kill community status. Grants prioritize collaborative approaches, data-driven programs, and innovative models that improve lifesaving rates at the community level.",
    matchStrength: "Strong match",
    matchDots: 5,
    matchLabel: "Strong match — no-kill mission and community programs align closely",
    whyMatches: [
      { icon: "check", text: "Mission alignment — your rescue, foster, and intake reduction work directly supports no-kill community goals" },
      { icon: "check", text: "Foster program — Maddie's Fund has historically prioritized foster expansion as a key lifesaving lever" },
      { icon: "check", text: "Geography — national funder; California organizations are strongly represented in their portfolio" },
      { icon: "warning", text: "Invite-only — Maddie's Fund does not accept unsolicited applications; LOI required through an RFP or relationship with program staff" },
    ],
    initiatives: [
      { name: "Rescue & Intake", match: "Strong match" },
      { name: "Foster Program", match: "Strong match" },
      { name: "Neutering", match: "Good match" },
    ],
    knownOpportunities: [
      { id: "", name: "Maddie's Lifesaving Award 2026", deadline: "Oct 1, 2026" },
    ],
  },
  {
    id: "found-animals",
    name: "Found Animals Foundation",
    type: "Private foundation",
    website: "https://www.foundanimals.org/grants",
    focusAreas: ["Animal Welfare", "Spay/Neuter", "Microchipping", "Pet Retention"],
    geography: "Los Angeles County + Southern California",
    fundingRange: "$10,000 – $75,000",
    acceptsUnsolicited: true,
    description:
      "Found Animals Foundation focuses on reducing pet homelessness in Southern California through free and low-cost spay/neuter, microchipping, and community education. They fund organizations working directly with underserved communities to keep pets and families together.",
    matchStrength: "Strong match",
    matchDots: 5,
    matchLabel: "Strong match — California geography, spay/neuter, and intake reduction all align",
    whyMatches: [
      { icon: "check", text: "Geography — Found Animals exclusively funds Southern California organizations; your service area qualifies" },
      { icon: "check", text: "Spay/neuter alignment — your Neutering initiative is a direct match for their primary program focus" },
      { icon: "check", text: "Foster alignment — foster programs support their pet retention and pet homelessness reduction goals" },
      { icon: "warning", text: "Geographic restriction — grants limited to Los Angeles County and surrounding areas; confirm your footprint qualifies" },
    ],
    initiatives: [
      { name: "Rescue & Intake", match: "Good match" },
      { name: "Foster Program", match: "Strong match" },
      { name: "Neutering", match: "Strong match" },
    ],
    knownOpportunities: [
      { id: "", name: "Found Animals Spay/Neuter Grant", deadline: "Jul 31, 2026" },
    ],
  },
  {
    id: "petsmart-charities-funder",
    name: "PetSmart Charities",
    type: "Corporate foundation",
    website: "https://petsmartcharities.org",
    focusAreas: ["Animal Welfare", "Cat & Kitten Programs", "Spay/Neuter", "Adoption"],
    geography: "National (U.S.) + Canada",
    fundingRange: "$10,000 – $100,000",
    acceptsUnsolicited: true,
    description:
      "PetSmart Charities funds organizations working to end pet homelessness through adoption programs, spay/neuter services, and foster networks. A significant portion of grants are designated for cat and kitten programs, including trap-neuter-return and community cat management.",
    matchStrength: "Good match",
    matchDots: 4,
    matchLabel: "Good match — strong alignment with foster and spay/neuter programs",
    whyMatches: [
      { icon: "check", text: "Foster alignment — PetSmart Charities has invested heavily in foster program expansion nationally" },
      { icon: "check", text: "Spay/neuter match — your Neutering initiative aligns with their TNR and community cat funding priorities" },
      { icon: "check", text: "Geography — national funder; California organizations are eligible" },
      { icon: "warning", text: "Cat-specific preference — grants with demonstrated cat and kitten program focus are prioritized; highlight this in your proposal" },
    ],
    initiatives: [
      { name: "Rescue & Intake", match: "Good match" },
      { name: "Foster Program", match: "Strong match" },
      { name: "Neutering", match: "Strong match" },
    ],
    knownOpportunities: [
      { id: "petsmart", name: "Saving Cats & Kittens Grant", deadline: "Rolling" },
    ],
  },
  {
    id: "hsus",
    name: "Humane Society of the United States",
    type: "Public charity",
    website: "https://www.humanesociety.org/resources/grants-and-awards",
    focusAreas: ["Animal Welfare", "Shelter Reform", "Anti-Cruelty", "Wildlife"],
    geography: "National (U.S.)",
    fundingRange: "$5,000 – $30,000",
    acceptsUnsolicited: false,
    description:
      "HSUS supports frontline animal welfare organizations through targeted grant programs focused on reducing animal suffering and reforming shelter systems. Their grantmaking emphasizes intake reduction, adoption promotion, and community-based solutions to pet overpopulation.",
    matchStrength: "Good match",
    matchDots: 4,
    matchLabel: "Good match — shelter reform and intake reduction align with your core programs",
    whyMatches: [
      { icon: "check", text: "Rescue & Intake alignment — HSUS prioritizes intake reduction and shelter diversion programs" },
      { icon: "check", text: "Shelter reform focus — your lifesaving model aligns with HSUS's systemic change priorities" },
      { icon: "warning", text: "Application process — HSUS grants are typically invite-only or competitive RFP; a relationship with regional staff is recommended" },
      { icon: "warning", text: "Smaller grants — HSUS direct grants tend to be in the $5,000–$30,000 range; may not fit larger program budgets" },
    ],
    initiatives: [
      { name: "Rescue & Intake", match: "Strong match" },
      { name: "Foster Program", match: "Good match" },
      { name: "Neutering", match: "Partial match" },
    ],
    knownOpportunities: [],
  },
  {
    id: "ca-wellness-funder",
    name: "California Wellness Foundation",
    type: "Private foundation",
    website: "https://www.calwellness.org",
    focusAreas: ["Health Equity", "Community Health", "Mental Health", "Reproductive Health"],
    geography: "California only",
    fundingRange: "$50,000 – $200,000",
    acceptsUnsolicited: true,
    description:
      "California Wellness Foundation advances the health and wellness of Californians by making grants to nonprofits addressing root causes of poor health in underserved communities. Animal welfare programs with a community health framing — particularly those serving low-income neighborhoods — may be considered.",
    matchStrength: "Partial match",
    matchDots: 3,
    matchLabel: "Partial match — geography aligns, focus areas require reframing for eligibility",
    whyMatches: [
      { icon: "check", text: "Geography — California Wellness exclusively funds California-based organizations; you qualify" },
      { icon: "check", text: "Underserved communities — your programs serving low-income neighborhoods align with their equity lens" },
      { icon: "warning", text: "Focus area framing — health and wellness framing required; animal welfare must be positioned as a community health intervention" },
      { icon: "warning", text: "LOI stage — letters of inquiry are evaluated before full proposals; budget time accordingly" },
    ],
    initiatives: [
      { name: "Rescue & Intake", match: "Partial match" },
      { name: "Foster Program", match: "Good match" },
      { name: "Neutering", match: "Partial match" },
    ],
    knownOpportunities: [
      { id: "ca-wellness", name: "Advancing Wellness in Underserved Communities", deadline: "Jul 1, 2026" },
    ],
  },
  {
    id: "north-shore",
    name: "North Shore Animal League America",
    type: "Public charity",
    website: "https://www.nsalamerica.org/grants",
    focusAreas: ["Animal Welfare", "No-Kill Advocacy", "Shelter Support", "Rescue Coordination"],
    geography: "National (U.S.)",
    fundingRange: "$10,000 – $50,000",
    acceptsUnsolicited: false,
    description:
      "North Shore Animal League America supports the no-kill movement through grants to shelters and rescue organizations. Grant programs focus on capacity building, intake reduction partnerships, and organizations demonstrating significant lifesaving outcomes for cats and dogs.",
    matchStrength: "Good match",
    matchDots: 4,
    matchLabel: "Good match — rescue and intake programs align with lifesaving mission",
    whyMatches: [
      { icon: "check", text: "Rescue & Intake alignment — no-kill lifesaving mission directly matches your core work" },
      { icon: "check", text: "Foster coordination — NSALA has funded foster network expansion programs nationally" },
      { icon: "warning", text: "By invitation — NSALA does not accept unsolicited applications; contact regional program staff first" },
      { icon: "warning", text: "East Coast focus — while national, a significant portion of their portfolio is Northeast-based; may require extra outreach" },
    ],
    initiatives: [
      { name: "Rescue & Intake", match: "Strong match" },
      { name: "Foster Program", match: "Good match" },
      { name: "Neutering", match: "Partial match" },
    ],
    knownOpportunities: [],
  },
]

export const PLATFORM_FUNDERS: PlatformFunder[] = [
  {
    id: "ford",
    name: "Ford Foundation",
    type: "Private foundation",
    website: "https://www.fordfoundation.org",
    focusAreas: ["Social Justice", "Economic Equity", "Housing", "Arts & Culture"],
    geography: "National (U.S.) + International",
    fundingRange: "$25,000 – $500,000",
  },
  {
    id: "kresge",
    name: "Kresge Foundation",
    type: "Private foundation",
    website: "https://kresge.org",
    focusAreas: ["Housing", "Climate", "Education", "Health", "Arts"],
    geography: "National (U.S.)",
    fundingRange: "$50,000 – $300,000",
  },
  {
    id: "casey",
    name: "Annie E. Casey Foundation",
    type: "Private foundation",
    website: "https://www.aecf.org",
    focusAreas: ["Child Welfare", "Youth Development", "Community Development"],
    geography: "National (U.S.)",
    fundingRange: "$25,000 – $150,000",
  },
  {
    id: "rwj",
    name: "Robert Wood Johnson Foundation",
    type: "Private foundation",
    website: "https://www.rwjf.org",
    focusAreas: ["Health Equity", "Public Health", "Community Health", "Mental Health"],
    geography: "National (U.S.)",
    fundingRange: "$50,000 – $250,000",
  },
  {
    id: "kellogg",
    name: "W.K. Kellogg Foundation",
    type: "Private foundation",
    website: "https://www.wkkf.org",
    focusAreas: ["Food Systems", "Early Childhood", "Education", "Civic Engagement"],
    geography: "National (U.S.) + International",
    fundingRange: "$30,000 – $200,000",
  },
  {
    id: "macarthur",
    name: "MacArthur Foundation",
    type: "Private foundation",
    website: "https://www.macfound.org",
    focusAreas: ["Criminal Justice", "Climate", "Journalism", "Arts"],
    geography: "National (U.S.) + International",
    fundingRange: "$100,000 – $15,000,000",
  },
  {
    id: "gates",
    name: "Bill & Melinda Gates Foundation",
    type: "Private foundation",
    website: "https://www.gatesfoundation.org",
    focusAreas: ["Global Health", "Education", "Poverty Alleviation", "Agriculture"],
    geography: "Global",
    fundingRange: "$100,000 – $50,000,000",
  },
  {
    id: "hewlett",
    name: "William and Flora Hewlett Foundation",
    type: "Private foundation",
    website: "https://hewlett.org",
    focusAreas: ["Education", "Environment", "Global Development", "Performing Arts"],
    geography: "National (U.S.) + International",
    fundingRange: "$50,000 – $1,000,000",
  },
  {
    id: "knight",
    name: "Knight Foundation",
    type: "Private foundation",
    website: "https://knightfoundation.org",
    focusAreas: ["Journalism", "Arts", "Community Engagement", "Technology"],
    geography: "National (U.S.) — 26 communities",
    fundingRange: "$25,000 – $5,000,000",
  },
  {
    id: "mellon",
    name: "Andrew W. Mellon Foundation",
    type: "Private foundation",
    website: "https://mellon.org",
    focusAreas: ["Arts & Culture", "Higher Education", "Humanities", "Social Justice"],
    geography: "National (U.S.)",
    fundingRange: "$75,000 – $2,000,000",
  },
  {
    id: "lumina",
    name: "Lumina Foundation",
    type: "Private foundation",
    website: "https://luminafoundation.org",
    focusAreas: ["Higher Education", "Workforce Development", "Equity", "Learning"],
    geography: "National (U.S.)",
    fundingRange: "$50,000 – $500,000",
  },
  {
    id: "bloomberg",
    name: "Bloomberg Philanthropies",
    type: "Private foundation",
    website: "https://www.bloomberg.org",
    focusAreas: ["Public Health", "Environment", "Education", "Arts", "Government"],
    geography: "Global",
    fundingRange: "$50,000 – $10,000,000",
  },
  {
    id: "silicon-valley-cf",
    name: "Silicon Valley Community Foundation",
    type: "Community foundation",
    website: "https://www.siliconvalleycf.org",
    focusAreas: ["Education", "Economic Security", "Immigration", "Bay Area Communities"],
    geography: "San Francisco Bay Area",
    fundingRange: "$10,000 – $500,000",
  },
  {
    id: "cdc",
    name: "Centers for Disease Control and Prevention",
    type: "Government",
    website: "https://www.cdc.gov/grants",
    focusAreas: ["Public Health", "Disease Prevention", "Community Health", "Research"],
    geography: "National (U.S.)",
    fundingRange: "$100,000 – $5,000,000",
  },
]
