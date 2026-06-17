"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { FunderType } from "./types"

const SESSION_KEY = "ga_discover_filters"

export interface DiscoverFiltersState {
  primaryTab: "matches" | "explore"
  objectType: "opportunities" | "funders"
  query: string
  typeFilters: FunderType[]
  focusAreaFilters: string[]
  geographyFilters: string[]
  awardRangeFilter: string
  deadlineFilter: string
  sortBy: "match" | "deadline" | "award"
}

export interface DiscoverFiltersContextValue extends DiscoverFiltersState {
  setPrimaryTab: (v: "matches" | "explore") => void
  setObjectType: (v: "opportunities" | "funders") => void
  setQuery: (v: string) => void
  toggleTypeFilter: (v: FunderType) => void
  toggleFocusAreaFilter: (v: string) => void
  toggleGeographyFilter: (v: string) => void
  setAwardRangeFilter: (v: string) => void
  setDeadlineFilter: (v: string) => void
  setSortBy: (v: "match" | "deadline" | "award") => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

const DEFAULT_STATE: DiscoverFiltersState = {
  primaryTab: "matches",
  objectType: "opportunities",
  query: "",
  typeFilters: [],
  focusAreaFilters: [],
  geographyFilters: [],
  awardRangeFilter: "",
  deadlineFilter: "",
  sortBy: "match",
}

function loadFromSession(): DiscoverFiltersState {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return DEFAULT_STATE
    const p = JSON.parse(raw)
    return {
      primaryTab: p.primaryTab === "explore" ? "explore" : "matches",
      objectType: p.objectType === "funders" ? "funders" : "opportunities",
      query: typeof p.query === "string" ? p.query : "",
      typeFilters: Array.isArray(p.typeFilters) ? p.typeFilters : [],
      focusAreaFilters: Array.isArray(p.focusAreaFilters) ? p.focusAreaFilters : [],
      geographyFilters: Array.isArray(p.geographyFilters) ? p.geographyFilters : [],
      awardRangeFilter: typeof p.awardRangeFilter === "string" ? p.awardRangeFilter : "",
      deadlineFilter: typeof p.deadlineFilter === "string" ? p.deadlineFilter : "",
      sortBy: ["match", "deadline", "award"].includes(p.sortBy) ? p.sortBy : "match",
    }
  } catch {
    return DEFAULT_STATE
  }
}

const DiscoverFiltersContext = createContext<DiscoverFiltersContextValue | null>(null)

export function DiscoverFiltersProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DiscoverFiltersState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)

  // Rehydrate from sessionStorage after mount to avoid SSR mismatch
  useEffect(() => {
    setState(loadFromSession())
    setHydrated(true)
  }, [])

  // Mirror to sessionStorage whenever state changes (after hydration)
  useEffect(() => {
    if (!hydrated) return
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
  }, [state, hydrated])

  const setPrimaryTab = useCallback((v: "matches" | "explore") => setState(s => ({ ...s, primaryTab: v })), [])
  const setObjectType = useCallback((v: "opportunities" | "funders") => setState(s => ({ ...s, objectType: v })), [])
  const setQuery = useCallback((v: string) => setState(s => ({ ...s, query: v })), [])
  const setAwardRangeFilter = useCallback((v: string) => setState(s => ({ ...s, awardRangeFilter: v })), [])
  const setDeadlineFilter = useCallback((v: string) => setState(s => ({ ...s, deadlineFilter: v })), [])
  const setSortBy = useCallback((v: "match" | "deadline" | "award") => setState(s => ({ ...s, sortBy: v })), [])

  const toggleTypeFilter = useCallback((v: FunderType) =>
    setState(s => ({
      ...s,
      typeFilters: s.typeFilters.includes(v)
        ? s.typeFilters.filter(f => f !== v)
        : [...s.typeFilters, v],
    })), [])

  const toggleFocusAreaFilter = useCallback((v: string) =>
    setState(s => ({
      ...s,
      focusAreaFilters: s.focusAreaFilters.includes(v)
        ? s.focusAreaFilters.filter(f => f !== v)
        : [...s.focusAreaFilters, v],
    })), [])

  const toggleGeographyFilter = useCallback((v: string) =>
    setState(s => ({
      ...s,
      geographyFilters: s.geographyFilters.includes(v)
        ? s.geographyFilters.filter(f => f !== v)
        : [...s.geographyFilters, v],
    })), [])

  const clearFilters = useCallback(() =>
    setState(s => ({
      ...s,
      typeFilters: [],
      focusAreaFilters: [],
      geographyFilters: [],
      awardRangeFilter: "",
      deadlineFilter: "",
    })), [])

  const hasActiveFilters =
    state.typeFilters.length > 0 ||
    state.focusAreaFilters.length > 0 ||
    state.geographyFilters.length > 0 ||
    !!state.awardRangeFilter ||
    !!state.deadlineFilter

  return (
    <DiscoverFiltersContext.Provider value={{
      ...state,
      setPrimaryTab, setObjectType, setQuery,
      toggleTypeFilter, toggleFocusAreaFilter, toggleGeographyFilter,
      setAwardRangeFilter, setDeadlineFilter, setSortBy,
      clearFilters, hasActiveFilters,
    }}>
      {children}
    </DiscoverFiltersContext.Provider>
  )
}

export function useDiscoverFilters(): DiscoverFiltersContextValue {
  const ctx = useContext(DiscoverFiltersContext)
  if (!ctx) throw new Error("useDiscoverFilters must be used within DiscoverFiltersProvider")
  return ctx
}
