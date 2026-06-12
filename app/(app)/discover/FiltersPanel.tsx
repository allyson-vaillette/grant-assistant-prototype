import type { FunderType } from "@/lib/types"

export const FUNDER_TYPE_LABELS: Record<FunderType, string> = {
  private_foundation:   "Private foundation",
  community_foundation: "Community foundation",
  government:           "Government",
  corporate_foundation: "Corporate foundation",
  public_charity:       "Public charity",
}

export const AWARD_RANGE_LABELS: Record<string, string> = {
  "under-25k": "Up to $25k",
  "25k-50k":   "$25k to $50k",
  "over-50k":  "Over $50k",
}

export const DEADLINE_LABELS: Record<string, string> = {
  "30": "Due within 30 days",
  "60": "Due within 60 days",
  "90": "Due within 90 days",
}
