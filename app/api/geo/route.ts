import { NextRequest, NextResponse } from 'next/server'

/**
 * Returns the visitor's country code using Vercel's automatic geo-header.
 * In local dev there is no header → defaults to 'IN' so you can test UPI flow.
 * Change the fallback to 'US' if you want to test the Dodo/USD flow locally.
 */
export async function GET(req: NextRequest) {
    // Vercel injects this header automatically on every request
    const country = req.headers.get('x-vercel-ip-country') ?? 'IN'
    return NextResponse.json({ country })
}
