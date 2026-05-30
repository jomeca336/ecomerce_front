import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getCustomers, createCustomer, deleteCustomer } from '../../api/customers.api'
import { createAddress } from '../../api/addresses.api'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { usePermissions } from '../../hooks/usePermissions'

const emptyAddress = () => ({ addressLine: '', city: '' })

export default function CustomerListPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { isAdmin } = usePermissions()

  const [createModal, setCreateModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState({ name: '', email: '' })
  const [addresses, setAddresses] = useState([emptyAddress()])
  const [error, setError] = useState('')

  const { data: customers = [], isLoading, isError } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomers().then(r => r.data),
    refetchInterval: 30000,
  })

  const createMutation = useMutation({
    mutationFn: async ({ customer, addresses }) => {
      const res = await createCustomer(customer)
      const customerId = res.data.id
      const validAddresses = addresses.filter(a => a.addressLine.trim() && a.city.trim())
      await Promise.all(validAddresses.map(a => createAddress(customerId, a)))
      return res
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      handleCloseCreate()
      navigate(`/dashboard/customers/${res.data.id}`)
    },
    onError: () => setError('Error al crear el cliente. Verifica los datos.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setDeleteTarget(null)
    },
  })

  const handleCloseCreate = () => {
    setCreateModal(false)
    setForm({ name: '', email: '' })
    setAddresses([emptyAddress()])
    setError('')
  }

  const updateAddress = (index, field, value) => {
    setAddresses(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }

  const addAddressRow = () => setAddresses(prev => [...prev, emptyAddress()])

  const removeAddressRow = (index) => {
    if (addresses.length === 1) return
    setAddresses(prev => prev.filter((_, i) => i !== index))
  }

  if (isLoading) return <div className="text-gray-400 text-sm">Cargando clientes...</div>
  if (isError)   return <div className="text-red-500 text-sm">Error al cargar clientes.</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Clientes</h1>
        <button className="btn-primary" onClick={() => setCreateModal(true)}>
          + Nuevo cliente
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center px-6 py-10 text-gray-400">
                  No hay clientes registrados.
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-800">{c.name}</td>
                <td className="px-6 py-4 text-gray-500">{c.email}</td>
                <td className="px-6 py-4"><StatusBadge value={c.status} /></td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-end">
                    <button className="btn-secondary text-xs py-1.5 px-3" onClick={() => navigate(`/dashboard/customers/${c.id}`)}>
                      Ver detalle
                    </button>
                    {isAdmin && (
                      <button className="btn-danger text-xs py-1.5 px-3" onClick={() => setDeleteTarget(c)}>
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear cliente */}
      {createModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(17,10,36,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && handleCloseCreate()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-800">Nuevo cliente</h2>
              <button onClick={handleCloseCreate} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ customer: form, addresses }) }}
              className="px-6 py-5 space-y-4"
            >
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{error}</div>
              )}

              {/* Datos del cliente */}
              <div>
                <label className="label">Nombre</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              </div>

              {/* Sección de direcciones */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Direcciones</p>

                <div className="space-y-3">
                  {addresses.map((addr, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <input
                          className="input"
                          value={addr.addressLine}
                          onChange={e => updateAddress(i, 'addressLine', e.target.value)}
                          placeholder="Dirección (Calle 123 # 45-67)"
                        />
                        <input
                          className="input"
                          value={addr.city}
                          onChange={e => updateAddress(i, 'city', e.target.value)}
                          placeholder="Ciudad"
                        />
                      </div>
                      {addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeAddressRow(i)}
                          className="mt-1 w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors shrink-0"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addAddressRow}
                  className="mt-3 flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  Agregar otra dirección
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 disabled:opacity-60">
                  {createMutation.isPending ? 'Creando...' : 'Crear cliente'}
                </button>
                <button type="button" onClick={handleCloseCreate} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmar eliminar */}
      {deleteTarget && (
        <ConfirmDialog
          title="Eliminar cliente"
          message={`¿Seguro que deseas eliminar a "${deleteTarget.name}"? Esta acción no se puede deshacer.`}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
