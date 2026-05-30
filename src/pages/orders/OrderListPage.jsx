import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, createOrder, addOrderItem } from '../../api/orders.api'
import { getCustomers } from '../../api/customers.api'
import { getAddresses } from '../../api/addresses.api'
import { getProducts } from '../../api/products.api'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Pagination } from '../../components/ui/Pagination'
import OrderDetailModal from './OrderDetailModal'

export default function OrderListPage() {
  const queryClient = useQueryClient()

  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [form, setForm] = useState({ customerId: '', shippingAddressId: '' })
  const [cart, setCart] = useState({})   // { productId: quantity }
  const [search, setSearch] = useState('')
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

  const filteredProducts = search.trim()
    ? activeProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      )
    : activeProducts

  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const p = products.find(p => p.id === parseInt(id))
      return p ? { ...p, quantity: qty } : null
    })
    .filter(Boolean)

  const total = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const setQty = (productId, qty) => {
    setCart(prev => {
      if (qty <= 0) {
        const next = { ...prev }
        delete next[productId]
        return next
      }
      return { ...prev, [productId]: qty }
    })
  }

  const createMutation = useMutation({
    mutationFn: async ({ customerId, shippingAddressId, cartItems }) => {
      const res = await createOrder({ customerId, shippingAddressId })
      const orderId = res.data.id
      for (const item of cartItems) {
        await addOrderItem(orderId, { productId: item.id, quantity: item.quantity })
      }
      return res
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      handleClose()
      setDetailId(res.data.id)
    },
    onError: () => setError('Error al crear la orden. Verifica los datos.'),
  })

  const handleClose = () => {
    setModal(false)
    setForm({ customerId: '', shippingAddressId: '' })
    setCart({})
    setSearch('')
    setError('')
  }

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
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nueva orden</button>
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
              <tr><td colSpan={6} className="text-center px-6 py-10 text-gray-400">No hay órdenes registradas.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-gray-400">#{o.id}</td>
                <td className="px-6 py-4 text-gray-700 font-medium">{o.customerName ?? `Cliente #${o.customerId}`}</td>
                <td className="px-6 py-4 text-gray-500">{formatDate(o.orderDate)}</td>
                <td className="px-6 py-4 text-gray-800 font-medium">${o.total?.toLocaleString('es-CO') ?? '0'}</td>
                <td className="px-6 py-4"><StatusBadge value={o.status} /></td>
                <td className="px-6 py-4">
                  <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => setDetailId(o.id)}>
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Modal detalle */}
      {detailId && (
        <OrderDetailModal orderId={detailId} onClose={() => setDetailId(null)} />
      )}

      {/* Modal nueva orden */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(17,10,36,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">Nueva orden</h2>
              <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <div className="flex flex-1 min-h-0">
              {/* Columna izquierda: cliente + productos */}
              <div className="flex-1 flex flex-col min-h-0 border-r border-gray-100">
                <div className="px-6 pt-5 pb-3 space-y-4 shrink-0">
                  {error && (
                    <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>
                  )}
                  <div>
                    <label className="label">Cliente</label>
                    <select className="input" value={form.customerId}
                      onChange={e => setForm({ customerId: e.target.value, shippingAddressId: '' })} required>
                      <option value="">Seleccionar cliente...</option>
                      {customers.filter(c => c.status === 'ACTIVE').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Dirección de envío</label>
                    <select className="input" value={form.shippingAddressId}
                      onChange={e => setForm(f => ({ ...f, shippingAddressId: e.target.value }))}
                      required disabled={!form.customerId}>
                      <option value="">{form.customerId ? 'Seleccionar dirección...' : 'Primero elige un cliente'}</option>
                      {addresses.map(a => (
                        <option key={a.id} value={a.id}>{a.addressLine}, {a.city}</option>
                      ))}
                    </select>
                    {form.customerId && addresses.length === 0 && (
                      <p className="text-xs text-amber-500 mt-1">Este cliente no tiene direcciones.</p>
                    )}
                  </div>

                  {/* Buscador */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Productos</p>
                    <div className="relative">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                      </svg>
                      <input
                        className="input pl-9"
                        placeholder="Buscar por nombre o SKU..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Lista de productos scrollable */}
                <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-1.5">
                  {filteredProducts.length === 0 && (
                    <p className="text-sm text-gray-400 py-4 text-center">Sin resultados.</p>
                  )}
                  {filteredProducts.map(p => {
                    const qty = cart[p.id] ?? 0
                    return (
                      <div key={p.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${qty > 0 ? 'border-violet-200 bg-violet-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{p.sku} · ${p.price?.toLocaleString('es-CO')} · stock {p.stock}</p>
                        </div>
                        {qty === 0 ? (
                          <button
                            type="button"
                            onClick={() => setQty(p.id, 1)}
                            className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200 flex items-center justify-center font-bold text-lg transition-colors shrink-0"
                          >
                            +
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 shrink-0">
                            <button type="button" onClick={() => setQty(p.id, qty - 1)}
                              className="w-7 h-7 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center font-bold transition-colors">
                              −
                            </button>
                            <span className="w-8 text-center text-sm font-semibold text-violet-700">{qty}</span>
                            <button type="button" onClick={() => setQty(p.id, Math.min(qty + 1, p.stock))}
                              className="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200 flex items-center justify-center font-bold transition-colors">
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Columna derecha: resumen del carrito */}
              <div className="w-64 flex flex-col shrink-0">
                <div className="px-5 pt-5 pb-3 shrink-0">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Resumen {cartItems.length > 0 && `(${cartItems.length})`}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto px-5 space-y-2">
                  {cartItems.length === 0 ? (
                    <p className="text-sm text-gray-400">Agrega productos desde la lista.</p>
                  ) : (
                    cartItems.map(item => (
                      <div key={item.id} className="text-sm">
                        <p className="font-medium text-gray-700 truncate">{item.name}</p>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>×{item.quantity}</span>
                          <span className="text-gray-700 font-medium">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div className="px-5 py-3 border-t border-gray-100 shrink-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="text-base font-bold text-violet-700">${total.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="px-5 pb-5 pt-3 space-y-2 shrink-0 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={createMutation.isPending || cartItems.length === 0 || !form.customerId || !form.shippingAddressId}
                    className="btn-primary w-full disabled:opacity-50"
                    onClick={() => {
                      if (cartItems.length === 0) { setError('Agrega al menos un producto.'); return }
                      if (!form.customerId || !form.shippingAddressId) { setError('Completa cliente y dirección.'); return }
                      setError('')
                      createMutation.mutate({
                        customerId: parseInt(form.customerId),
                        shippingAddressId: parseInt(form.shippingAddressId),
                        cartItems,
                      })
                    }}
                  >
                    {createMutation.isPending ? 'Creando...' : 'Crear orden'}
                  </button>
                  <button type="button" onClick={handleClose} className="btn-secondary w-full">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
