// ── Status & Stage ────────────────────────────────────────────────────────

export type PipelineStatus =
  | "researching"
  | "planned"
  | "loi-in-progress"
  | "loi-submitted"
  | "application-in-progress"
  | "application-submitted"
  | "declined"
  | "abandoned"
  | "awarded-active"
  | "awarded-closed"

export type PipelinePhase = "researching" | "applications" | "awards"

export type ArtifactStage = "pre-apply" | "apply" | "post-apply"

export function phaseFromStatus(status: PipelineStatus): PipelinePhase {
  if (status === "researching") return "researching"
  if (status === "awarded-active" || status === "awarded-closed") return "awards"
  return "applications"
}

export function stageFromStatus(status: PipelineStatus): ArtifactStage {
  if (status === "researching" || status === "planned") return "pre-apply"
  if (
    status === "application-submitted" ||
    status === "declined" ||
    status === "abandoned" ||
    status === "awarded-active" ||
    status === "awarded-closed"
  ) return "post-apply"
  return "apply"
}

// ── Core entities ─────────────────────────────────────────────────────────

export interface Account {
  id: string
  name: string
}

export interface Organization {
  id: string
  accountId: string
  name: string
  ein?: string
  mission?: string
  focusAreas: string[]
  geography: string
}

export interface User {
  id: string
  organizationId: string
  name: string
  email: string
  initials: string
}

export interface Membership {
  id: string
  userId: string
  organizationId: string
  role: "admin" | "member" | "viewer"
}

export interface Project {
  id: string
  organizationId: string
  name: string
  description?: string
  isDefault: boolean
}

// ── Funders & Opportunities ────────────────────────────────────────────────

export type FunderType =
  | "private_foundation"
  | "community_foundation"
  | "government"
  | "corporate_foundation"
  | "public_charity"

export interface RecentGrant {
  grantee: string
  year: number
  amount: number
}

export interface Funder {
  id: string
  name: string
  type: FunderType
  website?: string
  focusAreas: string[]
  geography: string
  location?: string
  ein?: string
  fundingRange?: string
  description?: string
  acceptsUnsolicited: boolean
  programAreas?: string[]
  orgTypesFunded?: string[]
  locationsFunded?: string[]
  recentGrants?: RecentGrant[]
}

export interface Opportunity {
  id: string
  funderId: string
  name: string
  amount?: string
  deadline?: string
  description?: string
  eligibility?: string
  eligibilityLabel?: string
  focusAreas?: string[]
}

// ── Pipeline ───────────────────────────────────────────────────────────────

export interface TrackedFunder {
  id: string
  funderId: string
  organizationId: string
  trackedAt: string
}

export interface PipelineOpportunity {
  id: string
  organizationId: string
  projectId: string
  funderId: string
  opportunityId: string
  status: PipelineStatus
  submittedAt?: string
  notes?: string
}

export interface Artifact {
  id: string
  pipelineOpportunityId: string
  name: string
  type: "proposal" | "loi" | "report" | "budget" | "other"
  stage: ArtifactStage
  updatedAt: string
  content?: string
  isSubmitted?: boolean
}

export type AttachmentCategory = "rfp" | "prior_proposal" | "report" | "contact_notes" | "other" | "application"

export interface Attachment {
  id: string
  pipelineOpportunityId: string
  filename: string
  fileType: "pdf" | "docx" | "image" | "sheet" | "other"
  stage: ArtifactStage
  category: AttachmentCategory
  uploadDate: string
  uploaderId: string
  includedInSubmission?: boolean
}

export interface Task {
  id: string
  pipelineOpportunityId?: string
  title: string
  assigneeId?: string
  dueDate?: string
  completed: boolean
}

// ── Writing surface ───────────────────────────────────────────────────────

export interface RequirementConstraint {
  type: "required_attachment"
  value: string
}

export interface Requirement {
  id: string
  text: string
  wordLimit?: number
  charLimit?: number
  constraint?: RequirementConstraint
  source?: "rfp-extracted" | "user-entered"
}

export interface DraftSection {
  id: string
  requirementId: string
  title: string
  content: string
}

export interface WritingSession {
  artifactId: string
  requirements: Requirement[]
  sections: DraftSection[]
  sourceAttachmentId?: string
  contextAttachmentIds: string[]
  wordLimit?: number
  charLimit?: number
}

export interface Snippet {
  id: string
  organizationId: string
  title: string
  body: string
  category: "mission" | "programs" | "outcomes" | "budget" | "other"
}

export interface Comment {
  id: string
  threadId: string
  authorId: string
  content: string
  createdAt: string
  mentions: string[]
}

export interface CommentThread {
  id: string
  artifactId: string
  sectionId: string
  requirementId: string
  anchorText: string
  anchorStart: number
  anchorEnd: number
  anchorStatus: "intact" | "text_changed"
  status: "open" | "resolved"
  createdAt: string
  comments: Comment[]
}

// ── Funder Intelligence ────────────────────────────────────────────────────

export interface FunderYearlyGiving {
  year: number
  totalAmount: number
  newGranteeCount: number
  repeatGranteeCount: number
}

export interface FunderIntelligence {
  funderId: string
  yearlyGiving: FunderYearlyGiving[]
  medianGrantAmount: number
  notableGrantees?: string[]
}

// ── Funder Extended ───────────────────────────────────────────────────────

export interface KeyPerson {
  name: string
  title: string
}

export interface Form990 {
  year: number
  url: string
}

export interface PastGrantee {
  id: string
  name: string
  year: number
  location: string
  amount: number
  purpose: string
}

export interface NTEEBreakdown {
  code: string
  label: string
  amount: number
}

export interface GrantSizeBucket {
  label: string
  count: number
}

export interface GrantYearStats {
  yearKey: "snapshot" | number
  yearLabel: string
  min: number
  max: number
  median: number
  average: number
  count: number
  buckets: GrantSizeBucket[]
}

export interface FunderExtended {
  funderId: string
  address?: string
  phone?: string
  keyPeople?: KeyPerson[]
  forms990?: Form990[]
  pastGrantees?: PastGrantee[]
  nteeBreakdown?: NTEEBreakdown[]
  totalAssetsEstimate?: number
  yearlyAssets?: number[]
  grantYearStats?: GrantYearStats[]
}

// ── Matching ───────────────────────────────────────────────────────────────

export type MatchStrength = "strong" | "good" | "partial"

export interface Match {
  id: string
  organizationId: string
  funderId: string
  opportunityId?: string
  matchStrength: MatchStrength
  matchScore: number
  isNew?: boolean
  reasons: {
    positive: string[]
    cautions: string[]
  }
  matchReasons?: Array<{ label?: string; value: string }>
}
