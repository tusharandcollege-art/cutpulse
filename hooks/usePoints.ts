'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { initUserPoints, subscribePoints, deductPoints as _deduct, logTransaction as _log } from '@/lib/points'

interface PointsState {
    points: number
    totalVideos: number
    loading: boolean
    deductPoints: (amount: number, meta?: { mode: string; model: string; duration: number; prompt?: string }) => Promise<void>
}

export function usePoints(): PointsState {
    const { user } = useAuth()
    const [points, setPoints] = useState(0)
    const [totalVideos, setTotalVideos] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user) { setLoading(false); return }

        let unsub: (() => void) | undefined

        initUserPoints(user.uid, user.displayName, user.email)
            .then(() => {
                unsub = subscribePoints(user.uid, (pts, vids) => {
                    setPoints(pts)
                    setTotalVideos(vids)
                    setLoading(false)
                })
            })
            .catch(() => setLoading(false))

        return () => { unsub?.() }
    }, [user])

    const deductPoints = async (
        amount: number,
        meta?: { mode: string; model: string; duration: number; prompt?: string }
    ) => {
        if (!user) return
        await _deduct(user.uid, amount)
        if (meta) {
            _log(user.uid, { amount, ...meta }).catch(() => { })   // fire-and-forget
        }
    }

    return { points, totalVideos, loading, deductPoints }
}
