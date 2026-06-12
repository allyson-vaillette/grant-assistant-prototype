import type {
  Account, Organization, User, Membership, Project,
  Funder, Opportunity, PipelineOpportunity, PipelineStatus,
  Artifact, Attachment, Task, Match,
  WritingSession, Snippet, CommentThread, RecentGrant,
} from "./types"

// ── Account & Org ─────────────────────────────────────────────────────────

export const ACCOUNT: Account = {
  id: "acc-1",
  name: "Whisker Haven",
}

export const ORG: Organization = {
  id: "org-1",
  accountId: "acc-1",
  name: "Whisker Haven Cat Rescue",
  ein: "47-1234567",
  mission: "Saving cats and finding them loving homes across San Diego County.",
  focusAreas: ["Animal Welfare", "Pet Adoption", "Spay/Neuter", "Foster Programs"],
  geography: "San Diego, CA",
}

export const USER: User = {
  id: "user-1",
  organizationId: "org-1",
  name: "Taylor S.",
  email: "taylor@whiskerhaven.org",
  initials: "TS",
}

export const TEAMMATES: User[] = [
  {
    id: "user-2",
    organizationId: "org-1",
    name: "Jordan M.",
    email: "jordan@whiskerhaven.org",
    initials: "JM",
  },
  {
    id: "user-3",
    organizationId: "org-1",
    name: "Sam L.",
    email: "sam@whiskerhaven.org",
    initials: "SL",
  },
]

export const MEMBERSHIP: Membership = {
  id: "mem-1",
  userId: "user-1",
  organizationId: "org-1",
  role: "admin",
}

export const PROJECTS: Project[] = [
  {
    id: "proj-general",
    organizationId: "org-1",
    name: "General",
    description: "Default project for all grant pursuits",
    isDefault: true,
  },
  {
    id: "proj-spay-neuter",
    organizationId: "org-1",
    name: "Spay/Neuter Initiative",
    description: "Community spay/neuter and TNR programs",
    isDefault: false,
  },
  {
    id: "proj-kitten-season",
    organizationId: "org-1",
    name: "Kitten Season Campaign",
    description: "Seasonal kitten rescue, foster, and adoption programs",
    isDefault: false,
  },
]

// ── Funders ────────────────────────────────────────────────────────────────

export const FUNDERS: Funder[] = [
  {
    id: "funder-petco",
    name: "Petco Love",
    type: "corporate_foundation",
    website: "https://petcolove.org",
    focusAreas: ["Animal Welfare", "Pet Adoption", "Community Programs"],
    geography: "National (U.S.)",
    location: "San Diego, CA",
    ein: "33-0845930",
    fundingRange: "$5,000 – $50,000",
    description:
      "Petco Love invests in organizations working to create communities where no pet is unnecessarily euthanized. They fund shelters, rescues, and organizations that reduce pet overpopulation, increase adoptions, and support spay/neuter programs.",
    acceptsUnsolicited: true,
    programAreas: ["Animal Welfare", "Pet Adoption", "Shelter Support", "Spay/Neuter", "Community Cat Programs"],
    orgTypesFunded: ["Animal Shelters", "Rescue Organizations", "Spay/Neuter Clinics", "Community Animal Programs"],
    locationsFunded: ["United States"],
    recentGrants: [
      { grantee: "San Diego Humane Society", year: 2023, amount: 75000 },
      { grantee: "Austin Pets Alive", year: 2023, amount: 50000 },
      { grantee: "Nevada Humane Society", year: 2022, amount: 40000 },
    ],
  },
  {
    id: "funder-aspca",
    name: "ASPCA",
    type: "public_charity",
    website: "https://www.aspca.org/grants",
    focusAreas: ["Animal Welfare", "Shelter Support", "Anti-Cruelty", "Spay/Neuter"],
    geography: "National (U.S.)",
    location: "New York, NY",
    ein: "13-1623829",
    fundingRange: "$5,000 – $75,000",
    description:
      "The ASPCA's grantmaking focuses on reducing the number of animals euthanized in shelters and improving the lives of animals at risk. Programs support intake reduction, foster networks, community cat management, and spay/neuter services.",
    acceptsUnsolicited: true,
    programAreas: ["Shelter Intake Reduction", "Spay/Neuter", "Community Cat Management", "Foster Network Expansion", "Anti-Cruelty Enforcement"],
    orgTypesFunded: ["Animal Shelters", "Rescue Organizations", "Municipal Animal Control Agencies", "Veterinary Clinics"],
    locationsFunded: ["United States"],
    recentGrants: [
      { grantee: "Humane Rescue Alliance", year: 2023, amount: 65000 },
      { grantee: "Animal Rescue League of Boston", year: 2023, amount: 50000 },
      { grantee: "Kentucky Humane Society", year: 2022, amount: 45000 },
    ],
  },
  {
    id: "funder-maddies",
    name: "Maddie's Fund",
    type: "private_foundation",
    website: "https://www.maddiesfund.org",
    focusAreas: ["Animal Welfare", "No-Kill Initiatives", "Shelter Medicine", "Community Programs"],
    geography: "National (U.S.)",
    location: "Pleasanton, CA",
    ein: "94-3362163",
    fundingRange: "$25,000 – $200,000",
    description:
      "Maddie's Fund supports the no-kill movement by funding shelters, rescues, and coalitions working to achieve no-kill community status. Grants prioritize collaborative approaches, data-driven programs, and innovative models that improve lifesaving rates.",
    acceptsUnsolicited: false,
    programAreas: ["No-Kill Community Initiatives", "Shelter Medicine", "Foster Program Expansion", "Data-Driven Lifesaving", "Community Coalitions"],
    orgTypesFunded: ["Animal Shelters", "Rescue Coalitions", "Veterinary Schools", "Community Organizations"],
    locationsFunded: ["United States"],
    recentGrants: [
      { grantee: "Best Friends Animal Society", year: 2023, amount: 150000 },
      { grantee: "Oregon Humane Society", year: 2023, amount: 100000 },
      { grantee: "Pima Animal Care Center", year: 2022, amount: 75000 },
    ],
  },
  {
    id: "funder-found-animals",
    name: "Found Animals Foundation",
    type: "private_foundation",
    website: "https://www.foundanimals.org/grants",
    focusAreas: ["Animal Welfare", "Spay/Neuter", "Microchipping", "Pet Retention"],
    geography: "Los Angeles County + Southern California",
    location: "Los Angeles, CA",
    ein: "26-2028686",
    fundingRange: "$10,000 – $75,000",
    description:
      "Found Animals Foundation focuses on reducing pet homelessness in Southern California through free and low-cost spay/neuter, microchipping, and community education.",
    acceptsUnsolicited: true,
    programAreas: ["Spay/Neuter", "Microchipping and ID", "Pet Retention", "Community Education", "Low-Cost Veterinary Services"],
    orgTypesFunded: ["Animal Shelters", "Community Clinics", "Rescue Organizations", "Veterinary Practices"],
    locationsFunded: ["Los Angeles County", "Southern California"],
    recentGrants: [
      { grantee: "Downtown Dog Rescue", year: 2023, amount: 60000 },
      { grantee: "L.A. Animal Services", year: 2022, amount: 75000 },
      { grantee: "Lange Foundation", year: 2022, amount: 35000 },
    ],
  },
  {
    id: "funder-petsmart",
    name: "PetSmart Charities",
    type: "corporate_foundation",
    website: "https://petsmartcharities.org",
    focusAreas: ["Animal Welfare", "Cat & Kitten Programs", "Spay/Neuter", "Adoption"],
    geography: "National (U.S.) + Canada",
    location: "Phoenix, AZ",
    ein: "86-0687979",
    fundingRange: "$10,000 – $100,000",
    description:
      "PetSmart Charities funds organizations working to end pet homelessness through adoption programs, spay/neuter services, and foster networks.",
    acceptsUnsolicited: true,
    programAreas: ["Cat and Kitten Programs", "Spay/Neuter", "Foster Network Expansion", "Adoption Events", "TNR Programs"],
    orgTypesFunded: ["Animal Shelters", "Rescue Organizations", "Community Cat Programs", "Foster Networks"],
    locationsFunded: ["United States", "Canada"],
    recentGrants: [
      { grantee: "North Shore Animal League", year: 2023, amount: 90000 },
      { grantee: "Kitten Lady Foundation", year: 2023, amount: 45000 },
      { grantee: "Tree House Humane Society", year: 2022, amount: 40000 },
    ],
  },
  {
    id: "funder-best-friends",
    name: "Best Friends Animal Society",
    type: "public_charity",
    website: "https://bestfriends.org/grants",
    focusAreas: ["Animal Welfare", "No-Kill Initiatives", "Community Programs", "Foster Care"],
    geography: "National (U.S.)",
    location: "Kanab, UT",
    ein: "43-1840211",
    fundingRange: "$10,000 – $100,000",
    description:
      "Best Friends Animal Society works to end the killing of dogs and cats in America's shelters. Their grantmaking supports the no-kill movement through lifesaving programs, coalition building, and community-level initiatives.",
    acceptsUnsolicited: true,
    programAreas: ["No-Kill Community Programs", "Foster Network Expansion", "Shelter Diversion", "Community Cat Management", "Adoption Promotion"],
    orgTypesFunded: ["Animal Shelters", "Rescue Organizations", "Municipal Animal Services", "No-Kill Coalitions"],
    locationsFunded: ["United States"],
    recentGrants: [
      { grantee: "Houston Humane Society", year: 2023, amount: 85000 },
      { grantee: "Animal Rescue of the Rockies", year: 2023, amount: 50000 },
      { grantee: "Triangle Beagle Rescue", year: 2022, amount: 30000 },
    ],
  },
  {
    id: "funder-doris-day",
    name: "Doris Day Animal Foundation",
    type: "private_foundation",
    website: "https://dorisdayanimalfoundation.org",
    focusAreas: ["Animal Welfare", "Spay/Neuter", "Community Programs", "Veterinary Care"],
    geography: "National (U.S.)",
    location: "Washington, D.C.",
    ein: "52-1218833",
    fundingRange: "$5,000 – $35,000",
    description:
      "The Doris Day Animal Foundation funds smaller community-based organizations focused on spay/neuter, trap-neuter-return, and low-cost veterinary care for underserved populations and community cats.",
    acceptsUnsolicited: true,
    programAreas: ["Spay/Neuter", "TNR", "Low-Cost Veterinary Care", "Community Cat Programs", "Pet Owner Support"],
    orgTypesFunded: ["Rescue Organizations", "Spay/Neuter Clinics", "Community Cat Programs", "Humane Societies"],
    locationsFunded: ["United States"],
    recentGrants: [
      { grantee: "Alley Cat Allies", year: 2023, amount: 30000 },
      { grantee: "Mid-America Spay/Neuter Clinic", year: 2022, amount: 20000 },
      { grantee: "Feral Cat Coalition of Oregon", year: 2022, amount: 15000 },
    ],
  },
  {
    id: "funder-petfinder",
    name: "Petfinder Foundation",
    type: "corporate_foundation",
    website: "https://petfinderfoundation.com",
    focusAreas: ["Animal Welfare", "Adoption", "Emergency Relief", "Capacity Building"],
    geography: "National (U.S.)",
    location: "New York, NY",
    ein: "20-5806345",
    fundingRange: "$2,500 – $20,000",
    description:
      "The Petfinder Foundation helps shelter and rescue organizations improve their capacity, emergency preparedness, and adoption outcomes. Grants support technology adoption, staff training, and emergency relief for animals in crisis.",
    acceptsUnsolicited: true,
    programAreas: ["Adoption Programs", "Emergency Relief", "Capacity Building", "Technology Adoption", "Volunteer Development"],
    orgTypesFunded: ["Animal Shelters", "Rescue Organizations", "Foster Networks"],
    locationsFunded: ["United States"],
    recentGrants: [
      { grantee: "Rescue Me! Animal Sanctuary", year: 2023, amount: 18000 },
      { grantee: "Friends of the Shelter", year: 2023, amount: 12000 },
      { grantee: "Paws of Hope Rescue", year: 2022, amount: 10000 },
    ],
  },
  {
    id: "funder-ca-coastal",
    name: "California Community Foundation",
    type: "community_foundation",
    website: "https://www.calfund.org",
    focusAreas: ["Animal Welfare", "Community Services", "Health", "Environment"],
    geography: "Los Angeles County",
    location: "Los Angeles, CA",
    ein: "95-3510055",
    fundingRange: "$15,000 – $75,000",
    description:
      "The California Community Foundation supports nonprofits strengthening Los Angeles County communities. Animal welfare grants focus on organizations providing direct services to animals and low-income pet owners in underserved neighborhoods.",
    acceptsUnsolicited: true,
    programAreas: ["Animal Welfare", "Community Health", "Human-Animal Bond", "Veterinary Access", "Rescue Operations"],
    orgTypesFunded: ["Animal Shelters", "Rescue Organizations", "Community Clinics", "Humane Societies"],
    locationsFunded: ["Los Angeles County"],
    recentGrants: [
      { grantee: "L.A. Animal Services Foundation", year: 2023, amount: 60000 },
      { grantee: "Lange Foundation", year: 2023, amount: 40000 },
      { grantee: "Stray Cat Alliance", year: 2022, amount: 25000 },
    ],
  },
  {
    id: "funder-humane-society",
    name: "Humane Society of the United States",
    type: "public_charity",
    website: "https://www.humanesociety.org/grants",
    focusAreas: ["Animal Welfare", "Spay/Neuter", "Anti-Cruelty", "Disaster Response"],
    geography: "National (U.S.)",
    location: "Washington, D.C.",
    ein: "53-0225390",
    fundingRange: "$10,000 – $60,000",
    description:
      "The Humane Society of the United States provides grants to local organizations tackling animal cruelty, overpopulation, and disaster response. Priority given to programs with measurable community impact and strong volunteer infrastructure.",
    acceptsUnsolicited: true,
    programAreas: ["Spay/Neuter", "Anti-Cruelty Enforcement", "Disaster Response", "Shelter Reform", "Community Education"],
    orgTypesFunded: ["Animal Shelters", "Rescue Organizations", "Law Enforcement Agencies", "Veterinary Clinics"],
    locationsFunded: ["United States"],
    recentGrants: [
      { grantee: "Charleston Animal Society", year: 2023, amount: 55000 },
      { grantee: "Animal Rescue Corps", year: 2023, amount: 45000 },
      { grantee: "Tri-County Animal Rescue", year: 2022, amount: 30000 },
    ],
  },
]

// ── Opportunities ──────────────────────────────────────────────────────────

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-1",
    funderId: "funder-petco",
    name: "Petco Love Lost & Found Grant 2026",
    amount: "$25,000",
    deadline: "Jun 25, 2026",
    description:
      "Supports organizations with proven track records in animal rescue, adoption, and community outreach. Eligible organizations must be 501(c)(3) nonprofits operating active rescue or shelter programs.",
    eligibility: "501(c)(3) required · Active rescue/shelter program · Annual budget under $2M",
    eligibilityLabel: "Likely eligible",
    focusAreas: ["Animal Welfare", "Pet Adoption", "Rescue Operations"],
  },
  {
    id: "opp-2",
    funderId: "funder-aspca",
    name: "ASPCA Saving Lives Grant",
    amount: "$50,000",
    deadline: "Sep 30, 2026",
    description:
      "Focused on organizations with data-driven approaches to reducing shelter euthanasia. Strong preference for applicants who can demonstrate measurable outcomes in live release rates.",
    eligibility: "501(c)(3) required · Demonstrable intake and live release rate data",
    eligibilityLabel: "Likely eligible",
    focusAreas: ["Animal Welfare", "Shelter Reform", "Spay/Neuter"],
  },
  {
    id: "opp-3",
    funderId: "funder-maddies",
    name: "Maddie's Lifesaving Award 2026",
    amount: "$75,000",
    deadline: "Oct 1, 2026",
    description:
      "Recognizes and funds organizations demonstrating exceptional lifesaving outcomes. Invite-only via LOI process — contact program staff before applying.",
    eligibility: "Invitation required via LOI · Demonstrated no-kill outcomes",
    eligibilityLabel: "Invitation required",
    focusAreas: ["No-Kill Initiatives", "Animal Welfare"],
  },
  {
    id: "opp-4",
    funderId: "funder-found-animals",
    name: "Found Animals Spay/Neuter Grant",
    amount: "$15,000",
    deadline: "Jul 31, 2026",
    description:
      "Supports spay/neuter programs serving underserved communities in Southern California. Priority given to organizations with mobile or community-based delivery models.",
    eligibility: "501(c)(3) · Southern California service area · Spay/neuter programming",
    eligibilityLabel: "Confirm eligibility",
    focusAreas: ["Spay/Neuter", "Community Programs"],
  },
  {
    id: "opp-5",
    funderId: "funder-petsmart",
    name: "Saving Cats & Kittens Grant",
    amount: "$45,000",
    deadline: "Rolling",
    description:
      "Funds organizations with demonstrated cat and kitten-specific programs including TNR, foster networks, and kitten nurseries.",
    eligibility: "501(c)(3) required · Active cat/kitten program · Adoption outcomes data",
    eligibilityLabel: "Likely eligible",
    focusAreas: ["Cat & Kitten Programs", "Foster Networks", "TNR"],
  },
  {
    id: "opp-6",
    funderId: "funder-best-friends",
    name: "Community Lifesaving Coalition Grant",
    amount: "$30,000",
    deadline: "Aug 15, 2026",
    description:
      "Supports rescue organizations participating in or building local no-kill coalitions. Funded organizations must demonstrate collaborative relationships with at least one municipal shelter and a commitment to data-sharing.",
    eligibility: "501(c)(3) · Active coalition participation · Municipal shelter partnership",
    eligibilityLabel: "Likely eligible",
    focusAreas: ["No-Kill Initiatives", "Animal Welfare", "Community Programs"],
  },
  {
    id: "opp-7",
    funderId: "funder-best-friends",
    name: "Foster Network Expansion Award",
    amount: "$20,000",
    deadline: "Sep 12, 2026",
    description:
      "Designed for organizations looking to significantly scale their foster volunteer base. Funds recruitment infrastructure, training programs, and the technology needed to manage a larger foster network.",
    eligibility: "501(c)(3) · Established foster program · Capacity to scale",
    eligibilityLabel: "Likely eligible",
    focusAreas: ["Foster Care", "Animal Welfare", "Capacity Building"],
  },
  {
    id: "opp-8",
    funderId: "funder-doris-day",
    name: "Community Cat TNR Grant",
    amount: "$12,000",
    deadline: "Jul 10, 2026",
    description:
      "Funds trap-neuter-return programs targeting community cat colonies in underserved neighborhoods. Priority given to programs with established colony management protocols and volunteer trapper networks.",
    eligibility: "501(c)(3) · Active TNR program · Colony management records",
    eligibilityLabel: "Likely eligible",
    focusAreas: ["TNR", "Community Programs", "Spay/Neuter"],
  },
  {
    id: "opp-9",
    funderId: "funder-doris-day",
    name: "Low-Cost Veterinary Access Grant",
    amount: "$18,000",
    deadline: "Oct 30, 2026",
    description:
      "Supports organizations providing subsidized veterinary care to owned pets in low-income households, helping keep animals in homes and out of shelters.",
    eligibility: "501(c)(3) · Veterinary services program · Income-based eligibility criteria",
    eligibilityLabel: "Likely eligible",
    focusAreas: ["Veterinary Care", "Community Programs", "Pet Retention"],
  },
  {
    id: "opp-10",
    funderId: "funder-petfinder",
    name: "Adoption Guarantee Grant",
    amount: "$10,000",
    deadline: "Rolling",
    description:
      "Helps rescue organizations improve adoption conversion rates through better photography, digital outreach, and listing quality. Organizations must be active Petfinder members with at least 25 adoptions in the prior year.",
    eligibility: "501(c)(3) · Active Petfinder member · 25+ adoptions in prior year",
    eligibilityLabel: "Likely eligible",
    focusAreas: ["Adoption", "Capacity Building", "Animal Welfare"],
  },
  {
    id: "opp-11",
    funderId: "funder-petfinder",
    name: "Emergency Relief Fund",
    amount: "$5,000",
    deadline: "Rolling",
    description:
      "Rapid-response grants for rescue organizations facing unexpected crisis — facility damage, disease outbreak, or emergency intake surge. Applications reviewed within 5 business days.",
    eligibility: "501(c)(3) · Active Petfinder listing · Documented emergency need",
    eligibilityLabel: "Likely eligible",
    focusAreas: ["Emergency Relief", "Animal Welfare", "Capacity Building"],
  },
  {
    id: "opp-12",
    funderId: "funder-humane-society",
    name: "Shelter Reform Innovation Grant",
    amount: "$40,000",
    deadline: "Nov 14, 2026",
    description:
      "Supports organizations implementing innovative models to reduce shelter intake and increase live release rates. Preference for programs addressing the root causes of surrender, including owner support services and behavior resources.",
    eligibility: "501(c)(3) · Documented intake and live release data · Innovation component required",
    eligibilityLabel: "Likely eligible",
    focusAreas: ["Shelter Reform", "Animal Welfare", "Community Programs"],
  },
  {
    id: "opp-13",
    funderId: "funder-humane-society",
    name: "Disaster Preparedness and Response Grant",
    amount: "$25,000",
    deadline: "Aug 31, 2026",
    description:
      "Builds organizational capacity to respond to natural disasters and large-scale cruelty cases. Funds emergency transport infrastructure, temporary housing equipment, and staff training.",
    eligibility: "501(c)(3) · Emergency response plan on file · Transport capacity",
    eligibilityLabel: "Confirm eligibility",
    focusAreas: ["Disaster Response", "Animal Welfare", "Capacity Building"],
  },
  {
    id: "opp-14",
    funderId: "funder-ca-coastal",
    name: "Los Angeles Animal Welfare Grant",
    amount: "$50,000",
    deadline: "Sep 5, 2026",
    description:
      "Supports nonprofits providing direct animal welfare services to residents of Los Angeles County, with emphasis on underserved communities. Funded programs must demonstrate measurable community impact.",
    eligibility: "501(c)(3) · Los Angeles County service area · Community impact metrics",
    eligibilityLabel: "Confirm eligibility",
    focusAreas: ["Animal Welfare", "Community Services", "Veterinary Care"],
  },
  {
    id: "opp-15",
    funderId: "funder-aspca",
    name: "ASPCA Kitten Nursery Initiative",
    amount: "$35,000",
    deadline: "Jul 18, 2026",
    description:
      "Dedicated funding for organizations running or launching neonatal kitten nursery programs. Supports staffing, equipment, and formula costs for round-the-clock care of bottle-fed kittens.",
    eligibility: "501(c)(3) · Active kitten nursery or documented plan · 24-hour care capability",
    eligibilityLabel: "Likely eligible",
    focusAreas: ["Cat & Kitten Programs", "Animal Welfare", "Shelter Support"],
  },
]

// ── Pipeline Opportunities ─────────────────────────────────────────────────

export const PIPELINE_OPPORTUNITIES: PipelineOpportunity[] = [
  {
    id: "pip-1",
    organizationId: "org-1",
    projectId: "proj-general",
    funderId: "funder-petco",
    opportunityId: "opp-1",
    status: "application-in-progress",
    notes:
      "Strong fit — focus areas, geography, and eligibility all align. Program officer confirmed eligibility on June 1.",
  },
  {
    id: "pip-2",
    organizationId: "org-1",
    projectId: "proj-general",
    funderId: "funder-aspca",
    opportunityId: "opp-2",
    status: "application-submitted",
    submittedAt: "Mar 15, 2026",
    notes: "Submitted with strong outcome data. Awaiting reviewer assignment.",
  },
  {
    id: "pip-3",
    organizationId: "org-1",
    projectId: "proj-general",
    funderId: "funder-found-animals",
    opportunityId: "opp-4",
    status: "researching",
    notes: "Identified as a strong fit. Confirming San Diego service area eligibility before applying.",
  },
  {
    id: "pip-4",
    organizationId: "org-1",
    projectId: "proj-general",
    funderId: "funder-petsmart",
    opportunityId: "opp-5",
    status: "awarded-active",
    submittedAt: "Jan 20, 2026",
    notes: "Awarded $45,000 in March 2026. Funds received and deposited.",
  },
]

// ── Artifacts ─────────────────────────────────────────────────────────────

export const ARTIFACTS: Artifact[] = [
  {
    id: "art-1",
    pipelineOpportunityId: "pip-1",
    name: "Draft Proposal",
    type: "proposal",
    stage: "apply",
    updatedAt: "Jun 5, 2026",
    content: `Whisker Haven Cat Rescue is a 501(c)(3) nonprofit organization based in San Diego, California, dedicated to rescuing cats and kittens in need and placing them in loving homes.

Since our founding in 2018, we have rescued over 4,200 cats and achieved a live release rate of 97%. Our programs include a foster network of 180 active volunteers, a community spay/neuter clinic serving 600+ cats annually, and a kitten nursery caring for neonates who would otherwise not survive.

The Petco Love Lost & Found Grant would allow us to expand our rescue operations by increasing intake capacity by 20%, adding a second mobile outreach vehicle, and deepening our partnerships with underserved communities throughout San Diego County.`,
  },
  {
    id: "art-2",
    pipelineOpportunityId: "pip-1",
    name: "Budget Narrative",
    type: "budget",
    stage: "apply",
    updatedAt: "Jun 4, 2026",
    content: `Personnel (60% of request — $15,000)
• Rescue coordinator (0.5 FTE): $10,000
• Volunteer coordinator (0.25 FTE): $5,000

Program expenses (40% of request — $10,000)
• Mobile outreach vehicle fuel and maintenance: $4,000
• Medical supplies and veterinary care: $4,500
• Microchipping and ID supplies: $1,500`,
  },
  {
    id: "art-3",
    pipelineOpportunityId: "pip-2",
    name: "Final Submission",
    type: "proposal",
    stage: "post-apply",
    updatedAt: "Mar 14, 2026",
    content: `Submitted to ASPCA Saving Lives Grant program on March 15, 2026.`,
  },
]

// ── Attachments ────────────────────────────────────────────────────────────

export const ATTACHMENTS: Attachment[] = [
  {
    id: "att-1",
    pipelineOpportunityId: "pip-1",
    filename: "Petco Love RFP 2026.pdf",
    fileType: "pdf",
    stage: "pre-apply",
    category: "rfp",
    uploadDate: "May 20, 2026",
    uploaderId: "user-1",
  },
  {
    id: "att-2",
    pipelineOpportunityId: "pip-1",
    filename: "Prior Proposal 2024.docx",
    fileType: "docx",
    stage: "apply",
    category: "prior_proposal",
    uploadDate: "Jun 1, 2026",
    uploaderId: "user-1",
  },
  {
    id: "att-3",
    pipelineOpportunityId: "pip-2",
    filename: "ASPCA Submission Receipt.pdf",
    fileType: "pdf",
    stage: "post-apply",
    category: "rfp",
    uploadDate: "Mar 15, 2026",
    uploaderId: "user-1",
  },
]

// ── Tasks ─────────────────────────────────────────────────────────────────

export const TASKS: Task[] = [
  {
    id: "task-5",
    pipelineOpportunityId: "pip-1",
    title: "Attach 501(c)(3) determination letter",
    assigneeId: "user-1",
    dueDate: "Jun 5, 2026",
    completed: false,
  },
  {
    id: "task-6",
    pipelineOpportunityId: "pip-1",
    title: "Review draft proposal with program director",
    assigneeId: "user-1",
    dueDate: "Jun 9, 2026",
    completed: false,
  },
  {
    id: "task-1",
    pipelineOpportunityId: "pip-1",
    title: "Complete program narrative section",
    assigneeId: "user-1",
    dueDate: "Jul 15, 2026",
    completed: false,
  },
  {
    id: "task-2",
    pipelineOpportunityId: "pip-1",
    title: "Get budget approved by board",
    assigneeId: "user-1",
    dueDate: "Jul 20, 2026",
    completed: false,
  },
  {
    id: "task-3",
    pipelineOpportunityId: "pip-1",
    title: "Upload 2025 annual report",
    assigneeId: "user-1",
    completed: true,
  },
  {
    id: "task-4",
    pipelineOpportunityId: "pip-2",
    title: "Follow up with program officer",
    assigneeId: "user-1",
    dueDate: "Jun 20, 2026",
    completed: false,
  },
  {
    id: "task-7",
    pipelineOpportunityId: "pip-1",
    title: "Collect board signatures on conflict of interest form",
    assigneeId: "user-2",
    dueDate: "Jun 7, 2026",
    completed: false,
  },
  {
    id: "task-8",
    pipelineOpportunityId: "pip-1",
    title: "Send updated budget to program officer",
    assigneeId: "user-2",
    dueDate: "Jun 15, 2026",
    completed: false,
  },
  {
    id: "task-9",
    pipelineOpportunityId: "pip-2",
    title: "Gather Q1 live release rate data for ASPCA report",
    assigneeId: "user-3",
    dueDate: "Jun 8, 2026",
    completed: false,
  },
]

// ── Matches ────────────────────────────────────────────────────────────────

export const MATCHES: Match[] = [
  {
    id: "match-1",
    organizationId: "org-1",
    funderId: "funder-petco",
    opportunityId: "opp-1",
    matchStrength: "strong",
    matchScore: 5,
    reasons: {
      positive: [
        "Funds shelters and spay/neuter programs, a close fit for your rescue and foster work.",
        "Geography: Petco Love funds nationally, so your San Diego work is eligible.",
        "Eligibility: 501(c)(3) required; your org size fits the grant range.",
      ],
      cautions: [
        "Competitive: Petco Love gets a high volume of applications; strong outcome data will help your proposal stand out.",
      ],
    },
  },
  {
    id: "match-2",
    organizationId: "org-1",
    funderId: "funder-aspca",
    opportunityId: "opp-2",
    matchStrength: "strong",
    matchScore: 5,
    reasons: {
      positive: [
        "Animal welfare is their core focus, and your rescue work fits squarely.",
        "Geography: ASPCA funds nationally, and California organizations are eligible.",
        "Spay/neuter: your program targets the same community cat and population management priorities they fund.",
      ],
      cautions: [
        "Data requirements: ASPCA grants require demonstrated intake and live release rate metrics.",
      ],
    },
  },
  {
    id: "match-3",
    organizationId: "org-1",
    funderId: "funder-maddies",
    opportunityId: "opp-3",
    matchStrength: "good",
    matchScore: 4,
    reasons: {
      positive: [
        "Backs lifesaving shelter and rescue work, right where Whisker Haven operates.",
        "Foster: Maddie's Fund has prioritized foster expansion as a key lifesaving lever.",
        "Geography: national funder; California organizations are well-represented in their portfolio.",
      ],
      cautions: [
        "Invite-only: Maddie's Fund does not accept unsolicited applications; an LOI through program staff is required.",
      ],
    },
  },
  {
    id: "match-4",
    organizationId: "org-1",
    funderId: "funder-found-animals",
    opportunityId: "opp-4",
    matchStrength: "strong",
    matchScore: 5,
    reasons: {
      positive: [
        "Built for spay/neuter programs, one of your core services.",
        "Foster: foster programs support their pet retention goals.",
        "California eligibility: San Diego may qualify; confirm the service area with program staff.",
      ],
      cautions: [
        "Geographic restriction: grants are limited to Los Angeles County and surrounding areas; verify San Diego eligibility.",
      ],
    },
  },
  {
    id: "match-5",
    organizationId: "org-1",
    funderId: "funder-petsmart",
    opportunityId: "opp-5",
    matchStrength: "good",
    matchScore: 4,
    reasons: {
      positive: [
        "Focused on cat and kitten rescue, which is your whole mission.",
        "Spay/neuter: your TNR and community cat work matches their funding priorities.",
        "Geography: national funder; California organizations are eligible.",
      ],
      cautions: [
        "Cat-specific preference: proposals with a clear cat and kitten program focus are prioritized; lead with that.",
      ],
    },
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

export function getFunder(id: string): Funder | undefined {
  return FUNDERS.find((f) => f.id === id)
}

export function getOpportunity(id: string): Opportunity | undefined {
  return OPPORTUNITIES.find((o) => o.id === id)
}

export function getPipelineOpportunity(id: string): PipelineOpportunity | undefined {
  return PIPELINE_OPPORTUNITIES.find((p) => p.id === id)
}

export function getArtifact(id: string): Artifact | undefined {
  return ARTIFACTS.find((a) => a.id === id)
}

export function getArtifactsForPipeline(pipelineId: string): Artifact[] {
  return ARTIFACTS.filter((a) => a.pipelineOpportunityId === pipelineId)
}

export function createArtifact(pipelineOpportunityId: string): Artifact {
  const id = `art-${Date.now()}`
  const artifact: Artifact = {
    id,
    pipelineOpportunityId,
    name: "New Proposal",
    type: "proposal",
    stage: "apply",
    updatedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  }
  ARTIFACTS.push(artifact)
  return artifact
}

export function getAttachmentsForPipeline(pipelineId: string): Attachment[] {
  return ATTACHMENTS.filter((a) => a.pipelineOpportunityId === pipelineId)
}

export function getTasksForPipeline(pipelineId: string): Task[] {
  return TASKS.filter((t) => t.pipelineOpportunityId === pipelineId)
}

export function getMatchForOpportunity(oppId: string): Match | undefined {
  return MATCHES.find((m) => m.opportunityId === oppId)
}

export function getPipelineForOpportunity(oppId: string): PipelineOpportunity | undefined {
  return PIPELINE_OPPORTUNITIES.find((p) => p.opportunityId === oppId)
}

export function getPipelineForOpportunityAndProject(
  oppId: string,
  projectId: string,
): PipelineOpportunity | undefined {
  return PIPELINE_OPPORTUNITIES.find(
    (p) => p.opportunityId === oppId && p.projectId === projectId,
  )
}

export function createPipelineOpportunity(
  opportunityId: string,
  projectId: string,
): PipelineOpportunity {
  const existing = getPipelineForOpportunityAndProject(opportunityId, projectId)
  if (existing) return existing

  const opp = getOpportunity(opportunityId)
  if (!opp) throw new Error("Opportunity not found")

  const pip: PipelineOpportunity = {
    id: `pip-${PIPELINE_OPPORTUNITIES.length + 1}-${opportunityId}`,
    organizationId: ORG.id,
    projectId,
    funderId: opp.funderId,
    opportunityId,
    status: "researching",
  }

  PIPELINE_OPPORTUNITIES.push(pip)
  return pip
}

// ── Writing Sessions ───────────────────────────────────────────────────────

export const WRITING_SESSIONS: WritingSession[] = [
  {
    artifactId: "art-1",
    wordLimit: 2250,
    charLimit: 14000,
    requirements: [
      {
        id: "req-1",
        text: "Organization overview and mission alignment",
        wordLimit: 500,
        charLimit: 3000,
      },
      {
        id: "req-2",
        text: "Program description and activities to be funded",
        wordLimit: 750,
      },
      {
        id: "req-3",
        text: "Expected outcomes and impact metrics",
        wordLimit: 500,
        charLimit: 3200,
      },
      {
        id: "req-4",
        text: "Evaluation methodology and reporting plan",
        wordLimit: 250,
      },
      {
        id: "req-5",
        text: "Budget narrative",
        constraint: { type: "required_attachment", value: "Budget spreadsheet (xlsx or pdf)" },
      },
    ],
    sections: [
      {
        id: "sec-1",
        requirementId: "req-1",
        title: "Organization Overview",
        content: `Whisker Haven Cat Rescue is a 501(c)(3) nonprofit organization based in San Diego, California, dedicated to ending preventable cat euthanasia throughout San Diego County. Since our founding in 2018, we have built one of the region's most active cat rescue networks — rescuing over 4,200 animals and maintaining a 97% live release rate.

Our programs span the full rescue continuum: direct intake from field operations and municipal shelter transfers, a foster network of 180 active volunteers, a community spay/neuter clinic serving over 600 cats annually, and a kitten nursery providing 24-hour care for neonates who would otherwise have no survival path. Our mission is not merely to rescue individual animals but to shift community-level outcomes through evidence-based, data-tracked programming.`,
      },
      {
        id: "sec-2",
        requirementId: "req-2",
        title: "Program Description and Activities to Be Funded",
        content: `The Petco Love Lost & Found Grant will directly fund three core program expansions over the 12-month grant period.

First, we will increase rescue intake capacity by 20% — from approximately 1,000 to 1,200 animals per year — through the addition of a 0.5 FTE rescue coordinator. This role will manage field rescue operations, coordinate municipal shelter transfers, and oversee triage intake protocols.

Second, we will add a second mobile outreach vehicle to extend community reach into underserved neighborhoods across southeastern and eastern San Diego. The vehicle will support TNR operations, community microchipping events, and direct transport of animals to foster care.

Third, we will deepen partnerships with two local municipal animal control facilities to establish formal transfer protocols, reducing euthanasia risk for cats that exceed municipal holding periods.`,
      },
      {
        id: "sec-3",
        requirementId: "req-3",
        title: "Expected Outcomes and Impact Metrics",
        content: `With this investment, Whisker Haven projects the following measurable outcomes over the 12-month grant period:

• 240 additional rescues above our current annual baseline (20% intake increase)
• Sustained live release rate at or above 96%
• 150 additional TNR procedures in underserved zip codes
• Two formal municipal transfer partnerships established`,
      },
      {
        id: "sec-4",
        requirementId: "req-4",
        title: "Evaluation Methodology and Reporting Plan",
        content: "",
      },
      {
        id: "sec-5",
        requirementId: "req-5",
        title: "Budget Narrative",
        content: "",
      },
    ],
    sourceAttachmentId: "att-1",
    contextAttachmentIds: ["att-2"],
  },
]

// ── Snippets ───────────────────────────────────────────────────────────────

export const SNIPPETS: Snippet[] = [
  {
    id: "snip-1",
    organizationId: "org-1",
    title: "Mission statement",
    body: "Whisker Haven Cat Rescue is a 501(c)(3) nonprofit organization dedicated to ending preventable cat euthanasia in San Diego County through direct rescue, foster care, and evidence-based community programs.",
    category: "mission",
  },
  {
    id: "snip-2",
    organizationId: "org-1",
    title: "Live release rate stat",
    body: "Since our founding in 2018, we have maintained a live release rate of 97% across more than 4,200 rescues — a benchmark placing us among the top-performing cat rescues in California.",
    category: "outcomes",
  },
  {
    id: "snip-3",
    organizationId: "org-1",
    title: "Foster network description",
    body: "Our foster network of 180 active volunteers provides temporary homes for cats and kittens awaiting adoption, including specialized care for neonates, seniors, and medically complex animals who require additional time before placement.",
    category: "programs",
  },
  {
    id: "snip-4",
    organizationId: "org-1",
    title: "Spay/neuter program stats",
    body: "Our community spay/neuter clinic serves more than 600 cats annually, prioritizing owned pets in low-income households and community cats through our TNR program, which operates in 12 zip codes across San Diego County.",
    category: "programs",
  },
  {
    id: "snip-5",
    organizationId: "org-1",
    title: "IRS status boilerplate",
    body: "Whisker Haven Cat Rescue holds 501(c)(3) public charity status as recognized by the Internal Revenue Service (EIN: 47-1234567). Contributions are tax-deductible to the extent permitted by law.",
    category: "other",
  },
]

export function getWritingSession(artifactId: string): WritingSession | undefined {
  return WRITING_SESSIONS.find((s) => s.artifactId === artifactId)
}

export function getSnippetsForOrg(orgId: string): Snippet[] {
  return SNIPPETS.filter((s) => s.organizationId === orgId)
}

// ── Comment Threads ────────────────────────────────────────────────────────

export const COMMENT_THREADS: CommentThread[] = [
  {
    id: "thread-1",
    artifactId: "art-1",
    sectionId: "sec-1",
    requirementId: "req-1",
    anchorText: "97% live release rate",
    anchorStart: 321,
    anchorEnd: 342,
    anchorStatus: "intact",
    status: "open",
    createdAt: "2026-06-07T14:23:00Z",
    comments: [
      {
        id: "cmt-1",
        threadId: "thread-1",
        authorId: "user-2",
        content: "Should we cite the source for this stat? The funder might want a link to our shelter management report.",
        createdAt: "2026-06-07T14:23:00Z",
        mentions: [],
      },
      {
        id: "cmt-2",
        threadId: "thread-1",
        authorId: "user-1",
        content: "@Jordan M. Good catch — I'll add a footnote referencing the annual report. The data is from our Rescue Track dashboard.",
        createdAt: "2026-06-07T15:04:00Z",
        mentions: ["user-2"],
      },
    ],
  },
  {
    id: "thread-2",
    artifactId: "art-1",
    sectionId: "sec-2",
    requirementId: "req-2",
    anchorText: "0.5 FTE rescue coordinator",
    anchorStart: 238,
    anchorEnd: 264,
    anchorStatus: "intact",
    status: "open",
    createdAt: "2026-06-08T09:10:00Z",
    comments: [
      {
        id: "cmt-3",
        threadId: "thread-2",
        authorId: "user-3",
        content: "Do we want to say \"0.5 FTE\" here or just \"part-time\"? I think the funder guidelines preferred plain language.",
        createdAt: "2026-06-08T09:10:00Z",
        mentions: [],
      },
    ],
  },
  {
    id: "thread-3",
    artifactId: "art-1",
    sectionId: "sec-3",
    requirementId: "req-3",
    anchorText: "240 additional rescues",
    anchorStart: 131,
    anchorEnd: 153,
    anchorStatus: "intact",
    status: "resolved",
    createdAt: "2026-06-06T16:45:00Z",
    comments: [
      {
        id: "cmt-4",
        threadId: "thread-3",
        authorId: "user-2",
        content: "This number needs to reconcile with the budget narrative — 240 rescues at what per-animal cost?",
        createdAt: "2026-06-06T16:45:00Z",
        mentions: [],
      },
      {
        id: "cmt-5",
        threadId: "thread-3",
        authorId: "user-1",
        content: "Reconciled in the budget spreadsheet — $208 per animal intake. We're good.",
        createdAt: "2026-06-06T17:22:00Z",
        mentions: [],
      },
    ],
  },
]

export function getCommentThreadsForArtifact(artifactId: string): CommentThread[] {
  return COMMENT_THREADS.filter((t) => t.artifactId === artifactId)
}

export function updatePipelineStatus(pipId: string, status: PipelineStatus): void {
  const pip = PIPELINE_OPPORTUNITIES.find(p => p.id === pipId)
  if (!pip) return
  pip.status = status
  if (status === "application-submitted" && !pip.submittedAt) {
    pip.submittedAt = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }
}

export function submitPursuitApplication(
  pipId: string,
  artifactId: string,
  appAttachmentIds: string[],
): void {
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  const pip = PIPELINE_OPPORTUNITIES.find(p => p.id === pipId)
  if (pip) {
    pip.status = "application-submitted"
    pip.submittedAt = today
  }

  const artifact = ARTIFACTS.find(a => a.id === artifactId)
  if (artifact) artifact.isSubmitted = true

  for (const id of appAttachmentIds) {
    const att = ATTACHMENTS.find(a => a.id === id)
    if (att) att.includedInSubmission = true
  }
}
