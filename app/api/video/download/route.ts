import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60 // Vercel Pro allows up to 60s; Hobby = 10s (stream helps)

export async function GET(req: NextRequest) {
    try {
        const url = req.nextUrl.searchParams.get('url')
        if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

        console.log('[download] fetching:', url)

        // Use streaming so Vercel doesn't time out buffering large video files
        const upstream = await fetch(url, {
            signal: AbortSignal.timeout(55_000), // 55s max fetch time
        })

        if (!upstream.ok) {
            console.error('[download] upstream failed:', upstream.status)
            return NextResponse.json({ error: `CDN returned ${upstream.status}` }, { status: 502 })
        }

        const contentType = upstream.headers.get('content-type') || 'video/mp4'
        const filename = `cutpulse-${Date.now()}.mp4`

        // Stream the body directly — avoid loading whole video into memory
        return new NextResponse(upstream.body, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-store',
            },
        })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Server error'
        console.error('[download] error:', msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
