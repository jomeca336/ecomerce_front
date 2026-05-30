import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/products',
    label: 'Productos',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20 6h-2.18c.07-.44.18-.88.18-1.35C18 2.99 16.66 2 15 2c-1.01 0-1.83.56-2.43 1.19L12 3.77l-.57-.58C10.83 2.56 10.01 2 9 2 7.34 2 6 2.99 6 4.65c0 .47.11.91.18 1.35H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/categories',
    label: 'Categorías',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5S15.01 22 17.5 22s4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/customers',
    label: 'Clientes',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/orders',
    label: 'Órdenes',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
      </svg>
    ),
  },
  {
    to: '/dashboard/reports',
    label: 'Reportes',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm3-4H7v-2h8v2zm0-4H7V7h8v2z" />
      </svg>
    ),
  },
]

export function Sidebar() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-16 flex flex-col items-center py-6 gap-2 z-50"
      style={{ background: 'linear-gradient(180deg, #6d28d9 0%, #7c3aed 50%, #8b5cf6 100%)' }}>

      {/* Logo */}
      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-4">
        <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
        </svg>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1 w-full px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            title={item.label}
            className={({ isActive }) =>
              `flex items-center justify-center w-full h-10 rounded-xl transition-all duration-200 group relative
              ${isActive
                ? 'bg-white/25 text-white shadow-lg'
                : 'text-white/60 hover:bg-white/15 hover:text-white'
              }`
            }
          >
            {item.icon}
            {/* Tooltip */}
            <span className="absolute left-14 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap
              opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg">
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        className="flex items-center justify-center w-10 h-10 rounded-xl text-white/60 hover:bg-white/15 hover:text-white transition-all duration-200 group relative"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
        </svg>
        <span className="absolute left-14 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap
          opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg">
          Cerrar sesión
        </span>
      </button>
    </aside>
  )
}
