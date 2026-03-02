'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'
import { applyForAffiliate, getAffiliate, requestPayout, AffiliateData } from '@/lib/affiliate'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Copy, Check, TrendingUp, Users, DollarSign, Clock, Instagram } from 'lucide-react'

const NICHES = ['Tech & AI', 'Reels / Short Videos', 'Gaming', 'Travel', 'Fashion & Lifestyle', 'Education', 'Finance', 'Food', 'Other']

export default function AffiliatePage() {
    const { user, loading: authLoading, signIn } = useAuth()
    const { show: toast } = useToast()

    // State
    const [aff, setAff] = useState<AffiliateData | null>(null)
    const [referrals, setReferrals] = useState<any[]>([])
    const [pageLoading, setPageLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [copied, setCopied] = useState(false)
    const [upi, setUpi] = useState('')
    const [payoutLoading, setPayoutLoading] = useState(false)
    const [calcSales, setCalcSales] = useState(10)

    const [form, setForm] = useState({ name: '', email: '', instagram: '', followers: '10000', niche: 'Tech & AI', why: '' })

    useEffect(() => {
        if (authLoading) return
        if (!user) { setPageLoading(false); return }

        setForm(f => ({ ...f, name: user.displayName || '', email: user.email || '' }))

        getAffiliate(user.uid).then(async data => {
            setAff(data)
            setUpi(data?.upiId || '')
            if (data?.status === 'approved') {
                const q = query(collection(db, 'referrals'), where('affiliateUid', '==', user.uid), orderBy('createdAt', 'desc'))
                const snap = await getDocs(q)
                setReferrals(snap.docs.map(d => ({ ...d.data(), id: d.id })))
            }
            setPageLoading(false)
        })
    }, [user, authLoading])

    const link = aff ? `https://cutpulse.com/?ref=${aff.code}` : ''

    const copyLink = () => {
        navigator.clipboard.writeText(link)
        setCopied(true)
        toast('Link copied!', 'success')
        setTimeout(() => setCopied(false), 2000)
    }

    const handleApply = async () => {
        if (!user) { signIn(); return }
        if (!form.instagram.trim()) { toast('Enter your Instagram handle', 'error'); return }
        if (!form.why.trim()) { toast('Tell us about your audience', 'error'); return }
        setSubmitting(true)
        try {
            await applyForAffiliate(user.uid, form)
            setAff({ ...form, code: form.instagram.toLowerCase().replace(/[^a-z0-9_]/g, ''), status: 'pending', uid: user.uid, totalEarnings: 0, pendingEarnings: 0, totalSales: 0, totalReferrals: 0, createdAt: null })
            toast('Application submitted! We\'ll review within 24 hours.', 'success')
        } catch { toast('Failed to submit. Try again.', 'error') }
        finally { setSubmitting(false) }
    }

    const handlePayout = async () => {
        if (!aff || !user) return
        if (!upi.trim()) { toast('Enter your UPI ID', 'error'); return }
        if (aff.pendingEarnings < 500) { toast('Minimum payout is ₹500', 'error'); return }
        setPayoutLoading(true)
        try {
            await requestPayout(user.uid, aff.pendingEarnings, upi)
            toast(`₹${aff.pendingEarnings} payout requested! Paid within 48h.`, 'success')
            setAff(a => a ? { ...a, pendingEarnings: 0 } : a)
        } catch { toast('Failed. Try again.', 'error') }
        finally { setPayoutLoading(false) }
    }

    // Loading
    if (authLoading || pageLoading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )

    // ── STATUS BANNER ─────────────────────────────────────────────────────
    const renderStatusBanner = () => {
        if (!aff) return null
        if (aff.status === 'pending') return (
            <div style={{
                margin: '0 auto 24px', maxWidth: 700, padding: '20px 28px', borderRadius: 16,
                background: 'rgba(245,158,11,.1)', border: '2px solid rgba(245,158,11,.4)',
                display: 'flex', alignItems: 'center', gap: 16,
            }}>
                <span style={{ fontSize: 40 }}>⏳</span>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#f59e0b', marginBottom: 4 }}>Application Under Review</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>You applied to join the affiliate program. We'll notify you via WhatsApp / email within 24 hours.</div>
                </div>
            </div>
        )
        if (aff.status === 'rejected') return (
            <div style={{
                margin: '0 auto 24px', maxWidth: 700, padding: '20px 28px', borderRadius: 16,
                background: 'rgba(239,68,68,.1)', border: '2px solid rgba(239,68,68,.4)',
                display: 'flex', alignItems: 'center', gap: 16,
            }}>
                <span style={{ fontSize: 40 }}>❌</span>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#ef4444', marginBottom: 4 }}>Application Not Approved</div>
                    <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Your application was not approved at this time. Contact us on Instagram @cutpulse.ai for more details.</div>
                </div>
            </div>
        )
        return null
    }

    // ── APPROVED DASHBOARD ────────────────────────────────────────────────
    if (aff?.status === 'approved') return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px 60px' }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: '#22c55e18', border: '1px solid #22c55e44', marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#22c55e' }}>APPROVED AFFILIATE</span>
                </div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>Welcome back, {aff.name.split(' ')[0]}! 👋</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>@{aff.instagram} · Code: <strong style={{ color: '#6366f1' }}>{aff.code}</strong></p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24 }}>
                {[
                    { label: 'Total Referrals', value: aff.totalReferrals, icon: '👥', color: '#6366f1' },
                    { label: 'Total Sales', value: aff.totalSales, icon: '📈', color: '#22c55e' },
                    { label: 'Total Earned', value: `₹${aff.totalEarnings.toLocaleString('en-IN')}`, icon: '💰', color: '#f59e0b' },
                    { label: 'Ready to Withdraw', value: `₹${aff.pendingEarnings.toLocaleString('en-IN')}`, icon: '💸', color: '#8b5cf6' },
                ].map(s => (
                    <div key={s.label} style={{ padding: '20px 18px', borderRadius: 16, background: 'var(--bg-card)', border: `1px solid ${s.color}22` }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)' }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Referral link */}
            <div style={{ padding: 24, borderRadius: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>🔗 Your Referral Link</h3>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1, padding: '11px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', fontSize: 14, color: '#6366f1', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {link}
                    </div>
                    <button onClick={copyLink} style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: copied ? '#22c55e' : '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>Share this in your bio, stories, or reels. Every purchase = 20% commission to you.</p>
            </div>

            {/* Payout */}
            <div style={{ padding: 24, borderRadius: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>💸 Withdraw Earnings</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                    {aff.pendingEarnings >= 500
                        ? `You have ₹${aff.pendingEarnings.toLocaleString('en-IN')} ready to withdraw!`
                        : `Minimum withdrawal is ₹500. You currently have ₹${aff.pendingEarnings}.`}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input value={upi} onChange={e => setUpi(e.target.value)} placeholder="yourname@upi"
                        style={{ flex: 1, padding: '11px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, outline: 'none' }} />
                    <button onClick={handlePayout} disabled={payoutLoading || aff.pendingEarnings < 500}
                        style={{ padding: '11px 20px', borderRadius: 10, border: 'none', background: aff.pendingEarnings >= 500 ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--bg-pill)', color: '#fff', fontWeight: 800, fontSize: 13, cursor: aff.pendingEarnings >= 500 ? 'pointer' : 'not-allowed' }}>
                        {payoutLoading ? 'Processing…' : `Withdraw ₹${aff.pendingEarnings.toLocaleString('en-IN')}`}
                    </button>
                </div>
            </div>

            {/* Referral history */}
            <div style={{ padding: 24, borderRadius: 20, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>📊 Referral History</h3>
                {referrals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>No referrals yet. Share your link to start earning! 🚀</div>
                ) : referrals.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{r.referredUid.slice(0, 8)}…</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.status === 'purchased' ? `Purchased ₹${r.purchaseAmount}` : 'Signed up — no purchase yet'}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 14, fontWeight: 900, color: r.status === 'purchased' ? '#22c55e' : 'var(--text-muted)' }}>
                                {r.status === 'purchased' ? `+₹${r.commission}` : '—'}
                            </div>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700, background: r.status === 'purchased' ? '#22c55e18' : 'var(--bg-pill)', color: r.status === 'purchased' ? '#22c55e' : 'var(--text-muted)', border: `1px solid ${r.status === 'purchased' ? '#22c55e33' : 'var(--border)'}` }}>
                                {r.status === 'purchased' ? 'CONVERTED' : 'SIGNED UP'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    // ── PITCH + APPLY PAGE ────────────────────────────────────────────────
    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 60px' }}>

            {/* Status banner (pending / rejected) — shown at TOP, very prominent */}
            {renderStatusBanner()}

            {/* Hero */}
            {!aff && (
                <>
                    <div style={{ textAlign: 'center', marginBottom: 48 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: 'rgba(99,102,241,.1)', border: '1px solid rgba(99,102,241,.25)', marginBottom: 20 }}>
                            <Instagram size={14} color="#6366f1" />
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#6366f1' }}>For Instagram Influencers</span>
                        </div>
                        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, color: 'var(--text)', marginBottom: 16, lineHeight: 1.15 }}>
                            Earn 20% on Every Sale.<br />
                            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>No Limits.</span>
                        </h1>
                        <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 520, margin: '0 auto 32px' }}>
                            Promote CutPulse to your followers. Every plan they buy puts 20% straight into your UPI account.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
                            {[{ v: '20%', l: 'Per sale' }, { v: '₹170+', l: 'Min per referral' }, { v: '₹1,000', l: 'Max per referral' }, { v: 'UPI', l: 'Instant payout' }].map(s => (
                                <div key={s.l} style={{ padding: '14px 20px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'center' }}>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>{s.v}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.l}</div>
                                </div>
                            ))}
                        </div>

                        {/* Earnings calc */}
                        <div style={{ padding: 28, borderRadius: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 40, textAlign: 'left' }}>
                            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>💰 Earnings Calculator</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sales per month</span>
                                <span style={{ fontSize: 16, fontWeight: 900, color: '#6366f1' }}>{calcSales} sales</span>
                            </div>
                            <input type="range" min={1} max={100} value={calcSales} onChange={e => setCalcSales(+e.target.value)} style={{ width: '100%', accentColor: '#6366f1', marginBottom: 16 }} />
                            <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Monthly earnings estimate</span>
                                <span style={{ fontSize: 28, fontWeight: 900, color: '#6366f1' }}>₹{Math.floor(calcSales * 1699 * 0.20).toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Apply form */}
                    {!user ? (
                        <div style={{ textAlign: 'center', padding: '48px 32px', borderRadius: 24, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
                            <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>Sign in to Apply</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Use the Google account you'd like associated with your affiliate earnings.</p>
                            <button onClick={() => signIn()} style={{ padding: '13px 32px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.2H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.8z" /><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.4 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.6 16.3 44 24 44z" /><path fill="#1976D2" d="M43.6 20.2H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C41.5 36.6 44 30.8 44 24c0-1.3-.1-2.6-.4-3.8z" /></svg>
                                Sign In with Google
                            </button>
                        </div>
                    ) : (
                        <div style={{ padding: 32, borderRadius: 24, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                            <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 6 }}>Apply to Join</h2>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>Only selected Instagram influencers are accepted. We review within 24 hours.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {[{ label: 'Full Name', key: 'name', placeholder: 'Rahul Sharma' }, { label: 'Email', key: 'email', placeholder: 'you@email.com' }, { label: 'Instagram Handle', key: 'instagram', placeholder: 'techwithrohit (without @)' }, { label: 'Followers Count', key: 'followers', placeholder: '50000' }].map(f => (
                                    <div key={f.key}>
                                        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>{f.label}</label>
                                        <input value={form[f.key as keyof typeof form]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} placeholder={f.placeholder}
                                            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                                    </div>
                                ))}
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Content Niche</label>
                                    <select value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))} style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, outline: 'none' }}>
                                        {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>Why do you want to join? Tell us about your audience.</label>
                                    <textarea value={form.why} onChange={e => setForm(f => ({ ...f, why: e.target.value }))} rows={4} placeholder="My audience loves AI content creation and Reels..."
                                        style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                                </div>
                                <button onClick={handleApply} disabled={submitting} style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: submitting ? 'var(--bg-pill)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                    <Instagram size={18} />
                                    {submitting ? 'Submitting…' : 'Submit Application'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
