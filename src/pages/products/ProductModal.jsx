import { useState, useEffect } from 'react'

export default function ProductModal({ product, categories, isPending, error, onSave, onClose }) {
  const isEditing = Boolean(product)

  const [form, setForm] = useState({
    sku: '', name: '', description: '', price: '', active: true, categoryId: '',
    stock: '', minStock: '',
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
        stock:       '',
        minStock:    '',
      })
    }
  }, [product])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      product: {
        sku:        form.sku,
        name:       form.name,
        description: form.description,
        price:      parseFloat(form.price),
        active:     form.active,
        categoryId: parseInt(form.categoryId),
      },
      inventory: isEditing ? null : {
        stock:    parseInt(form.stock),
        minStock: parseInt(form.minStock),
      },
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17,10,36,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-800">
            {isEditing ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>
          )}

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
            <textarea className="input resize-none h-20" name="description"
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

          {/* Stock — solo al crear */}
          {!isEditing && (
            <>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inventario inicial</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Stock inicial</label>
                    <input className="input" name="stock" type="number" min="0"
                      value={form.stock} onChange={handleChange} placeholder="Ej: 100" required />
                  </div>
                  <div>
                    <label className="label">Stock mínimo</label>
                    <input className="input" name="minStock" type="number" min="0"
                      value={form.minStock} onChange={handleChange} placeholder="Ej: 10" required />
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex items-center gap-3">
            <input type="checkbox" id="active" name="active"
              checked={form.active} onChange={handleChange}
              className="w-4 h-4 accent-violet-600" />
            <label htmlFor="active" className="text-sm font-medium text-gray-600 cursor-pointer">
              Producto activo
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending} className="btn-primary flex-1 disabled:opacity-60">
              {isPending ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
