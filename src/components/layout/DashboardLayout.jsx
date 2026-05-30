import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[#f1f0f7]">
      <Sidebar />
      <main className="ml-16 flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
