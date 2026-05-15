import { TopNav } from "@/components/layout/top-nav"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen bg-canvas" style={{ overflow: "hidden" }}>
      <TopNav />
      <main className="flex-1 flex flex-col" style={{ overflow: "hidden", minHeight: 0 }}>
        {children}
      </main>
    </div>
  )
}
