import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrders, createOrder, addOrderItem } from '../../api/orders.api'
import { getCustomers } from '../../api/customers.api'
import { getAddresses } from '../../api/addresses.api'
import { getProducts } from '../../api/products.api'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Pagination } from '../../components/ui/Pagination'
import OrderDetailModal from './OrderDetailModal'

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
)

function ProductPicker({ products, onAdd, onClose }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null) // { product, qty }

  const filtered = search.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
      )
    : products

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(17,10,36,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <h3 className="text-base font-bold text-gray-800">Agregar producto</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="px-5 pt-4 pb-2 shrink-0">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              className="input pl-9"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-1.5">
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Sin resultados.</p>
          )}
          {filtered.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-violet-50 rounded-xl transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                <p className="text-xs text-gray-400 font-mono">{p.sku} · ${p.price?.toLocaleString('es-CO')} · stock: {p.stock}</p>
              </div>
              <input
                type="number"
                min="1"
                max={p.stock}
                defaultValue={1}
                className="input w-16 text-center py-1.5 text-sm"
                id={`qty-${p.id}`}
              />
              <button
                type="button"
                onClick={() => {
                  const raw = parseInt(document.getElementById(`qty-${p.id}`)?.value) || 1
                  const qty = Math.min(Math.max(1, raw), p.stock)
                  onAdd({ ...p, quantity: qty })
                  onClose()
                }}
                className="btn-primary text-xs py-1.5 px-3 shrink-0"
              >
                Agregar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function OrderListPage() {
  const queryClient = useQueryClient()

  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [form, setForm] = useState({ customerId: '', shippingAddressId: '' })
  const [cart, setCart] = useState([])  // [{ id, sku, name, price, quantity }]
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
  const cartProductIds = new Set(cart.map(i => i.id))
  const availableProducts = activeProducts.filter(p => !cartProductIds.has(p.id))

  const createMutation = useMutation({
    mutationFn: async ({ customerId, shippingAddressId, cart }) => {
      const res = await createOrder({ customerId, shippingAddressId })
      const orderId = res.data.id
      for (const item of cart) {
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

  const handleAddProduct = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + product.quantity } : i)
      return [...prev, product]
    })
  }

  const handleRemoveFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))

  const handleCartQty = (id, qty) => {
    if (qty < 1) { handleRemoveFromCart(id); return }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.min(qty, i.stock) } : i))
  }

  const handleClose = () => {
    setModal(false)
    setPickerOpen(false)
    setForm({ customerId: '', shippingAddressId: '' })
    setCart([])
    setError('')
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const orders = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  const filteredOrders = search.trim()
    ? orders.filter(o => (o.customerName ?? '').toLowerCase().includes(search.toLowerCase()))
    : orders

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

  if (isLoading) return <div className="text-gray-400 text-sm">Cargando órdenes...</div>
  if (isError)   return <div className="text-red-500 text-sm">Error al cargar órdenes.</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title mb-0">Órdenes</h1>
        <button className="btn-primary" onClick={() => setModal(true)}>+ Nueva orden</button>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative mb-4 max-w-sm">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input className="input pl-9" placeholder="Buscar por cliente..." value={search} onChange={e => setSearch(e.target.value)} />
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
            {filteredOrders.length === 0 && (
              <tr><td colSpan={6} className="text-center px-6 py-10 text-gray-400">No hay órdenes registradas.</td></tr>
            )}
            {filteredOrders.map((o) => (
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

      {detailId && <OrderDetailModal orderId={detailId} onClose={() => setDetailId(null)} />}

      {/* Modal nueva orden */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(17,10,36,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">Nueva orden</h2>
              <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {error && <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>}

              <div>
                <label className="label">Cliente</label>
                <select className="input" value={form.customerId}
                  onChange={e => setForm({ customerId: e.target.value, shippingAddressId: '' })}>
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
                  disabled={!form.customerId}>
                  <option value="">{form.customerId ? 'Seleccionar dirección...' : 'Primero elige un cliente'}</option>
                  {addresses.map(a => (
                    <option key={a.id} value={a.id}>{a.addressLine}, {a.city}</option>
                  ))}
                </select>
                {form.customerId && addresses.length === 0 && (
                  <p className="text-xs text-amber-500 mt-1">Este cliente no tiene direcciones.</p>
                )}
              </div>

              {/* Carrito */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Productos {cart.length > 0 && `(${cart.length})`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    + Agregar producto
                  </button>
                </div>

                {cart.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">Sin productos agregados.</p>
                ) : (
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">${item.price?.toLocaleString('es-CO')} c/u</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => handleCartQty(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center font-bold text-sm transition-colors">
                            −
                          </button>
                          <input
                            type="number" min="1" max={item.stock}
                            value={item.quantity}
                            onChange={e => handleCartQty(item.id, parseInt(e.target.value) || 1)}
                            className="w-10 text-center text-sm font-semibold text-gray-800 border border-gray-200 rounded-md py-0.5 focus:outline-none focus:border-violet-400"
                          />
                          <button type="button"
                            onClick={() => handleCartQty(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
                            className="w-6 h-6 rounded-md bg-violet-100 text-violet-600 hover:bg-violet-200 flex items-center justify-center font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            +
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-gray-700 w-20 text-right shrink-0">
                          ${(item.price * item.quantity).toLocaleString('es-CO')}
                        </p>
                        <button type="button" onClick={() => handleRemoveFromCart(item.id)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors shrink-0">
                          <XIcon />
                        </button>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-4 py-3 bg-violet-50 rounded-xl">
                      <span className="text-sm font-semibold text-gray-600">Total estimado</span>
                      <span className="text-base font-bold text-violet-700">${total.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={createMutation.isPending}
                  className="btn-primary flex-1 disabled:opacity-60"
                  onClick={() => {
                    if (!form.customerId || !form.shippingAddressId) { setError('Completa cliente y dirección.'); return }
                    if (cart.length === 0) { setError('Agrega al menos un producto.'); return }
                    setError('')
                    createMutation.mutate({ customerId: parseInt(form.customerId), shippingAddressId: parseInt(form.shippingAddressId), cart })
                  }}
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear orden'}
                </button>
                <button type="button" onClick={handleClose} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal selector de productos */}
      {pickerOpen && (
        <ProductPicker
          products={availableProducts}
          onAdd={handleAddProduct}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}
