// Content + types for the Respond conversational creation flow.
// Figma: GA 2.0 Final Specs > 1c · Creation as conversation (node 1388-3)

export type Phase =
  | "name"
  | "project"
  | "sources-loading"
  | "sources-review"
  | "requirements"
  | "wrapup"
  | "done";

export const PHASE_ORDER: Phase[] = [
  "name",
  "project",
  "sources-loading",
  "sources-review",
  "requirements",
  "wrapup",
  "done",
];

export interface SourceDoc {
  id: string;
  name: string;
  tag: string;
  plan: string;
  note: string | null; // saved note text
}

export interface RequirementRow {
  id: string;
  label: string;
  source: string; // right-aligned attribution when covered
  covered: boolean;
}

export interface SetupQuestion {
  id: string;
  ordinal: string; // "1 OF 3"
  question: string;
  context: string; // "For: …" line
  requirementId: string | null; // requirement it unlocks when answered
  answeredSource: string; // attribution shown on the checklist once answered
}

export const ENGAGEMENT = {
  funder: "Bissell Pet Foundation",
  opportunity: "Spay Waggin Support",
  due: "Due Jul 5",
  defaultName: "Spay Waggin Support Proposal",
  defaultProject: "Community Cat TNR",
};

export const PROJECT_OPTIONS = [
  "Community Cat TNR",
  "Spay Waggin Mobile Clinic",
  "Shelter Intake Diversion",
  "Foster Network Expansion",
];

export const INITIAL_SOURCES: SourceDoc[] = [
  {
    id: "src-2024-proposal",
    name: "2024 Bissell proposal",
    tag: "TNR",
    plan: "Plan: write in this voice and structure.",
    note: null,
  },
  {
    id: "src-impact-report",
    name: "2025 Impact Report.pdf",
    tag: "Org",
    plan: "Plan: pull stats and outcomes from it. I won't copy its wording.",
    note: null,
  },
  {
    id: "src-budget",
    name: "Community Cat TNR budget.xlsx",
    tag: "TNR",
    plan: "Plan: use its cost figures for the budget narrative.",
    note: null,
  },
];

export const LIBRARY_EXTRA: SourceDoc = {
  id: "src-outreach-plan",
  name: "2025 Outreach plan.docx",
  tag: "TNR",
  plan: "Plan: reference delivery model and community partners.",
  note: null,
};

export const UPLOAD_EXTRA: SourceDoc = {
  id: "src-upload",
  name: "board-of-directors-2026.pdf",
  tag: "Org",
  plan: "Plan: cite for the board of directors requirement.",
  note: null,
};

export const INITIAL_REQUIREMENTS: RequirementRow[] = [
  { id: "req-background", label: "Organization background", source: "2024 Bissell proposal", covered: true },
  { id: "req-501c3", label: "501(c)(3) determination letter", source: "your upload", covered: true },
  { id: "req-board", label: "Board of directors list", source: "your upload", covered: true },
  { id: "req-program", label: "Program description & delivery model", source: "outreach plan + 2024 proposal", covered: true },
  { id: "req-need", label: "Statement of need with local data", source: "20 studies, cited", covered: true },
  { id: "req-budget", label: "Budget & budget narrative", source: "TNR budget.xlsx", covered: true },
  { id: "req-financials", label: "Organizational financials", source: "library, org-wide", covered: true },
  { id: "req-outcomes", label: "Prior-year program outcomes", source: "needs your answer", covered: false },
  { id: "req-cost", label: "Cost-effectiveness measure", source: "needs your answer", covered: false },
];

export const QUESTIONS: SetupQuestion[] = [
  {
    id: "q-outcomes",
    ordinal: "1 OF 3",
    question: "How many cats went through the Spay Waggin last year?",
    context: "For: Prior-year program outcomes. Your sources cover 2024 but not last year.",
    requirementId: "req-outcomes",
    answeredSource: "your answer",
  },
  {
    id: "q-cost",
    ordinal: "2 OF 3",
    question: "What does one spay/neuter surgery cost?",
    context: "For: Cost-effectiveness measure. Your budget has totals but not per-surgery cost.",
    requirementId: "req-cost",
    answeredSource: "your answer",
  },
  {
    id: "q-context",
    ordinal: "3 OF 3",
    question: "Anything else I should know before I draft? Tone, emphasis, things to avoid.",
    context: "Applies to everything drafted or suggested for this proposal.",
    requirementId: null,
    answeredSource: "",
  },
];

export const COPY = {
  step1Eyebrow: "STEP 1 OF 5 · NAME YOUR PROPOSAL",
  step1Message:
    "Hi! Let's get your proposal set-up. How does this name sound? Tap in to change it, or keep it and we'll move on.",
  step2Eyebrow: "STEP 2 OF 5 · WHICH PROJECT DOES THIS BELONG TO?",
  step2Message: (project: string) =>
    `This opportunity lives under ${project}, so I've picked that. Choose a different one if it belongs elsewhere.`,
  step3Eyebrow: "STEP 3 OF 5 · SOURCES",
  step3LoadingMessage: (name: string) =>
    `Setting up ${name} from this opportunity. One moment while I read what's here and find sources from your library…`,
  step3Message: (count: number) =>
    `Based on the requirements from the funder, I found ${count} documents in your library that fit this proposal. Uncheck anything you don't want used. You can also give me instructions on how you want me to use your documents.`,
  step4Eyebrow: "STEP 4 OF 5 · REQUIREMENTS",
  step4Message:
    "I checked the RFP's 9 requirements against everything you've given me. 7 are covered. I have 3 quick questions to write the rest well. Answer, or skip any and I'll mark it in the draft.",
  step4Footnote:
    "This list becomes the requirements checklist in your workspace, it travels with the proposal.",
  step4Recap: (skipped: number) =>
    skipped > 0
      ? `Got it: warm, neighbors-helping-neighbors voice, clinic growth up front. These apply to everything I draft or suggest. If you want to change that, just chat with me using the AI assistant panel in the editor.`
      : `Got it. These notes apply to everything I draft or suggest. If you want to change them, just chat with me using the AI assistant panel in the editor.`,
  step5Eyebrow: "STEP 5 OF 5 · WRITE OR DRAFT",
  step5Message: (sources: number, requirements: number) =>
    `Setup's done: ${sources} sources, ${requirements} requirements tracked. How do you want to start?`,
};
