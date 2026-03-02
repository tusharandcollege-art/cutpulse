'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/components/ThemeProvider'
import { Scissors, Sun, Moon } from 'lucide-react'

export default function AffiliatesLayout({ children }: { children: React.ReactNode }) {
    const { user, signIn, logOut } = useAuth()
    const { theme, toggle } = useTheme()
    const isDark = theme === 'dark'

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>
            {/* Minimal header — no sidebar */}
            <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 24px', height: 56,
                background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
                position: 'sticky', top: 0, zIndex: 50,
            }}>
                <Link href="https://cutpulse.com" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Scissors size={13} color="#fff" strokeWidth={2.3} />
                    </div>
                    <span style={{ fontWeight: 900, fontSize: 15 }}>
                        <span style={{ color: 'var(--text)' }}>Cut</span>
                        <span style={{ color: '#6366f1' }}>Pulse</span>
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', padding: '2px 8px', borderRadius: 999, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.25)', marginLeft: 4 }}>
                        Affiliates
                    </span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 6, borderRadius: 8 }}>
                        {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    {user ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {user.photoURL
                                ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{ width: 28, height: 28, borderRadius: '50%' }} />
                                : <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>{user.displayName?.[0]}</div>
                            }
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user.displayName?.split(' ')[0]}
                            </span>
                            <button onClick={logOut} style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => signIn()} style={{ padding: '7px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                            Sign In with Google
                        </button>
                    )}
                </div>
            </header>

            <main style={{ flex: 1 }}>{children}</main>

            <footer style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                © 2025 CutPulse ·{' '}
                <Link href="https://cutpulse.com" style={{ color: '#6366f1', textDecoration: 'none' }}>Back to App</Link>
            </footer>
        </div>
    )
}
