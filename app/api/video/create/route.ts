import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.XSKILL_API_KEY
const BASE_URL = 'https://api.xskill.ai'

export async function POST(req: NextRequest) {
    try {
        if (!API_KEY) return NextResponse.json({ error: 'XSKILL_API_KEY not set' }, { status: 500 })

        const {
            prompt = '',
            model = 'seedance_2.0_fast',
            ratio = '16:9',
            duration = 5,
            functionMode = 'text_to_video',
            // URLs (already uploaded to Firebase Storage by the browser)
            filePaths = [],   // image-to-video / frames-to-video: [startUrl] or [startUrl, endUrl]
            image_files = [],   // omni reference images
            video_files = [],   // omni reference videos
        } = await req.json()

        // ─── Build inner params based on mode ──────────────────────────────
        const innerParams: Record<string, unknown> = {
            model,        // "seedance_2.0_fast" | "seedance_2.0"
            prompt,
            ratio,
            duration,
        }

        if (functionMode === 'omni_reference') {
            // ─── Validate omni_reference limits ────────────────────────────
            if (image_files.length > 4) {
                return NextResponse.json({ error: 'Maximum 4 images allowed for Omni Reference.' }, { status: 400 })
            }
            if (video_files.length > 3) {
                return NextResponse.json({ error: 'Maximum 3 videos allowed for Omni Reference.' }, { status: 400 })
            }

            // Omni Reference: image_files + video_files arrays
            innerParams.functionMode = 'omni_reference'
            if (image_files.length) innerParams.image_files = image_files
            if (video_files.length) innerParams.video_files = video_files
        } else {
            // text_to_video OR image_to_video OR frames_to_video — all use "first_last_frames"
            innerParams.functionMode = 'first_last_frames'
            if (filePaths.length) innerParams.filePaths = filePaths
        }

        // ─── Outer xskill wrapper ───────────────────────────────────────────
        const payload = {
            model: 'st-ai/super-seed2',
            params: innerParams,
            channel: null,
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

        // data.data.task_id
        return NextResponse.json({ task_id: data?.data?.task_id ?? data?.task_id, raw: data })
    } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
    }
}
