import { Sidebar } from "@/components/layout/sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex" style={{ height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <main
        className="flex-1 flex flex-col"
        style={{ overflow: "hidden", minHeight: 0, backgroundColor: "var(--canvas)" }}
      >
        {children}
      </main>
    </div>
  )
}
