import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

const API_KEY = process.env.XSKILL_API_KEY
const BASE_URL = 'https://api.xskill.ai'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://cutpulse.com'

export async function POST(req: NextRequest) {
    try {
        if (!API_KEY) return NextResponse.json({ error: 'XSKILL_API_KEY not set' }, { status: 500 })

        const {
            prompt = '',
            model = 'seedance_2.0_fast',
            ratio = '16:9',
            duration = 5,
            functionMode = 'text_to_video',
            filePaths = [],
            image_files = [],
            video_files = [],
            uid = null,        // ← user id for Firestore
            cost = 0,          // ← points cost for billing record
        } = await req.json()

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
            callback_url: `${APP_URL}/api/video/webhook`,   // ← xskill will POST here on completion
        }

        console.log('[create] payload →', JSON.stringify(payload, null, 2))

        const res = await fetch(`${BASE_URL}/api/v3/tasks/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
            body: JSON.stringify(payload),
        })

        const data = await res.json()
        console.log('[create] response →', JSON.stringify(data))

        if (!res.ok) return NextResponse.json({ error: data?.message || 'xskill API error' }, { status: res.status })

        const task_id = data?.data?.task_id ?? data?.task_id

        // ─── Save task to Firestore (so webhook can find it) ─────────────────
        if (task_id) {
            const taskRecord = {
                task_id,
                uid: uid ?? null,
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

            // Top-level for webhook lookup
            await adminDb.collection('videoTasks').doc(task_id).set(taskRecord)

            // Also under user's subcollection for My Videos page
            if (uid) {
                await adminDb
                    .collection('users').doc(uid)
                    .collection('videos').doc(task_id)
                    .set(taskRecord)
            }

            console.log('[create] ✅ saved task to Firestore:', task_id)
        }

        return NextResponse.json({ task_id, raw: data })
    } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
    }
}
