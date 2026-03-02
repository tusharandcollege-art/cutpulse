'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'
import { applyForAffiliate, getAffiliate } from '@/lib/affiliate'
import { useRouter } from 'next/navigation'
import { Instagram, TrendingUp, Copy, CheckCircle, Zap, DollarSign, Users, Star } from 'lucide-react'

const NICHES = ['Tech & AI', 'Reels / Short Videos', 'Gaming', 'Travel', 'Fashion & Lifestyle', 'Education', 'Finance', 'Food', 'Other']

const TIERS = [
    { label: 'Bronze', min: 1, max: 10, pct: 20, color: '#cd7f32' },
    { label: 'Silver', min: 11, max: 30, pct: 25, color: '#94a3b8' },
    { label: 'Gold', min: 31, max: 999, pct: 30, color: '#f59e0b' },
]

export default function AffiliatePage() {
    const { user, signIn } = useAuth()
    const { show: toast } = useToast()
    const router = useRouter()
    const [affiliateStatus, setAffiliateStatus] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [calcSales, setCalcSales] = useState(10)

    const [form, setForm] = useState({
        name: '', email: '', instagram: '', followers: '10000', niche: 'Tech & AI', why: ''
    })

    useEffect(() => {
        if (!user) { setLoading(false); return }
        setForm(f => ({ ...f, name: user.displayName || '', email: user.email || '' }))
        getAffiliate(user.uid).then(aff => {
            if (aff) {
                setAffiliateStatus(aff.status)
                if (aff.status === 'approved') router.push('/affiliate/dashboard')
            }
            setLoading(false)
        })
    }, [user, router])

    const calcEarnings = () => {
        const avgPlan = 1699 // Popular yearly
        return Math.floor(calcSales * avgPlan * 0.20)
    }

    const handleApply = async () => {
        if (!user) { signIn(); return }
        if (!form.instagram.trim()) { toast('Enter your Instagram handle', 'error'); return }
        if (!form.why.trim()) { toast('Tell us why you want to join', 'error'); return }
        setSubmitting(true)
        try {
            await applyForAffiliate(user.uid, form)
            setAffiliateStatus('pending')
            toast('Application submitted! We\'ll review within 24 hours.', 'success')
        } catch { toast('Failed to submit. Try again.', 'error') }
        finally { setSubmitting(false) }
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--indigo)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    )

    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 60px' }}>

            {/* ── Hero ─────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, #0f0f16 0%, #1a1040 50%, #0f0f16 100%)',
                padding: '72px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
                {/* Glow orbs */}
                <div style={{ position: 'absolute', top: '20%', left: '20%', width: 400, height: 300, background: 'radial-gradient(ellipse, rgba(99,102,241,.15), transparent 70%)', filter: 'blur(60px)' }} />
                <div style={{ position: 'absolute', bottom: 0, right: '20%', width: 300, height: 200, background: 'radial-gradient(ellipse, rgba(139,92,246,.12), transparent 70%)', filter: 'blur(60px)' }} />

                <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: 'rgba(99,102,241,.15)', border: '1px solid rgba(99,102,241,.3)', marginBottom: 20 }}>
                        <Instagram size={14} color="#6366f1" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>Exclusive Influencer Program</span>
                    </div>

                    <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.1 }}>
                        Turn Your Reach Into<br />
                        <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Real Income
                        </span>
                    </h1>
                    <p style={{ fontSize: 18, color: 'rgba(255,255,255,.65)', marginBottom: 36, lineHeight: 1.6 }}>
                        Promote CutPulse to your followers and earn <strong style={{ color: '#a78bfa' }}>20% commission</strong> on every sale.<br />
                        Indian creators are already searching for Seedance 2.0 — be the one to show them where.
                    </p>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Commission', value: '20%', icon: '💰' },
                            { label: 'Per Starter Sale', value: '₹170', icon: '⚡' },
                            { label: 'Per Pro Sale', value: '₹1,000', icon: '🚀' },
                            { label: 'Payout via', value: 'UPI', icon: '📲' },
                        ].map(s => (
                            <div key={s.label} style={{
                                padding: '16px 24px', borderRadius: 16,
                                background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
                                backdropFilter: 'blur(12px)',
                            }}>
                                <div style={{ fontSize: 22 }}>{s.icon}</div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{s.value}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>

                {/* ── How it works ──────────────────────────────── */}
                <div style={{ marginTop: 56, marginBottom: 48 }}>
                    <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 900, color: 'var(--text)', marginBottom: 32 }}>How it works</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                        {[
                            { step: '1', icon: '📋', title: 'Apply', desc: 'Fill out the form below. We review within 24 hours.' },
                            { step: '2', icon: '🔗', title: 'Share your link', desc: 'Get your custom link: cutpulse.com/?ref=yourhandle' },
                            { step: '3', icon: '💸', title: 'Earn 20%', desc: 'Every sale from your link = 20% commission to your UPI.' },
                        ].map(s => (
                            <div key={s.step} style={{
                                padding: 24, borderRadius: 20,
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 32, marginBottom: 12 }}>{s.icon}</div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--indigo)', marginBottom: 6, letterSpacing: '0.1em' }}>STEP {s.step}</div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{s.title}</div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Earnings calculator ───────────────────────── */}
                <div style={{ padding: 32, borderRadius: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 48 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 6 }}>💰 Earnings Calculator</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Drag to see how much you can earn per month</p>

                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sales per month</span>
                            <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--indigo)' }}>{calcSales} sales</span>
                        </div>
                        <input type="range" min={1} max={100} value={calcSales} onChange={e => setCalcSales(+e.target.value)}
                            style={{ width: '100%', accentColor: '#6366f1' }} />
                    </div>

                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '20px 24px', borderRadius: 16, background: 'linear-gradient(135deg, rgba(99,102,241,.1), rgba(139,92,246,.1))', border: '1px solid rgba(99,102,241,.2)' }}>
                        <div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Estimated monthly earnings</div>
                            <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--indigo)' }}>₹{calcEarnings().toLocaleString('en-IN')}</div>
                        </div>
                        <div style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Based on Popular yearly plan (₹1,699) × {calcSales} sales × 20% commission
                        </div>
                    </div>
                </div>

                {/* ── Commission tiers ──────────────────────────── */}
                <div style={{ marginBottom: 48 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 20, textAlign: 'center' }}>Performance Tiers</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {TIERS.map(t => (
                            <div key={t.label} style={{
                                padding: 20, borderRadius: 16,
                                background: 'var(--bg-card)', border: `1.5px solid ${t.color}44`,
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>
                                    {t.label === 'Bronze' ? '🥉' : t.label === 'Silver' ? '🥈' : '🥇'}
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 900, color: t.color, marginBottom: 4 }}>{t.label}</div>
                                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)' }}>{t.pct}%</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                                    {t.min}–{t.max === 999 ? '∞' : t.max} sales/mo
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Application section ───────────────────────── */}
                {affiliateStatus === 'pending' ? (
                    <div style={{ padding: 40, borderRadius: 24, background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,.3)', textAlign: 'center', marginBottom: 40 }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
                        <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>Application Under Review</h3>
                        <p style={{ color: 'var(--text-muted)' }}>We'll notify you via WhatsApp / email within 24 hours.</p>
                    </div>
                ) : affiliateStatus === 'rejected' ? (
                    <div style={{ padding: 40, borderRadius: 24, background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,.3)', textAlign: 'center', marginBottom: 40 }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
                        <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>Application Not Approved</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Contact us on Instagram @cutpulse.ai to learn more.</p>
                    </div>
                ) : (
                    <div style={{ padding: 36, borderRadius: 24, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 40 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 6 }}>Apply to Join</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>Only selected Instagram influencers are accepted. Apply below.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[
                                { label: 'Full Name', key: 'name', placeholder: 'Rahul Sharma' },
                                { label: 'Email', key: 'email', placeholder: 'you@email.com' },
                                { label: 'Instagram Handle', key: 'instagram', placeholder: 'techwithrohit (without @)' },
                                { label: 'Followers Count', key: 'followers', placeholder: '50000' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>{f.label}</label>
                                    <input
                                        value={form[f.key as keyof typeof form]}
                                        onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        style={{
                                            width: '100%', padding: '11px 14px', borderRadius: 10,
                                            background: 'var(--bg-input)', border: '1px solid var(--border)',
                                            color: 'var(--text)', fontSize: 14, outline: 'none',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                </div>
                            ))}

                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Content Niche</label>
                                <select value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
                                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, outline: 'none' }}>
                                    {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Why do you want to join? (Tell us about your audience)</label>
                                <textarea value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))} rows={4}
                                    placeholder="My audience is interested in AI content creation and Reels..."
                                    style={{
                                        width: '100%', padding: '11px 14px', borderRadius: 10,
                                        background: 'var(--bg-input)', border: '1px solid var(--border)',
                                        color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'vertical',
                                        boxSizing: 'border-box', fontFamily: 'inherit',
                                    }} />
                            </div>

                            <button
                                onClick={handleApply}
                                disabled={submitting}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                                    background: submitting ? 'var(--bg-pill)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: '#fff', fontSize: 15, fontWeight: 800,
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}
                            >
                                {submitting ? 'Submitting…' : (
                                    <>
                                        <Instagram size={18} />
                                        {user ? 'Submit Application' : 'Sign In to Apply'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
