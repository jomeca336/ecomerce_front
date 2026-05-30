import { useState } from 'react'

export default function InventoryModal({ product, isPending, error, onSave, onClose }) {
  const [units, setUnits] = useState('')
  const [minStock, setMinStock] = useState(String(product?.minStock ?? ''))

  const currentStock = product?.stock ?? 0
  const newTotal = currentStock + (parseInt(units) || 0)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ stock: newTotal, minStock: parseInt(minStock) })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17,10,36,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Agregar stock</h2>
            {product && (
              <p className="text-sm text-gray-400 mt-0.5">
                {product.name}
                <span className="font-mono ml-1 text-xs">({product.sku})</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Stock actual */}
          <div className="flex gap-3">
            <div className="flex-1 px-3 py-2.5 bg-gray-50 rounded-xl text-center">
              <p className="text-xs text-gray-400">Stock actual</p>
              <p className="text-xl font-bold text-gray-800 mt-0.5">{currentStock}</p>
            </div>
            <div className="flex-1 px-3 py-2.5 bg-violet-50 rounded-xl text-center">
              <p className="text-xs text-gray-400">Nuevo total</p>
              <p className="text-xl font-bold text-violet-700 mt-0.5">{units ? newTotal : '—'}</p>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>
          )}

          <div>
            <label className="label">Unidades a agregar</label>
            <input
              className="input" type="number" min="1"
              value={units}
              onChange={e => setUnits(e.target.value)}
              placeholder="Ej: 50"
              required autoFocus
            />
          </div>

          <div>
            <label className="label">Stock mínimo</label>
            <input
              className="input" type="number" min="0"
              value={minStock}
              onChange={e => setMinStock(e.target.value)}
              placeholder="Ej: 10"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Alerta cuando el stock baje de este valor.</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={isPending} className="btn-primary flex-1 disabled:opacity-60">
              {isPending ? 'Guardando...' : 'Agregar unidades'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
