import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrderById, payOrder, shipOrder, deliverOrder, cancelOrder } from '../../api/orders.api'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useState } from 'react'

const STATUS_ACTIONS = {
  CREATED: [
    { label: 'Marcar como Pagada', action: 'pay', style: 'btn-primary' },
    { label: 'Cancelar orden',     action: 'cancel', style: 'btn-danger' },
  ],
  PAID: [
    { label: 'Marcar como Enviada', action: 'ship', style: 'btn-primary' },
  ],
  SHIPPED: [
    { label: 'Marcar como Entregada', action: 'deliver', style: 'btn-primary' },
  ],
  DELIVERED: [],
  CANCELLED: [],
}

const ACTION_FN = { pay: payOrder, ship: shipOrder, deliver: deliverOrder, cancel: cancelOrder }

const ACTION_CONFIRM = {
  cancel: { title: 'Cancelar orden', message: '¿Seguro que deseas cancelar esta orden? Esta acción no se puede deshacer.' },
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmAction, setConfirmAction] = useState(null)

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', id],
    queryFn: () => getOrderById(id).then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (action) => ACTION_FN[action](id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', id] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setConfirmAction(null)
    },
  })

  const handleAction = (action) => {
    if (ACTION_CONFIRM[action]) {
      setConfirmAction(action)
    } else {
      mutation.mutate(action)
    }
  }

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  if (isLoading) return <div className="text-gray-400 text-sm">Cargando orden...</div>
  if (!order)    return <div className="text-red-500 text-sm">Orden no encontrada.</div>

  const actions = STATUS_ACTIONS[order.status] ?? []

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/orders')} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <h1 className="page-title mb-0">Orden #{order.id}</h1>
        <StatusBadge value={order.status} />
      </div>

      {/* Info */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Información</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-0.5">Cliente</p>
            <p className="font-medium text-gray-800">Cliente #{order.customerId}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">Dirección envío</p>
            <p className="font-medium text-gray-800">Dirección #{order.shippingAddressId}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">Fecha de orden</p>
            <p className="font-medium text-gray-800">{formatDate(order.orderDate)}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">Total</p>
            <p className="text-2xl font-bold text-violet-600">${order.total?.toLocaleString('es-CO') ?? '0'}</p>
          </div>
        </div>
      </div>

      {/* Acciones de estado */}
      {actions.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Acciones</h2>
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

      {/* Estado final */}
      {actions.length === 0 && (
        <div className="card bg-gray-50 border border-gray-100">
          <p className="text-sm text-gray-400 text-center py-2">
            Esta orden está en estado final — no se pueden realizar más acciones.
          </p>
        </div>
      )}

      {confirmAction && (
        <ConfirmDialog
          title={ACTION_CONFIRM[confirmAction].title}
          message={ACTION_CONFIRM[confirmAction].message}
          confirmLabel="Sí, cancelar"
          onConfirm={() => mutation.mutate(confirmAction)}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
