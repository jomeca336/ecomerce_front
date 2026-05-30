import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProductById, updateInventory } from '../../api/products.api'

export default function InventoryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({ stock: '', minStock: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: product, isLoading } = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProductById(id).then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (data) => updateInventory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setSuccess(true)
      setTimeout(() => navigate('/dashboard/products'), 1200)
    },
    onError: () => setError('Error al actualizar el inventario.'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    mutation.mutate({
      stock:    parseInt(form.stock),
      minStock: parseInt(form.minStock),
    })
  }

  if (isLoading) return <div className="text-gray-400 text-sm">Cargando...</div>

  return (
    <div className="max-w-md">
      <h1 className="page-title">Gestionar inventario</h1>

      {product && (
        <div className="mb-4 px-4 py-3 bg-violet-50 border border-violet-100 rounded-xl text-sm">
          <span className="font-medium text-violet-700">{product.name}</span>
          <span className="text-gray-400 ml-2 font-mono text-xs">({product.sku})</span>
        </div>
      )}

      <div className="card">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl">
            Inventario actualizado correctamente.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Stock actual</label>
            <input
              className="input" type="number" min="0"
              value={form.stock}
              onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
              placeholder="Ej: 100"
              required
            />
          </div>
          <div>
            <label className="label">Stock mínimo</label>
            <input
              className="input" type="number" min="0"
              value={form.minStock}
              onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))}
              placeholder="Ej: 10"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Se mostrará una alerta cuando el stock baje de este valor.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="btn-primary disabled:opacity-60">
              {mutation.isPending ? 'Guardando...' : 'Actualizar inventario'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard/products')} className="btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
