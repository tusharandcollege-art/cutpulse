/**
 * Points system — backed by Firestore users/{uid}
 *
 * Schema: { points: number, totalVideos: number, createdAt: string }
 *
 * New users automatically receive STARTER_POINTS on first sign-in.
 */

import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot, serverTimestamp, arrayUnion, collection, query, where, getDocs, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const STARTER_POINTS = 200   // free points for every new account

const HARDCODED_PROMOS: Record<string, number> = {
    'LAUNCH2026': 5000,
    'WELCOME500': 500,
    'FREECUT': 2000
}

/* ── Ensure user document exists ─────────────────────────────────── */
export async function initUserPoints(uid: string, displayName?: string | null, email?: string | null) {
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) {
        await setDoc(ref, {
            points: STARTER_POINTS,
            totalVideos: 0,
            displayName: displayName ?? '',
            email: email ?? '',
            createdAt: serverTimestamp(),
        })
    }
}

/* ── Deduct points after a successful generation ─────────────────── */
export async function deductPoints(uid: string, amount: number) {
    if (!uid || amount <= 0) return
    const ref = doc(db, 'users', uid)
    await updateDoc(ref, {
        points: increment(-amount),
        totalVideos: increment(1),
    })
}

/* ── Subscribe to real-time balance changes ──────────────────────── */
export function subscribePoints(uid: string, cb: (points: number, totalVideos: number) => void) {
    const ref = doc(db, 'users', uid)
    return onSnapshot(ref, snap => {
        if (snap.exists()) {
            cb(snap.data().points ?? 0, snap.data().totalVideos ?? 0)
        }
    })
}

/* ── Log a transaction ────────────────────────────────────────────── */
export async function logTransaction(uid: string, entry: {
    amount: number; mode: string; model: string; duration: number; prompt?: string
}) {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'transactions'), {
        ...entry,
        type: entry.amount < 0 ? 'debit' : 'credit',  // support positive amounts logically
        createdAt: serverTimestamp(),
    })
}

/* ── Referrals & Promo Codes ──────────────────────────────────────── */
export async function getOrGenerateReferralCode(uid: string): Promise<string | null> {
    if (!uid) return null
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null

    const data = snap.data()
    if (data.referralCode) return data.referralCode

    // Generate unique 8 char code
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
    await updateDoc(ref, { referralCode: code })
    return code
}

export async function applyPromoOrReferralCode(uid: string, code: string): Promise<{ success: boolean; message: string }> {
    if (!uid || !code.trim()) return { success: false, message: 'Invalid code' }
    const codeUpp = code.toUpperCase().trim()
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) return { success: false, message: 'User not found' }
    const userData = snap.data()

    // 1. Promo Code
    if (HARDCODED_PROMOS[codeUpp]) {
        if (userData.usedPromos?.includes(codeUpp)) return { success: false, message: 'Promo code already used' }
        const reward = HARDCODED_PROMOS[codeUpp]
        await updateDoc(ref, {
            points: increment(reward),
            usedPromos: arrayUnion(codeUpp)
        })
        await logTransaction(uid, { amount: reward, mode: 'promo_code', model: codeUpp, duration: 0 })
        return { success: true, message: `Promo applied: +${reward} pts 🎉` }
    }

    // 2. Referral Code
    if (userData.referralCode === codeUpp) return { success: false, message: 'You cannot use your own referral code' }
    if (userData.referredBy) return { success: false, message: 'You have already used a referral code' }

    const q = query(collection(db, 'users'), where('referralCode', '==', codeUpp))
    const res = await getDocs(q)
    if (res.empty) return { success: false, message: 'Invalid promo or referral code' }

    const referrerUid = res.docs[0].id
    // Referee gets small instant bonus (100 pts)
    await updateDoc(ref, {
        points: increment(100),
        referredBy: referrerUid
    })
    await logTransaction(uid, { amount: 100, mode: 'referral_bonus', model: codeUpp, duration: 0 })
    return { success: true, message: 'Referral code applied: +100 pts instant bonus! 🎉' }
}

/* ── Mock Plan Purchase (Triggers referral earn) ───────────────────── */
export async function purchasePlanCredit(uid: string, planName: string, configPoints: number) {
    if (!uid) return
    const ref = doc(db, 'users', uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    const userData = snap.data()

    // Credit buyer
    await updateDoc(ref, { points: increment(configPoints) })
    await logTransaction(uid, { amount: configPoints, mode: 'plan_purchase', model: planName, duration: 0 })

    // If user was referred, credit the referrer (e.g. 15% of points as a kickback)
    if (userData.referredBy) {
        const referrerBonus = Math.floor(configPoints * 0.15)
        const referrerRef = doc(db, 'users', userData.referredBy)
        await updateDoc(referrerRef, { points: increment(referrerBonus) })
        await logTransaction(userData.referredBy, { amount: referrerBonus, mode: 'affiliate_commission', model: uid, duration: 0 })
    }
}
