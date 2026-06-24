import { createContext, useContext, useState, useCallback } from 'react'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

let uid = 0

const ICONS = {
  success: 'fas fa-check-circle',
  error:   'fas fa-times-circle',
  info:    'fas fa-info-circle',
  warning: 'fas fa-exclamation-triangle',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'success', duration = 4000) => {
    const id = ++uid
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
    return id
  }, [])

  const dismiss = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="rc-toast-wrap" role="alert" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`rc-toast rc-toast-${t.type}`}>
            <i className={ICONS[t.type] || ICONS.info} />
            <span>{t.message}</span>
            <button className="rc-toast-x" onClick={() => dismiss(t.id)} aria-label="Dismiss">✕</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
