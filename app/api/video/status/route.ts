import { NextRequest, NextResponse } from 'next/server'

const API_KEY = process.env.XSKILL_API_KEY
const BASE_URL = 'https://api.xskill.ai'

export async function POST(req: NextRequest) {
    try {
        if (!API_KEY) return NextResponse.json({ error: 'XSKILL_API_KEY not set' }, { status: 500 })

        const { task_id } = await req.json()
        if (!task_id) return NextResponse.json({ error: 'task_id required' }, { status: 400 })

        const res = await fetch(`${BASE_URL}/api/v3/tasks/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
            body: JSON.stringify({ task_id }),
        })

        const raw = await res.json()
        console.log('[status] raw →', JSON.stringify(raw))

        const task = raw?.data ?? {}
        const status = task?.status ?? 'pending'
        const progress = task?.progress ?? null

        // ✅ FIXED: xskill returns output directly at data.output
        // NOT at data.result.output (wrong assumption before)
        const output = task?.output ?? task?.result?.output ?? task?.result ?? {}

        // Helper: extract URL whether array element is a plain string or {url: "..."}
        const extractFromArray = (arr: unknown): string | undefined => {
            if (!Array.isArray(arr) || arr.length === 0) return undefined
            const first = arr[0]
            if (typeof first === 'string') return first
            if (first && typeof first === 'object' && 'url' in first) return (first as { url: string }).url
            return undefined
        }

        const videoUrl =
            output?.video_url ??
            output?.url ??
            extractFromArray(output?.videos) ??
            extractFromArray(output?.images) ??
            extractFromArray(task?.images) ??   // sometimes at data.images directly
            task?.video_url                      // sometimes at data.video_url directly

        console.log('[status] status:', status, '| stage:', progress?.stage, '| videoUrl:', videoUrl)

        return NextResponse.json({
            data: {
                status,
                result: { video_url: videoUrl },
                error: task?.error ?? null,
                progress,
                raw_output: output,
            }
        })
    } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
    }
}
