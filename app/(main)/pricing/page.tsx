'use client'

import { useState, useEffect } from 'react'
import { Check, Zap, Star, Crown, Building2, Gift, Ticket, X, Globe, IndianRupee } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'
import { purchasePlanCredit } from '@/lib/points'
import { load } from '@cashfreepayments/cashfree-js'
import { db } from '@/lib/firebase'
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { validatePromoCode, recordAffiliateCommission, AffiliateData } from '@/lib/affiliate'

type Billing = 'monthly' | 'yearly'
type Region = 'india' | 'international'

interface Plan {
    id: string
    name: string
    icon: React.ElementType
    color: string
    points: number
    badge?: string
    highlight?: boolean
    bestValue?: boolean
    features: string[]
    // INR prices for India / Cashfree UPI
    inrPrice: number
    inrYearlyPrice: number
    // USD prices for International / Dodo
    usdPrice: number
    usdYearlyPrice: number
    // Dodo product IDs created in Dodo dashboard per billing cycle
    dodoProductIdMonthly: string
    dodoProductIdYearly: string
}

const PLANS: Plan[] = [
    {
        id: 'starter', name: 'Starter', icon: Zap,
        usdPrice: 9.99, usdYearlyPrice: 6.99,
        inrPrice: 849, inrYearlyPrice: 599,
        dodoProductIdMonthly: 'pdt_0NZqGrePUG2orIMOEQZl6',
        dodoProductIdYearly: 'pdt_0NZqHNoidVKQLsCqMAzBo',
        points: 7500,
        color: '#6366f1',
        features: ['7,500 points/month', 'Seedance 2.0 Fast access', 'Text to Video', 'Image to Video', 'Basic support'],
    },
    {
        id: 'popular', name: 'Popular', icon: Star,
        usdPrice: 29.99, usdYearlyPrice: 19.99,
        inrPrice: 2549, inrYearlyPrice: 1699,
        dodoProductIdMonthly: 'pdt_0NZqHeq2S4WggUCc4Hhg2',
        dodoProductIdYearly: 'pdt_0NZqHmSWad7Jsxi97fIu4',
        points: 24000,
        badge: '🔥 Most Popular',
        highlight: true,
        color: '#6366f1',
        features: ['24,000 points/month', 'Seedance 2.0 + Fast access', 'Text, Image & Frame to Video', 'Omni Reference mode', 'Priority support', 'HD downloads'],
    },
    {
        id: 'pro', name: 'Pro', icon: Crown,
        usdPrice: 59.99, usdYearlyPrice: 39.99,
        inrPrice: 4999, inrYearlyPrice: 3399,
        dodoProductIdMonthly: 'pdt_0NZqHudgo4ZQUnSgFRPIw',
        dodoProductIdYearly: 'pdt_0NZqI3dVVV4LMW0d1YSBs',
        points: 45000,
        badge: '⚡ Best for Creators',
        highlight: true,
        color: '#8b5cf6',
        features: ['45,000 points/month', 'All models + early access', 'All generation modes', 'Omni Reference mode', 'Priority queue', 'Commercial license', 'Dedicated support'],
    },
    {
        id: 'enterprise', name: 'Enterprise', icon: Building2,
        usdPrice: 199, usdYearlyPrice: 139,
        inrPrice: 16900, inrYearlyPrice: 11800,
        dodoProductIdMonthly: 'pdt_0NZqILrVbcdFWchoOG4Kb',
        dodoProductIdYearly: 'pdt_0NZqISos112Pvq4i26ksw',
        points: 200000,
        bestValue: true,
        badge: '🏆 Best Value',
        color: '#14b8a6',
        features: ['200,000 points/month', 'All models unlimited', 'Custom SLA & uptime guarantee', 'Dedicated infrastructure', 'Dedicated account manager', 'White-label options', 'Custom integrations & webhooks', 'Invoice billing'],
    },
]

// ─── Plan Card ───────────────────────────────────────────────────────────────
function PlanCard({
    plan, billing, region, discount, onPurchase,
}: {
    plan: Plan; billing: Billing; region: Region; discount: boolean; onPurchase: (plan: Plan) => void
}) {
    const isHighlighted = plan.highlight || plan.bestValue
    const isIndia = region === 'india'

    const rawInr = billing === 'monthly' ? plan.inrPrice : plan.inrYearlyPrice
    const inrPrice = discount ? Math.floor(rawInr * 0.80) : rawInr
    const rawUsd = billing === 'monthly' ? plan.usdPrice : plan.usdYearlyPrice
    const usdPrice = discount ? +(rawUsd * 0.80).toFixed(2) : rawUsd

    return (
        <div
            className="relative flex flex-col rounded-2xl p-6 transition-all duration-300"
            style={{
                background: isHighlighted
                    ? `linear-gradient(160deg, rgba(${plan.highlight ? '99,102,241' : '20,184,166'},.1) 0%, var(--bg-card) 60%)`
                    : 'var(--bg-card)',
                border: isHighlighted ? `1.5px solid ${plan.color}44` : '1px solid var(--border)',
                boxShadow: isHighlighted ? `0 8px 32px ${plan.color}22` : 'var(--shadow-card)',
            }}
        >
            {plan.badge && (
                <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black whitespace-nowrap"
                    style={{ background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`, color: '#fff', boxShadow: `0 4px 14px ${plan.color}44` }}
                >
                    {plan.badge}
                </div>
            )}

            {/* Icon + Name */}
            <div className="flex items-center gap-3 mb-5 mt-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${plan.color}18`, border: `1px solid ${plan.color}30` }}>
                    <plan.icon size={18} style={{ color: plan.color }} />
                </div>
                <span className="text-base font-black" style={{ color: 'var(--text)' }}>{plan.name}</span>
            </div>

            {/* Price */}
            <div className="mb-1">
                {isIndia ? (
                    <div className="flex items-end gap-2">
                        {discount && (
                            <span className="text-xl font-bold line-through" style={{ color: 'var(--text-muted)' }}>
                                ₹{rawInr.toLocaleString('en-IN')}
                            </span>
                        )}
                        <span className="text-4xl font-black" style={{ color: discount ? '#22c55e' : 'var(--text)' }}>
                            ₹{inrPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm mb-1.5 font-semibold" style={{ color: 'var(--text-muted)' }}>/mo</span>
                    </div>
                ) : (
                    <div className="flex items-end gap-2">
                        {discount && (
                            <span className="text-xl font-bold line-through" style={{ color: 'var(--text-muted)' }}>
                                ${rawUsd}
                            </span>
                        )}
                        <span className="text-4xl font-black" style={{ color: discount ? '#22c55e' : 'var(--text)' }}>
                            ${usdPrice}
                        </span>
                        <span className="text-sm mb-1.5 font-semibold" style={{ color: 'var(--text-muted)' }}>/mo</span>
                    </div>
                )}

                {discount && (
                    <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[11px] font-black"
                        style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e33' }}>
                        🎉 20% OFF Applied
                    </div>
                )}

                {billing === 'yearly' ? (
                    <div className="flex items-center gap-2 mt-1">
                        {isIndia ? (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                billed ₹{(plan.inrYearlyPrice * 12).toLocaleString('en-IN')}/year
                            </span>
                        ) : (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                billed ${(plan.usdYearlyPrice * 12).toFixed(2)}/year
                            </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
                            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e33' }}>
                            Save {isIndia ? `₹${Math.round((plan.inrPrice - plan.inrYearlyPrice) * 12)}/yr` : `$${((plan.usdPrice - plan.usdYearlyPrice) * 12).toFixed(0)}/yr`}
                        </span>
                    </div>
                ) : (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>billed monthly</p>
                )}
            </div>

            <div className="flex items-center gap-2 my-4 py-3 rounded-xl px-3"
                style={{ background: `${plan.color}0e`, border: `1px solid ${plan.color}22` }}>
                <Zap size={14} style={{ color: plan.color }} />
                <span className="text-sm font-black" style={{ color: plan.color }}>
                    {plan.points.toLocaleString()} points
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/month</span>
            </div>

            {/* CTA */}
            <button
                className="w-full py-3 rounded-xl font-black text-sm transition-all duration-200 mb-5"
                style={isHighlighted
                    ? { background: `linear-gradient(135deg, ${plan.color}, ${plan.color}bb)`, color: '#fff', boxShadow: `0 4px 18px ${plan.color}44` }
                    : { background: 'var(--bg-hover)', color: 'var(--text)', border: '1px solid var(--border)' }
                }
                onClick={() => onPurchase(plan)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
                {plan.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
            </button>

            {/* Features */}
            <ul className="flex flex-col gap-2.5">
                {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-2)' }}>
                        <Check size={14} style={{ color: plan.color, flexShrink: 0, marginTop: 2 }} />
                        {f}
                    </li>
                ))}
            </ul>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PricingPage() {
    const [billing, setBilling] = useState<Billing>('yearly')
    const [region, setRegion] = useState<Region>('india')
    const [geoLoading, setGeoLoading] = useState(true)
    const { user, signIn } = useAuth()
    const { show: toast } = useToast()
    const [promoInput, setPromoInput] = useState('')
    const [promoAffiliate, setPromoAffiliate] = useState<AffiliateData | null>(null)
    const [promoError, setPromoError] = useState('')
    const [promoLoading, setPromoLoading] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
    const [userPhone, setUserPhone] = useState<string>('')
    const [dodoLoading, setDodoLoading] = useState(false)

    // Auto-detect region from IP address via /api/geo (Vercel geo headers)
    useEffect(() => {
        fetch('/api/geo')
            .then(r => r.json())
            .then(data => {
                setRegion(data.country === 'IN' ? 'india' : 'international')
            })
            .catch(() => setRegion('india')) // safe fallback
            .finally(() => setGeoLoading(false))
    }, [])

    // Handle Dodo redirect back after payment
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('dodo_success') === '1') {
            const pts = parseInt(params.get('points') || '0', 10)
            if (pts > 0 && user) {
                toast(`🎉 Payment successful! ${pts.toLocaleString()} points added to your account.`, 'success')
            } else if (pts > 0) {
                toast(`🎉 Payment successful! Points will be credited shortly.`, 'success')
            }
            window.history.replaceState({}, '', '/pricing')
        }
    }, [user])

    // Fetch user's real phone number saved during sign-up
    useEffect(() => {
        if (!user) return
        getDoc(doc(db, 'users', user.uid)).then(snap => {
            const phone = snap.data()?.phone ?? ''
            setUserPhone(phone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10))
        }).catch(() => { })
    }, [user])

    const handlePurchase = (plan: Plan) => {
        if (!user) {
            toast('Please sign in to continue', 'error')
            signIn()
            return
        }
        if (plan.id === 'enterprise') {
            toast('Sales team has been notified!', 'success')
            return
        }
        setSelectedPlan(plan)
    }

    // ── Cashfree (UPI / INR) checkout ────────────────────────────────────────
    const processCashfreeCheckout = async (plan: Plan) => {
        setSelectedPlan(null)
        toast(`Initiating UPI checkout for ${plan.name}...`, 'success')

        const inrAmount = billing === 'monthly' ? plan.inrPrice : plan.inrYearlyPrice * 12
        const finalAmount = promoAffiliate ? Math.floor(inrAmount * 0.80) : inrAmount

        try {
            const res = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan.id,
                    planName: plan.name,
                    price: finalAmount,
                    currency: 'INR',
                    points: plan.points,
                    customer_id: user?.uid || 'anonymous',
                    customer_name: user?.displayName || 'User',
                    customer_email: user?.email || 'no-email@cutpulse.com',
                    customer_phone: userPhone || '9999999999',
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create payment session')

            const cashfree = await load({
                mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox',
            })

            cashfree.checkout({
                paymentSessionId: data.payment_session_id,
                redirectTarget: '_modal',
            } as any).then(async (result: any) => {
                if (result.error) {
                    toast(result.error.message || 'Payment failed or cancelled', 'error')
                } else if (result.paymentDetails) {
                    toast('Verifying payment...', 'success')

                    const verifyRes = await fetch('/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order_id: data.order_id })
                    })
                    const verifyData = await verifyRes.json()

                    if (verifyRes.ok && verifyData.success) {
                        await purchasePlanCredit(user?.uid || 'anonymous', plan.name, plan.points)
                        toast(`Payment Successful! 🎉 ${plan.points.toLocaleString()} pts added.`, 'success')

                        await addDoc(collection(db, 'purchases'), {
                            uid: user?.uid,
                            planName: plan.name,
                            amount: finalAmount,
                            currency: 'INR',
                            gateway: 'cashfree',
                            orderId: data.order_id,
                            billing,
                            promoCode: promoAffiliate?.promoCode ?? null,
                            createdAt: serverTimestamp(),
                        }).catch(() => { })

                        if (promoAffiliate && user?.uid) {
                            try { await recordAffiliateCommission(promoAffiliate.uid, user.uid, inrAmount) } catch { }
                        }

                        if (typeof window !== 'undefined' && (window as any).gtag) {
                            ; (window as any).gtag('event', 'conversion', {
                                send_to: 'AW-17985390147/9usaCJPEkIEcEMOMjYBD',
                                value: finalAmount,
                                currency: 'INR',
                                transaction_id: data.order_id,
                            })
                        }
                    } else {
                        toast(verifyData.message || 'Verification failed. Contact support.', 'error')
                    }
                }
            })
        } catch (error: any) {
            toast(error.message || 'Could not start checkout process', 'error')
        }
    }

    // ── Dodo (Card / International / USD) checkout ───────────────────────────
    const processDodoCheckout = async (plan: Plan) => {
        setSelectedPlan(null)
        setDodoLoading(true)
        toast(`Initiating international checkout for ${plan.name}...`, 'success')

        const productId = billing === 'monthly' ? plan.dodoProductIdMonthly : plan.dodoProductIdYearly
        const usdAmount = billing === 'monthly' ? plan.usdPrice : plan.usdYearlyPrice

        try {
            const res = await fetch('/api/payment/dodo-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan.id,
                    planName: plan.name,
                    productId,
                    price: usdAmount,
                    points: plan.points,
                    customer_id: user?.uid || 'anonymous',
                    customer_email: user?.email || 'no-email@cutpulse.com',
                    customer_name: user?.displayName || 'User',
                    billing,
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create Dodo checkout session')

            if (data.checkout_url) {
                // Redirect to Dodo hosted checkout
                window.location.href = data.checkout_url
            } else {
                throw new Error('No checkout URL received from Dodo')
            }
        } catch (error: any) {
            toast(error.message || 'Could not start international checkout', 'error')
        } finally {
            setDodoLoading(false)
        }
    }

    const [giftInput, setGiftInput] = useState('')
    const [giftLoading, setGiftLoading] = useState(false)
    const [giftError, setGiftError] = useState('')
    const [giftSuccess, setGiftSuccess] = useState<number | null>(null)

    const handleApplyGift = async () => {
        if (!giftInput.trim()) return
        if (!user) { toast('Please sign in first.', 'error'); return }
        setGiftError(''); setGiftLoading(true); setGiftSuccess(null)
        try {
            const idToken = await user.getIdToken()
            const res = await fetch('/api/gift/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ code: giftInput.trim() }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Invalid code')
            setGiftSuccess(data.pointsAdded)
            setGiftInput('')
            toast(`🎁 +${data.pointsAdded} points added to your account!`, 'success')
        } catch (e: any) {
            setGiftError(e.message || 'Invalid or already-used code.')
        } finally {
            setGiftLoading(false)
        }
    }

    const handleApplyPromo = async () => {
        if (!promoInput.trim()) return
        setPromoError('')
        setPromoLoading(true)
        try {
            const aff = await validatePromoCode(promoInput)
            if (aff) {
                setPromoAffiliate(aff)
                toast(`✅ Promo code applied! 20% off on all plans.`, 'success')
            } else {
                setPromoAffiliate(null)
                setPromoError('Invalid or expired promo code.')
            }
        } catch {
            setPromoError('Could not verify code. Try again.')
        } finally {
            setPromoLoading(false)
        }
    }

    const isIndia = region === 'india'

    return (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '32px 24px 40px', position: 'relative' }}>

            {/* ── Payment Method Modal ──────────────────────────────────────── */}
            {selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-sm rounded-2xl p-6 relative transition-all"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                        <button onClick={() => setSelectedPlan(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-black mb-1" style={{ color: 'var(--text)' }}>Choose Payment Method</h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                            Secure checkout for the <strong style={{ color: 'var(--text)' }}>{selectedPlan.name}</strong> plan.
                        </p>

                        <div className="flex flex-col gap-3">
                            {/* Dodo – International / Card / USD */}
                            <button
                                onClick={() => processDodoCheckout(selectedPlan)}
                                disabled={dodoLoading}
                                className="w-full relative flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200"
                                style={{ borderColor: 'var(--border)', background: 'var(--bg-input)' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = 'rgba(99,102,241,0.07)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-input)' }}
                            >
                                <div>
                                    <div className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                                        <Globe size={14} style={{ color: '#6366f1' }} />
                                        International Cards
                                        <span className="text-[9px] px-1.5 py-0.5 rounded font-black whitespace-nowrap"
                                            style={{ background: '#6366f118', border: '1px solid #6366f144', color: '#6366f1' }}>
                                            VISA / MC / AMEX
                                        </span>
                                    </div>
                                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        Powered by Dodo Payments · No forex fees
                                    </div>
                                </div>
                                <div className="font-black text-lg" style={{ color: 'var(--text)' }}>
                                    ${billing === 'monthly'
                                        ? selectedPlan.usdPrice
                                        : (selectedPlan.usdYearlyPrice * 12).toFixed(2)
                                    }{billing === 'yearly' ? '/yr' : '/mo'}
                                </div>
                            </button>

                            {/* Cashfree – UPI / INR */}
                            <button
                                onClick={() => processCashfreeCheckout(selectedPlan)}
                                className="w-full relative flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200"
                                style={{ borderColor: 'var(--border)', background: 'var(--bg-input)' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#14b8a6'; e.currentTarget.style.background = 'rgba(20,184,166,0.05)' }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-input)' }}
                            >
                                <div>
                                    <div className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                                        <IndianRupee size={14} style={{ color: '#14b8a6' }} />
                                        Pay via UPI (India)
                                        <span className="text-[9px] px-1.5 py-0.5 rounded font-black whitespace-nowrap"
                                            style={{ background: '#14b8a618', border: '1px solid #14b8a644', color: '#14b8a6' }}>
                                            POPULAR
                                        </span>
                                    </div>
                                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        UPI / Net Banking / Debit Cards — Zero forex fees
                                    </div>
                                </div>
                                <div className="font-black text-lg" style={{ color: 'var(--text)' }}>
                                    ₹{(billing === 'monthly' ? selectedPlan.inrPrice : selectedPlan.inrYearlyPrice * 12).toLocaleString('en-IN')}
                                </div>
                            </button>
                        </div>

                        <p className="text-center text-[10px] mt-4" style={{ color: 'var(--text-muted)' }}>
                            🔒 256-bit SSL encrypted · Payments processed securely
                        </p>
                    </div>
                </div>
            )}

            {/* Pointer glow */}
            <div className="pointer-events-none fixed inset-0" style={{ zIndex: 0 }}>
                <div className="absolute top-[-5%] left-[30%] w-[500px] h-[350px] rounded-full opacity-[0.06]"
                    style={{ background: 'radial-gradient(ellipse, #6366f1, transparent 70%)', filter: 'blur(80px)' }} />
                <div className="absolute bottom-[-5%] right-[20%] w-[400px] h-[300px] rounded-full opacity-[0.05]"
                    style={{ background: 'radial-gradient(ellipse, #14b8a6, transparent 70%)', filter: 'blur(80px)' }} />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10 animate-fadeIn">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 text-xs font-bold"
                        style={{ background: 'var(--indigo-light)', border: '1px solid rgba(99,102,241,.22)', color: '#a5b4fc' }}>
                        <Star size={11} /> Simple, Transparent Pricing
                    </div>
                    <h1 className="font-black tracking-tight mb-3" style={{ fontSize: 'clamp(28px, 4vw, 46px)', color: 'var(--text)' }}>
                        Create more.{' '}
                        <span style={{ background: 'linear-gradient(135deg, #a5b4fc, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Pay less.
                        </span>
                    </h1>
                    <p className="text-base" style={{ color: 'var(--text-muted)' }}>
                        Choose a plan that fits your creative workflow. Cancel anytime.
                    </p>
                </div>

                {/* ── Auto-detected Region Badge ── */}
                <div className="flex justify-center mb-6">
                    {geoLoading ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold animate-pulse"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                            Detecting your location...
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
                            style={{
                                background: isIndia ? '#14b8a610' : '#6366f110',
                                border: `1px solid ${isIndia ? '#14b8a633' : '#6366f133'}`,
                                color: isIndia ? '#14b8a6' : '#a5b4fc'
                            }}>
                            {isIndia
                                ? '🇮🇳 Showing prices in ₹ INR for India'
                                : '🌍 Showing prices in $ USD for your region'}
                        </div>
                    )}
                </div>

                {/* Billing toggle */}
                <div className="flex justify-center mb-10">
                    <div className="flex items-center rounded-xl p-1 gap-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        {(['monthly', 'yearly'] as Billing[]).map(b => (
                            <button
                                key={b}
                                onClick={() => setBilling(b)}
                                className="px-5 py-2 rounded-lg text-sm font-black transition-all duration-200 flex items-center gap-2"
                                style={billing === b
                                    ? { background: 'var(--indigo)', color: '#fff', boxShadow: `0 4px 12px var(--indigo-glow)` }
                                    : { color: 'var(--text-muted)', background: 'transparent' }
                                }
                            >
                                {b === 'monthly' ? 'Monthly' : 'Yearly'}
                                {b === 'yearly' && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black"
                                        style={{
                                            background: billing === 'yearly' ? 'rgba(255,255,255,.25)' : '#22c55e18',
                                            color: billing === 'yearly' ? '#fff' : '#22c55e',
                                        }}>
                                        Up to 40% off
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment method info strip */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
                        style={{ background: isIndia ? '#14b8a610' : '#6366f110', border: `1px solid ${isIndia ? '#14b8a633' : '#6366f133'}`, color: isIndia ? '#14b8a6' : '#a5b4fc' }}>
                        {isIndia
                            ? '🔒 UPI · Net Banking · Cards — powered by Cashfree'
                            : '🔒 Visa · Mastercard · Amex — powered by Dodo Payments'}
                    </div>
                </div>

                {/* Plan cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
                    {PLANS.map(plan => (
                        <PlanCard key={plan.id} plan={plan} billing={billing} region={region} discount={!!promoAffiliate} onPurchase={handlePurchase} />
                    ))}
                </div>

                {/* Promo Code section */}
                <div className="mt-8 mx-auto max-w-sm">
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
                            <Gift size={14} style={{ color: 'var(--indigo)' }} />
                            Have an Influencer Promo Code?
                        </div>

                        {promoAffiliate ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#22c55e10', border: '1px solid #22c55e33' }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#22c55e' }}>🎉 20% OFF Applied!</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Code by @{promoAffiliate.instagram}</div>
                                </div>
                                <button onClick={() => { setPromoAffiliate(null); setPromoInput(''); setPromoError('') }}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input value={promoInput} onChange={e => setPromoInput(e.target.value.toUpperCase())}
                                        onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                                        placeholder="e.g. ROHIT20"
                                        style={{ flex: 1, background: 'var(--bg-input)', border: `1px solid ${promoError ? '#ef4444' : 'var(--border)'}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', outline: 'none', color: 'var(--text)' }} />
                                    <button onClick={handleApplyPromo} disabled={!promoInput.trim() || promoLoading}
                                        style={{ background: promoInput.trim() ? 'var(--indigo)' : 'var(--bg-input)', color: promoInput.trim() ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 10, padding: '0 16px', fontWeight: 800, fontSize: 12, cursor: promoInput.trim() ? 'pointer' : 'not-allowed' }}>
                                        {promoLoading ? '...' : 'Apply'}
                                    </button>
                                </div>
                                {promoError && <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>{promoError}</div>}
                            </>
                        )}
                    </div>
                </div>

                {/* Gift Code section */}
                <div className="mt-4 mx-auto max-w-sm">
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
                            <Ticket size={14} style={{ color: '#f59e0b' }} />
                            Have a Gift Code?
                        </div>

                        {giftSuccess !== null ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#f59e0b10', border: '1px solid #f59e0b33' }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b' }}>🎁 +{giftSuccess} points added!</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Points credited to your account.</div>
                                </div>
                                <button onClick={() => setGiftSuccess(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>×</button>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                        value={giftInput}
                                        onChange={e => { setGiftInput(e.target.value.toUpperCase()); setGiftError('') }}
                                        onKeyDown={e => e.key === 'Enter' && handleApplyGift()}
                                        placeholder="e.g. CUTPULSE2000"
                                        style={{ flex: 1, background: 'var(--bg-input)', border: `1px solid ${giftError ? '#ef4444' : 'var(--border)'}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', outline: 'none', color: 'var(--text)' }}
                                    />
                                    <button
                                        onClick={handleApplyGift}
                                        disabled={!giftInput.trim() || giftLoading}
                                        style={{ background: giftInput.trim() ? '#f59e0b' : 'var(--bg-input)', color: giftInput.trim() ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 10, padding: '0 16px', fontWeight: 800, fontSize: 12, cursor: giftInput.trim() ? 'pointer' : 'not-allowed' }}
                                    >
                                        {giftLoading ? '...' : 'Redeem'}
                                    </button>
                                </div>
                                {giftError && <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>{giftError}</div>}
                            </>
                        )}
                    </div>
                </div>

                {/* How points work */}
                <div className="mt-12 rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <h3 className="font-black text-base mb-1" style={{ color: 'var(--text)' }}>How points work</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Points are consumed per second of video generated. You always see exact costs before you generate.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Pro Fast (no video ref)', rate: 100, example: '5s = 500 pts' },
                            { label: 'Pro Fast (with video ref)', rate: 200, example: '5s = 1,000 pts' },
                            { label: 'Standard (no video ref)', rate: 200, example: '5s = 1,000 pts' },
                            { label: 'Standard (with video ref)', rate: 400, example: '5s = 2,000 pts' },
                        ].map((r, i) => (
                            <div key={i} className="px-4 py-3 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                                <div className="text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>{r.label}</div>
                                <div className="text-[10px] mb-0.5" style={{ color: 'var(--text-muted)' }}>{r.rate} points/second</div>
                                <div className="text-[11px] font-black" style={{ color: 'var(--teal)' }}>{r.example}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FAQ row */}
                <div className="mt-8 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Questions? Email us at{' '}
                        <a href="mailto:support@cutpulse.com" style={{ color: 'var(--indigo)' }}>support@cutpulse.com</a>
                        {' '}· Unused points do not roll over ·{' '}
                        {isIndia ? 'Prices in ₹ INR for Indian customers' : 'Prices in $ USD for international customers'}
                    </p>
                </div>
            </div>
        </div>
    )
}
