# Grant Assistant 2.0, MVP prototype

Canonical repo. A stale, out-of-date copy exists at ~/Downloads/grant-assistant-prototype-main; ignore it.

## Stack
Next.js 14, shadcn/ui, Tailwind v4. Preserve the existing design system and tokens, and match existing inline-style conventions. Mock data: org Whisker Haven Cat Rescue, user Taylor S.

## Object model and vocabulary (do not break these)
- Opportunity: a funder's open call in the catalogue. Read-only, shared, shown in Discover. Route /opportunity/[id] is a read-only catalogue detail with a Pursue button.
- PipelineOpportunity: the working object an org saves and works, with status, tasks, artifacts, attachments. Route /pursuit/[id]. NEVER name the working object "Opportunity". They are two different things.
- Funder: publishes Opportunities. The Tracker leads with the funder name, grant name secondary.
- Project / Initiative: the unit of grant-seeking. Each org auto-gets a non-deletable General project (isDefault). Hide the project picker until an org has a second project.
- Membership: links a User to an Organization, carries role and project access (multi-org).
- Artifact: a GA-produced document, editable and re-openable (updatedAt). Has a stage.
- Attachment: an uploaded file. Has a stage and a category (evidence lives here).
- Task: belongs to a Project, optionally to a PipelineOpportunity, single assignee.
- Match: a recommendation linking a Project and an Opportunity, with a hidden flag.

## Status (the single progression)
researching -> applying -> submitted -> awarded / denied. submittedAt is stamped when status becomes submitted. The Tracker groups by status: Researching, Applying, Submitted always shown; Awarded and Denied shown only when non-empty.
Stage (pre-apply / apply / post-apply) is an internal field auto-derived from status. Never expose it as a user-facing grouping or a separate control.

## Key MVP behaviors
- Discover surfaces fewer, genuinely strong matches (bias to precision), never a dead empty state.
- Pursue creates a PipelineOpportunity for the current Project (General if only one) and routes to /pursuit/[id]. No duplicates per opportunity and project.
- Artifact editor: the user can prompt AI for a section edit or a whole-document edit anytime. AI changes are pessimistic and previewable (accept or discard), never silent overwrites. Keep a few pre-edit snapshots.
- Mark submitted sets status to submitted and stamps submittedAt.

## Deferred, do not build
Reporting, funder relationship timeline, budget and expenses, multi-assignee tasks, enterprise and multi-org views (these wait on the RBAC decision). Calendar and Kanban are stubs only.
