import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, createProduct, updateProduct, updateInventory, deleteProduct, getDeletedProducts, restoreProduct } from '../../api/products.api'
import { getCategories } from '../../api/categories.api'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { usePermissions } from '../../hooks/usePermissions'
import ProductModal from './ProductModal'
import InventoryModal from './InventoryModal'
import StockHistoryModal from './StockHistoryModal'

function stockStatus(stock, minStock) {
  if (stock === null || stock === undefined) return 'none'
  if (stock === 0)           return 'out'
  if (stock <= minStock)     return 'critical'
  if (stock <= minStock * 2) return 'warning'
  return 'ok'
}

const ROW_COLORS = {
  out:      'bg-red-50',
  critical: 'bg-red-50',
  warning:  'bg-amber-50',
  ok:       '',
  none:     '',
}

function StockBadge({ stock, minStock }) {
  if (stock === null || stock === undefined) {
    return <span className="text-xs text-gray-300">Sin stock</span>
  }
  const status = stockStatus(stock, minStock)
  if (status === 'out') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Agotado
      </span>
    )
  }
  if (status === 'critical') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        Casi agotado · {stock}
      </span>
    )
  }
  if (status === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {stock} uds
      </span>
    )
  }
  return <span className="text-sm text-gray-700 font-medium">{stock}</span>
}

export default function ProductListPage() {
  const queryClient = useQueryClient()
  const { isAdmin } = usePermissions()
  const [productModal, setProductModal] = useState({ open: false, product: null })
  const [inventoryModal, setInventoryModal] = useState({ open: false, product: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [historyProduct, setHistoryProduct] = useState(null)
  const [search, setSearch] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: deletedProducts = [] } = useQuery({
    queryKey: ['products-deleted'],
    queryFn: () => getDeletedProducts().then(r => r.data),
    enabled: showDeleted,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(r => r.data),
  })

  const categoryName = (id) => categories.find(c => c.id === id)?.name ?? '—'

  const createMutation = useMutation({
    mutationFn: async ({ product: productData, inventory }) => {
      const res = await createProduct(productData)
      await updateInventory(res.data.id, inventory)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setProductModal({ open: false, product: null })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setProductModal({ open: false, product: null })
    },
  })

  const inventoryMutation = useMutation({
    mutationFn: ({ id, data }) => updateInventory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setInventoryModal({ open: false, product: null })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (p) => updateProduct(p.id, {
      sku: p.sku, name: p.name, description: p.description,
      price: p.price, active: !p.active, categoryId: p.categoryId,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDeleteTarget(null)
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id) => restoreProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products-deleted'] })
    },
  })

  const handleSave = ({ product, inventory }) => {
    if (productModal.product) {
      updateMutation.mutate({ id: productModal.product.id, data: product })
    } else {
      createMutation.mutate({ product, inventory })
    }
  }

  if (isLoading) return <div className="text-gray-400 text-sm">Cargando productos...</div>
  if (isError)   return <div className="text-red-500 text-sm">Error al cargar productos.</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title mb-0">Productos</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDeleted(v => !v)}
            className={`text-sm font-medium px-4 py-2 rounded-xl border transition-colors ${showDeleted ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700'}`}
          >
            {showDeleted ? 'Ver activos' : 'Ver eliminados'}
          </button>
          {!showDeleted && (
            <button className="btn-primary" onClick={() => setProductModal({ open: true, product: null })}>
              + Nuevo producto
            </button>
          )}
        </div>
      </div>

      {!showDeleted && (
        <div className="relative mb-4 max-w-sm">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input className="input pl-9" placeholder="Buscar por nombre o SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {/* Tabla eliminados */}
      {showDeleted && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">SKU</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {deletedProducts.length === 0 && (
                <tr><td colSpan={5} className="text-center px-6 py-10 text-gray-400">No hay productos eliminados.</td></tr>
              )}
              {deletedProducts.map(p => (
                <tr key={p.id} className="border-b border-gray-50 bg-gray-50/50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">{p.sku}</td>
                  <td className="px-6 py-4 font-medium text-gray-500">{p.name}</td>
                  <td className="px-6 py-4 text-gray-400">{categoryName(p.categoryId)}</td>
                  <td className="px-6 py-4 text-gray-400">${p.price?.toLocaleString('es-CO')}</td>
                  <td className="px-6 py-4">
                    <button
                      className="text-xs py-1.5 px-3 rounded-lg font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                      onClick={() => restoreMutation.mutate(p.id)}
                      disabled={restoreMutation.isPending}
                    >
                      Restaurar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla activos */}
      {!showDeleted && <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">SKU</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Categoría</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Precio</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filteredProducts = search.trim()
                ? products.filter(p =>
                    p.name.toLowerCase().includes(search.toLowerCase()) ||
                    p.sku.toLowerCase().includes(search.toLowerCase())
                  )
                : products
              return (
                <>
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center px-6 py-10 text-gray-400">
                        No hay productos registrados.
                      </td>
                    </tr>
                  )}
                  {filteredProducts.map((p) => {
              const rowColor = ROW_COLORS[stockStatus(p.stock, p.minStock)]
              return (
                <tr key={p.id} className={`border-b border-gray-50 hover:brightness-95 transition-all ${rowColor}`}>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.sku}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{p.name}</td>
                  <td className="px-6 py-4 text-gray-500">{categoryName(p.categoryId)}</td>
                  <td className="px-6 py-4 text-gray-800">${p.price?.toLocaleString('es-CO')}</td>
                  <td className="px-6 py-4">
                    <StockBadge stock={p.stock} minStock={p.minStock} />
                  </td>
                  <td className="px-6 py-4"><StatusBadge value={p.active} /></td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <button
                        className="btn-secondary text-xs py-1.5 px-3"
                        onClick={() => setProductModal({ open: true, product: p })}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-primary text-xs py-1.5 px-3"
                        onClick={() => setInventoryModal({ open: true, product: p })}
                      >
                        Stock
                      </button>
                      <button
                        className="btn-secondary text-xs py-1.5 px-3"
                        onClick={() => setHistoryProduct(p)}
                      >
                        Historial
                      </button>
                      <button
                        className={`text-xs py-1.5 w-24 text-center rounded-lg font-medium transition-colors ${p.active ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        onClick={() => toggleMutation.mutate(p)}
                        disabled={toggleMutation.isPending}
                      >
                        {p.active ? 'Desactivar' : 'Activar'}
                      </button>
                      {isAdmin && (
                        <button
                          className="btn-danger text-xs py-1.5 px-3"
                          onClick={() => setDeleteTarget(p)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
                </>
              )
            })()}
          </tbody>
        </table>
      </div>}

      {productModal.open && (
        <ProductModal
          product={productModal.product}
          categories={categories}
          isPending={createMutation.isPending || updateMutation.isPending}
          error={createMutation.isError ? 'Error al crear el producto. Verifica los datos.' : updateMutation.isError ? 'Error al guardar los cambios.' : ''}
          onSave={handleSave}
          onClose={() => setProductModal({ open: false, product: null })}
        />
      )}

      {inventoryModal.open && (
        <InventoryModal
          product={inventoryModal.product}
          isPending={inventoryMutation.isPending}
          error={inventoryMutation.isError ? 'Error al actualizar inventario.' : ''}
          onSave={(data) => inventoryMutation.mutate({ id: inventoryModal.product.id, data })}
          onClose={() => setInventoryModal({ open: false, product: null })}
        />
      )}

      {historyProduct && (
        <StockHistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar producto"
          message={`¿Seguro que deseas eliminar "${deleteTarget.name}"? Esta acción no se puede deshacer.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
