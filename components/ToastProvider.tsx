'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'
interface ToastItem { id: string; message: string; type: ToastType }

const ToastCtx = createContext<{ show: (msg: string, type?: ToastType) => void }>({ show: () => { } })
export const useToast = () => useContext(ToastCtx)

const ICONS = {
    success: <CheckCircle size={15} color="#22c55e" />,
    error: <XCircle size={15} color="#ef4444" />,
    warning: <AlertTriangle size={15} color="#f59e0b" />,
    info: <Info size={15} color="#7c7cf0" />,
}
const COLORS = {
    success: { border: 'rgba(34,197,94,.25)', bg: 'rgba(34,197,94,.07)' },
    error: { border: 'rgba(239,68,68,.25)', bg: 'rgba(239,68,68,.07)' },
    warning: { border: 'rgba(245,158,11,.25)', bg: 'rgba(245,158,11,.07)' },
    info: { border: 'rgba(124,124,240,.25)', bg: 'rgba(124,124,240,.07)' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const show = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now().toString()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
    }, [])

    const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

    return (
        <ToastCtx.Provider value={{ show }}>
            {children}

            {/* Toast stack — bottom-right */}
            <div style={{
                position: 'fixed', bottom: 24, right: 24, zIndex: 9998,
                display: 'flex', flexDirection: 'column', gap: 8,
                pointerEvents: 'none',
            }}>
                {toasts.map(t => (
                    <div key={t.id} className="animate-fadeIn" style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 14px 11px 12px',
                        borderRadius: 12, minWidth: 220, maxWidth: 340,
                        background: 'var(--bg-card)',
                        border: `1px solid ${COLORS[t.type].border}`,
                        boxShadow: '0 8px 24px rgba(0,0,0,.18)',
                        backdropFilter: 'blur(8px)',
                        pointerEvents: 'auto',
                    }}>
                        {ICONS[t.type]}
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
                            {t.message}
                        </span>
                        <button onClick={() => dismiss(t.id)} style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: 2, flexShrink: 0,
                        }}>
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastCtx.Provider>
    )
}
