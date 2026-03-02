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
    code: string
    status: 'pending' | 'approved' | 'rejected'
    upiId?: string
    totalEarnings: number
    pendingEarnings: number
    totalSales: number
    totalReferrals: number
    createdAt: any
}

/** Submit affiliate application */
export async function applyForAffiliate(uid: string, data: {
    name: string; email: string; instagram: string; followers: string; niche: string; why: string
}) {
    const code = data.instagram.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
    await setDoc(doc(db, 'affiliates', uid), {
        uid, ...data, code,
        status: 'pending',
        totalEarnings: 0, pendingEarnings: 0,
        totalSales: 0, totalReferrals: 0,
        createdAt: serverTimestamp(),
    })
    return code
}

/** Get affiliate by UID */
export async function getAffiliate(uid: string): Promise<AffiliateData | null> {
    const snap = await getDoc(doc(db, 'affiliates', uid))
    return snap.exists() ? snap.data() as AffiliateData : null
}

/** Get approved affiliate by referral code */
export async function getAffiliateByCode(code: string): Promise<AffiliateData | null> {
    const q = query(collection(db, 'affiliates'), where('code', '==', code), where('status', '==', 'approved'))
    const snap = await getDocs(q)
    return snap.empty ? null : snap.docs[0].data() as AffiliateData
}

/** Called when a new user signs up via referral link */
export async function trackReferralSignup(affiliateUid: string, referredUid: string) {
    try {
        // Tag user as referred
        await updateDoc(doc(db, 'users', referredUid), { referredBy: affiliateUid })
    } catch {
        await setDoc(doc(db, 'users', referredUid), { referredBy: affiliateUid }, { merge: true })
    }
    // Create referral record
    await addDoc(collection(db, 'referrals'), {
        affiliateUid, referredUid,
        status: 'signed_up', commission: 0, purchaseAmount: 0,
        createdAt: serverTimestamp(),
    })
    // Increment referral count
    await updateDoc(doc(db, 'affiliates', affiliateUid), { totalReferrals: increment(1) })
}

/** Record 20% commission when referred user purchases */
export async function recordAffiliateCommission(affiliateUid: string, referredUid: string, amountINR: number) {
    const commission = Math.floor(amountINR * 0.20)
    const q = query(collection(db, 'referrals'), where('affiliateUid', '==', affiliateUid), where('referredUid', '==', referredUid))
    const snap = await getDocs(q)
    if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, { status: 'purchased', purchaseAmount: amountINR, commission })
    }
    await updateDoc(doc(db, 'affiliates', affiliateUid), {
        totalEarnings: increment(commission),
        pendingEarnings: increment(commission),
        totalSales: increment(1),
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
