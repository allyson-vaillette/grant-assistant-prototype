import type {
  Account, Organization, User, Membership, Project,
  Funder, Opportunity, PipelineOpportunity, PipelineStatus,
  Artifact, Attachment, Task, Match,
  WritingSession, Snippet, CommentThread, RecentGrant,
  FunderIntelligence, TrackedFunder,
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
    matchReasons: [
      { label: "Focus Areas", value: "Animal Welfare, Spay/Neuter" },
      { label: "Eligible Project Location", value: "National" },
      { value: "History of funding shelter and rescue programs" },
    ],
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
    matchReasons: [
      { label: "Focus Areas", value: "Animal Welfare, Shelter Reform" },
      { label: "Eligible Project Location", value: "National" },
      { value: "History of funding animal welfare nonprofits" },
    ],
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
    matchReasons: [
      { label: "Focus Areas", value: "Spay/Neuter, Community Programs" },
      { label: "Eligible Project Location", value: "Los Angeles County" },
      { value: "History of serving Los Angeles County" },
    ],
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
  {
    id: "match-6",
    organizationId: "org-1",
    funderId: "funder-best-friends",
    opportunityId: "opp-6",
    matchStrength: "good",
    matchScore: 4,
    reasons: {
      positive: [
        "No-kill coalition work aligns with your rescue-to-shelter diversion model.",
        "San Diego Humane Society is an established Best Friends network partner — an existing relationship strengthens your application.",
        "Geography: national funder, California organizations well-represented in their portfolio.",
      ],
      cautions: [
        "Coalition documentation required: you'll need to show a formal data-sharing arrangement with a municipal shelter before applying.",
      ],
    },
  },
  {
    id: "match-7",
    organizationId: "org-1",
    funderId: "funder-best-friends",
    opportunityId: "opp-7",
    matchStrength: "strong",
    matchScore: 5,
    isNew: true,
    reasons: {
      positive: [
        "Foster network expansion is one of your core strategic priorities — a direct fit.",
        "Your existing volunteer infrastructure gives you a credible foundation to show capacity to scale.",
        "Best Friends treats foster expansion as a primary lifesaving lever; your model demonstrates exactly that.",
      ],
      cautions: [
        "Scale ambition: proposals should include a concrete target (number of new foster homes, animals placed) to be competitive.",
      ],
    },
    matchReasons: [
      { label: "Focus Areas", value: "Animal Welfare, Foster Programs" },
      { label: "Eligible Project Location", value: "National" },
      { value: "History of funding foster and rescue networks" },
    ],
  },
  {
    id: "match-8",
    organizationId: "org-1",
    funderId: "funder-doris-day",
    opportunityId: "opp-8",
    matchStrength: "strong",
    matchScore: 5,
    isNew: true,
    reasons: {
      positive: [
        "TNR is one of your primary programs — this grant was designed for organizations like yours.",
        "Colony management records: your documentation of managed colonies is exactly what they require.",
        "Smaller community-based orgs are explicitly preferred; your size is an advantage here.",
      ],
      cautions: [
        "Grant ceiling is $12K — plan for this as supplemental funding rather than a primary source.",
      ],
    },
    matchReasons: [
      { label: "Focus Areas", value: "Spay/Neuter, Community Cats" },
      { label: "Eligible Project Location", value: "National" },
      { value: "History of funding TNR and community cat programs" },
    ],
  },
  {
    id: "match-9",
    organizationId: "org-1",
    funderId: "funder-doris-day",
    opportunityId: "opp-9",
    matchStrength: "partial",
    matchScore: 3,
    reasons: {
      positive: [
        "Your low-cost spay/neuter services touch owned pets in low-income households, which overlaps with the stated priority.",
        "San Diego's high rental cost burden means there's real need for owner-support services your org could address.",
      ],
      cautions: [
        "Program fit is indirect — Whisker Haven's primary focus is rescue and TNR, not owned-pet retention services. You'd need to reframe or expand scope.",
        "Income eligibility criteria: the grant requires a formal income-screening process you may not currently have.",
      ],
    },
  },
  {
    id: "match-10",
    organizationId: "org-1",
    funderId: "funder-petfinder",
    opportunityId: "opp-10",
    matchStrength: "good",
    matchScore: 4,
    reasons: {
      positive: [
        "Petfinder membership: your active listings make you eligible and the application process streamlined.",
        "Adoption outcomes: your placement data directly supports the 25+ adoptions/year threshold.",
        "Rolling deadline means you can apply when your adoption numbers and photos are strongest.",
      ],
      cautions: [
        "Competitive at the lower end: $10K ceiling means this is a capacity-building supplement, not a program grant.",
      ],
    },
  },
  {
    id: "match-11",
    organizationId: "org-1",
    funderId: "funder-petfinder",
    opportunityId: "opp-11",
    matchStrength: "partial",
    matchScore: 3,
    reasons: {
      positive: [
        "Rolling deadline and fast review (5 business days) make this a reliable safety net for unexpected crises.",
        "Rescue organizations regularly face intake surges — a documented surge event would qualify.",
      ],
      cautions: [
        "Reactive by design: this is emergency relief, not proactive program funding. Apply only in response to a real crisis.",
        "Low ceiling ($5K) limits strategic impact; better suited as gap coverage than a planned funding stream.",
      ],
    },
  },
  {
    id: "match-12",
    organizationId: "org-1",
    funderId: "funder-humane-society",
    opportunityId: "opp-12",
    matchStrength: "good",
    matchScore: 4,
    reasons: {
      positive: [
        "Your intake diversion work — pulling cats from San Diego Humane before euthanasia — is a textbook shelter reform model.",
        "Live release rate data: your placement outcomes give you the metrics this grant requires.",
        "HSUS values innovation; your kitten nursery and neonatal care program could serve as the required 'innovation component.'",
      ],
      cautions: [
        "You'll need to clearly frame Whisker Haven as a shelter partner, not just a standalone rescue, to fit the grant's shelter-reform framing.",
      ],
    },
  },
  {
    id: "match-13",
    organizationId: "org-1",
    funderId: "funder-humane-society",
    opportunityId: "opp-13",
    matchStrength: "partial",
    matchScore: 3,
    reasons: {
      positive: [
        "San Diego is a disaster-prone region (wildfires, flooding) — emergency transport capacity is genuinely relevant for a rescue org here.",
        "HSUS recognizes rescue orgs as first responders in large-scale cruelty cases, which you're positioned to support.",
      ],
      cautions: [
        "Emergency response plan required: you'd need a documented plan on file before applying, which may require prep work.",
        "This is not a primary fit — disaster response isn't a core part of your current program portfolio.",
      ],
    },
  },
  {
    id: "match-14",
    organizationId: "org-1",
    funderId: "funder-ca-coastal",
    opportunityId: "opp-14",
    matchStrength: "partial",
    matchScore: 3,
    reasons: {
      positive: [
        "Your work directly benefits LA County residents who adopt cats through your network.",
        "California Community Foundation has funded San Diego-adjacent orgs when they serve LA County populations.",
      ],
      cautions: [
        "Geographic restriction: this grant is explicitly for Los Angeles County service areas. San Diego operations are unlikely to qualify without an LA County presence or partnership.",
        "Verify with program staff before investing time in an application.",
      ],
    },
  },
  {
    id: "match-15",
    organizationId: "org-1",
    funderId: "funder-aspca",
    opportunityId: "opp-15",
    matchStrength: "strong",
    matchScore: 5,
    isNew: true,
    reasons: {
      positive: [
        "Neonatal kitten care is central to Whisker Haven's work — your nursery program is exactly what this grant funds.",
        "24-hour care capability: your bottle-baby volunteer network demonstrates the round-the-clock capacity they require.",
        "ASPCA has historically prioritized orgs with demonstrated kitten throughput; your placement numbers make a strong case.",
      ],
      cautions: [
        "Documentation depth: ASPCA expects outcome data (kittens received, weaned, placed) — make sure your records are clean and queryable before applying.",
      ],
    },
    matchReasons: [
      { label: "Focus Areas", value: "Cat & Kitten Programs, Animal Welfare" },
      { label: "Eligible Project Location", value: "National" },
      { value: "History of funding neonatal kitten care programs" },
    ],
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

// ── Funder Intelligence ────────────────────────────────────────────────────

export const FUNDER_INTELLIGENCE: FunderIntelligence[] = [
  {
    funderId: "funder-petco",
    yearlyGiving: [
      { year: 2019, totalAmount: 1_800_000, newGranteeCount: 42, repeatGranteeCount: 28 },
      { year: 2020, totalAmount: 2_100_000, newGranteeCount: 51, repeatGranteeCount: 31 },
      { year: 2021, totalAmount: 3_200_000, newGranteeCount: 78, repeatGranteeCount: 40 },
      { year: 2022, totalAmount: 3_800_000, newGranteeCount: 89, repeatGranteeCount: 52 },
      { year: 2023, totalAmount: 4_200_000, newGranteeCount: 95, repeatGranteeCount: 58 },
    ],
    medianGrantAmount: 32_000,
    notableGrantees: [
      "San Diego Humane Society",
      "Austin Pets Alive",
      "Nevada Humane Society",
      "San Francisco SPCA",
      "Seattle Humane",
    ],
  },
  {
    funderId: "funder-aspca",
    yearlyGiving: [
      { year: 2019, totalAmount: 2_400_000, newGranteeCount: 38, repeatGranteeCount: 24 },
      { year: 2020, totalAmount: 2_800_000, newGranteeCount: 44, repeatGranteeCount: 28 },
      { year: 2021, totalAmount: 3_100_000, newGranteeCount: 52, repeatGranteeCount: 33 },
      { year: 2022, totalAmount: 3_500_000, newGranteeCount: 58, repeatGranteeCount: 38 },
      { year: 2023, totalAmount: 4_000_000, newGranteeCount: 62, repeatGranteeCount: 44 },
    ],
    medianGrantAmount: 45_000,
    notableGrantees: [
      "Humane Rescue Alliance",
      "Animal Rescue League of Boston",
      "Kentucky Humane Society",
    ],
  },
  {
    funderId: "funder-found-animals",
    yearlyGiving: [
      { year: 2019, totalAmount: 800_000, newGranteeCount: 14, repeatGranteeCount: 8 },
      { year: 2020, totalAmount: 950_000, newGranteeCount: 18, repeatGranteeCount: 9 },
      { year: 2021, totalAmount: 1_100_000, newGranteeCount: 22, repeatGranteeCount: 11 },
      { year: 2022, totalAmount: 1_300_000, newGranteeCount: 25, repeatGranteeCount: 14 },
      { year: 2023, totalAmount: 1_500_000, newGranteeCount: 28, repeatGranteeCount: 17 },
    ],
    medianGrantAmount: 42_000,
    notableGrantees: [
      "Downtown Dog Rescue",
      "L.A. Animal Services",
      "Lange Foundation",
    ],
  },
  {
    funderId: "funder-maddies",
    yearlyGiving: [
      { year: 2019, totalAmount: 7_200_000, newGranteeCount: 12, repeatGranteeCount: 22 },
      { year: 2020, totalAmount: 8_400_000, newGranteeCount: 14, repeatGranteeCount: 24 },
      { year: 2021, totalAmount: 9_800_000, newGranteeCount: 16, repeatGranteeCount: 27 },
      { year: 2022, totalAmount: 11_200_000, newGranteeCount: 18, repeatGranteeCount: 29 },
      { year: 2023, totalAmount: 12_500_000, newGranteeCount: 21, repeatGranteeCount: 31 },
    ],
    medianGrantAmount: 85_000,
    notableGrantees: [
      "Best Friends Animal Society",
      "Oregon Humane Society",
      "Pima Animal Care Center",
      "Austin Pets Alive",
      "Washoe County Regional Animal Services",
    ],
  },
  {
    funderId: "funder-petsmart",
    yearlyGiving: [
      { year: 2019, totalAmount: 4_800_000, newGranteeCount: 58, repeatGranteeCount: 34 },
      { year: 2020, totalAmount: 5_200_000, newGranteeCount: 62, repeatGranteeCount: 37 },
      { year: 2021, totalAmount: 6_100_000, newGranteeCount: 71, repeatGranteeCount: 44 },
      { year: 2022, totalAmount: 6_900_000, newGranteeCount: 78, repeatGranteeCount: 50 },
      { year: 2023, totalAmount: 7_800_000, newGranteeCount: 85, repeatGranteeCount: 55 },
    ],
    medianGrantAmount: 35_000,
    notableGrantees: [
      "North Shore Animal League",
      "Kitten Lady Foundation",
      "Tree House Humane Society",
      "Nashville Humane Association",
      "Stray Cat Alliance",
    ],
  },
  {
    funderId: "funder-best-friends",
    yearlyGiving: [
      { year: 2019, totalAmount: 2_600_000, newGranteeCount: 38, repeatGranteeCount: 19 },
      { year: 2020, totalAmount: 3_100_000, newGranteeCount: 45, repeatGranteeCount: 22 },
      { year: 2021, totalAmount: 3_900_000, newGranteeCount: 54, repeatGranteeCount: 27 },
      { year: 2022, totalAmount: 4_700_000, newGranteeCount: 62, repeatGranteeCount: 33 },
      { year: 2023, totalAmount: 5_400_000, newGranteeCount: 68, repeatGranteeCount: 38 },
    ],
    medianGrantAmount: 40_000,
    notableGrantees: [
      "Houston Humane Society",
      "Animal Rescue of the Rockies",
      "Triangle Beagle Rescue",
      "KC Pet Project",
      "Long Beach Animal Care Services",
    ],
  },
  {
    funderId: "funder-doris-day",
    yearlyGiving: [
      { year: 2019, totalAmount: 280_000, newGranteeCount: 16, repeatGranteeCount: 6 },
      { year: 2020, totalAmount: 310_000, newGranteeCount: 18, repeatGranteeCount: 7 },
      { year: 2021, totalAmount: 370_000, newGranteeCount: 21, repeatGranteeCount: 9 },
      { year: 2022, totalAmount: 420_000, newGranteeCount: 24, repeatGranteeCount: 10 },
      { year: 2023, totalAmount: 480_000, newGranteeCount: 27, repeatGranteeCount: 12 },
    ],
    medianGrantAmount: 15_000,
    notableGrantees: [
      "Alley Cat Allies",
      "Mid-America Spay/Neuter Clinic",
      "Feral Cat Coalition of Oregon",
      "Community Cats of Greater Cincinnati",
    ],
  },
  {
    funderId: "funder-petfinder",
    yearlyGiving: [
      { year: 2019, totalAmount: 480_000, newGranteeCount: 52, repeatGranteeCount: 18 },
      { year: 2020, totalAmount: 560_000, newGranteeCount: 61, repeatGranteeCount: 21 },
      { year: 2021, totalAmount: 640_000, newGranteeCount: 68, repeatGranteeCount: 25 },
      { year: 2022, totalAmount: 720_000, newGranteeCount: 74, repeatGranteeCount: 28 },
      { year: 2023, totalAmount: 810_000, newGranteeCount: 81, repeatGranteeCount: 32 },
    ],
    medianGrantAmount: 8_000,
    notableGrantees: [
      "Rescue Me! Animal Sanctuary",
      "Friends of the Shelter",
      "Paws of Hope Rescue",
      "Second Chance Animal Rescue",
    ],
  },
  {
    funderId: "funder-ca-coastal",
    yearlyGiving: [
      { year: 2019, totalAmount: 980_000, newGranteeCount: 13, repeatGranteeCount: 9 },
      { year: 2020, totalAmount: 1_100_000, newGranteeCount: 15, repeatGranteeCount: 10 },
      { year: 2021, totalAmount: 1_350_000, newGranteeCount: 17, repeatGranteeCount: 12 },
      { year: 2022, totalAmount: 1_600_000, newGranteeCount: 19, repeatGranteeCount: 13 },
      { year: 2023, totalAmount: 1_850_000, newGranteeCount: 21, repeatGranteeCount: 14 },
    ],
    medianGrantAmount: 38_000,
    notableGrantees: [
      "L.A. Animal Services Foundation",
      "Lange Foundation",
      "Stray Cat Alliance",
      "NKLA Coalition",
    ],
  },
  {
    funderId: "funder-humane-society",
    yearlyGiving: [
      { year: 2019, totalAmount: 2_100_000, newGranteeCount: 42, repeatGranteeCount: 18 },
      { year: 2020, totalAmount: 2_500_000, newGranteeCount: 48, repeatGranteeCount: 22 },
      { year: 2021, totalAmount: 2_900_000, newGranteeCount: 54, repeatGranteeCount: 26 },
      { year: 2022, totalAmount: 3_300_000, newGranteeCount: 59, repeatGranteeCount: 29 },
      { year: 2023, totalAmount: 3_800_000, newGranteeCount: 64, repeatGranteeCount: 33 },
    ],
    medianGrantAmount: 28_000,
    notableGrantees: [
      "Charleston Animal Society",
      "Animal Rescue Corps",
      "Tri-County Animal Rescue",
      "Animal Welfare League of Arlington",
    ],
  },
]

export function getFunderIntelligence(funderId: string): FunderIntelligence | undefined {
  return FUNDER_INTELLIGENCE.find((fi) => fi.funderId === funderId)
}

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

// ── Tracked Funders ────────────────────────────────────────────────────────

export const TRACKED_FUNDERS: TrackedFunder[] = []

export function trackFunder(funderId: string, organizationId = "org-1"): TrackedFunder {
  const existing = TRACKED_FUNDERS.find(t => t.funderId === funderId)
  if (existing) return existing
  const tf: TrackedFunder = {
    id: `tf-${TRACKED_FUNDERS.length + 1}-${funderId}`,
    funderId,
    organizationId,
    trackedAt: new Date().toISOString(),
  }
  TRACKED_FUNDERS.push(tf)
  return tf
}

export function isTrackedFunder(funderId: string): boolean {
  return TRACKED_FUNDERS.some(t => t.funderId === funderId)
}

export function untrackFunder(funderId: string): void {
  const idx = TRACKED_FUNDERS.findIndex(t => t.funderId === funderId)
  if (idx >= 0) TRACKED_FUNDERS.splice(idx, 1)
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

// ── Funder Extended Data ───────────────────────────────────────────────────

import type { FunderExtended } from "./types"

const BUCKET_LABELS = ["<$5k", "$5k-$15k", "$15k-$25k", "$25k-$50k", "$50k-$150k", "$150k-$500k", "$500k-$1.5m", "$1.5m+"]

export const FUNDER_EXTENDED: FunderExtended[] = [
  {
    funderId: "funder-petco",
    address: "100 Petco Park Way, San Diego, CA 92103",
    phone: "(858) 555-0142",
    totalAssetsEstimate: 84_000_000,
    yearlyAssets: [52_000_000, 61_000_000, 72_000_000, 79_000_000, 84_000_000],
    keyPeople: [
      { name: "Susanne Kogut", title: "President & CEO" },
      { name: "Sara Kent", title: "VP Grantmaking" },
      { name: "Marcus Webb", title: "Grants Manager" },
    ],
    forms990: [
      { year: 2023, url: "#" }, { year: 2022, url: "#" },
      { year: 2021, url: "#" }, { year: 2020, url: "#" }, { year: 2019, url: "#" },
    ],
    nteeBreakdown: [
      { code: "D20", label: "Animal Protection & Welfare", amount: 2_100_000 },
      { code: "D10", label: "Animal Related (General)", amount: 1_200_000 },
      { code: "D30", label: "Wildlife Preservation", amount: 580_000 },
      { code: "D40", label: "Veterinary Services", amount: 220_000 },
      { code: "D99", label: "Other Animal Related", amount: 100_000 },
    ],
    pastGrantees: [
      { id: "pg-pc-1", name: "San Diego Humane Society", year: 2023, location: "San Diego, CA", amount: 75000, purpose: "Shelter capacity expansion and kitten nursery staffing" },
      { id: "pg-pc-2", name: "Austin Pets Alive", year: 2023, location: "Austin, TX", amount: 50000, purpose: "No-kill program operations and foster network" },
      { id: "pg-pc-3", name: "Nevada Humane Society", year: 2022, location: "Reno, NV", amount: 40000, purpose: "Community spay/neuter outreach program" },
      { id: "pg-pc-4", name: "San Francisco SPCA", year: 2022, location: "San Francisco, CA", amount: 35000, purpose: "Intake reduction and community cat management" },
      { id: "pg-pc-5", name: "Seattle Humane", year: 2023, location: "Bellevue, WA", amount: 28000, purpose: "Foster program expansion and volunteer training" },
      { id: "pg-pc-6", name: "Charleston Animal Society", year: 2021, location: "Charleston, SC", amount: 32000, purpose: "Low-cost veterinary services for underserved pets" },
      { id: "pg-pc-7", name: "Animal Humane Society", year: 2021, location: "Golden Valley, MN", amount: 45000, purpose: "Shelter medicine and neonatal kitten care" },
    ],
    grantYearStats: [
      {
        yearKey: "snapshot", yearLabel: "Snapshot",
        min: 5000, max: 50000, median: 32000, average: 27451, count: 563,
        buckets: [
          { label: "<$5k", count: 16 }, { label: "$5k-$15k", count: 110 },
          { label: "$15k-$25k", count: 172 }, { label: "$25k-$50k", count: 234 },
          { label: "$50k-$150k", count: 31 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2023, yearLabel: "2023",
        min: 5000, max: 50000, median: 32000, average: 27451, count: 153,
        buckets: [
          { label: "<$5k", count: 4 }, { label: "$5k-$15k", count: 28 },
          { label: "$15k-$25k", count: 47 }, { label: "$25k-$50k", count: 62 },
          { label: "$50k-$150k", count: 12 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2022, yearLabel: "2022",
        min: 5000, max: 50000, median: 30000, average: 26950, count: 141,
        buckets: [
          { label: "<$5k", count: 4 }, { label: "$5k-$15k", count: 27 },
          { label: "$15k-$25k", count: 43 }, { label: "$25k-$50k", count: 57 },
          { label: "$50k-$150k", count: 10 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2021, yearLabel: "2021",
        min: 5000, max: 50000, median: 28000, average: 27119, count: 118,
        buckets: [
          { label: "<$5k", count: 3 }, { label: "$5k-$15k", count: 22 },
          { label: "$15k-$25k", count: 38 }, { label: "$25k-$50k", count: 48 },
          { label: "$50k-$150k", count: 7 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2020, yearLabel: "2020",
        min: 5000, max: 45000, median: 26000, average: 25610, count: 82,
        buckets: [
          { label: "<$5k", count: 2 }, { label: "$5k-$15k", count: 15 },
          { label: "$15k-$25k", count: 26 }, { label: "$25k-$50k", count: 34 },
          { label: "$50k-$150k", count: 5 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2019, yearLabel: "2019",
        min: 5000, max: 40000, median: 24000, average: 25714, count: 70,
        buckets: [
          { label: "<$5k", count: 2 }, { label: "$5k-$15k", count: 14 },
          { label: "$15k-$25k", count: 22 }, { label: "$25k-$50k", count: 28 },
          { label: "$50k-$150k", count: 4 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
    ],
  },
  {
    funderId: "funder-aspca",
    address: "424 E 92nd St, New York, NY 10128",
    phone: "(212) 876-7700",
    totalAssetsEstimate: 292_000_000,
    yearlyAssets: [210_000_000, 240_000_000, 265_000_000, 280_000_000, 292_000_000],
    keyPeople: [
      { name: "Matt Bershadker", title: "President & CEO" },
      { name: "Howard Lawrence", title: "VP Grants & Awards" },
      { name: "Tara Loller", title: "Senior Grants Officer" },
    ],
    forms990: [
      { year: 2023, url: "#" }, { year: 2022, url: "#" },
      { year: 2021, url: "#" }, { year: 2020, url: "#" }, { year: 2019, url: "#" },
    ],
    nteeBreakdown: [
      { code: "D20", label: "Animal Protection & Welfare", amount: 1_800_000 },
      { code: "D30", label: "Spay/Neuter Programs", amount: 900_000 },
      { code: "D10", label: "Animal Related (General)", amount: 700_000 },
      { code: "D40", label: "Veterinary Services", amount: 400_000 },
      { code: "D99", label: "Other Animal Related", amount: 200_000 },
    ],
    pastGrantees: [
      { id: "pg-as-1", name: "Humane Rescue Alliance", year: 2023, location: "Washington, D.C.", amount: 65000, purpose: "Shelter intake reduction and live release rate improvement" },
      { id: "pg-as-2", name: "Animal Rescue League of Boston", year: 2023, location: "Boston, MA", amount: 50000, purpose: "Foster network expansion and neonatal kitten program" },
      { id: "pg-as-3", name: "Kentucky Humane Society", year: 2022, location: "Louisville, KY", amount: 45000, purpose: "Community cat management and TNR operations" },
      { id: "pg-as-4", name: "San Diego Humane Society", year: 2022, location: "San Diego, CA", amount: 55000, purpose: "Kitten nursery staffing and bottle-baby program" },
      { id: "pg-as-5", name: "Oregon Humane Society", year: 2021, location: "Portland, OR", amount: 48000, purpose: "Shelter medicine program and surgical capacity" },
      { id: "pg-as-6", name: "Pets Alive", year: 2021, location: "Middletown, NY", amount: 35000, purpose: "No-kill community coalition building" },
    ],
    grantYearStats: [
      {
        yearKey: "snapshot", yearLabel: "Snapshot",
        min: 5000, max: 75000, median: 45000, average: 38462, count: 260,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 18 },
          { label: "$15k-$25k", count: 32 }, { label: "$25k-$50k", count: 142 },
          { label: "$50k-$150k", count: 68 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2023, yearLabel: "2023",
        min: 8000, max: 75000, median: 45000, average: 38710, count: 62,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 5 },
          { label: "$15k-$25k", count: 8 }, { label: "$25k-$50k", count: 34 },
          { label: "$50k-$150k", count: 15 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2022, yearLabel: "2022",
        min: 5000, max: 75000, median: 43000, average: 36897, count: 58,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 5 },
          { label: "$15k-$25k", count: 9 }, { label: "$25k-$50k", count: 31 },
          { label: "$50k-$150k", count: 13 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2021, yearLabel: "2021",
        min: 5000, max: 70000, median: 40000, average: 36176, count: 52,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 4 },
          { label: "$15k-$25k", count: 7 }, { label: "$25k-$50k", count: 28 },
          { label: "$50k-$150k", count: 13 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2020, yearLabel: "2020",
        min: 5000, max: 65000, median: 38000, average: 38095, count: 44,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 3 },
          { label: "$15k-$25k", count: 6 }, { label: "$25k-$50k", count: 25 },
          { label: "$50k-$150k", count: 10 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2019, yearLabel: "2019",
        min: 5000, max: 60000, median: 35000, average: 38710, count: 44,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 4 },
          { label: "$15k-$25k", count: 7 }, { label: "$25k-$50k", count: 24 },
          { label: "$50k-$150k", count: 9 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
    ],
  },
  {
    funderId: "funder-maddies",
    address: "6160 Stoneridge Mall Rd, Pleasanton, CA 94588",
    phone: "(925) 310-5450",
    totalAssetsEstimate: 750_000_000,
    yearlyAssets: [540_000_000, 600_000_000, 660_000_000, 710_000_000, 750_000_000],
    keyPeople: [
      { name: "Rich Avanzino", title: "President" },
      { name: "Julie Castle", title: "Chief Program Officer" },
      { name: "Dr. Kate Hurley", title: "Director of Shelter Medicine" },
    ],
    forms990: [
      { year: 2023, url: "#" }, { year: 2022, url: "#" },
      { year: 2021, url: "#" }, { year: 2020, url: "#" }, { year: 2019, url: "#" },
    ],
    nteeBreakdown: [
      { code: "D20", label: "Animal Protection & Welfare", amount: 5_500_000 },
      { code: "D10", label: "Animal Related (General)", amount: 3_800_000 },
      { code: "D40", label: "Veterinary Services", amount: 2_100_000 },
      { code: "D30", label: "Wildlife Preservation", amount: 600_000 },
      { code: "D99", label: "Other Animal Related", amount: 500_000 },
    ],
    pastGrantees: [
      { id: "pg-md-1", name: "Best Friends Animal Society", year: 2023, location: "Kanab, UT", amount: 150000, purpose: "No-kill community coalition operations" },
      { id: "pg-md-2", name: "Oregon Humane Society", year: 2023, location: "Portland, OR", amount: 100000, purpose: "Shelter medicine fellowship program" },
      { id: "pg-md-3", name: "Pima Animal Care Center", year: 2022, location: "Tucson, AZ", amount: 75000, purpose: "Data-driven lifesaving initiative" },
      { id: "pg-md-4", name: "Austin Pets Alive", year: 2022, location: "Austin, TX", amount: 120000, purpose: "No-kill community modeling and replication" },
      { id: "pg-md-5", name: "Washoe County Regional Animal Services", year: 2021, location: "Reno, NV", amount: 90000, purpose: "Foster expansion and community outreach" },
      { id: "pg-md-6", name: "KC Pet Project", year: 2021, location: "Kansas City, MO", amount: 85000, purpose: "Municipal shelter reform and live release improvement" },
    ],
    grantYearStats: [
      {
        yearKey: "snapshot", yearLabel: "Snapshot",
        min: 25000, max: 200000, median: 85000, average: 92157, count: 170,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 0 },
          { label: "$15k-$25k", count: 0 }, { label: "$25k-$50k", count: 21 },
          { label: "$50k-$150k", count: 116 }, { label: "$150k-$500k", count: 33 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2023, yearLabel: "2023",
        min: 30000, max: 200000, median: 85000, average: 94697, count: 52,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 0 },
          { label: "$15k-$25k", count: 0 }, { label: "$25k-$50k", count: 6 },
          { label: "$50k-$150k", count: 36 }, { label: "$150k-$500k", count: 10 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2022, yearLabel: "2022",
        min: 25000, max: 180000, median: 82000, average: 89362, count: 47,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 0 },
          { label: "$15k-$25k", count: 0 }, { label: "$25k-$50k", count: 6 },
          { label: "$50k-$150k", count: 33 }, { label: "$150k-$500k", count: 8 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2021, yearLabel: "2021",
        min: 25000, max: 175000, median: 78000, average: 89908, count: 43,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 0 },
          { label: "$15k-$25k", count: 0 }, { label: "$25k-$50k", count: 5 },
          { label: "$50k-$150k", count: 30 }, { label: "$150k-$500k", count: 8 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2020, yearLabel: "2020",
        min: 25000, max: 160000, median: 72000, average: 86957, count: 46,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 0 },
          { label: "$15k-$25k", count: 0 }, { label: "$25k-$50k", count: 7 },
          { label: "$50k-$150k", count: 32 }, { label: "$150k-$500k", count: 7 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2019, yearLabel: "2019",
        min: 25000, max: 150000, median: 70000, average: 85714, count: 42,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 0 },
          { label: "$15k-$25k", count: 0 }, { label: "$25k-$50k", count: 7 },
          { label: "$50k-$150k", count: 28 }, { label: "$150k-$500k", count: 7 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
    ],
  },
  {
    funderId: "funder-found-animals",
    address: "1601 Cloverfield Blvd, Santa Monica, CA 90404",
    phone: "(310) 555-0181",
    totalAssetsEstimate: 48_000_000,
    yearlyAssets: [30_000_000, 34_000_000, 39_000_000, 43_000_000, 48_000_000],
    keyPeople: [
      { name: "Dr. Gary Michelson", title: "Founder & Chairman" },
      { name: "Aimee Gilbreath", title: "President" },
      { name: "Kevin Lewis", title: "Grants Director" },
    ],
    forms990: [
      { year: 2023, url: "#" }, { year: 2022, url: "#" },
      { year: 2021, url: "#" }, { year: 2020, url: "#" }, { year: 2019, url: "#" },
    ],
    nteeBreakdown: [
      { code: "D30", label: "Spay/Neuter Programs", amount: 680_000 },
      { code: "D20", label: "Animal Protection & Welfare", amount: 420_000 },
      { code: "D40", label: "Veterinary Services", amount: 280_000 },
      { code: "D10", label: "Animal Related (General)", amount: 80_000 },
      { code: "D99", label: "Other Animal Related", amount: 40_000 },
    ],
    pastGrantees: [
      { id: "pg-fa-1", name: "Downtown Dog Rescue", year: 2023, location: "Los Angeles, CA", amount: 60000, purpose: "Spay/neuter and microchipping for underserved communities" },
      { id: "pg-fa-2", name: "L.A. Animal Services", year: 2022, location: "Los Angeles, CA", amount: 75000, purpose: "Community cat TNR and colony management" },
      { id: "pg-fa-3", name: "Lange Foundation", year: 2022, location: "Los Angeles, CA", amount: 35000, purpose: "Low-cost spay/neuter clinic operations" },
      { id: "pg-fa-4", name: "Stray Cat Alliance", year: 2021, location: "Los Angeles, CA", amount: 42000, purpose: "TNR program and feral cat colony management" },
      { id: "pg-fa-5", name: "Pasadena Humane", year: 2021, location: "Pasadena, CA", amount: 38000, purpose: "Pet retention and owner support services" },
    ],
    grantYearStats: [
      {
        yearKey: "snapshot", yearLabel: "Snapshot",
        min: 10000, max: 75000, median: 42000, average: 37037, count: 135,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 6 },
          { label: "$15k-$25k", count: 18 }, { label: "$25k-$50k", count: 82 },
          { label: "$50k-$150k", count: 29 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2023, yearLabel: "2023",
        min: 10000, max: 75000, median: 42000, average: 33333, count: 45,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 2 },
          { label: "$15k-$25k", count: 6 }, { label: "$25k-$50k", count: 27 },
          { label: "$50k-$150k", count: 10 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2022, yearLabel: "2022",
        min: 10000, max: 75000, median: 40000, average: 33333, count: 39,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 2 },
          { label: "$15k-$25k", count: 5 }, { label: "$25k-$50k", count: 24 },
          { label: "$50k-$150k", count: 8 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2021, yearLabel: "2021",
        min: 10000, max: 70000, median: 38000, average: 33333, count: 33,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 1 },
          { label: "$15k-$25k", count: 5 }, { label: "$25k-$50k", count: 20 },
          { label: "$50k-$150k", count: 7 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2020, yearLabel: "2020",
        min: 10000, max: 65000, median: 36000, average: 35185, count: 27,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 1 },
          { label: "$15k-$25k", count: 3 }, { label: "$25k-$50k", count: 17 },
          { label: "$50k-$150k", count: 6 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2019, yearLabel: "2019",
        min: 10000, max: 60000, median: 34000, average: 36364, count: 22,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 1 },
          { label: "$15k-$25k", count: 3 }, { label: "$25k-$50k", count: 14 },
          { label: "$50k-$150k", count: 4 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
    ],
  },
  {
    funderId: "funder-petsmart",
    address: "19601 N 27th Ave, Phoenix, AZ 85027",
    phone: "(623) 555-0199",
    totalAssetsEstimate: 128_000_000,
    yearlyAssets: [88_000_000, 96_000_000, 108_000_000, 118_000_000, 128_000_000],
    keyPeople: [
      { name: "Aimee Gilbreath", title: "Executive Director" },
      { name: "Rachel Mielke", title: "VP Programs" },
      { name: "James Tedford", title: "Grants Manager" },
    ],
    forms990: [
      { year: 2023, url: "#" }, { year: 2022, url: "#" },
      { year: 2021, url: "#" }, { year: 2020, url: "#" }, { year: 2019, url: "#" },
    ],
    nteeBreakdown: [
      { code: "D20", label: "Animal Protection & Welfare", amount: 3_400_000 },
      { code: "D30", label: "Spay/Neuter Programs", amount: 2_100_000 },
      { code: "D10", label: "Animal Related (General)", amount: 1_500_000 },
      { code: "D40", label: "Veterinary Services", amount: 500_000 },
      { code: "D99", label: "Other Animal Related", amount: 300_000 },
    ],
    pastGrantees: [
      { id: "pg-ps-1", name: "North Shore Animal League", year: 2023, location: "Port Washington, NY", amount: 90000, purpose: "Cat and kitten foster program expansion" },
      { id: "pg-ps-2", name: "Kitten Lady Foundation", year: 2023, location: "Washington, D.C.", amount: 45000, purpose: "Neonatal kitten education and advocacy" },
      { id: "pg-ps-3", name: "Tree House Humane Society", year: 2022, location: "Chicago, IL", amount: 40000, purpose: "Community cat management and TNR operations" },
      { id: "pg-ps-4", name: "Nashville Humane Association", year: 2022, location: "Nashville, TN", amount: 55000, purpose: "Kitten nursery and foster program" },
      { id: "pg-ps-5", name: "Stray Cat Alliance", year: 2021, location: "Los Angeles, CA", amount: 38000, purpose: "TNR and community cat colony stewardship" },
      { id: "pg-ps-6", name: "San Diego Humane Society", year: 2021, location: "San Diego, CA", amount: 65000, purpose: "Foster network expansion and volunteer infrastructure" },
    ],
    grantYearStats: [
      {
        yearKey: "snapshot", yearLabel: "Snapshot",
        min: 10000, max: 100000, median: 35000, average: 55000, count: 340,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 22 },
          { label: "$15k-$25k", count: 62 }, { label: "$25k-$50k", count: 178 },
          { label: "$50k-$150k", count: 78 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2023, yearLabel: "2023",
        min: 10000, max: 100000, median: 35000, average: 55556, count: 140,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 8 },
          { label: "$15k-$25k", count: 22 }, { label: "$25k-$50k", count: 72 },
          { label: "$50k-$150k", count: 38 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2022, yearLabel: "2022",
        min: 10000, max: 90000, median: 33000, average: 54688, count: 128,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 8 },
          { label: "$15k-$25k", count: 22 }, { label: "$25k-$50k", count: 65 },
          { label: "$50k-$150k", count: 33 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2021, yearLabel: "2021",
        min: 10000, max: 85000, median: 31000, average: 52542, count: 118,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 8 },
          { label: "$15k-$25k", count: 20 }, { label: "$25k-$50k", count: 62 },
          { label: "$50k-$150k", count: 28 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2020, yearLabel: "2020",
        min: 10000, max: 80000, median: 28000, average: 52000, count: 100,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 7 },
          { label: "$15k-$25k", count: 16 }, { label: "$25k-$50k", count: 54 },
          { label: "$50k-$150k", count: 23 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2019, yearLabel: "2019",
        min: 10000, max: 75000, median: 26000, average: 52174, count: 92,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 6 },
          { label: "$15k-$25k", count: 15 }, { label: "$25k-$50k", count: 48 },
          { label: "$50k-$150k", count: 23 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
    ],
  },
  {
    funderId: "funder-best-friends",
    address: "5001 Angel Canyon Rd, Kanab, UT 84741",
    phone: "(435) 644-2001",
    totalAssetsEstimate: 88_000_000,
    yearlyAssets: [55_000_000, 62_000_000, 72_000_000, 80_000_000, 88_000_000],
    keyPeople: [
      { name: "Julie Castle", title: "Chief Executive Officer" },
      { name: "Francis Battista", title: "Co-founder & Board Chair" },
      { name: "Paul Saginaw", title: "Director of Grants" },
    ],
    forms990: [
      { year: 2023, url: "#" }, { year: 2022, url: "#" },
      { year: 2021, url: "#" }, { year: 2020, url: "#" }, { year: 2019, url: "#" },
    ],
    nteeBreakdown: [
      { code: "D20", label: "Animal Protection & Welfare", amount: 2_400_000 },
      { code: "D10", label: "Animal Related (General)", amount: 1_500_000 },
      { code: "D30", label: "Wildlife Preservation", amount: 900_000 },
      { code: "D40", label: "Veterinary Services", amount: 400_000 },
      { code: "D99", label: "Other Animal Related", amount: 200_000 },
    ],
    pastGrantees: [
      { id: "pg-bf-1", name: "Houston Humane Society", year: 2023, location: "Houston, TX", amount: 85000, purpose: "No-kill coalition operations and community outreach" },
      { id: "pg-bf-2", name: "Animal Rescue of the Rockies", year: 2023, location: "Denver, CO", amount: 50000, purpose: "Foster network expansion" },
      { id: "pg-bf-3", name: "Triangle Beagle Rescue", year: 2022, location: "Raleigh, NC", amount: 30000, purpose: "Breed-specific rescue and adoption program" },
      { id: "pg-bf-4", name: "KC Pet Project", year: 2022, location: "Kansas City, MO", amount: 75000, purpose: "Municipal shelter partnership and diversion" },
      { id: "pg-bf-5", name: "Long Beach Animal Care Services", year: 2021, location: "Long Beach, CA", amount: 60000, purpose: "No-kill community program" },
    ],
    grantYearStats: [
      {
        yearKey: "snapshot", yearLabel: "Snapshot",
        min: 10000, max: 100000, median: 40000, average: 40299, count: 268,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 12 },
          { label: "$15k-$25k", count: 32 }, { label: "$25k-$50k", count: 152 },
          { label: "$50k-$150k", count: 72 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2023, yearLabel: "2023",
        min: 10000, max: 100000, median: 40000, average: 50000, count: 106,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 5 },
          { label: "$15k-$25k", count: 14 }, { label: "$25k-$50k", count: 58 },
          { label: "$50k-$150k", count: 29 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2022, yearLabel: "2022",
        min: 10000, max: 90000, median: 38000, average: 47000, count: 95,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 4 },
          { label: "$15k-$25k", count: 13 }, { label: "$25k-$50k", count: 53 },
          { label: "$50k-$150k", count: 25 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2021, yearLabel: "2021",
        min: 10000, max: 80000, median: 36000, average: 43333, count: 81,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 4 },
          { label: "$15k-$25k", count: 11 }, { label: "$25k-$50k", count: 46 },
          { label: "$50k-$150k", count: 20 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2020, yearLabel: "2020",
        min: 10000, max: 75000, median: 34000, average: 46269, count: 67,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 3 },
          { label: "$15k-$25k", count: 9 }, { label: "$25k-$50k", count: 38 },
          { label: "$50k-$150k", count: 17 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2019, yearLabel: "2019",
        min: 10000, max: 70000, median: 32000, average: 45614, count: 57,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 3 },
          { label: "$15k-$25k", count: 8 }, { label: "$25k-$50k", count: 32 },
          { label: "$50k-$150k", count: 14 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
    ],
  },
  {
    funderId: "funder-doris-day",
    address: "PO Box 65597, Washington, D.C. 20035",
    phone: "(202) 555-0167",
    totalAssetsEstimate: 12_500_000,
    yearlyAssets: [7_800_000, 8_600_000, 9_800_000, 11_000_000, 12_500_000],
    keyPeople: [
      { name: "Kyla Duffy", title: "Executive Director" },
      { name: "Steven Moncrief", title: "Grants Administrator" },
    ],
    forms990: [
      { year: 2023, url: "#" }, { year: 2022, url: "#" },
      { year: 2021, url: "#" }, { year: 2020, url: "#" }, { year: 2019, url: "#" },
    ],
    nteeBreakdown: [
      { code: "D30", label: "Spay/Neuter Programs", amount: 220_000 },
      { code: "D20", label: "Animal Protection & Welfare", amount: 140_000 },
      { code: "D40", label: "Veterinary Services", amount: 80_000 },
      { code: "D99", label: "Other Animal Related", amount: 40_000 },
    ],
    pastGrantees: [
      { id: "pg-dd-1", name: "Alley Cat Allies", year: 2023, location: "Bethesda, MD", amount: 30000, purpose: "TNR program operations and advocacy" },
      { id: "pg-dd-2", name: "Mid-America Spay/Neuter Clinic", year: 2022, location: "Kansas City, MO", amount: 20000, purpose: "Low-cost spay/neuter clinic capacity" },
      { id: "pg-dd-3", name: "Feral Cat Coalition of Oregon", year: 2022, location: "Portland, OR", amount: 15000, purpose: "Community cat colony management" },
      { id: "pg-dd-4", name: "Community Cats of Greater Cincinnati", year: 2021, location: "Cincinnati, OH", amount: 12000, purpose: "TNR volunteer training program" },
      { id: "pg-dd-5", name: "Feline Rescue", year: 2021, location: "Saint Paul, MN", amount: 18000, purpose: "Spay/neuter services for owned community cats" },
    ],
    grantYearStats: [
      {
        yearKey: "snapshot", yearLabel: "Snapshot",
        min: 2000, max: 35000, median: 15000, average: 13714, count: 140,
        buckets: [
          { label: "<$5k", count: 8 }, { label: "$5k-$15k", count: 62 },
          { label: "$15k-$25k", count: 50 }, { label: "$25k-$50k", count: 20 },
          { label: "$50k-$150k", count: 0 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2023, yearLabel: "2023",
        min: 5000, max: 35000, median: 15000, average: 12308, count: 39,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 18 },
          { label: "$15k-$25k", count: 15 }, { label: "$25k-$50k", count: 6 },
          { label: "$50k-$150k", count: 0 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2022, yearLabel: "2022",
        min: 3000, max: 30000, median: 14000, average: 12500, count: 34,
        buckets: [
          { label: "<$5k", count: 1 }, { label: "$5k-$15k", count: 16 },
          { label: "$15k-$25k", count: 13 }, { label: "$25k-$50k", count: 4 },
          { label: "$50k-$150k", count: 0 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2021, yearLabel: "2021",
        min: 3000, max: 28000, median: 13000, average: 12222, count: 30,
        buckets: [
          { label: "<$5k", count: 2 }, { label: "$5k-$15k", count: 14 },
          { label: "$15k-$25k", count: 11 }, { label: "$25k-$50k", count: 3 },
          { label: "$50k-$150k", count: 0 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2020, yearLabel: "2020",
        min: 2000, max: 25000, median: 12000, average: 12400, count: 25,
        buckets: [
          { label: "<$5k", count: 2 }, { label: "$5k-$15k", count: 12 },
          { label: "$15k-$25k", count: 9 }, { label: "$25k-$50k", count: 2 },
          { label: "$50k-$150k", count: 0 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2019, yearLabel: "2019",
        min: 2000, max: 22000, median: 11000, average: 12727, count: 22,
        buckets: [
          { label: "<$5k", count: 2 }, { label: "$5k-$15k", count: 12 },
          { label: "$15k-$25k", count: 7 }, { label: "$25k-$50k", count: 1 },
          { label: "$50k-$150k", count: 0 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
    ],
  },
  {
    funderId: "funder-petfinder",
    address: "300 Vesey St, New York, NY 10281",
    phone: "(212) 555-0144",
    totalAssetsEstimate: 22_000_000,
    yearlyAssets: [14_000_000, 16_000_000, 18_000_000, 20_000_000, 22_000_000],
    keyPeople: [
      { name: "Betsy Banks Saul", title: "Founder" },
      { name: "Jaime Freyer", title: "Executive Director" },
    ],
    forms990: [
      { year: 2023, url: "#" }, { year: 2022, url: "#" },
      { year: 2021, url: "#" }, { year: 2020, url: "#" }, { year: 2019, url: "#" },
    ],
    nteeBreakdown: [
      { code: "D20", label: "Animal Protection & Welfare", amount: 380_000 },
      { code: "D10", label: "Animal Related (General)", amount: 250_000 },
      { code: "D30", label: "Emergency Relief", amount: 120_000 },
      { code: "D99", label: "Other Animal Related", amount: 60_000 },
    ],
    pastGrantees: [
      { id: "pg-pf-1", name: "Rescue Me! Animal Sanctuary", year: 2023, location: "Albany, NY", amount: 18000, purpose: "Adoption program digital outreach and photography" },
      { id: "pg-pf-2", name: "Friends of the Shelter", year: 2023, location: "Athens, GA", amount: 12000, purpose: "Emergency relief and capacity building" },
      { id: "pg-pf-3", name: "Paws of Hope Rescue", year: 2022, location: "Portland, OR", amount: 10000, purpose: "Adoption guarantee program technology adoption" },
      { id: "pg-pf-4", name: "Second Chance Animal Rescue", year: 2022, location: "Denver, CO", amount: 15000, purpose: "Emergency surge capacity and temporary housing" },
    ],
    grantYearStats: [
      {
        yearKey: "snapshot", yearLabel: "Snapshot",
        min: 2500, max: 20000, median: 8000, average: 7182, count: 570,
        buckets: [
          { label: "<$5k", count: 82 }, { label: "$5k-$15k", count: 364 },
          { label: "$15k-$25k", count: 124 }, { label: "$25k-$50k", count: 0 },
          { label: "$50k-$150k", count: 0 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2023, yearLabel: "2023",
        min: 2500, max: 20000, median: 8000, average: 7531, count: 113,
        buckets: [
          { label: "<$5k", count: 14 }, { label: "$5k-$15k", count: 76 },
          { label: "$15k-$25k", count: 23 }, { label: "$25k-$50k", count: 0 },
          { label: "$50k-$150k", count: 0 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2022, yearLabel: "2022",
        min: 2500, max: 18000, median: 7500, average: 7297, count: 102,
        buckets: [
          { label: "<$5k", count: 13 }, { label: "$5k-$15k", count: 70 },
          { label: "$15k-$25k", count: 19 }, { label: "$25k-$50k", count: 0 },
          { label: "$50k-$150k", count: 0 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2021, yearLabel: "2021",
        min: 2500, max: 15000, median: 7000, average: 7059, count: 93,
        buckets: [
          { label: "<$5k", count: 12 }, { label: "$5k-$15k", count: 65 },
          { label: "$15k-$25k", count: 16 }, { label: "$25k-$50k", count: 0 },
          { label: "$50k-$150k", count: 0 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2020, yearLabel: "2020",
        min: 2500, max: 15000, median: 6500, average: 6557, count: 82,
        buckets: [
          { label: "<$5k", count: 12 }, { label: "$5k-$15k", count: 56 },
          { label: "$15k-$25k", count: 14 }, { label: "$25k-$50k", count: 0 },
          { label: "$50k-$150k", count: 0 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2019, yearLabel: "2019",
        min: 2500, max: 12000, median: 6000, average: 6923, count: 70,
        buckets: [
          { label: "<$5k", count: 12 }, { label: "$5k-$15k", count: 48 },
          { label: "$15k-$25k", count: 10 }, { label: "$25k-$50k", count: 0 },
          { label: "$50k-$150k", count: 0 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
    ],
  },
  {
    funderId: "funder-ca-coastal",
    address: "700 S Flower St, Ste 2600, Los Angeles, CA 90017",
    phone: "(213) 413-4130",
    totalAssetsEstimate: 286_000_000,
    yearlyAssets: [190_000_000, 218_000_000, 248_000_000, 265_000_000, 286_000_000],
    keyPeople: [
      { name: "Antonia Hernandez", title: "President & CEO" },
      { name: "Albert Murillo", title: "VP Grants" },
      { name: "Rosa Ramirez", title: "Program Officer, Animal Welfare" },
    ],
    forms990: [
      { year: 2023, url: "#" }, { year: 2022, url: "#" },
      { year: 2021, url: "#" }, { year: 2020, url: "#" }, { year: 2019, url: "#" },
    ],
    nteeBreakdown: [
      { code: "D20", label: "Animal Protection & Welfare", amount: 820_000 },
      { code: "D10", label: "Animal Related (General)", amount: 580_000 },
      { code: "D40", label: "Veterinary Services", amount: 280_000 },
      { code: "D30", label: "Wildlife Preservation", amount: 120_000 },
      { code: "D99", label: "Other Animal Related", amount: 50_000 },
    ],
    pastGrantees: [
      { id: "pg-cc-1", name: "L.A. Animal Services Foundation", year: 2023, location: "Los Angeles, CA", amount: 60000, purpose: "Community animal welfare services in underserved neighborhoods" },
      { id: "pg-cc-2", name: "Lange Foundation", year: 2023, location: "Los Angeles, CA", amount: 40000, purpose: "Rescue operations and low-cost veterinary access" },
      { id: "pg-cc-3", name: "Stray Cat Alliance", year: 2022, location: "Los Angeles, CA", amount: 25000, purpose: "Community cat TNR program" },
      { id: "pg-cc-4", name: "NKLA Coalition", year: 2022, location: "Los Angeles, CA", amount: 55000, purpose: "No-kill coalition building and advocacy" },
      { id: "pg-cc-5", name: "Shelter Hope Pet Shop", year: 2021, location: "Thousand Oaks, CA", amount: 32000, purpose: "Adoption program and community outreach" },
    ],
    grantYearStats: [
      {
        yearKey: "snapshot", yearLabel: "Snapshot",
        min: 15000, max: 75000, median: 38000, average: 42308, count: 104,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 0 },
          { label: "$15k-$25k", count: 14 }, { label: "$25k-$50k", count: 62 },
          { label: "$50k-$150k", count: 28 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2023, yearLabel: "2023",
        min: 15000, max: 75000, median: 38000, average: 43333, count: 35,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 0 },
          { label: "$15k-$25k", count: 5 }, { label: "$25k-$50k", count: 21 },
          { label: "$50k-$150k", count: 9 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2022, yearLabel: "2022",
        min: 15000, max: 70000, median: 36000, average: 41250, count: 32,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 0 },
          { label: "$15k-$25k", count: 4 }, { label: "$25k-$50k", count: 19 },
          { label: "$50k-$150k", count: 9 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2021, yearLabel: "2021",
        min: 15000, max: 65000, median: 34000, average: 43103, count: 29,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 0 },
          { label: "$15k-$25k", count: 4 }, { label: "$25k-$50k", count: 17 },
          { label: "$50k-$150k", count: 8 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2020, yearLabel: "2020",
        min: 15000, max: 60000, median: 32000, average: 44000, count: 25,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 0 },
          { label: "$15k-$25k", count: 3 }, { label: "$25k-$50k", count: 15 },
          { label: "$50k-$150k", count: 7 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2019, yearLabel: "2019",
        min: 15000, max: 55000, median: 30000, average: 44444, count: 22,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 0 },
          { label: "$15k-$25k", count: 3 }, { label: "$25k-$50k", count: 13 },
          { label: "$50k-$150k", count: 6 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
    ],
  },
  {
    funderId: "funder-humane-society",
    address: "1255 23rd St NW, Ste 450, Washington, D.C. 20037",
    phone: "(202) 452-1100",
    totalAssetsEstimate: 192_000_000,
    yearlyAssets: [130_000_000, 152_000_000, 168_000_000, 180_000_000, 192_000_000],
    keyPeople: [
      { name: "Kitty Block", title: "President & CEO" },
      { name: "Sara Amundson", title: "President, HSUS Action Fund" },
      { name: "David Favre", title: "VP Policy & Government Affairs" },
    ],
    forms990: [
      { year: 2023, url: "#" }, { year: 2022, url: "#" },
      { year: 2021, url: "#" }, { year: 2020, url: "#" }, { year: 2019, url: "#" },
    ],
    nteeBreakdown: [
      { code: "D20", label: "Animal Protection & Welfare", amount: 1_700_000 },
      { code: "D30", label: "Spay/Neuter Programs", amount: 900_000 },
      { code: "D10", label: "Animal Related (General)", amount: 700_000 },
      { code: "D40", label: "Veterinary Services", amount: 300_000 },
      { code: "D99", label: "Other Animal Related", amount: 200_000 },
    ],
    pastGrantees: [
      { id: "pg-hs-1", name: "Charleston Animal Society", year: 2023, location: "Charleston, SC", amount: 55000, purpose: "Shelter reform and intake reduction program" },
      { id: "pg-hs-2", name: "Animal Rescue Corps", year: 2023, location: "Tysons Corner, VA", amount: 45000, purpose: "Large-scale cruelty case response capacity" },
      { id: "pg-hs-3", name: "Tri-County Animal Rescue", year: 2022, location: "Boca Raton, FL", amount: 30000, purpose: "Spay/neuter and community outreach" },
      { id: "pg-hs-4", name: "Animal Welfare League of Arlington", year: 2022, location: "Arlington, VA", amount: 40000, purpose: "Disaster preparedness and emergency response" },
      { id: "pg-hs-5", name: "Humane Society of the Pikes Peak Region", year: 2021, location: "Colorado Springs, CO", amount: 35000, purpose: "Shelter innovation and live release rate improvement" },
    ],
    grantYearStats: [
      {
        yearKey: "snapshot", yearLabel: "Snapshot",
        min: 10000, max: 60000, median: 28000, average: 30200, count: 250,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 18 },
          { label: "$15k-$25k", count: 68 }, { label: "$25k-$50k", count: 138 },
          { label: "$50k-$150k", count: 26 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2023, yearLabel: "2023",
        min: 10000, max: 60000, median: 28000, average: 38060, count: 97,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 6 },
          { label: "$15k-$25k", count: 24 }, { label: "$25k-$50k", count: 54 },
          { label: "$50k-$150k", count: 13 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2022, yearLabel: "2022",
        min: 10000, max: 55000, median: 26000, average: 36364, count: 88,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 5 },
          { label: "$15k-$25k", count: 23 }, { label: "$25k-$50k", count: 49 },
          { label: "$50k-$150k", count: 11 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2021, yearLabel: "2021",
        min: 10000, max: 50000, median: 24000, average: 35185, count: 80,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 5 },
          { label: "$15k-$25k", count: 22 }, { label: "$25k-$50k", count: 44 },
          { label: "$50k-$150k", count: 9 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2020, yearLabel: "2020",
        min: 10000, max: 50000, median: 23000, average: 35714, count: 70,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 4 },
          { label: "$15k-$25k", count: 19 }, { label: "$25k-$50k", count: 39 },
          { label: "$50k-$150k", count: 8 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
      {
        yearKey: 2019, yearLabel: "2019",
        min: 10000, max: 45000, median: 22000, average: 35000, count: 60,
        buckets: [
          { label: "<$5k", count: 0 }, { label: "$5k-$15k", count: 4 },
          { label: "$15k-$25k", count: 17 }, { label: "$25k-$50k", count: 34 },
          { label: "$50k-$150k", count: 5 }, { label: "$150k-$500k", count: 0 },
          { label: "$500k-$1.5m", count: 0 }, { label: "$1.5m+", count: 0 },
        ],
      },
    ],
  },
]

export function getFunderExtended(funderId: string): FunderExtended | undefined {
  return FUNDER_EXTENDED.find((fe) => fe.funderId === funderId)
}

// suppress unused-variable warning for BUCKET_LABELS (used as documentation)
void BUCKET_LABELS
