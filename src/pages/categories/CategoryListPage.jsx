import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCategories, createCategory } from '../../api/categories.api'

export default function CategoryListPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories().then(r => r.data),
    refetchInterval: 30000,
  })

  const mutation = useMutation({
    mutationFn: (data) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setModalOpen(false)
      setName('')
      setError('')
    },
    onError: () => setError('Error al crear la categoría.'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    mutation.mutate({ name: name.trim() })
  }

  const handleClose = () => {
    setModalOpen(false)
    setName('')
    setError('')
  }

  if (isLoading) return <div className="text-gray-400 text-sm">Cargando categorías...</div>
  if (isError)   return <div className="text-red-500 text-sm">Error al cargar categorías.</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Categorías</h1>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          + Nueva categoría
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input className="input pl-9" placeholder="Buscar por nombre..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">ID</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const filteredCategories = search.trim()
                ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
                : categories
              return (
                <>
                  {filteredCategories.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center px-6 py-10 text-gray-400">
                        No hay categorías registradas.
                      </td>
                    </tr>
                  )}
                  {filteredCategories.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-400 font-mono text-xs">{c.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{c.name}</td>
                    </tr>
                  ))}
                </>
              )
            })()}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(17,10,36,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Nueva categoría</h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
                  {error}
                </div>
              )}
              <div>
                <label className="label">Nombre</label>
                <input
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Ropa, Tecnología..."
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 disabled:opacity-60">
                  {mutation.isPending ? 'Creando...' : 'Crear categoría'}
                </button>
                <button type="button" onClick={handleClose} className="btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
