import type {
  Account, Organization, User, Membership, Project,
  Funder, Opportunity, PipelineOpportunity,
  Artifact, Attachment, Task, Match,
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
    fundingRange: "$5,000 – $50,000",
    description:
      "Petco Love invests in organizations working to create communities where no pet is unnecessarily euthanized. They fund shelters, rescues, and organizations that reduce pet overpopulation, increase adoptions, and support spay/neuter programs.",
    acceptsUnsolicited: true,
  },
  {
    id: "funder-aspca",
    name: "ASPCA",
    type: "public_charity",
    website: "https://www.aspca.org/grants",
    focusAreas: ["Animal Welfare", "Shelter Support", "Anti-Cruelty", "Spay/Neuter"],
    geography: "National (U.S.)",
    fundingRange: "$5,000 – $75,000",
    description:
      "The ASPCA's grantmaking focuses on reducing the number of animals euthanized in shelters and improving the lives of animals at risk. Programs support intake reduction, foster networks, community cat management, and spay/neuter services.",
    acceptsUnsolicited: true,
  },
  {
    id: "funder-maddies",
    name: "Maddie's Fund",
    type: "private_foundation",
    website: "https://www.maddiesfund.org",
    focusAreas: ["Animal Welfare", "No-Kill Initiatives", "Shelter Medicine", "Community Programs"],
    geography: "National (U.S.)",
    fundingRange: "$25,000 – $200,000",
    description:
      "Maddie's Fund supports the no-kill movement by funding shelters, rescues, and coalitions working to achieve no-kill community status. Grants prioritize collaborative approaches, data-driven programs, and innovative models that improve lifesaving rates.",
    acceptsUnsolicited: false,
  },
  {
    id: "funder-found-animals",
    name: "Found Animals Foundation",
    type: "private_foundation",
    website: "https://www.foundanimals.org/grants",
    focusAreas: ["Animal Welfare", "Spay/Neuter", "Microchipping", "Pet Retention"],
    geography: "Los Angeles County + Southern California",
    fundingRange: "$10,000 – $75,000",
    description:
      "Found Animals Foundation focuses on reducing pet homelessness in Southern California through free and low-cost spay/neuter, microchipping, and community education.",
    acceptsUnsolicited: true,
  },
  {
    id: "funder-petsmart",
    name: "PetSmart Charities",
    type: "corporate_foundation",
    website: "https://petsmartcharities.org",
    focusAreas: ["Animal Welfare", "Cat & Kitten Programs", "Spay/Neuter", "Adoption"],
    geography: "National (U.S.) + Canada",
    fundingRange: "$10,000 – $100,000",
    description:
      "PetSmart Charities funds organizations working to end pet homelessness through adoption programs, spay/neuter services, and foster networks.",
    acceptsUnsolicited: true,
  },
]

// ── Opportunities ──────────────────────────────────────────────────────────

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "opp-1",
    funderId: "funder-petco",
    name: "Petco Love Lost & Found Grant 2026",
    amount: "$25,000",
    deadline: "Aug 15, 2026",
    description:
      "Supports organizations with proven track records in animal rescue, adoption, and community outreach. Eligible organizations must be 501(c)(3) nonprofits operating active rescue or shelter programs.",
    eligibility: "501(c)(3) required · Active rescue/shelter program · Annual budget under $2M",
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
    focusAreas: ["Cat & Kitten Programs", "Foster Networks", "TNR"],
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
    status: "applying",
    notes:
      "Strong fit — focus areas, geography, and eligibility all align. Program officer confirmed eligibility on June 1.",
  },
  {
    id: "pip-2",
    organizationId: "org-1",
    projectId: "proj-general",
    funderId: "funder-aspca",
    opportunityId: "opp-2",
    status: "submitted",
    submittedAt: "Mar 15, 2026",
    notes: "Submitted with strong outcome data. Awaiting reviewer assignment.",
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
        "Focus areas align — Animal Welfare, pet adoption, and spay/neuter directly match your Rescue & Intake and Foster programs",
        "Geography — Petco Love funds nationally; your San Diego work is eligible",
        "Eligibility — 501(c)(3) required, your org size fits the grant range",
      ],
      cautions: [
        "Competitive — Petco Love receives high application volume; strong outcome data will differentiate your proposal",
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
        "Focus areas align — Animal Welfare is ASPCA's core mission; your programs are precisely in scope",
        "Geography — ASPCA funds nationally; California organizations are eligible",
        "Spay/neuter alignment — your program directly matches ASPCA's community cat and population management priorities",
      ],
      cautions: [
        "Data requirements — ASPCA grants require demonstrated intake and live release rate metrics",
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
        "Mission alignment — your rescue, foster, and intake reduction work directly supports no-kill community goals",
        "Foster program — Maddie's Fund has historically prioritized foster expansion as a key lifesaving lever",
        "Geography — national funder; California organizations are strongly represented in their portfolio",
      ],
      cautions: [
        "Invite-only — Maddie's Fund does not accept unsolicited applications; LOI required through program staff relationship",
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
        "Spay/neuter alignment — your program is a direct match for their primary focus",
        "Foster alignment — foster programs support their pet retention goals",
        "California eligibility — San Diego may qualify; confirm service area with program staff",
      ],
      cautions: [
        "Geographic restriction — grants limited to Los Angeles County and surrounding areas; verify San Diego eligibility",
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
        "Foster alignment — PetSmart Charities has invested heavily in foster program expansion nationally",
        "Spay/neuter match — your program aligns with their TNR and community cat funding priorities",
        "Geography — national funder; California organizations are eligible",
      ],
      cautions: [
        "Cat-specific preference — grants with demonstrated cat and kitten program focus are prioritized; highlight this in your proposal",
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
