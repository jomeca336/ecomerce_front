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
  const { data: monthlyIncome = [] } = useQuery({ queryKey: ['report-monthly-income'], queryFn: () => getMonthlyIncome().then(r => r.data), refetchInterval: 30000 })
  const { data: bestSelling = [] }   = useQuery({ queryKey: ['report-best-selling'],   queryFn: () => getBestSellingProducts().then(r => r.data), refetchInterval: 30000 })
  const { data: topCustomers = [] }  = useQuery({ queryKey: ['report-top-customers'],  queryFn: () => getTopCustomers().then(r => r.data), refetchInterval: 30000 })
  const { data: lowStock = [] }      = useQuery({ queryKey: ['report-low-stock'],      queryFn: () => getLowStockProducts().then(r => r.data), refetchInterval: 30000 })
  const { data: products = [] }      = useQuery({ queryKey: ['products'],              queryFn: () => getProducts().then(r => r.data) })
  const { data: customers = [] }     = useQuery({ queryKey: ['customers'],             queryFn: () => getCustomers().then(r => r.data) })
  const { data: ordersPage }         = useQuery({ queryKey: ['orders', 0],             queryFn: () => getOrders(0, 1).then(r => r.data) })

  const now = new Date()
  const currentMonthIncome = monthlyIncome.find(m => m.year === now.getFullYear() && m.month === now.getMonth() + 1)?.totalIncome ?? 0
  const activeCustomers = customers.filter(c => c.status === 'ACTIVE').length
  const totalOrders = ordersPage?.totalElements ?? 0

  const incomeChartData = [...monthlyIncome]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .slice(-6)
    .map(m => ({ name: MESES[m.month - 1], ingreso: m.totalIncome }))

  const bestSellingChart = bestSelling.slice(0, 5).map(p => ({
    name: p.productName.length > 12 ? p.productName.slice(0, 12) + '…' : p.productName,
    vendidos: p.totalQuantitySold,
  }))

  const stats = [
    { label: 'Ingresos del mes', value: `$${currentMonthIncome.toLocaleString('es-CO')}`, sub: 'mes actual',
      iconBg: '#dbeafe', iconColor: '#2563eb',
      icon: <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" /> },
    { label: 'Órdenes totales', value: totalOrders.toLocaleString('es-CO'), sub: 'en el sistema',
      iconBg: '#e0e7ff', iconColor: '#4f46e5',
      icon: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" /> },
    { label: 'Clientes activos', value: activeCustomers.toLocaleString('es-CO'), sub: `de ${customers.length} registrados`,
      iconBg: '#dcfce7', iconColor: '#16a34a',
      icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /> },
    { label: 'Productos', value: products.length.toLocaleString('es-CO'), sub: `${products.filter(p => p.active).length} activos`,
      iconBg: '#fef9c3', iconColor: '#ca8a04',
      icon: <path d="M20 6h-2.18c.07-.44.18-.88.18-1.35C18 2.99 16.66 2 15 2c-1.01 0-1.83.56-2.43 1.19L12 3.77l-.57-.58C10.83 2.56 10.01 2 9 2 7.34 2 6 2.99 6 4.65c0 .47.11.91.18 1.35H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" /> },
  ]

  return (
    <div className="h-full flex flex-col gap-4 min-h-0">
      {/* Header */}
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Resumen general</p>
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
      </div>

      {/* Stat cards — todas azul noche */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        {stats.map((s, i) => (
          <div key={s.label} className="rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden"
            style={i < 2
              ? { background: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)', boxShadow: '0 4px 16px rgba(30,41,59,0.25)' }
              : { background: 'linear-gradient(135deg, #252a3d 0%, #1c1f2e 100%)', boxShadow: '0 4px 16px rgba(28,31,46,0.25)' }
            }>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/5" />
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">{s.icon}</svg>
            </div>
            <div className="min-w-0 relative">
              <p className="text-xs text-white/60 truncate">{s.label}</p>
              <p className="text-lg font-bold text-white leading-tight">{s.value}</p>
              <p className="text-xs text-white/50 truncate">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid — fills remaining height */}
      <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">

        {/* Col izquierda: gráficas */}
        <div className="col-span-2 flex flex-col gap-4 min-h-0">

          {/* Ingresos mensuales — tinte azul suave */}
          <div className="flex-1 min-h-0 flex flex-col rounded-2xl p-6" style={{ background: '#e4ecff', boxShadow: '0 2px 12px rgba(30,58,138,0.09)' }}>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 shrink-0">Ingresos mensuales</h2>
            {incomeChartData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">Sin datos aún</div>
            ) : (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={incomeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} width={45} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} formatter={(v) => [`$${v.toLocaleString('es-CO')}`, 'Ingresos']} />
                    <Line type="monotone" dataKey="ingreso" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Más vendidos */}
          <div className="flex-1 min-h-0 flex flex-col rounded-2xl p-6" style={{ background: '#e4ecff', boxShadow: '0 2px 12px rgba(30,58,138,0.09)' }}>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 shrink-0">Productos más vendidos</h2>
            {bestSellingChart.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">Sin datos aún</div>
            ) : (
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bestSellingChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} width={30} />
                    <Tooltip formatter={(v) => [v, 'Unidades']} />
                    <Bar dataKey="vendidos" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Col derecha: top clientes + stock bajo */}
        <div className="flex flex-col gap-4 min-h-0">

          {/* Top clientes */}
          <div className="flex-1 min-h-0 flex flex-col rounded-2xl p-6" style={{ background: '#e4ecff', boxShadow: '0 2px 12px rgba(30,58,138,0.09)' }}>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 shrink-0">Top clientes</h2>
            {topCustomers.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">Sin datos</div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1">
                {topCustomers.slice(0, 5).map((c, i) => (
                  <div key={c.customerId} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm text-gray-700 truncate">{c.customerName}</span>
                    <span className="text-xs font-semibold text-gray-800 shrink-0">
                      ${c.totalSpent.toLocaleString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock bajo */}
          <div className="flex-1 min-h-0 flex flex-col rounded-2xl p-6" style={{ background: '#e4ecff', boxShadow: '0 2px 12px rgba(30,58,138,0.09)' }}>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 shrink-0 flex items-center gap-2">
              Alertas de stock
              {lowStock.length > 0 && (
                <span className="text-xs font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {lowStock.length}
                </span>
              )}
            </h2>
            {lowStock.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-emerald-400 text-xs gap-1.5">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                Stock en niveles normales
              </div>
            ) : (
              <div className="space-y-1.5 overflow-y-auto flex-1">
                {lowStock.slice(0, 6).map(p => (
                  <div key={p.productId} className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-red-400 shrink-0">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    <span className="flex-1 text-xs text-gray-700 truncate">{p.productName}</span>
                    <span className="text-xs font-semibold text-red-600 shrink-0">{p.availableStock}/{p.minimumStock}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
