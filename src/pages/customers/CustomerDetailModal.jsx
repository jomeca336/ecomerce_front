import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCustomerById, updateCustomer, deleteCustomer } from '../../api/customers.api'
import { getAddresses, createAddress } from '../../api/addresses.api'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { usePermissions } from '../../hooks/usePermissions'

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
)

export default function CustomerDetailModal({ customerId, onClose, onDeleted }) {
  const queryClient = useQueryClient()
  const { isAdmin } = usePermissions()

  const [editModal, setEditModal] = useState(false)
  const [addressModal, setAddressModal] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', status: '' })
  const [addressForm, setAddressForm] = useState({ addressLine: '', city: '' })
  const [editError, setEditError] = useState('')
  const [addressError, setAddressError] = useState('')

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customers', customerId],
    queryFn: () => getCustomerById(customerId).then(r => r.data),
  })

  const { data: addresses = [] } = useQuery({
    queryKey: ['addresses', customerId],
    queryFn: () => getAddresses(customerId).then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => updateCustomer(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', customerId] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setEditModal(false)
      setEditError('')
    },
    onError: () => setEditError('Error al actualizar el cliente.'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onDeleted?.()
      onClose()
    },
  })

  const addressMutation = useMutation({
    mutationFn: (data) => createAddress(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', customerId] })
      setAddressModal(false)
      setAddressForm({ addressLine: '', city: '' })
      setAddressError('')
    },
    onError: () => setAddressError('Error al agregar la dirección.'),
  })

  const openEdit = () => {
    setEditForm({ name: customer.name, email: customer.email, status: customer.status })
    setEditModal(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17,10,36,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-800">Detalle del cliente</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
            <XIcon />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {isLoading ? (
            <p className="text-gray-400 text-sm">Cargando...</p>
          ) : !customer ? (
            <p className="text-red-500 text-sm">Cliente no encontrado.</p>
          ) : (
            <>
              {/* Info */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{customer.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{customer.email}</p>
                </div>
                <StatusBadge value={customer.status} />
              </div>
              <div className="flex gap-2 pt-1 border-t border-gray-100">
                <button className="btn-secondary text-sm" onClick={openEdit}>Editar</button>
                {isAdmin && (
                  <button className="btn-danger text-sm" onClick={() => setDeleteDialog(true)}>Eliminar</button>
                )}
              </div>

              {/* Direcciones */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Direcciones</p>
                  <button className="btn-primary text-xs py-1.5 px-3" onClick={() => setAddressModal(true)}>
                    + Agregar
                  </button>
                </div>
                {addresses.length === 0 ? (
                  <p className="text-gray-400 text-sm">No hay direcciones registradas.</p>
                ) : (
                  <div className="space-y-2">
                    {addresses.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-violet-400 shrink-0">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        <span className="text-sm text-gray-700">{a.addressLine}, {a.city}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal editar */}
      {editModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
          style={{ background: 'rgba(17,10,36,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setEditModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Editar cliente</h2>
              <button onClick={() => setEditModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <XIcon />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(editForm) }} className="px-6 py-5 space-y-4">
              {editError && <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{editError}</div>}
              <div>
                <label className="label">Nombre</label>
                <input className="input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Estado</label>
                <select className="input" value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1 disabled:opacity-60">
                  {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button type="button" onClick={() => setEditModal(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal agregar dirección */}
      {addressModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
          style={{ background: 'rgba(17,10,36,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => e.target === e.currentTarget && setAddressModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">Nueva dirección</h2>
              <button onClick={() => setAddressModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <XIcon />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); addressMutation.mutate(addressForm) }} className="px-6 py-5 space-y-4">
              {addressError && <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">{addressError}</div>}
              <div>
                <label className="label">Dirección</label>
                <input className="input" value={addressForm.addressLine} onChange={e => setAddressForm(f => ({ ...f, addressLine: e.target.value }))} placeholder="Calle 123 # 45-67" required autoFocus />
              </div>
              <div>
                <label className="label">Ciudad</label>
                <input className="input" value={addressForm.city} onChange={e => setAddressForm(f => ({ ...f, city: e.target.value }))} placeholder="Bogotá" required />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={addressMutation.isPending} className="btn-primary flex-1 disabled:opacity-60">
                  {addressMutation.isPending ? 'Guardando...' : 'Agregar dirección'}
                </button>
                <button type="button" onClick={() => setAddressModal(false)} className="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteDialog && (
        <ConfirmDialog
          title="Eliminar cliente"
          message={`¿Seguro que deseas eliminar a "${customer?.name}"? Esta acción no se puede deshacer.`}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setDeleteDialog(false)}
        />
      )}
    </div>
  )
}
