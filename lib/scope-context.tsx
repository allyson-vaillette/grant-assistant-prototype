"use client"

import React, { createContext, useContext, useState } from "react"
import { PROJECTS, ORG } from "./mock-data"
import type { Project } from "./types"

interface ScopeContextValue {
  selectedProjectId: string | null
  setSelectedProjectId: (id: string | null) => void
  selectedProject: Project | null
  hasPrograms: boolean
  scopeLabel: string
  realProjects: Project[]
}

const ScopeContext = createContext<ScopeContextValue | null>(null)

export function ScopeProvider({ children }: { children: React.ReactNode }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const realProjects = PROJECTS.filter(p => !p.isDefault)
  const hasPrograms = realProjects.length > 0
  const selectedProject = selectedProjectId
    ? PROJECTS.find(p => p.id === selectedProjectId) ?? null
    : null
  const scopeLabel = selectedProject ? selectedProject.name : ORG.name

  return (
    <ScopeContext.Provider value={{ selectedProjectId, setSelectedProjectId, selectedProject, hasPrograms, scopeLabel, realProjects }}>
      {children}
    </ScopeContext.Provider>
  )
}

export function useScope() {
  const ctx = useContext(ScopeContext)
  if (!ctx) throw new Error("useScope must be used within ScopeProvider")
  return ctx
}
