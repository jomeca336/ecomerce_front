import { useQuery } from '@tanstack/react-query'
import { getMonthlyIncome, getBestSellingProducts, getTopCustomers, getLowStockProducts } from '../../api/reports.api'
import { getProducts } from '../../api/products.api'
import { getCustomers } from '../../api/customers.api'
import { getOrders } from '../../api/orders.api'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function DashboardHome() {
  const { data: monthlyIncome = [] } = useQuery({
    queryKey: ['report-monthly-income'],
    queryFn: () => getMonthlyIncome().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: bestSelling = [] } = useQuery({
    queryKey: ['report-best-selling'],
    queryFn: () => getBestSellingProducts().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: topCustomers = [] } = useQuery({
    queryKey: ['report-top-customers'],
    queryFn: () => getTopCustomers().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: lowStock = [] } = useQuery({
    queryKey: ['report-low-stock'],
    queryFn: () => getLowStockProducts().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts().then(r => r.data),
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomers().then(r => r.data),
  })

  const { data: ordersPage } = useQuery({
    queryKey: ['orders', 0],
    queryFn: () => getOrders(0, 1).then(r => r.data),
  })

  // Ingreso del mes actual
  const now = new Date()
  const currentMonthIncome = monthlyIncome.find(
    m => m.year === now.getFullYear() && m.month === now.getMonth() + 1
  )?.totalIncome ?? 0

  const activeCustomers = customers.filter(c => c.status === 'ACTIVE').length
  const totalOrders = ordersPage?.totalElements ?? 0

  // Formato datos para gráficas
  const incomeChartData = [...monthlyIncome]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-6)
    .map(m => ({ name: `${MESES[m.month - 1]} ${m.year}`, ingreso: m.totalIncome }))

  const bestSellingChart = bestSelling.slice(0, 6).map(p => ({
    name: p.productName.length > 14 ? p.productName.slice(0, 14) + '…' : p.productName,
    vendidos: p.totalQuantitySold,
  }))

  const stats = [
    {
      label: 'Ingresos del mes',
      value: `$${currentMonthIncome.toLocaleString('es-CO')}`,
      sub: 'mes actual',
      color: 'from-violet-500 to-purple-600',
      icon: (
        <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
        </svg>
      ),
    },
    {
      label: 'Órdenes totales',
      value: totalOrders.toLocaleString('es-CO'),
      sub: 'en el sistema',
      color: 'from-pink-500 to-rose-500',
      icon: (
        <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
        </svg>
      ),
    },
    {
      label: 'Clientes activos',
      value: activeCustomers.toLocaleString('es-CO'),
      sub: `de ${customers.length} registrados`,
      color: 'from-blue-500 to-indigo-500',
      icon: (
        <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
    },
    {
      label: 'Productos',
      value: products.length.toLocaleString('es-CO'),
      sub: `${products.filter(p => p.active).length} activos`,
      color: 'from-emerald-500 to-teal-500',
      icon: (
        <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
          <path d="M20 6h-2.18c.07-.44.18-.88.18-1.35C18 2.99 16.66 2 15 2c-1.01 0-1.83.56-2.43 1.19L12 3.77l-.57-.58C10.83 2.56 10.01 2 9 2 7.34 2 6 2.99 6 4.65c0 .47.11.91.18 1.35H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
        </svg>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general del negocio</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-lg`}>
              {s.icon}
            </div>
            <p className="text-gray-500 text-sm">{s.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
            <span className="inline-block mt-2 text-xs text-gray-400">{s.sub}</span>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Ingresos mensuales */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Ingresos mensuales</h2>
          {incomeChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sin datos aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={incomeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`$${v.toLocaleString('es-CO')}`, 'Ingresos']} />
                <Line type="monotone" dataKey="ingreso" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Más vendidos */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Productos más vendidos</h2>
          {bestSellingChart.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">Sin datos aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={bestSellingChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip formatter={(v) => [v, 'Unidades vendidas']} />
                <Bar dataKey="vendidos" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top clientes */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Top clientes</h2>
          {topCustomers.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-gray-300 text-sm">Sin datos aún</div>
          ) : (
            <div className="space-y-2">
              {topCustomers.slice(0, 5).map((c, i) => (
                <div key={c.customerId} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{c.customerName}</span>
                  <span className="text-sm font-semibold text-gray-800">
                    ${c.totalSpent.toLocaleString('es-CO')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock bajo */}
        <div className="card">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Alertas de stock bajo
            {lowStock.length > 0 && (
              <span className="ml-2 text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                {lowStock.length}
              </span>
            )}
          </h2>
          {lowStock.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-emerald-400 text-sm gap-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Todo el stock está en niveles normales
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.slice(0, 5).map((p) => (
                <div key={p.productId} className="flex items-center gap-3 px-3 py-2 bg-red-50 rounded-xl">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-400 shrink-0">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span className="flex-1 text-sm text-gray-700 truncate">{p.productName}</span>
                  <span className="text-xs font-semibold text-red-600">
                    {p.availableStock} / {p.minimumStock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
