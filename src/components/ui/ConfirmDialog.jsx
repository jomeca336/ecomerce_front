export function ConfirmDialog({ title, message, confirmLabel = 'Eliminar', onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(17,10,36,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-red-500">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-1">{title}</h2>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onConfirm} className="btn-danger flex-1">{confirmLabel}</button>
          <button onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  )
}
