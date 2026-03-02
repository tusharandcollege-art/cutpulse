'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'
import { getAffiliate, requestPayout, AffiliateData } from '@/lib/affiliate'
import { useRouter } from 'next/navigation'
import { Copy, Check, TrendingUp, Users, DollarSign, Clock, ExternalLink } from 'lucide-react'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function AffiliateDashboard() {
    const { user } = useAuth()
    const { show: toast } = useToast()
    const router = useRouter()
    const [aff, setAff] = useState<AffiliateData | null>(null)
    const [referrals, setReferrals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [upi, setUpi] = useState('')
    const [payoutLoading, setPayoutLoading] = useState(false)

    const link = aff ? `https://cutpulse.com/?ref=${aff.code}` : ''

    useEffect(() => {
        if (!user) { router.push('/affiliate'); return }
        getAffiliate(user.uid).then(async data => {
            if (!data || data.status !== 'approved') { router.push('/affiliate'); return }
            setAff(data)
            setUpi(data.upiId || '')
            // Load referrals
            const q = query(collection(db, 'referrals'), where('affiliateUid', '==', user.uid), orderBy('createdAt', 'desc'))
            const snap = await getDocs(q)
            setReferrals(snap.docs.map(d => ({ ...d.data(), id: d.id })))
            setLoading(false)
        })
    }, [user, router])

    const copyLink = () => {
        navigator.clipboard.writeText(link)
        setCopied(true)
        toast('Link copied to clipboard!', 'success')
        setTimeout(() => setCopied(false), 2000)
    }

    const handlePayout = async () => {
        if (!aff || !user) return
        if (!upi.trim()) { toast('Enter your UPI ID first', 'error'); return }
        if (aff.pendingEarnings < 500) { toast('Minimum payout is ₹500', 'error'); return }
        setPayoutLoading(true)
        try {
            await requestPayout(user.uid, aff.pendingEarnings, upi)
            toast(`Payout of ₹${aff.pendingEarnings} requested! We'll send within 48h.`, 'success')
            setAff(a => a ? { ...a, pendingEarnings: 0 } : a)
        } catch { toast('Failed. Try again.', 'error') }
        finally { setPayoutLoading(false) }
    }

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ width: 32, height: 32, border: '3px solid var(--indigo)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
    )

    if (!aff) return null

    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 60px', maxWidth: 860, margin: '0 auto', width: '100%' }}>

            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>AFFILIATE — APPROVED</span>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>
                    Welcome back, {aff.name.split(' ')[0]}! 👋
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>@{aff.instagram} · {aff.niche}</p>
            </div>

            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 32 }}>
                {[
                    { label: 'Total Referrals', value: aff.totalReferrals, icon: Users, color: '#6366f1' },
                    { label: 'Total Sales', value: aff.totalSales, icon: TrendingUp, color: '#22c55e' },
                    { label: 'Total Earned', value: `₹${aff.totalEarnings.toLocaleString('en-IN')}`, icon: DollarSign, color: '#f59e0b' },
                    { label: 'Pending Payout', value: `₹${aff.pendingEarnings.toLocaleString('en-IN')}`, icon: Clock, color: '#8b5cf6' },
                ].map(s => (
                    <div key={s.label} style={{
                        padding: '20px 20px', borderRadius: 16,
                        background: 'var(--bg-card)', border: `1px solid ${s.color}22`,
                        boxShadow: `0 4px 20px ${s.color}11`,
                    }}>
                        <s.icon size={18} style={{ color: s.color, marginBottom: 10 }} />
                        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Referral link */}
            <div style={{ padding: 24, borderRadius: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>
                    🔗 Your Unique Referral Link
                </h3>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{
                        flex: 1, padding: '12px 16px', borderRadius: 10,
                        background: 'var(--bg-input)', border: '1px solid var(--border)',
                        fontSize: 14, color: 'var(--indigo)', fontWeight: 600,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {link}
                    </div>
                    <button onClick={copyLink} style={{
                        padding: '12px 18px', borderRadius: 10, border: 'none',
                        background: copied ? '#22c55e' : 'var(--indigo)',
                        color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10, lineHeight: 1.5 }}>
                    Share this in your Instagram bio, stories, or reels. Every purchase through it earns you 20% commission.
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                    {['📲 Story caption: "Use my link to create AI videos!"',
                        '🎥 Reel hook: "I found Seedance 2.0 alternative for India"'].map(tip => (
                            <div key={tip} style={{ fontSize: 11, color: 'var(--text-muted)', padding: '6px 10px', borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border)' }}>
                                {tip}
                            </div>
                        ))}
                </div>
            </div>

            {/* Payout section */}
            <div style={{ padding: 24, borderRadius: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>💸 Request Payout</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Minimum ₹500. Paid within 48 hours via UPI.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input value={upi} onChange={e => setUpi(e.target.value)} placeholder="yourname@upi"
                        style={{ flex: 1, padding: '11px 14px', borderRadius: 10, background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, outline: 'none' }} />
                    <button onClick={handlePayout} disabled={payoutLoading || aff.pendingEarnings < 500}
                        style={{
                            padding: '11px 20px', borderRadius: 10, border: 'none',
                            background: aff.pendingEarnings >= 500 ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'var(--bg-pill)',
                            color: '#fff', fontWeight: 800, fontSize: 13,
                            cursor: aff.pendingEarnings >= 500 ? 'pointer' : 'not-allowed',
                        }}>
                        {payoutLoading ? 'Sending…' : `Request ₹${aff.pendingEarnings.toLocaleString('en-IN')}`}
                    </button>
                </div>
            </div>

            {/* Referrals history */}
            <div style={{ padding: 24, borderRadius: 20, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>📊 Referral History</h3>
                {referrals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
                        No referrals yet. Share your link to get started! 🚀
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {referrals.map(r => (
                            <div key={r.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '14px 16px', borderRadius: 12,
                                background: 'var(--bg-hover)', border: '1px solid var(--border)',
                            }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                                        {r.referredUid.slice(0, 8)}…
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                        {r.status === 'purchased' ? `Purchased ₹${r.purchaseAmount}` : 'Signed up (no purchase yet)'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontSize: 14, fontWeight: 900,
                                        color: r.status === 'purchased' ? '#22c55e' : 'var(--text-muted)',
                                    }}>
                                        {r.status === 'purchased' ? `+₹${r.commission}` : '—'}
                                    </div>
                                    <div style={{
                                        fontSize: 10, padding: '2px 8px', borderRadius: 999, fontWeight: 700,
                                        background: r.status === 'purchased' ? '#22c55e18' : 'var(--bg-pill)',
                                        color: r.status === 'purchased' ? '#22c55e' : 'var(--text-muted)',
                                        border: `1px solid ${r.status === 'purchased' ? '#22c55e33' : 'var(--border)'}`,
                                    }}>
                                        {r.status === 'purchased' ? 'CONVERTED' : 'SIGNED UP'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
