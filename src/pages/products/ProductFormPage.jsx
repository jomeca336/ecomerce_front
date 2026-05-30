import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProductById, createProduct, updateProduct } from '../../api/products.api'
import { getCategories } from '../../api/categories.api'

export default function ProductFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    sku: '', name: '', description: '', price: '', active: true, categoryId: '',
  })
  const [error, setError] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(r => r.data),
  })

  const { data: product } = useQuery({
    queryKey: ['products', id],
    queryFn: () => getProductById(id).then(r => r.data),
    enabled: isEditing,
  })

  useEffect(() => {
    if (product) {
      setForm({
        sku:         product.sku ?? '',
        name:        product.name ?? '',
        description: product.description ?? '',
        price:       product.price ?? '',
        active:      product.active ?? true,
        categoryId:  product.categoryId ?? '',
      })
    }
  }, [product])

  const mutation = useMutation({
    mutationFn: (data) =>
      isEditing ? updateProduct(id, data) : createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      navigate('/dashboard/products')
    },
    onError: () => setError('Error al guardar el producto. Verifica los datos.'),
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    mutation.mutate({
      ...form,
      price:      parseFloat(form.price),
      categoryId: parseInt(form.categoryId),
    })
  }

  return (
    <div className="max-w-2xl">
      <h1 className="page-title">
        {isEditing ? 'Editar producto' : 'Nuevo producto'}
      </h1>

      <div className="card">
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">SKU</label>
              <input className="input" name="sku" value={form.sku} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Precio</label>
              <input className="input" name="price" type="number" min="0" step="0.01"
                value={form.price} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label className="label">Nombre</label>
            <input className="input" name="name" value={form.name} onChange={handleChange} required />
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea className="input resize-none h-24" name="description"
              value={form.description} onChange={handleChange} />
          </div>

          <div>
            <label className="label">Categoría</label>
            <select className="input" name="categoryId" value={form.categoryId} onChange={handleChange} required>
              <option value="">Seleccionar categoría...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              name="active"
              checked={form.active}
              onChange={handleChange}
              className="w-4 h-4 accent-violet-600"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-600 cursor-pointer">
              Producto activo
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={mutation.isPending} className="btn-primary disabled:opacity-60">
              {mutation.isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
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
