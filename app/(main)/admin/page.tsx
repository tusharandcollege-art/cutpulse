'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'
import {
    getAllUsers, getAllAffiliates, getAllPayoutRequests, getAllPurchases,
    adminApproveAffiliate, adminRejectAffiliate, adminMarkPayoutPaid,
    AffiliateData,
} from '@/lib/affiliate'
import { Users, TrendingUp, DollarSign, Clock, CheckCircle, X, Instagram, RefreshCw, ShieldCheck } from 'lucide-react'

const ADMIN_EMAIL = 'likhitkatushar6@gmail.com'

type Tab = 'overview' | 'users' | 'affiliates' | 'payouts'

export default function AdminPage() {
    const { user } = useAuth()
    const { show: toast } = useToast()
    const [tab, setTab] = useState<Tab>('overview')
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const [users, setUsers] = useState<any[]>([])
    const [affiliates, setAffiliates] = useState<any[]>([])
    const [payouts, setPayouts] = useState<any[]>([])
    const [purchases, setPurchases] = useState<any[]>([])

    const load = useCallback(async () => {
        setRefreshing(true)
        const [u, a, p, pur] = await Promise.all([getAllUsers(), getAllAffiliates(), getAllPayoutRequests(), getAllPurchases()])
        setUsers(u)
        setAffiliates(a)
        setPayouts(p)
        setPurchases(pur)
        setLoading(false)
        setRefreshing(false)
    }, [])

    useEffect(() => { load() }, [load])

    if (!user) return <AccessDenied msg="Sign in to access admin." />
    if (user.email !== ADMIN_EMAIL) return <AccessDenied msg="You don't have admin access." />

    const totalRevenue = purchases.reduce((s: number, p: any) => s + (p.amount || 0), 0)
    const pendingAffiliates = affiliates.filter(a => a.status === 'pending').length
    const pendingPayouts = payouts.filter(p => p.status === 'pending').length

    const approve = async (uid: string) => {
        await adminApproveAffiliate(uid)
        setAffiliates(a => a.map(x => x.uid === uid ? { ...x, status: 'approved' } : x))
        toast('Affiliate approved!', 'success')
    }
    const reject = async (uid: string) => {
        await adminRejectAffiliate(uid)
        setAffiliates(a => a.map(x => x.uid === uid ? { ...x, status: 'rejected' } : x))
        toast('Affiliate rejected.', 'error')
    }
    const markPaid = async (id: string) => {
        await adminMarkPayoutPaid(id)
        setPayouts(p => p.map(x => x.id === id ? { ...x, status: 'paid' } : x))
        toast('Marked as paid!', 'success')
    }

    const tabs: { id: Tab; label: string; count?: number }[] = [
        { id: 'overview', label: '📊 Overview' },
        { id: 'users', label: '👥 Users', count: users.length },
        { id: 'affiliates', label: '🤝 Affiliates', count: pendingAffiliates || undefined },
        { id: 'payouts', label: '💸 Payouts', count: pendingPayouts || undefined },
    ]

    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 60px' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <ShieldCheck size={18} color="var(--indigo)" />
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--indigo)', letterSpacing: '0.1em' }}>ADMIN PANEL</span>
                        </div>
                        <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)' }}>CutPulse Dashboard</h1>
                    </div>
                    <button onClick={load} disabled={refreshing}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                        <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                        Refresh
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            style={{
                                padding: '8px 18px', borderRadius: 10, cursor: 'pointer',
                                fontWeight: 700, fontSize: 13,
                                background: tab === t.id ? 'var(--indigo)' : 'var(--bg-card)',
                                color: tab === t.id ? '#fff' : 'var(--text-muted)',
                                border: tab === t.id ? 'none' : '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                            {t.label}
                            {t.count != null && (
                                <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 999, fontWeight: 900 }}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading data…</div>
                ) : (
                    <>
                        {/* ── OVERVIEW ───────────────────────────── */}
                        {tab === 'overview' && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
                                    {[
                                        { label: 'Total Users', value: users.length, icon: Users, color: '#6366f1' },
                                        { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: '#22c55e' },
                                        { label: 'Active Affiliates', value: affiliates.filter(a => a.status === 'approved').length, icon: TrendingUp, color: '#f59e0b' },
                                        { label: 'Pending Payouts', value: pendingPayouts, icon: Clock, color: '#ef4444' },
                                    ].map(s => (
                                        <div key={s.label} style={{
                                            padding: '24px 20px', borderRadius: 20,
                                            background: 'var(--bg-card)', border: `1px solid ${s.color}22`,
                                        }}>
                                            <s.icon size={20} style={{ color: s.color, marginBottom: 12 }} />
                                            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)' }}>{s.value}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Recent purchases */}
                                <SectionCard title="🛒 Recent Purchases">
                                    {purchases.length === 0 && <Empty msg="No purchases yet." />}
                                    {purchases.slice(0, 10).map((p: any, i: number) => (
                                        <Row key={i}>
                                            <Cell primary={p.planName || '—'} sub={p.orderId?.slice(0, 16) + '…'} />
                                            <Cell primary={`₹${(p.amount || 0).toLocaleString('en-IN')}`} sub={tsToDate(p.createdAt)} right />
                                        </Row>
                                    ))}
                                </SectionCard>
                            </div>
                        )}

                        {/* ── USERS ──────────────────────────────── */}
                        {tab === 'users' && (
                            <SectionCard title={`👥 All Users (${users.length})`}>
                                {users.length === 0 && <Empty msg="No users yet." />}
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                                {['Name', 'Email', 'Phone', 'Points', 'Plan', 'Referred By'].map(h => (
                                                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: 11 }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((u: any, i: number) => (
                                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                    <td style={{ padding: '10px 12px', color: 'var(--text)', fontWeight: 600 }}>{u.name || '—'}</td>
                                                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.email || '—'}</td>
                                                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.phone || '—'}</td>
                                                    <td style={{ padding: '10px 12px', color: 'var(--indigo)', fontWeight: 700 }}>{(u.points || 0).toLocaleString()}</td>
                                                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{u.currentPlan || 'Free'}</td>
                                                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 11 }}>{u.referredBy ? u.referredBy.slice(0, 8) + '…' : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </SectionCard>
                        )}

                        {/* ── AFFILIATES ─────────────────────────── */}
                        {tab === 'affiliates' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {/* Pending */}
                                <SectionCard title={`⏳ Pending Applications (${affiliates.filter(a => a.status === 'pending').length})`}>
                                    {affiliates.filter(a => a.status === 'pending').length === 0 && <Empty msg="No pending applications." />}
                                    {affiliates.filter(a => a.status === 'pending').map((a: any) => (
                                        <AffiliateRow key={a.uid} a={a} onApprove={() => approve(a.uid)} onReject={() => reject(a.uid)} />
                                    ))}
                                </SectionCard>

                                {/* Approved */}
                                <SectionCard title={`✅ Approved Affiliates (${affiliates.filter(a => a.status === 'approved').length})`}>
                                    {affiliates.filter(a => a.status === 'approved').length === 0 && <Empty msg="No approved affiliates yet." />}
                                    {affiliates.filter(a => a.status === 'approved').map((a: any) => (
                                        <div key={a.uid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 12 }}>
                                            <div>
                                                <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>{a.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{a.instagram} · code: <span style={{ color: 'var(--indigo)', fontWeight: 700 }}>{a.code}</span></div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 24 }}>
                                                {[
                                                    { label: 'Referrals', v: a.totalReferrals },
                                                    { label: 'Sales', v: a.totalSales },
                                                    { label: 'Earned', v: `₹${a.totalEarnings}` },
                                                    { label: 'Pending', v: `₹${a.pendingEarnings}` },
                                                ].map(s => (
                                                    <div key={s.label} style={{ textAlign: 'center' }}>
                                                        <div style={{ fontWeight: 900, color: 'var(--text)', fontSize: 16 }}>{s.v}</div>
                                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </SectionCard>
                            </div>
                        )}

                        {/* ── PAYOUTS ────────────────────────────── */}
                        {tab === 'payouts' && (
                            <SectionCard title="💸 Payout Requests">
                                {payouts.length === 0 && <Empty msg="No payout requests yet." />}
                                {payouts.map((p: any) => (
                                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--border)', gap: 12, flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>₹{(p.amount || 0).toLocaleString('en-IN')}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>UPI: {p.upiId} · {tsToDate(p.createdAt)}</div>
                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Affiliate: {p.affiliateUid?.slice(0, 12)}…</div>
                                        </div>
                                        {p.status === 'pending' ? (
                                            <button onClick={() => markPaid(p.id)} style={{
                                                padding: '8px 20px', borderRadius: 10, border: 'none',
                                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                                color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                                            }}>
                                                Mark as Paid
                                            </button>
                                        ) : (
                                            <span style={{ color: '#22c55e', fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <CheckCircle size={16} /> Paid
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </SectionCard>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

// ── Small helper components ──────────────────────────────────────────

function AccessDenied({ msg }: { msg: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <ShieldCheck size={48} style={{ color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 16, fontWeight: 700 }}>{msg}</p>
        </div>
    )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ padding: 24, borderRadius: 20, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 18 }}>{title}</h3>
            {children}
        </div>
    )
}

function Row({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
            {children}
        </div>
    )
}

function Cell({ primary, sub, right }: { primary: string; sub?: string; right?: boolean }) {
    return (
        <div style={{ textAlign: right ? 'right' : 'left' }}>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13 }}>{primary}</div>
            {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
        </div>
    )
}

function AffiliateRow({ a, onApprove, onReject }: { a: any; onApprove: () => void; onReject: () => void }) {
    return (
        <div style={{ padding: '18px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                <div>
                    <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: 15 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{a.instagram} · {a.niche} · {a.followers} followers</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={onApprove} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={14} /> Approve
                    </button>
                    <button onClick={onReject} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-hover)', color: 'var(--text-muted)', fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <X size={14} /> Reject
                    </button>
                </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-hover)' }}>
                "{a.why}"
            </div>
        </div>
    )
}

function Empty({ msg }: { msg: string }) {
    return <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{msg}</div>
}

function tsToDate(ts: any) {
    if (!ts) return '—'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
