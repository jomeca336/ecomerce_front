import { useQuery } from '@tanstack/react-query'
import { getStockHistory } from '../../api/products.api'

const TYPE_STYLES = {
  ENTRADA:    { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Entrada',     sign: '+' },
  VENTA:      { bg: 'bg-red-100',    text: 'text-red-600',    label: 'Venta',       sign: ''  },
  CANCELACION:{ bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Cancelación', sign: '+' },
}

const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—'

export default function StockHistoryModal({ product, onClose }) {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ['stock-history', product.id],
    queryFn: () => getStockHistory(product.id).then(r => r.data),
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17,10,36,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Historial de stock</h2>
            <p className="text-sm text-gray-400 mt-0.5">{product.name} <span className="font-mono text-xs">({product.sku})</span></p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="text-gray-400 text-sm text-center py-8">Cargando historial...</p>
          ) : movements.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin movimientos registrados.</p>
          ) : (
            <div className="space-y-3">
              {movements.map((m) => {
                const style = TYPE_STYLES[m.type] ?? TYPE_STYLES.ENTRADA
                return (
                  <div key={m.id} className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-xl">
                    {/* Badge tipo */}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    {/* Cantidad */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${m.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {m.quantity > 0 ? '+' : ''}{m.quantity} uds
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(m.date)}</p>
                    </div>
                    {/* Stock resultante */}
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">Stock final</p>
                      <p className="text-sm font-semibold text-gray-800">{m.stockAfter}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
