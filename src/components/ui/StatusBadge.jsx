const STYLES = {
  true:      'bg-emerald-100 text-emerald-700',
  false:     'bg-gray-100 text-gray-500',
  ACTIVE:    'bg-emerald-100 text-emerald-700',
  INACTIVE:  'bg-gray-100 text-gray-500',
  CREATED:   'bg-blue-100 text-blue-700',
  PAID:      'bg-emerald-100 text-emerald-700',
  SHIPPED:   'bg-amber-100 text-amber-700',
  DELIVERED: 'bg-teal-100 text-teal-800',
  CANCELLED: 'bg-red-100 text-red-600',
}

const LABELS = {
  true:      'Activo',
  false:     'Inactivo',
  ACTIVE:    'Activo',
  INACTIVE:  'Inactivo',
  CREATED:   'Creada',
  PAID:      'Pagada',
  SHIPPED:   'Enviada',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
}

export function StatusBadge({ value }) {
  const key = String(value)
  const style = STYLES[key] ?? 'bg-gray-100 text-gray-500'
  const label = LABELS[key] ?? key
  return (
    <span className={`inline-flex justify-center text-xs font-semibold px-2.5 py-1 rounded-full min-w-[5rem] ${style}`}>
      {label}
    </span>
  )
}
