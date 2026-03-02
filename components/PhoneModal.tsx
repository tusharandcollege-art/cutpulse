'use client'

import { useState, useEffect, useRef } from 'react'
import { X, MessageCircle } from 'lucide-react'

interface Props {
    userName: string
    onSubmit: (phone: string) => void
    onSkip: () => void
}

export default function PhoneModal({ userName, onSubmit, onSkip }: Props) {
    const [phone, setPhone] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 100)
    }, [])

    const validate = (val: string) => {
        const digits = val.replace(/\D/g, '')
        if (digits.length === 0) return 'Please enter your WhatsApp number'
        if (digits.length !== 10) return 'Enter a valid 10-digit Indian number'
        if (!/^[6-9]/.test(digits)) return 'Indian mobile numbers start with 6, 7, 8 or 9'
        return ''
    }

    const handleSubmit = async () => {
        const digits = phone.replace(/\D/g, '')
        const err = validate(digits)
        if (err) { setError(err); return }
        setLoading(true)
        await onSubmit(`+91${digits}`)
    }

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow digits, max 10
        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
        setPhone(val)
        if (error) setError('')
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24,
            }}
            className="animate-fadeIn"
        >
            <div
                className="animate-scaleIn"
                style={{
                    width: '100%', maxWidth: 420,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 24, overflow: 'hidden',
                    boxShadow: '0 32px 80px rgba(0,0,0,.4)',
                }}
            >
                {/* Top gradient bar */}
                <div style={{ height: 4, background: 'linear-gradient(90deg, #25d366, #128c7e)' }} />

                {/* Close */}
                <button
                    onClick={onSkip}
                    style={{
                        position: 'absolute', background: 'none', border: 'none', cursor: 'pointer',
                        top: 20, right: 20, color: 'var(--text-muted)', padding: 4, borderRadius: 8,
                    }}
                >
                    <X size={16} />
                </button>

                {/* Body */}
                <div style={{ padding: '36px 32px 32px', textAlign: 'center' }}>
                    {/* Icon */}
                    <div style={{
                        width: 60, height: 60, borderRadius: 20, margin: '0 auto 20px',
                        background: 'linear-gradient(135deg, #25d366, #128c7e)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <MessageCircle size={28} color="#fff" />
                    </div>

                    <h2 style={{ fontSize: 21, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>
                        One last step, {userName.split(' ')[0]}!
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.65 }}>
                        Add your WhatsApp number so we can notify<br />you when your videos are ready — even if<br />you close the browser.
                    </p>

                    {/* Phone input */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 0,
                        border: `1.5px solid ${error ? 'rgba(239,68,68,.6)' : 'var(--border)'}`,
                        borderRadius: 12, overflow: 'hidden',
                        background: 'var(--bg-input)',
                        transition: 'border-color .15s',
                    }}>
                        {/* +91 prefix */}
                        <div style={{
                            padding: '13px 14px', background: 'var(--bg-pill)',
                            borderRight: '1px solid var(--border)',
                            fontSize: 14, fontWeight: 700, color: 'var(--text)',
                            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                            whiteSpace: 'nowrap',
                        }}>
                            🇮🇳 +91
                        </div>
                        <input
                            ref={inputRef}
                            type="tel"
                            inputMode="numeric"
                            placeholder="98765 43210"
                            value={phone}
                            onChange={handleInput}
                            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                            style={{
                                flex: 1, padding: '13px 14px',
                                background: 'transparent', border: 'none', outline: 'none',
                                fontSize: 15, color: 'var(--text)', letterSpacing: '0.05em',
                            }}
                        />
                    </div>

                    {error && (
                        <p style={{ fontSize: 12, color: '#ef4444', marginTop: 8, textAlign: 'left' }}>
                            ⚠ {error}
                        </p>
                    )}

                    {/* Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{
                                width: '100%', padding: '13px',
                                borderRadius: 12, border: 'none',
                                background: loading ? 'var(--bg-pill)' : 'linear-gradient(135deg, #25d366, #128c7e)',
                                color: '#fff', fontSize: 14, fontWeight: 800,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}
                        >
                            {loading ? 'Saving…' : (
                                <>
                                    <MessageCircle size={16} />
                                    Save WhatsApp Number
                                </>
                            )}
                        </button>
                        <button
                            onClick={onSkip}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: 12, color: 'var(--text-muted)', padding: '6px',
                            }}
                        >
                            Skip for now
                        </button>
                    </div>

                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 14, lineHeight: 1.5 }}>
                        🔒 Only used for video notifications. We never spam.
                    </p>
                </div>
            </div>
        </div>
    )
}
