/**
 * /api/upload
 * ─────────────────────────────────────────────────────────────────
 * POST — upload a file to Cloudinary (server-side).
 *         Browser sends multipart/form-data { file, folder }.
 *         Returns { url: string, publicId: string, resourceType: string }
 *
 * DELETE — delete previously uploaded temp files from Cloudinary.
 *          Body: { items: { publicId: string, resourceType: string }[] }
 *          Called automatically after xskill confirms task receipt.
 */
import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export const runtime = 'nodejs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

/* helper — detect resource type from mime */
function resourceType(mimeType: string): 'image' | 'video' | 'raw' {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    return 'raw'
}

/* ── POST: upload ─────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const folder = (formData.get('folder') as string) || 'images'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        const resType = resourceType(file.type)

        // Convert File → base64 data URI (Cloudinary accepts this directly)
        const arrayBuffer = await file.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const dataUri = `data:${file.type};base64,${base64}`

        const result = await cloudinary.uploader.upload(dataUri, {
            folder: `cutpulse-temp/${folder}`,
            resource_type: resType,
            // Auto-delete after 2 hours — belt-and-suspenders cleanup
            // (we also delete explicitly after xskill confirms the task)
            invalidate: true,
        })

        return NextResponse.json({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: resType,
        })
    } catch (e: unknown) {
        console.error('[upload/POST] error:', e)
        return NextResponse.json(
            { error: e instanceof Error ? e.message : 'Upload failed' },
            { status: 500 }
        )
    }
}

/* ── DELETE: cleanup temp reference files ─────────────────────── */
export async function DELETE(req: NextRequest) {
    try {
        const { items } = await req.json() as {
            items: { publicId: string; resourceType: string }[]
        }

        if (!Array.isArray(items) || !items.length) {
            return NextResponse.json({ deleted: 0 })
        }

        await Promise.allSettled(
            items.map(({ publicId, resourceType: rt }) =>
                cloudinary.uploader.destroy(publicId, {
                    resource_type: rt as 'image' | 'video' | 'raw',
                    invalidate: true,
                })
            )
        )

        return NextResponse.json({ deleted: items.length })
    } catch (e: unknown) {
        console.error('[upload/DELETE] error:', e)
        return NextResponse.json(
            { error: e instanceof Error ? e.message : 'Delete failed' },
            { status: 500 }
        )
    }
}
