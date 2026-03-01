import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

/**
 * POST /api/video/webhook
 * Called by xskill when a task changes status (completed / failed).
 * Payload shape from xskill docs:
 * {
 *   event: "task.status_changed",
 *   data: {
 *     task_id: string,
 *     status: "completed" | "failed",
 *     output: { images?: string[] | {url:string}[], video_url?: string } | null,
 *     error?: string
 *   }
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        console.log('[webhook] received →', JSON.stringify(body))

        const event = body?.event
        const data = body?.data ?? body   // some providers send data directly

        const task_id = data?.task_id ?? data?.taskId
        if (!task_id) {
            console.warn('[webhook] no task_id in payload')
            return NextResponse.json({ ok: false, error: 'no task_id' }, { status: 400 })
        }

        const status: string = data?.status ?? 'unknown'

        // ── Extract video URL ─────────────────────────────────────────────
        const output = data?.output ?? {}

        const extractFromArray = (arr: unknown): string | undefined => {
            if (!Array.isArray(arr) || arr.length === 0) return undefined
            const first = arr[0]
            if (typeof first === 'string') return first
            if (first && typeof first === 'object' && 'url' in first) return (first as { url: string }).url
            return undefined
        }

        const videoUrl = output?.video_url ?? output?.url
            ?? extractFromArray(output?.videos)
            ?? extractFromArray(output?.images)
            ?? data?.video_url
            ?? null

        console.log('[webhook] task_id:', task_id, '| status:', status, '| videoUrl:', videoUrl)

        // ── Look up the task record in Firestore ──────────────────────────
        const taskRef = adminDb.collection('videoTasks').doc(task_id)
        const taskSnap = await taskRef.get()

        if (!taskSnap.exists) {
            console.warn('[webhook] task not found in Firestore:', task_id)
            // Still return 200 so xskill doesn't retry endlessly
            return NextResponse.json({ ok: true, warning: 'task not found' })
        }

        const taskData = taskSnap.data()!
        const uid = taskData.uid

        // ── Update the task document ──────────────────────────────────────
        const patch: Record<string, unknown> = {
            status: status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : status,
            completedAt: new Date().toISOString(),
        }
        if (videoUrl) patch.videoUrl = videoUrl
        if (data?.error) patch.error = data.error

        await taskRef.update(patch)

        // ── Also update users/{uid}/videos/{task_id} if uid known ─────────
        if (uid) {
            await adminDb
                .collection('users').doc(uid)
                .collection('videos').doc(task_id)
                .update(patch)
                .catch(() => {
                    // Doc might not exist (very old task) — ignore
                })
        }

        console.log('[webhook] ✅ updated task', task_id, 'for uid', uid)
        return NextResponse.json({ ok: true })

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Server error'
        console.error('[webhook] error:', msg)
        // Return 200 anyway — xskill retries on non-200, which could flood us
        return NextResponse.json({ ok: false, error: msg }, { status: 200 })
    }
}
