import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import admin from 'firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// Admin UIDs allowed to create codes
const ADMIN_UIDS = ['tuushar1likhitkar@gmail.com'] // fallback email check

export async function POST(req: NextRequest) {
    try {
        // Verify caller is admin
        const authHeader = req.headers.get('Authorization') ?? ''
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
        if (!idToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let email: string
        let uid: string
        try {
            const decoded = await admin.auth().verifyIdToken(idToken)
            email = decoded.email ?? ''
            uid = decoded.uid
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'tuushar1likhitkar@gmail.com'
        if (email !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { code, points } = await req.json()
        if (!code || !points) return NextResponse.json({ error: 'code and points required' }, { status: 400 })

        const codeStr = String(code).trim().toUpperCase()
        const ref = adminDb.collection('giftCodes').doc(codeStr)
        const existing = await ref.get()
        if (existing.exists) return NextResponse.json({ error: 'Code already exists' }, { status: 409 })

        await ref.set({
            code: codeStr,
            points: Number(points),
            used: false,
            usedBy: null,
            usedAt: null,
            createdBy: uid,
            createdAt: FieldValue.serverTimestamp(),
        })

        return NextResponse.json({ success: true, code: codeStr, points: Number(points) })
    } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 })
    }
}
