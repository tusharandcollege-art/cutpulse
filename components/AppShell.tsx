'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Scissors, Settings, Sparkles, Image, Film, Layers, PlaySquare, Sun, Moon, LogOut, ChevronDown, Zap } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/hooks/useAuth'
import { usePoints } from '@/hooks/usePoints'
import { useVideoStore } from '@/hooks/useVideoStore'
import AuthModal from '@/components/AuthModal'
import { ToastProvider } from '@/components/ToastProvider'
import Footer from '@/components/Footer'

const activePolls = new Set<string>()

const nav = [
    { href: '/generate', icon: Sparkles, label: 'Text to\nVideo', mobileLabel: 'Create' },
    { href: '/image-to-video', icon: Image, label: 'Image to\nVideo', mobileLabel: 'Image' },
    { href: '/frames-to-video', icon: Film, label: 'Frames\nto Video', mobileLabel: 'Frames' },
    { href: '/omni-reference', icon: Layers, label: 'All\nRound', mobileLabel: 'All-Round' },
    { href: '/my-videos', icon: PlaySquare, label: 'My\nVideos', mobileLabel: 'Videos' },
    { href: '/pricing', icon: Zap, label: 'Pricing', mobileLabel: 'Pricing' },
    { href: '/settings', icon: Settings, label: 'Settings', mobileLabel: 'Settings' },
]

const mobileNav = nav.filter(n => !['/settings', '/pricing'].includes(n.href)) // Limit bottom nav on mobile to the 5 core features

function PointsBadge({ points, loading, user }: { points: number; loading: boolean; user: unknown }) {
    if (!user) return null
    if (loading) return (
        <div style={{
            width: 80, height: 26, borderRadius: 999,
            background: 'var(--bg-pill)', animation: 'pulse 1.5s infinite',
        }} />
    )
    const low = points < 100
    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 999,
            background: low ? 'rgba(239,68,68,.1)' : 'var(--indigo-light)',
            border: `1px solid ${low ? 'rgba(239,68,68,.25)' : 'rgba(99,102,241,.22)'}`,
            fontSize: 12, fontWeight: 800,
            color: low ? '#ef4444' : 'var(--indigo)',
            whiteSpace: 'nowrap',
        }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
            {points.toLocaleString()} pts
            {low && <span style={{ fontSize: 9, opacity: .8, marginLeft: 2 }}>Low!</span>}
        </div>
    )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { theme, toggle } = useTheme()
    const { user, loading: authLoading, signIn, logOut } = useAuth()
    const { points, loading: ptsLoading } = usePoints()
    const { videos } = useVideoStore()
    const isDark = theme === 'dark'

    const [showModal, setShowModal] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)

    // Background video completion syncer (so users can close the browser and not lose generating videos)
    const { update } = useVideoStore()
    useEffect(() => {
        const timer = setInterval(() => {
            const raw = localStorage.getItem('cp-videos')
            if (!raw) return
            try {
                const arr = JSON.parse(raw) as any[]
                const pend = arr.filter(v => v.status === 'pending' && v.taskId && !activePolls.has(v.taskId))
                pend.forEach(async v => {
                    activePolls.add(v.taskId)
                    try {
                        const s = await fetch('/api/video/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: v.taskId }) }).then(r => r.json())
                        const st = s?.data?.status
                        if (st === 'completed' || st === 'success') {
                            update(v.id, { status: 'completed', videoUrl: s?.data?.result?.video_url })
                        } else if (st === 'failed' || st === 'error') {
                            update(v.id, { status: 'error', error: s?.data?.error || 'Failed' })
                        }
                    } catch { /* suppress network errors */ }
                    finally { activePolls.delete(v.taskId) }
                })
            } catch { }
        }, 5000)
        return () => clearInterval(timer)
    }, [update])

    // Count actively pending/generating videos
    const generatingCount = videos.filter(v => v.status === 'pending').length

    const handleSignIn = async () => {
        try { await signIn(); setShowModal(false) } catch { /* user cancelled */ }
    }

    return (
        <ToastProvider>
            {/* ── Auth Modal ──────────────────────────────────────── */}
            {showModal && <AuthModal onSignIn={handleSignIn} onClose={() => setShowModal(false)} />}

            <div className="app-shell">
                {/* ── Header ──────────────────────────────────────────── */}
                <header className="app-header">
                    <Link href="/generate" className="flex items-center gap-2 no-underline" style={{ flexShrink: 0 }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', flexShrink: 0 }}>
                            <Scissors size={13} color="#fff" strokeWidth={2.3} />
                        </div>
                        <span className="text-[14.5px] font-black tracking-tight hide-mobile">
                            <span style={{ color: 'var(--text)' }}>Cut</span>
                            <span style={{ color: 'var(--indigo)' }}>Pulse</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                        {/* Live points badge — hidden on mobile (shown in settings) */}
                        <div className="hide-mobile">
                            <PointsBadge points={points} loading={ptsLoading} user={user} />
                        </div>

                        {/* Get More Points button */}
                        {user && points < 500 && !ptsLoading && (
                            <Link href="/pricing" style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                            }}>
                                <Zap size={11} fill="currentColor" />
                                <span className="hide-mobile">Get Points</span>
                            </Link>
                        )}

                        {/* Theme toggle — hidden on mobile */}
                        <button className="icon-btn hide-mobile" onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'}>
                            {isDark ? <Sun size={14} /> : <Moon size={14} />}
                        </button>

                        {/* Settings — hidden on mobile (accessible via bottom nav) */}
                        <Link href="/settings" className="icon-btn hide-mobile" title="Settings">
                            <Settings size={13} />
                        </Link>

                        {/* ── Auth area ── */}
                        {authLoading ? (
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-pill)', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                        ) : user ? (
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <button
                                    onClick={() => setShowUserMenu(v => !v)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        padding: '3px 8px 3px 3px', borderRadius: 999,
                                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                                        cursor: 'pointer', color: 'var(--text)', flexShrink: 0,
                                    }}
                                >
                                    {user.photoURL
                                        ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
                                        : <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>{user.displayName?.[0] ?? '?'}</div>
                                    }
                                    <span className="hide-mobile" style={{ fontSize: 12, fontWeight: 700, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.displayName?.split(' ')[0] ?? 'User'}
                                    </span>
                                    <ChevronDown size={12} className="hide-mobile" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                </button>

                                {showUserMenu && (
                                    <>
                                        <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowUserMenu(false)} />
                                        <div style={{
                                            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
                                            width: 220, background: 'var(--bg-card)', border: '1px solid var(--border)',
                                            borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,.18)', overflow: 'hidden',
                                        }} className="animate-fadeIn">
                                            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{user.displayName}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
                                            </div>
                                            <div style={{ padding: '6px 0' }}>
                                                <Link href="/settings" onClick={() => setShowUserMenu(false)} style={{
                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                    padding: '9px 16px', color: 'var(--text-2)', textDecoration: 'none',
                                                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                                }}
                                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'}
                                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                                >
                                                    <Settings size={14} /> Settings
                                                </Link>
                                                <button onClick={() => { logOut(); setShowUserMenu(false) }} style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                                    padding: '9px 16px', color: '#ef4444', background: 'none',
                                                    border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'left',
                                                }}
                                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,.06)'}
                                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                                                >
                                                    <LogOut size={14} /> Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <button className="signin-btn flex items-center gap-1.5" onClick={() => setShowModal(true)}>
                                <svg width="13" height="13" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                                    <path fill="#FFC107" d="M43.6 20.2H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.8z" />
                                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
                                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.6 16.3 44 24 44z" />
                                    <path fill="#1976D2" d="M43.6 20.2H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C41.5 36.6 44 30.8 44 24c0-1.3-.1-2.6-.4-3.8z" />
                                </svg>
                                Sign In
                            </button>
                        )}
                    </div>
                </header>

                {/* ── Sidebar (desktop) ─────────────────────────────────── */}
                <aside className="app-sidebar">
                    {nav.filter(n => n.href !== '/settings').map(({ href, icon: Icon, label }) => {
                        const active = pathname === href
                        const isPending = href === '/my-videos' && generatingCount > 0
                        return (
                            <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`} style={{ position: 'relative' }}>
                                <Icon size={18} strokeWidth={active ? 2.1 : 1.6} />
                                {label}
                                {isPending && (
                                    <span style={{
                                        position: 'absolute', top: 4, right: 4,
                                        width: 8, height: 8, borderRadius: '50%',
                                        background: '#f59e0b', border: '1.5px solid var(--bg)',
                                        animation: 'pulse 1.5s infinite',
                                    }} />
                                )}
                            </Link>
                        )
                    })}

                    <div className="mt-auto mb-1 flex flex-col items-center gap-2">
                        <div className="w-5 h-px" style={{ background: 'var(--border)' }} />
                        <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
                            <Settings size={18} strokeWidth={pathname === '/settings' ? 2.1 : 1.6} />
                            {'Settings'}
                        </Link>
                        <div className="w-5 h-px mt-1 mb-1" style={{ background: 'var(--border)' }} />
                        <span className="font-extrabold tracking-widest" style={{ fontSize: '7px', color: 'var(--indigo)', writingMode: 'vertical-rl', letterSpacing: '0.28em' }}>
                            CUTPULSE
                        </span>
                    </div>
                </aside>

                {/* ── Main ─────────────────────────────────────────────── */}
                <main className="app-main flex flex-col h-full overflow-y-auto" style={{ height: 'calc(100vh - var(--header-h))' }}>
                    <div className="flex-1">
                        {children}
                    </div>
                    <div className="mt-8">
                        <Footer />
                    </div>
                </main>

                {/* ── Mobile bottom nav ─────────────────────────────────── */}
                <nav className="mobile-bottom-nav">
                    {mobileNav.map(({ href, icon: Icon, mobileLabel }) => {
                        const active = pathname === href
                        const isPending = href === '/my-videos' && generatingCount > 0
                        return (
                            <Link key={href} href={href} style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center',
                                gap: 3, padding: '2px 0 6px', position: 'relative',
                                color: active ? 'var(--indigo)' : 'var(--text-muted)',
                                textDecoration: 'none',
                                fontSize: '8.5px', fontWeight: active ? 800 : 500,
                                flex: 1, minWidth: 0,
                            }}>
                                <Icon size={20} strokeWidth={active ? 2.2 : 1.5} />
                                <span style={{ whiteSpace: 'nowrap', lineHeight: 1.2 }}>{mobileLabel}</span>
                                {isPending && (
                                    <span style={{
                                        position: 'absolute', top: 2, right: '50%', transform: 'translateX(10px)',
                                        width: 6, height: 6, borderRadius: '50%',
                                        background: '#f59e0b', border: '1.5px solid var(--bg-card)',
                                    }} />
                                )}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </ToastProvider>
    )
}
