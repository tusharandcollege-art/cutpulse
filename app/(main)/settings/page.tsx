'use client'

import { useState, useEffect } from 'react'
import { User, Palette, Sliders, Bell, Database, Info, Check, LogOut, Zap, Video, Gift, Copy } from 'lucide-react'
import { useTheme } from '@/components/ThemeProvider'
import { useAuth } from '@/hooks/useAuth'
import { usePoints } from '@/hooks/usePoints'
import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { db } from '@/lib/firebase'
import { getOrGenerateReferralCode, applyPromoOrReferralCode } from '@/lib/points'

type Theme = 'light' | 'dark'
type Model = 'seedance_2.0_fast' | 'seedance_2.0'
type Ratio = '16:9' | '9:16' | '1:1'

// ── Storage helpers ──────────────────────────────────────────────
const SETTINGS_KEY = 'cp-settings'
const VIDEOS_KEY = 'cp-videos'

function loadSettings() {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } catch { return {} }
}
function saveToLS(data: object) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...loadSettings(), ...data }))
}
function getVideoCount() {
    if (typeof window === 'undefined') return 0
    try { return JSON.parse(localStorage.getItem(VIDEOS_KEY) || '[]').length } catch { return 0 }
}

// ── Sub-components ───────────────────────────────────────────────
function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--indigo-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} style={{ color: 'var(--indigo)' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{title}</span>
            </div>
            <div style={{ padding: '4px 0' }}>{children}</div>
        </div>
    )
}

function Row({ label, hint, last, children }: { label: string; hint?: string; last?: boolean; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: last ? 'none' : '1px solid var(--border)', gap: 16 }}>
            <div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{label}</div>
                {hint && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div>}
            </div>
            <div style={{ flexShrink: 0 }}>{children}</div>
        </div>
    )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
    return (
        <button onClick={() => onChange(!value)} style={{
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: value ? 'var(--indigo)' : 'var(--border-hover)', position: 'relative', transition: 'background .2s',
        }}>
            <span style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} />
        </button>
    )
}

function Sel<T extends string>({ value, options, onChange }: { value: T; options: { val: T; label: string }[]; onChange: (v: T) => void }) {
    return (
        <select value={value} onChange={e => onChange(e.target.value as T)} style={{
            background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text)', padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', outline: 'none',
        }}>
            {options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
        </select>
    )
}

// ── Main page ────────────────────────────────────────────────────
export default function SettingsPage() {
    const { theme, toggle: toggleTheme } = useTheme()
    const { user, logOut, signIn } = useAuth()
    const { points, totalVideos } = usePoints()

    // Form state — pre-populated from localStorage
    const s = loadSettings()
    const [displayName, setDisplayName] = useState(s.displayName ?? user?.displayName ?? '')
    const [defaultModel, setDefaultModel] = useState<Model>(s.defaultModel ?? 'seedance_2.0_fast')
    const [defaultRatio, setDefaultRatio] = useState<Ratio>(s.defaultRatio ?? '16:9')
    const [defaultDuration, setDefaultDuration] = useState<number>(s.defaultDuration ?? 5)
    const [notifOn, setNotifOn] = useState<boolean>(s.notificationsOn ?? false)
    const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default')

    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [nameUpdated, setNameUpdated] = useState(false)
    const [videosCleared, setVideosCleared] = useState(false)
    const [videoCount, setVideoCount] = useState(0)

    // Referral and Promo state
    const [promoInput, setPromoInput] = useState('')
    const [promoMsg, setPromoMsg] = useState<{ text: string, type: 'success' | 'error' } | null>(null)
    const [referralCode, setReferralCode] = useState<string | null>(null)
    const [codeCopied, setCodeCopied] = useState(false)

    useEffect(() => {
        setVideoCount(getVideoCount())
        if ('Notification' in window) setNotifPerm(Notification.permission)
        // sync display name from logged-in user if not set locally
        if (user?.displayName && !s.displayName) setDisplayName(user.displayName)

        // Fetch or create referral code
        if (user) {
            getOrGenerateReferralCode(user.uid).then(code => setReferralCode(code))
        } else {
            setReferralCode(null)
        }
    }, [user])

    // ── Theme ────────────────────────────────────────────────────
    const applyTheme = (t: Theme) => {
        if (t === theme) return
        toggleTheme()                         // ThemeProvider toggles and persists
    }

    // ── Save all settings ────────────────────────────────────────
    const saveSettings = async () => {
        setSaving(true)
        const data = { displayName, defaultModel, defaultRatio, defaultDuration, notificationsOn: notifOn }
        saveToLS(data)           // always save to localStorage (works logged out too)

        // Persist to Firestore if logged in
        if (user) {
            try {
                await updateDoc(doc(db, 'users', user.uid), {
                    displayName,
                    settings: data,
                })
                // Update Firebase Auth display name
                if (displayName !== user.displayName) {
                    await updateProfile(user, { displayName })
                    setNameUpdated(true)
                    setTimeout(() => setNameUpdated(false), 3000)
                }
            } catch (e) { console.error('Firestore update failed', e) }
        }

        // Notifications
        if (notifOn && 'Notification' in window) {
            const perm = await Notification.requestPermission()
            setNotifPerm(perm)
        }

        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    // ── Clear My Videos ───────────────────────────────────────────
    const clearVideos = () => {
        localStorage.removeItem(VIDEOS_KEY)
        setVideoCount(0)
        setVideosCleared(true)
        setTimeout(() => setVideosCleared(false), 2500)
    }

    // ── Notifications toggle ──────────────────────────────────────
    const handleNotifToggle = async (val: boolean) => {
        setNotifOn(val)
        if (val && 'Notification' in window) {
            const perm = await Notification.requestPermission()
            setNotifPerm(perm)
            if (perm !== 'granted') setNotifOn(false)   // revert if denied
        }
    }

    // ── Promo / Referral Redeem ───────────────────────────────────
    const handlePromoSubmit = async () => {
        if (!user || !promoInput.trim()) return
        const res = await applyPromoOrReferralCode(user.uid, promoInput)
        setPromoMsg({ text: res.message, type: res.success ? 'success' : 'error' })
        if (res.success) setPromoInput('')
        setTimeout(() => setPromoMsg(null), 4000)
    }

    const copyReferral = () => {
        if (!referralCode) return
        navigator.clipboard.writeText(referralCode)
        setCodeCopied(true)
        setTimeout(() => setCodeCopied(false), 2000)
    }

    return (
        <div style={{ height: '100%', overflowY: 'auto' }}>
            <div style={{ maxWidth: 620, margin: '0 auto', padding: '28px 24px 40px' }}>

                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>Settings</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Your preferences are saved automatically to your account</p>
                </div>

                {/* ── Account ──────────────────────────────────────────── */}
                <Section icon={User} title="Account">
                    {user ? (
                        <>
                            {/* Avatar + info */}
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                                {user.photoURL
                                    ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                                    : <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff' }}>{user.displayName?.[0] ?? '?'}</div>
                                }
                                <div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{user.displayName}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{user.email}</div>
                                    <div style={{ display: 'flex', gap: 12, marginTop: 5 }}>
                                        <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--indigo)', fontWeight: 700 }}>
                                            <Zap size={10} /> {points.toLocaleString()} pts
                                        </span>
                                        <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontWeight: 600 }}>
                                            <Video size={10} /> {totalVideos} video{totalVideos !== 1 ? 's' : ''} generated
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Display name */}
                            <Row label="Display Name" hint="Shown in the header and your videos">
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                                        placeholder="Your name"
                                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '5px 10px', fontSize: 12, width: 140, outline: 'none' }} />
                                    {nameUpdated && <Check size={13} style={{ color: '#22c55e' }} />}
                                </div>
                            </Row>

                            {/* Sign out */}
                            <Row label="Session" hint="You are signed in with Google" last>
                                <button onClick={logOut} style={{
                                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8,
                                    border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)',
                                    color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                                }}>
                                    <LogOut size={12} /> Sign Out
                                </button>
                            </Row>
                        </>
                    ) : (
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sign in to sync your settings across devices and keep your points balance.</p>
                            <button onClick={signIn} style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 10,
                                border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text)',
                                cursor: 'pointer', fontSize: 13, fontWeight: 700,
                            }}>
                                <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.2H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.8z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.6 16.3 44 24 44z" /><path fill="#1976D2" d="M43.6 20.2H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C41.5 36.6 44 30.8 44 24c0-1.3-.1-2.6-.4-3.8z" /></svg>
                                Sign in with Google
                            </button>
                        </div>
                    )}
                </Section>

                {/* ── Appearance ───────────────────────────────────────── */}
                <Section icon={Palette} title="Appearance">
                    <Row label="Theme" hint="Applied instantly across the whole app" last>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {(['light', 'dark'] as Theme[]).map(t => (
                                <button key={t} onClick={() => applyTheme(t)} style={{
                                    padding: '5px 16px', borderRadius: 8, border: '1px solid var(--border)',
                                    background: theme === t ? 'var(--indigo)' : 'var(--bg-input)',
                                    color: theme === t ? '#fff' : 'var(--text-2)',
                                    cursor: 'pointer', fontSize: 12, fontWeight: 700, textTransform: 'capitalize', transition: 'all .15s',
                                }}>{t === 'light' ? '☀ Light' : '🌙 Dark'}</button>
                            ))}
                        </div>
                    </Row>
                </Section>

                {/* ── Rewards & Promos ─────────────────────────────────── */}
                <Section icon={Gift} title="Rewards & Promos">
                    {user ? (
                        <>
                            <Row label="Your Referral Code" hint="Friends get 100 pts. You earn a 15% bonus when they buy a plan!">
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <div style={{
                                        background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8,
                                        padding: '5px 12px', fontSize: 13, fontWeight: 800, color: 'var(--text)',
                                        letterSpacing: 1, fontFamily: 'monospace'
                                    }}>
                                        {referralCode || '...'}
                                    </div>
                                    <button onClick={copyReferral} style={{
                                        background: 'var(--bg-input)', border: '1px solid var(--border)',
                                        borderRadius: 8, padding: '6px', color: codeCopied ? '#22c55e' : 'var(--text-muted)',
                                        cursor: 'pointer', transition: 'all .2s'
                                    }}>
                                        {codeCopied ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </Row>
                            <Row label="Redeem Code" hint="Enter a promo or referral code" last>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <input value={promoInput} onChange={e => setPromoInput(e.target.value.toUpperCase())}
                                            placeholder="Code"
                                            style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '5px 10px', fontSize: 13, width: 140, outline: 'none', textTransform: 'uppercase' }} />
                                        <button onClick={handlePromoSubmit} disabled={!promoInput.trim()} style={{
                                            background: promoInput.trim() ? 'var(--indigo)' : 'var(--bg-input)',
                                            color: promoInput.trim() ? '#fff' : 'var(--text-muted)',
                                            border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 700,
                                            cursor: promoInput.trim() ? 'pointer' : 'not-allowed', transition: 'background .2s'
                                        }}>
                                            Apply
                                        </button>
                                    </div>
                                    {promoMsg && (
                                        <span style={{ fontSize: 11, fontWeight: 600, color: promoMsg.type === 'success' ? '#22c55e' : '#ef4444' }}>
                                            {promoMsg.text}
                                        </span>
                                    )}
                                </div>
                            </Row>
                        </>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sign in to access your referral code and redeem promos.</p>
                        </div>
                    )}
                </Section>

                {/* ── Generation Defaults ────────────────────────────── */}
                <Section icon={Sliders} title="Generation Defaults">
                    <p style={{ padding: '10px 20px 4px', fontSize: 11, color: 'var(--text-muted)' }}>
                        These defaults are used when you open any generation page. Press Save to apply.
                    </p>
                    <Row label="Default Model" hint="Fast = cheaper, Standard = higher quality">
                        <Sel value={defaultModel} onChange={setDefaultModel} options={[
                            { val: 'seedance_2.0_fast', label: '⚡ Fast (100 pts/s)' },
                            { val: 'seedance_2.0', label: '✨ Standard (200 pts/s)' },
                        ]} />
                    </Row>
                    <Row label="Default Aspect Ratio" hint="Shape of the output video">
                        <Sel value={defaultRatio} onChange={setDefaultRatio} options={[
                            { val: '16:9', label: '▬ 16:9 Landscape' },
                            { val: '9:16', label: '▮ 9:16 Portrait' },
                            { val: '1:1', label: '■ 1:1 Square' },
                        ]} />
                    </Row>
                    <Row label="Default Duration" hint="Video length in seconds" last>
                        <Sel value={defaultDuration.toString()} onChange={v => setDefaultDuration(Number(v))} options={[
                            { val: '4', label: '4s — shortest' },
                            { val: '5', label: '5s' },
                            { val: '8', label: '8s' },
                            { val: '10', label: '10s' },
                            { val: '15', label: '15s — longest' },
                        ]} />
                    </Row>
                </Section>

                {/* ── Notifications ─────────────────────────────────── */}
                <Section icon={Bell} title="Notifications">
                    <Row label="Desktop Notifications"
                        hint={
                            notifPerm === 'granted' ? '✅ Permission granted' :
                                notifPerm === 'denied' ? '❌ Blocked by browser — change in browser settings' :
                                    'Notify you when video generation is complete'
                        }
                        last
                    >
                        <Toggle value={notifOn} onChange={handleNotifToggle} />
                    </Row>
                </Section>

                {/* ── Data & Privacy ─────────────────────────────────── */}
                <Section icon={Database} title="Data & Privacy">
                    <Row label="My Videos Cache"
                        hint={videoCount > 0 ? `${videoCount} video${videoCount !== 1 ? 's' : ''} stored locally in your browser` : 'No videos saved locally'}
                    >
                        <button onClick={clearVideos} disabled={videoCount === 0} style={{
                            padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)',
                            background: videosCleared ? 'rgba(34,197,94,.1)' : 'var(--bg-input)',
                            color: videosCleared ? '#22c55e' : videoCount === 0 ? 'var(--text-muted)' : '#ef4444',
                            cursor: videoCount === 0 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700,
                            display: 'flex', alignItems: 'center', gap: 5, transition: 'all .2s',
                        }}>
                            {videosCleared ? <><Check size={11} /> Cleared!</> : 'Clear History'}
                        </button>
                    </Row>
                    <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)' }}>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.65 }}>
                            Video history is stored <strong style={{ color: 'var(--text-2)' }}>only in your browser</strong>. Generation
                            requests are sent to the AI provider via our server. Your points balance is stored
                            {user ? <strong style={{ color: 'var(--text-2)' }}> in your Firestore account</strong> : ' locally'}.
                        </p>
                    </div>
                </Section>

                {/* ── About ─────────────────────────────────────────── */}
                <Section icon={Info} title="About CutPulse">
                    <Row label="Version"><span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>v0.1.0</span></Row>
                    <Row label="AI Model"><span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 700 }}>Seedance 2.0 · xskill.ai</span></Row>
                    <Row label="Storage"><span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 700 }}>Firebase Storage</span></Row>
                    <Row label="Auth & DB" last><span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 700 }}>Firebase Auth + Firestore</span></Row>
                </Section>

                {/* ── Save button ────────────────────────────────────── */}
                <button onClick={saveSettings} disabled={saving} style={{
                    width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                    background: saved ? '#22c55e' : 'var(--indigo)',
                    color: '#fff', fontWeight: 900, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'background .3s', opacity: saving ? 0.7 : 1,
                }}>
                    {saving ? 'Saving…' : saved ? <><Check size={16} /> Saved!</> : 'Save Settings'}
                </button>
                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>
                    {user ? 'Settings saved to your Firestore account + this browser' : 'Settings saved to this browser only · Sign in to sync across devices'}
                </p>
            </div>
        </div>
    )
}
