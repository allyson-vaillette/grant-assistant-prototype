// ── Status & Stage ────────────────────────────────────────────────────────

export type PipelineStatus = "researching" | "applying" | "submitted" | "awarded" | "denied"
export type ArtifactStage = "pre-apply" | "apply" | "post-apply"

export function stageFromStatus(status: PipelineStatus): ArtifactStage {
  if (status === "researching") return "pre-apply"
  if (status === "applying") return "apply"
  return "post-apply"
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

export interface Funder {
  id: string
  name: string
  type: FunderType
  website?: string
  focusAreas: string[]
  geography: string
  fundingRange?: string
  description?: string
  acceptsUnsolicited: boolean
}

export interface Opportunity {
  id: string
  funderId: string
  name: string
  amount?: string
  deadline?: string
  description?: string
  eligibility?: string
  focusAreas?: string[]
}

// ── Pipeline ───────────────────────────────────────────────────────────────

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
}

export type AttachmentCategory = "rfp" | "prior_proposal" | "report" | "contact_notes" | "other"

export interface Attachment {
  id: string
  pipelineOpportunityId: string
  filename: string
  fileType: "pdf" | "docx" | "image" | "sheet" | "other"
  stage: ArtifactStage
  category: AttachmentCategory
  uploadDate: string
  uploaderId: string
}

export interface Task {
  id: string
  pipelineOpportunityId: string
  title: string
  assigneeId?: string
  dueDate?: string
  completed: boolean
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
  reasons: {
    positive: string[]
    cautions: string[]
  }
}
