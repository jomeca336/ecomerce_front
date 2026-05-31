import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[#eef2f7]">
      <Sidebar />
      <main className="ml-[92px] flex-1 py-6 pr-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
