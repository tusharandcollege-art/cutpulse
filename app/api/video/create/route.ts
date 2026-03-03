import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import admin from 'firebase-admin'

const API_KEY = process.env.XSKILL_API_KEY
const BASE_URL = 'https://api.xskill.ai'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cutpulse.com'

export async function POST(req: NextRequest) {
    try {
        if (!API_KEY) return NextResponse.json({ error: 'XSKILL_API_KEY not set' }, { status: 500 })

        // ── 1. Verify Firebase Auth token ─────────────────────────────────────
        const authHeader = req.headers.get('Authorization') ?? ''
        const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

        if (!idToken) {
            return NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 })
        }

        let verifiedUid: string
        try {
            const decoded = await admin.auth().verifyIdToken(idToken)
            verifiedUid = decoded.uid
        } catch {
            return NextResponse.json({ error: 'Invalid or expired session. Please sign in again.' }, { status: 401 })
        }

        // ── 2. Verify user has enough points ──────────────────────────────────
        const {
            prompt = '',
            model = 'seedance_2.0_fast',
            ratio = '16:9',
            duration = 5,
            functionMode = 'text_to_video',
            filePaths = [],
            image_files = [],
            video_files = [],
            cost = 0,
        } = await req.json()

        if (cost > 0) {
            const userSnap = await adminDb.collection('users').doc(verifiedUid).get()
            if (!userSnap.exists) {
                return NextResponse.json({ error: 'User account not found.' }, { status: 404 })
            }
            const currentPoints = userSnap.data()?.points ?? 0
            if (currentPoints < cost) {
                return NextResponse.json(
                    { error: `Insufficient points — you need ${cost} pts but have ${currentPoints} pts. Please top up on the Pricing page.` },
                    { status: 402 }
                )
            }
        }

        // ─── Build inner params based on mode ──────────────────────────────
        const innerParams: Record<string, unknown> = {
            model,
            prompt,
            ratio,
            duration,
        }

        if (functionMode === 'omni_reference') {
            if (image_files.length > 4) {
                return NextResponse.json({ error: 'Maximum 4 images allowed for Omni Reference.' }, { status: 400 })
            }
            if (video_files.length > 3) {
                return NextResponse.json({ error: 'Maximum 3 videos allowed for Omni Reference.' }, { status: 400 })
            }
            innerParams.functionMode = 'omni_reference'
            if (image_files.length) innerParams.image_files = image_files
            if (video_files.length) innerParams.video_files = video_files
        } else {
            innerParams.functionMode = 'first_last_frames'
            if (filePaths.length) innerParams.filePaths = filePaths
        }

        // ─── Outer xskill wrapper with callback_url ─────────────────────────
        const payload = {
            model: 'st-ai/super-seed2',
            params: innerParams,
            channel: null,
            callback_url: `${APP_URL}/api/video/webhook`,
        }

        console.log('[create] payload →', JSON.stringify(payload, null, 2))

        const res = await fetch(`${BASE_URL}/api/v3/tasks/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
            body: JSON.stringify(payload),
        })

        const data = await res.json()
        console.log('[create] response →', JSON.stringify(data))

        if (!res.ok) {
            console.error('[create] xskill error →', res.status, JSON.stringify(data))
            const rawMsg: string = data?.message || data?.error || data?.msg || data?.detail || `xskill API error (${res.status})`
            // Translate common Chinese error messages
            const friendlyMsg = rawMsg.includes('余额不足')
                ? 'Insufficient credits on the AI provider. Please contact support.'
                : rawMsg
            return NextResponse.json({ error: friendlyMsg }, { status: res.status })
        }

        const task_id = data?.data?.task_id ?? data?.task_id

        // ─── Save task to Firestore ──────────────────────────────────────────
        if (task_id) {
            const taskRecord = {
                task_id,
                uid: verifiedUid,
                status: 'pending',
                videoUrl: null,
                prompt,
                mode: functionMode,
                model,
                ratio,
                duration,
                cost,
                createdAt: new Date().toISOString(),
                completedAt: null,
                error: null,
            }

            await adminDb.collection('videoTasks').doc(task_id).set(taskRecord)
            await adminDb
                .collection('users').doc(verifiedUid)
                .collection('videos').doc(task_id)
                .set(taskRecord)

            console.log('[create] ✅ saved task to Firestore:', task_id)
        }

        return NextResponse.json({ task_id, raw: data })
    } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
    }
}

