import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    try {
        const url = req.nextUrl.searchParams.get('url')
        if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 })

        const res = await fetch(url)
        if (!res.ok) return NextResponse.json({ error: 'Download failed' }, { status: 502 })

        const blob = await res.arrayBuffer()
        return new NextResponse(blob, {
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Disposition': `attachment; filename="seedance-${Date.now()}.mp4"`,
            },
        })
    } catch (e: unknown) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Server error' }, { status: 500 })
    }
}
