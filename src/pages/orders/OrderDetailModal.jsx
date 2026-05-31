import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrderById, payOrder, shipOrder, deliverOrder, cancelOrder } from '../../api/orders.api'
import { getProducts } from '../../api/products.api'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'

const STATUS_ACTIONS = {
  CREATED:   [{ label: 'Marcar como Pagada',    action: 'pay',     style: 'btn-primary' },
              { label: 'Cancelar orden',          action: 'cancel',  style: 'btn-danger'  }],
  PAID:      [{ label: 'Marcar como Enviada',    action: 'ship',    style: 'btn-primary' }],
  SHIPPED:   [{ label: 'Marcar como Entregada',  action: 'deliver', style: 'btn-primary' }],
  DELIVERED: [],
  CANCELLED: [],
}
const ACTION_FN = { pay: payOrder, ship: shipOrder, deliver: deliverOrder, cancel: cancelOrder }

export default function OrderDetailModal({ orderId, onClose }) {
  const queryClient = useQueryClient()
  const [confirmAction, setConfirmAction] = useState(null)

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', String(orderId)],
    queryFn: () => getOrderById(orderId).then(r => r.data),
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts().then(r => r.data),
  })

  const productName = (id) => products.find(p => p.id === id)?.name ?? `Producto #${id}`

  const mutation = useMutation({
    mutationFn: (action) => ACTION_FN[action](orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', String(orderId)] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['report-monthly-income'] })
      queryClient.invalidateQueries({ queryKey: ['report-best-selling'] })
      queryClient.invalidateQueries({ queryKey: ['report-top-customers'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setConfirmAction(null)
    },
  })

  const handleAction = (action) => {
    if (action === 'cancel') setConfirmAction(action)
    else mutation.mutate(action)
  }

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  const actions = STATUS_ACTIONS[order?.status] ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17,10,36,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-800">
              {order ? `Orden #${order.id}` : 'Cargando...'}
            </h2>
            {order && <StatusBadge value={order.status} />}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {isLoading ? (
            <p className="text-gray-400 text-sm">Cargando orden...</p>
          ) : !order ? (
            <p className="text-red-500 text-sm">Orden no encontrada.</p>
          ) : (
            <>
              {/* Info general */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Cliente</p>
                  <p className="font-semibold text-gray-800">{order.customerName ?? `#${order.customerId}`}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Dirección de envío</p>
                  <p className="font-medium text-gray-700">ID #{order.shippingAddressId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Fecha</p>
                  <p className="font-medium text-gray-700">{formatDate(order.orderDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Total</p>
                  <p className="text-xl font-bold text-violet-600">${order.total?.toLocaleString('es-CO') ?? '0'}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Productos ({order.items?.length ?? 0})
                </p>
                {(!order.items || order.items.length === 0) ? (
                  <p className="text-sm text-gray-400">Sin productos en esta orden.</p>
                ) : (
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{productName(item.productId)}</p>
                          <p className="text-xs text-gray-400">×{item.quantity} · ${item.unitPrice?.toLocaleString('es-CO')} c/u</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">${item.subtotal?.toLocaleString('es-CO')}</p>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-4 py-3 bg-violet-50 rounded-xl">
                      <span className="text-sm font-semibold text-gray-600">Total</span>
                      <span className="text-base font-bold text-violet-700">${order.total?.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Acciones de estado */}
              {actions.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Acciones</p>
                  <div className="flex gap-3">
                    {actions.map(({ label, action, style }) => (
                      <button
                        key={action}
                        className={`${style} disabled:opacity-60`}
                        disabled={mutation.isPending}
                        onClick={() => handleAction(action)}
                      >
                        {mutation.isPending && mutation.variables === action ? 'Procesando...' : label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {actions.length === 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm text-gray-400 text-center py-1">
                    Orden en estado final — no hay más acciones disponibles.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {confirmAction && (
        <ConfirmDialog
          title="Cancelar orden"
          message="¿Seguro que deseas cancelar esta orden? Esta acción no se puede deshacer."
          confirmLabel="Sí, cancelar"
          onConfirm={() => mutation.mutate(confirmAction)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
