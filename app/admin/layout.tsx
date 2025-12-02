import { AdminSidebar } from "@/components/admin/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <AdminSidebar />
      <div className="flex-1 min-w-0 lg:ml-0">
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8 lg:pl-24">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}