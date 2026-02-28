'use client'

import { useEffect, useRef } from 'react'
import { Sparkles, X } from 'lucide-react'

interface Props {
    onSignIn: () => void
    onClose: () => void
}

export default function AuthModal({ onSignIn, onClose }: Props) {
    const overlayRef = useRef<HTMLDivElement>(null)

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    return (
        <div
            ref={overlayRef}
            onClick={e => { if (e.target === overlayRef.current) onClose() }}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24,
            }}
            className="animate-fadeIn"
        >
            <div
                className="animate-scaleIn"
                style={{
                    width: '100%', maxWidth: 400,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 24, overflow: 'hidden',
                    boxShadow: '0 32px 80px rgba(0,0,0,.35)',
                }}
            >
                {/* Header gradient bar */}
                <div style={{ height: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)' }} />

                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', background: 'none', border: 'none', cursor: 'pointer',
                        top: 16, right: 16, color: 'var(--text-muted)', padding: 4, borderRadius: 8,
                    }}
                >
                    <X size={16} />
                </button>

                {/* Body */}
                <div style={{ padding: '36px 32px 32px', textAlign: 'center' }}>
                    {/* Logo */}
                    <div style={{
                        width: 56, height: 56, borderRadius: 18, margin: '0 auto 18px',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Sparkles size={24} color="#fff" />
                    </div>

                    <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
                        Welcome to CutPulse
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
                        Sign in to save your videos, track usage, and<br />access all generation modes.
                    </p>

                    {/* Google Sign-In button */}
                    <button
                        onClick={onSignIn}
                        style={{
                            width: '100%', padding: '13px 20px',
                            borderRadius: 14, border: '1px solid var(--border)',
                            background: 'var(--bg-input)', color: 'var(--text)',
                            fontSize: 14, fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                            transition: 'border-color .15s, background .15s',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,.5)'
                                ; (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                                ; (e.currentTarget as HTMLElement).style.background = 'var(--bg-input)'
                        }}
                    >
                        {/* Google SVG logo */}
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.6 20.2H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.8z" />
                            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
                            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.6 16.3 44 24 44z" />
                            <path fill="#1976D2" d="M43.6 20.2H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C41.5 36.6 44 30.8 44 24c0-1.3-.1-2.6-.4-3.8z" />
                        </svg>
                        Continue with Google
                    </button>

                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 18, lineHeight: 1.6 }}>
                        By continuing you agree to our{' '}
                        <span style={{ color: 'var(--indigo)', cursor: 'pointer' }}>Terms of Service</span>
                        {' '}and{' '}
                        <span style={{ color: 'var(--indigo)', cursor: 'pointer' }}>Privacy Policy</span>
                    </p>
                </div>
            </div>
        </div>
    )
}
