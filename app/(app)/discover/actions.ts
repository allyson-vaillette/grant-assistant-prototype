"use server"

export type HideReasonKind = "durable" | "contextual"

export interface RecordHidePayload {
  opportunityId: string
  reasonId: string | null
  reasonKind: HideReasonKind | null
  signal: string | null
  note: string
}

// TODO: matcher team — persist to DB and feed the matching engine.
// Durable reasons (kind="durable") should adjust the model's future rankings.
// Contextual reasons (kind="contextual") should be logged but must NOT suppress
// similar opportunities long-term.
export async function recordHideOpportunity(payload: RecordHidePayload): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log("[recordHideOpportunity]", payload)
  }
}

// TODO: matcher team — roll back a recorded hide when the user clicks Undo.
export async function undoHideOpportunity(opportunityId: string): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log("[undoHideOpportunity]", opportunityId)
  }
}
