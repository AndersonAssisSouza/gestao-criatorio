export function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Confirmar', danger = false }) {
  return (
    <div className="p-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="p-modal">
        <div className="p-modal__title">{title}</div>
        <div className="p-modal__message">{message}</div>
        <div className="p-modal__actions">
          <button className="p-btn p-btn--secondary" onClick={onCancel}>Cancelar</button>
          <button className={`p-btn ${danger ? 'p-btn--danger' : 'p-btn--primary'}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
