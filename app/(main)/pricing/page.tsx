'use client'

import { useState } from 'react'
import { Check, Zap, Star, Crown, Building2, Gift, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'
import { applyPromoOrReferralCode, purchasePlanCredit } from '@/lib/points'
import { load } from '@cashfreepayments/cashfree-js'

type Billing = 'monthly' | 'yearly'

interface Plan {
    id: string
    name: string
    icon: React.ElementType
    monthlyPrice: number
    yearlyPrice: number
    points: number
    save?: number
    badge?: string
    highlight?: boolean
    bestValue?: boolean
    color: string
    features: string[]
}

const PLANS: Plan[] = [
    {
        id: 'starter', name: 'Starter', icon: Zap,
        monthlyPrice: 9.99, yearlyPrice: 6.99,
        points: 7500, save: 36,
        color: '#6366f1',
        features: ['7,500 points/month', 'Seedance 2.0 Fast access', 'Text to Video', 'Image to Video', 'Basic support'],
    },
    {
        id: 'popular', name: 'Popular', icon: Star,
        monthlyPrice: 29.99, yearlyPrice: 19.99,
        points: 24000, save: 120,
        badge: '🔥 Most Popular',
        highlight: true,
        color: '#6366f1',
        features: ['24,000 points/month', 'Seedance 2.0 + Fast access', 'Text, Image & Frame to Video', 'Omni Reference mode', 'Priority support', 'HD downloads'],
    },
    {
        id: 'pro', name: 'Pro', icon: Crown,
        monthlyPrice: 59.99, yearlyPrice: 39.99,
        points: 45000, save: 240,
        badge: '⚡ Best for Creators',
        highlight: true,
        color: '#8b5cf6',
        features: ['45,000 points/month', 'All models + early access', 'All generation modes', 'Omni Reference mode', 'Priority queue', 'Commercial license', 'Dedicated support'],
    },
    {
        id: 'enterprise', name: 'Enterprise', icon: Building2,
        monthlyPrice: 199, yearlyPrice: 139,
        points: 200000, save: 720,
        bestValue: true,
        badge: '🏆 Best Value',
        color: '#14b8a6',
        features: ['200,000 points/month', 'All models unlimited', 'Custom SLA & uptime guarantee', 'Dedicated infrastructure', 'Dedicated account manager', 'White-label options', 'Custom integrations & webhooks', 'Invoice billing'],
    },
]

function PlanCard({ plan, billing, onPurchase }: { plan: Plan; billing: Billing; onPurchase: (plan: Plan) => void }) {
    const price = billing === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
    const yearlyTotal = (plan.yearlyPrice * 12).toFixed(2)
    const isHighlighted = plan.highlight || plan.bestValue

    return (
        <div
            className="relative flex flex-col rounded-2xl p-6 transition-all duration-300"
            style={{
                background: isHighlighted ? `linear-gradient(160deg, rgba(${plan.highlight ? '99,102,241' : '20,184,166'},.1) 0%, var(--bg-card) 60%)` : 'var(--bg-card)',
                border: isHighlighted ? `1.5px solid ${plan.color}44` : '1px solid var(--border)',
                boxShadow: isHighlighted ? `0 8px 32px ${plan.color}22` : 'var(--shadow-card)',
            }}
        >
            {/* Top badge */}
            {plan.badge && (
                <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-black whitespace-nowrap"
                    style={{
                        background: `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                        color: '#fff',
                        boxShadow: `0 4px 14px ${plan.color}44`,
                    }}
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
                <div className="flex items-end gap-1">
                    <span className="text-4xl font-black" style={{ color: 'var(--text)' }}>
                        ${price}
                    </span>
                    <span className="text-sm mb-1.5 font-semibold" style={{ color: 'var(--text-muted)' }}>/mo</span>
                </div>
                {billing === 'yearly' ? (
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>billed ${yearlyTotal}/year</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
                            style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e33' }}>
                            Save ${plan.save}/yr
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

export default function PricingPage() {
    const [billing, setBilling] = useState<Billing>('yearly')
    const { user, signIn } = useAuth()
    const { show: toast } = useToast()
    const [promo, setPromo] = useState('')
    const [promoStatus, setPromoStatus] = useState<{ msg: string, type: 'success' | 'error' } | null>(null)

    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

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

    const processCheckout = async (plan: Plan, currency: 'USD' | 'INR', amount: number) => {
        setSelectedPlan(null)
        toast(`Initiating secure checkout for ${plan.name}...`, 'success')

        try {
            // 1. Create order on our backend
            const res = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan.id,
                    planName: plan.name,
                    price: amount,
                    currency: currency,
                    points: plan.points,
                    customer_id: user?.uid || 'anonymous',
                    customer_name: user?.displayName || 'User',
                    customer_email: user?.email || 'no-email@example.com'
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create payment session')

            // 2. Load SDK
            const cashfree = await load({
                mode: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT === 'PRODUCTION' ? 'production' : 'sandbox',
            })

            // 3. Open embedded checkout
            const checkoutOptions = {
                paymentSessionId: data.payment_session_id,
                redirectTarget: "_modal",
            }

            cashfree.checkout(checkoutOptions as any).then(async (result: any) => {
                if (result.error) {
                    toast(result.error.message || 'Payment failed or cancelled', 'error')
                } else if (result.paymentDetails) {
                    toast('Verifying payment...', 'success')

                    // 4. Verify payment with our server
                    const verifyRes = await fetch('/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ order_id: data.order_id })
                    })
                    const verifyData = await verifyRes.json()

                    if (verifyRes.ok && verifyData.success) {
                        // 5. Grant Points
                        await purchasePlanCredit(user?.uid || 'anonymous', plan.name, plan.points)
                        toast(`Payment Successful! 🎉 ${plan.points.toLocaleString()} pts added.`, 'success')
                    } else {
                        toast(verifyData.message || 'Verification failed. Contact support.', 'error')
                    }
                }
            })
        } catch (error: any) {
            toast(error.message || 'Could not start checkout process', 'error')
        }
    }

    const handlePromo = async () => {
        if (!user) { signIn(); return }
        if (!promo.trim()) return
        const res = await applyPromoOrReferralCode(user.uid, promo)
        setPromoStatus({ msg: res.message, type: res.success ? 'success' : 'error' })
        if (res.success) setPromo('')
        setTimeout(() => setPromoStatus(null), 4000)
    }

    return (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '32px 24px 40px', position: 'relative' }}>

            {/* Payment Method Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="w-full max-w-sm rounded-2xl p-6 relative transition-all" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                        <button onClick={() => setSelectedPlan(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-black mb-1" style={{ color: 'var(--text)' }}>Choose Method</h2>
                        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Checkout securely for the {selectedPlan.name} plan.</p>

                        <div className="flex flex-col gap-3">
                            <button
                                disabled
                                className="w-full relative flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 group opacity-50 cursor-not-allowed" style={{ borderColor: 'var(--border)', background: 'var(--bg-input)' }}
                            >
                                <div>
                                    <div className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                                        Global Checkout
                                        <span className="text-[9px] px-1.5 py-0.5 rounded font-black whitespace-nowrap" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>COMING SOON</span>
                                    </div>
                                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Cards & PayPal</div>
                                </div>
                                <div className="font-black text-sm" style={{ color: 'var(--text-muted)' }}>Not Available</div>
                            </button>

                            <button
                                onClick={() => processCheckout(selectedPlan, 'INR', Math.ceil((billing === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice) * 85))}
                                className="w-full relative flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 group" style={{ borderColor: 'var(--border)', background: 'var(--bg-input)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#14b8a6'; e.currentTarget.style.background = 'rgba(20,184,166,0.05)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-input)' }}
                            >
                                <div>
                                    <div className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                                        Pay via UPI (India)
                                        <span className="text-[9px] px-1.5 py-0.5 rounded font-black whitespace-nowrap" style={{ background: '#14b8a618', border: '1px solid #14b8a644', color: '#14b8a6' }}>POPULAR</span>
                                    </div>
                                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Zero forex fees</div>
                                </div>
                                <div className="font-black text-lg" style={{ color: 'var(--text)' }}>₹{Math.ceil((billing === 'monthly' ? selectedPlan.monthlyPrice : selectedPlan.yearlyPrice) * 85).toLocaleString()}</div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Pointer glow ─────────────────────────────────── */}
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

                {/* Toggle */}
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

                {/* Plan cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
                    {PLANS.map(plan => (
                        <PlanCard key={plan.id} plan={plan} billing={billing} onPurchase={handlePurchase} />
                    ))}
                </div>

                {/* Promo Code section */}
                <div className="mt-8 mx-auto max-w-sm">
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
                                <Gift size={14} style={{ color: 'var(--indigo)' }} />
                                Have a Promo or Referral Code?
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginLeft: 22 }}>
                                New users get 100 bonus pts. Referrers get a 15% points match on plan purchases!
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input value={promo} onChange={e => setPromo(e.target.value.toUpperCase())}
                                placeholder="Enter code"
                                style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: 13, textTransform: 'uppercase', outline: 'none', color: 'var(--text)' }} />
                            <button onClick={handlePromo} disabled={!promo.trim()} style={{
                                background: promo.trim() ? 'var(--indigo)' : 'var(--bg-input)', color: promo.trim() ? '#fff' : 'var(--text-muted)',
                                border: 'none', borderRadius: 10, padding: '0 16px', fontWeight: 800, fontSize: 12, cursor: promo.trim() ? 'pointer' : 'not-allowed', transition: 'all .2s'
                            }}>
                                Apply
                            </button>
                        </div>
                        {promoStatus && (
                            <div style={{ fontSize: 11, fontWeight: 700, color: promoStatus.type === 'success' ? '#22c55e' : '#ef4444' }}>
                                {promoStatus.msg}
                            </div>
                        )}
                    </div>
                </div>

                {/* Point calculator */}
                <div className="mt-12 rounded-2xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <h3 className="font-black text-base mb-1" style={{ color: 'var(--text)' }}>How points work</h3>
                    <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Points are consumed per second of video generated. You always see exact costs before you generate.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Fast (no video ref)', rate: 100, example: '5s = 500 pts' },
                            { label: 'Fast (with video ref)', rate: 200, example: '5s = 1,000 pts' },
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
                        {' '}· Unused points do not roll over · All prices in USD
                    </p>
                </div>
            </div>
        </div>
    )
}
