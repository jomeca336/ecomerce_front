import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function DashboardLayout() {
  return (
    <div className="h-screen overflow-hidden bg-[#f0f2f5]">
      <Sidebar />
      <main className="ml-[92px] h-full py-5 pr-5 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
