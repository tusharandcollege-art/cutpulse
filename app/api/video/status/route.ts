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

        // xskill returns the video under result.output.video_url or result.video_url
        const output = task?.result?.output ?? task?.result ?? {}
        const videoUrl =
            output?.video_url ??
            output?.url ??
            (Array.isArray(output?.videos) ? output.videos[0]?.url : undefined) ??
            (Array.isArray(output?.images) ? output.images[0]?.url : undefined)

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
