import { db } from '@/lib/firebase'
import {
    doc, getDoc, setDoc, updateDoc, addDoc,
    collection, query, where, getDocs, orderBy,
    serverTimestamp, increment, limit,
} from 'firebase/firestore'

export interface AffiliateData {
    uid: string
    name: string
    email: string
    instagram: string
    followers: string
    niche: string
    why: string
    code: string          // lowercase handle (internal)
    promoCode: string     // e.g. "ROHIT20" (user-facing, unique)
    status: 'pending' | 'approved' | 'rejected'
    upiId?: string
    totalEarnings: number
    pendingEarnings: number
    totalSales: number
    totalReferrals: number
    createdAt: any
}

/** Generate a unique promo code like ROHIT20, TECHWITHROHIT20, etc. */
async function generateUniquePromoCode(instagram: string): Promise<string> {
    const base = instagram.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12) + '20'

    // Check if base code is already taken
    const existing = await getDocs(
        query(collection(db, 'affiliates'), where('promoCode', '==', base))
    )
    if (existing.empty) return base

    // If taken, append random 3 digits until unique
    for (let i = 0; i < 10; i++) {
        const suffix = Math.floor(100 + Math.random() * 900).toString()
        const candidate = instagram.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) + suffix
        const check = await getDocs(
            query(collection(db, 'affiliates'), where('promoCode', '==', candidate))
        )
        if (check.empty) return candidate
    }

    // Fallback: uuid-style suffix
    return base + Date.now().toString().slice(-4)
}

/** Submit affiliate application */
export async function applyForAffiliate(uid: string, data: {
    name: string; email: string; instagram: string; followers: string; niche: string; why: string
}) {
    const code = data.instagram.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
    const promoCode = await generateUniquePromoCode(data.instagram)

    await setDoc(doc(db, 'affiliates', uid), {
        uid, ...data, code, promoCode,
        status: 'pending',
        totalEarnings: 0, pendingEarnings: 0,
        totalSales: 0, totalReferrals: 0,
        createdAt: serverTimestamp(),
    })
    return { code, promoCode }
}

/** Validate a promo code entered at checkout — returns affiliate if valid & approved */
export async function validatePromoCode(input: string): Promise<AffiliateData | null> {
    const normalized = input.trim().toUpperCase().replace(/\s+/g, '')
    if (!normalized) return null

    const snap = await getDocs(
        query(
            collection(db, 'affiliates'),
            where('promoCode', '==', normalized),
            where('status', '==', 'approved')
        )
    )
    return snap.empty ? null : snap.docs[0].data() as AffiliateData
}

/** Get affiliate by UID */
export async function getAffiliate(uid: string): Promise<AffiliateData | null> {
    const snap = await getDoc(doc(db, 'affiliates', uid))
    return snap.exists() ? snap.data() as AffiliateData : null
}

/** Record commission when promo code was used at checkout */
export async function recordAffiliateCommission(affiliateUid: string, referredUid: string, amountINR: number) {
    const commission = Math.floor(amountINR * 0.20)
    await updateDoc(doc(db, 'affiliates', affiliateUid), {
        totalEarnings: increment(commission),
        pendingEarnings: increment(commission),
        totalSales: increment(1),
    })
    // Log the sale for admin visibility
    await addDoc(collection(db, 'affiliateSales'), {
        affiliateUid, referredUid,
        amount: amountINR, commission,
        createdAt: serverTimestamp(),
    })
    return commission
}

/** Affiliate requests UPI payout */
export async function requestPayout(affiliateUid: string, amount: number, upiId: string) {
    await addDoc(collection(db, 'payoutRequests'), {
        affiliateUid, amount, upiId, status: 'pending', createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'affiliates', affiliateUid), { pendingEarnings: 0, upiId })
}

// ── Admin helpers ──────────────────────────────────────────────────

export const adminApproveAffiliate = (uid: string) =>
    updateDoc(doc(db, 'affiliates', uid), { status: 'approved' })

export const adminRejectAffiliate = (uid: string) =>
    updateDoc(doc(db, 'affiliates', uid), { status: 'rejected' })

export const adminMarkPayoutPaid = (id: string) =>
    updateDoc(doc(db, 'payoutRequests', id), { status: 'paid', paidAt: serverTimestamp() })

export async function getAllAffiliates() {
    const snap = await getDocs(query(collection(db, 'affiliates'), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ ...d.data(), id: d.id })) as (AffiliateData & { id: string })[]
}

export async function getAllPayoutRequests() {
    const snap = await getDocs(query(collection(db, 'payoutRequests'), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

export async function getAllUsers(cap = 200) {
    const snap = await getDocs(query(collection(db, 'users'), limit(cap)))
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}

export async function getAllPurchases() {
    const snap = await getDocs(query(collection(db, 'purchases'), orderBy('createdAt', 'desc'), limit(200)))
    return snap.docs.map(d => ({ ...d.data(), id: d.id }))
}
