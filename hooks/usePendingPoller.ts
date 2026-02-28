'use client'
/**
 * usePendingPoller
 * ─────────────────────────────────────────────────────────────────
 * On mount, finds every video record with status === 'pending' AND
 * a taskId. Polls /api/video/status for each one (in parallel)
 * and calls `update()` the moment a result arrives.
 *
 * Polling strategy (adaptive):
 *   - First 2 minutes: every 5 seconds (user might be watching)
 *   - After 2 minutes: every 30 seconds (xskill might be slow/queued)
 *   - Gives up after 6 hours total
 *
 * This means: even if xskill takes hours, the video will still show
 * up in My Videos the next time the user opens the app.
 */
import { useEffect } from 'react'
import { VideoRecord } from './useVideoStore'

interface Props {
    videos: VideoRecord[]
    update: (id: string, patch: Partial<VideoRecord>) => void
    deductPoints: (cost: number, meta?: { mode: string; model: string; duration: number; prompt?: string }) => Promise<void>
}

const FAST_INTERVAL_MS = 5_000           // every 5s for first 2 min
const SLOW_INTERVAL_MS = 30_000          // every 30s after that
const FAST_PHASE_MS = 2 * 60 * 1000  // 2 minutes
const MAX_DURATION_MS = 6 * 60 * 60 * 1000  // 6 hours hard limit

async function pollOnce(taskId: string): Promise<string | null> {
    try {
        const res = await fetch('/api/video/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task_id: taskId }),
        })
        if (!res.ok) return null
        const s = await res.json()
        const st = s?.data?.status
        if (st === 'completed' || st === 'success') {
            return s?.data?.result?.video_url ?? null
        }
        if (st === 'failed' || st === 'error') {
            return 'ERROR'
        }
        return null   // still processing
    } catch {
        return null
    }
}

export function usePendingPoller({ videos, update, deductPoints }: Props) {
    useEffect(() => {
        const pending = videos.filter(v => v.status === 'pending' && v.taskId)
        if (!pending.length) return

        const controllers: AbortController[] = []

        for (const record of pending) {
            const ctrl = new AbortController()
            controllers.push(ctrl)

                ; (async () => {
                    const startTime = Date.now()

                    while (!ctrl.signal.aborted) {
                        const elapsed = Date.now() - startTime

                        // Hard stop after 6 hours
                        if (elapsed > MAX_DURATION_MS) {
                            update(record.id, { status: 'error', error: 'Timed out after 6 hours — xskill may be overloaded' })
                            break
                        }

                        // Adaptive interval: fast early, slow later
                        const interval = elapsed < FAST_PHASE_MS ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS
                        await new Promise(r => setTimeout(r, interval))
                        if (ctrl.signal.aborted) break

                        const result = await pollOnce(record.taskId!)

                        if (result === 'ERROR') {
                            update(record.id, { status: 'error', error: 'Generation failed on xskill' })
                            break
                        }
                        if (result) {
                            update(record.id, { status: 'completed', videoUrl: result })
                            await deductPoints(record.cost)
                            break
                        }
                    }
                })()
        }

        return () => {
            controllers.forEach(c => c.abort())
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
}
