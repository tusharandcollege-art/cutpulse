import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
    try {
        // ── 1. Auth ──────────────────────────────────────────────────────────
        const authHeader = req.headers.get('Authorization') ?? ''
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
        if (!idToken) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })

        let uid: string
        try {
            const decoded = await admin.auth().verifyIdToken(idToken)
            uid = decoded.uid
        } catch {
            return NextResponse.json({ error: 'Invalid session. Please sign in again.' }, { status: 401 })
        }

        // ── 2. Get code from body ─────────────────────────────────────────────
        const { code } = await req.json()
        if (!code?.trim()) return NextResponse.json({ error: 'No code provided.' }, { status: 400 })

        const codeStr = String(code).trim().toUpperCase()
        const codeRef = adminDb.collection('giftCodes').doc(codeStr)

        // ── 3. Atomic check-and-claim using Firestore transaction ─────────────
        const pointsAdded = await adminDb.runTransaction(async (tx) => {
            const snap = await tx.get(codeRef)

            if (!snap.exists) throw new Error('Invalid gift code.')
            const data = snap.data()!

            if (data.used) throw new Error('This code has already been used.')

            const pts = Number(data.points) || 0
            if (pts <= 0) throw new Error('Invalid code value.')

            // Mark code as used
            tx.update(codeRef, {
                used: true,
                usedBy: uid,
                usedAt: FieldValue.serverTimestamp(),
            })

            // Add points to user
            const userRef = adminDb.collection('users').doc(uid)
            tx.set(userRef, { points: FieldValue.increment(pts) }, { merge: true })

            // Log the transaction
            const logRef = adminDb.collection('users').doc(uid)
                .collection('pointsHistory').doc()
            tx.set(logRef, {
                type: 'gift_code',
                code: codeStr,
                points: pts,
                createdAt: FieldValue.serverTimestamp(),
                description: `Gift code: ${codeStr}`,
            })

            return pts
        })

        return NextResponse.json({ success: true, pointsAdded })

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Something went wrong.'
        return NextResponse.json({ error: msg }, { status: 400 })
    }
}
