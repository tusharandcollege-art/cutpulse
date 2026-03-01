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

        // Normalise into a shape our frontend always expects:
        // { data: { status, result: { video_url } } }
        const task = raw?.data ?? {}
        const status = task?.status ?? 'pending'

        console.log('[status] full task →', JSON.stringify(task, null, 2))

        // xskill response: result.output.images = ["https://..."] (plain strings)
        // OR result.output.video_url, result.output.videos[0].url, etc.
        const output = task?.result?.output ?? task?.result ?? {}

        // Helper: extract URL whether the array element is a string or an object {url}
        const extractFromArray = (arr: unknown): string | undefined => {
            if (!Array.isArray(arr) || arr.length === 0) return undefined
            const first = arr[0]
            if (typeof first === 'string') return first          // plain string URL
            if (first && typeof first === 'object' && 'url' in first) return (first as { url: string }).url
            return undefined
        }

        const videoUrl =
            output?.video_url ??
            output?.url ??
            extractFromArray(output?.videos) ??
            extractFromArray(output?.images) ??   // xskill puts video URL here as plain string!
            extractFromArray(task?.result?.images) ??
            task?.result?.video_url

        return NextResponse.json({
            data: {
                status,
                result: { video_url: videoUrl },
                error: task?.error ?? null,
                raw_output: output,
            }
        })
    } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
    }
}
