import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getOrders, createOrder, addOrderItem } from '../../api/orders.api'
import { getCustomers } from '../../api/customers.api'
import { getAddresses } from '../../api/addresses.api'
import { getProducts } from '../../api/products.api'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Pagination } from '../../components/ui/Pagination'

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
)

export default function OrderListPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ customerId: '', shippingAddressId: '' })
  const [items, setItems] = useState([])
  const [itemProductId, setItemProductId] = useState('')
  const [itemQty, setItemQty] = useState(1)
  const [error, setError] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => getOrders(page, 10).then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomers().then(r => r.data),
  })

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses', form.customerId],
    queryFn: () => getAddresses(form.customerId).then(r => r.data),
    enabled: Boolean(form.customerId),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts().then(r => r.data),
  })

  const activeProducts = products.filter(p => p.active && p.stock > 0)

  const createMutation = useMutation({
    mutationFn: async ({ customerId, shippingAddressId, items }) => {
      const res = await createOrder({ customerId, shippingAddressId })
      const orderId = res.data.id
      for (const item of items) {
        await addOrderItem(orderId, { productId: item.productId, quantity: item.quantity })
      }
      return res
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      handleClose()
      navigate(`/dashboard/orders/${res.data.id}`)
    },
    onError: () => setError('Error al crear la orden. Verifica los datos.'),
  })

  const handleCustomerChange = (e) => {
    setForm({ customerId: e.target.value, shippingAddressId: '' })
  }

  const handleAddItem = () => {
    if (!itemProductId) return
    const product = activeProducts.find(p => p.id === parseInt(itemProductId))
    if (!product) return
    const qty = Math.max(1, parseInt(itemQty) || 1)
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i)
      }
      return [...prev, { productId: product.id, name: product.name, sku: product.sku, price: product.price, quantity: qty }]
    })
    setItemProductId('')
    setItemQty(1)
  }

  const handleRemoveItem = (productId) => {
    setItems(prev => prev.filter(i => i.productId !== productId))
  }

  const handleClose = () => {
    setModal(false)
    setForm({ customerId: '', shippingAddressId: '' })
    setItems([])
    setItemProductId('')
    setItemQty(1)
    setError('')
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const orders = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  if (isLoading) return <div className="text-gray-400 text-sm">Cargando órdenes...</div>
  if (isError)   return <div className="text-red-500 text-sm">Error al cargar órdenes.</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Órdenes</h1>
        <button className="btn-primary" onClick={() => setModal(true)}>
          + Nueva orden
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">#</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center px-6 py-10 text-gray-400">
                  No hay órdenes registradas.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-400">#{o.id}</td>
                <td className="px-6 py-4 text-gray-700 font-medium">{o.customerName ?? `Cliente #${o.customerId}`}</td>
                <td className="px-6 py-4 text-gray-500">{formatDate(o.orderDate)}</td>
                <td className="px-6 py-4 text-gray-800 font-medium">
                  ${o.total?.toLocaleString('es-CO') ?? '0'}
                </td>
                <td className="px-6 py-4"><StatusBadge value={o.status} /></td>
                <td className="px-6 py-4">
                  <button
                    className="btn-secondary text-xs py-1.5 px-3"
                    onClick={() => navigate(`/dashboard/orders/${o.id}`)}
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Modal nueva orden */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(17,10,36,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">Nueva orden</h2>
              <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <XIcon />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (items.length === 0) { setError('Agrega al menos un producto.'); return }
                createMutation.mutate({
                  customerId: parseInt(form.customerId),
                  shippingAddressId: parseInt(form.shippingAddressId),
                  items,
                })
              }}
              className="px-6 py-5 space-y-5"
            >
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>
              )}

              {/* Cliente */}
              <div>
                <label className="label">Cliente</label>
                <select className="input" value={form.customerId} onChange={handleCustomerChange} required>
                  <option value="">Seleccionar cliente...</option>
                  {customers.filter(c => c.status === 'ACTIVE').map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                  ))}
                </select>
              </div>

              {/* Dirección */}
              <div>
                <label className="label">Dirección de envío</label>
                <select
                  className="input"
                  value={form.shippingAddressId}
                  onChange={e => setForm(f => ({ ...f, shippingAddressId: e.target.value }))}
                  required
                  disabled={!form.customerId}
                >
                  <option value="">{form.customerId ? 'Seleccionar dirección...' : 'Primero elige un cliente'}</option>
                  {addresses.map(a => (
                    <option key={a.id} value={a.id}>{a.addressLine}, {a.city}</option>
                  ))}
                </select>
                {form.customerId && addresses.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">Este cliente no tiene direcciones registradas.</p>
                )}
              </div>

              {/* Productos */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Productos</p>

                {/* Agregar producto */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="label">Producto</label>
                    <select className="input" value={itemProductId} onChange={e => setItemProductId(e.target.value)}>
                      <option value="">Seleccionar...</option>
                      {activeProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ${p.price?.toLocaleString('es-CO')} (stock: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="label">Cantidad</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={e => setItemQty(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!itemProductId}
                    className="btn-primary px-4 py-2.5 disabled:opacity-40 shrink-0"
                  >
                    + Agregar
                  </button>
                </div>

                {/* Lista de items */}
                {items.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {items.map(item => (
                      <div key={item.productId} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                        </div>
                        <span className="text-sm text-gray-500">×{item.quantity}</span>
                        <span className="text-sm font-semibold text-gray-800 w-24 text-right">
                          ${(item.price * item.quantity).toLocaleString('es-CO')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <XIcon />
                        </button>
                      </div>
                    ))}

                    {/* Total */}
                    <div className="flex justify-between items-center px-4 py-3 bg-violet-50 rounded-xl">
                      <span className="text-sm font-semibold text-gray-600">Total estimado</span>
                      <span className="text-base font-bold text-violet-700">${total.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                )}

                {items.length === 0 && (
                  <p className="text-xs text-gray-400 mt-2">Sin productos agregados.</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 disabled:opacity-60">
                  {createMutation.isPending ? 'Creando...' : 'Crear orden'}
                </button>
                <button type="button" onClick={handleClose} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
