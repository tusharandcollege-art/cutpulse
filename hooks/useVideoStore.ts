'use client'
import { useState, useEffect, useCallback } from 'react'

export type VideoStatus = 'pending' | 'completed' | 'error'

export interface VideoRecord {
    id: string
    taskId?: string
    prompt: string
    mode: 'text_to_video' | 'image_to_video' | 'frames_to_video' | 'omni_reference'
    model: string
    ratio: string
    duration: number
    cost: number
    videoUrl: string
    createdAt: string
    status?: VideoStatus   // undefined = completed (backwards-compat)
    error?: string
}

const KEY = 'cp-videos'

function persist(videos: VideoRecord[]) {
    try {
        localStorage.setItem(KEY, JSON.stringify(videos))
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('cp-videos-updated'))
        }
    } catch { /* quota */ }
}

export function useVideoStore() {
    const [videos, setVideos] = useState<VideoRecord[]>([])

    useEffect(() => {
        const load = () => {
            try {
                const raw = localStorage.getItem(KEY)
                if (raw) setVideos(JSON.parse(raw))
            } catch { /* ignore */ }
        }
        load()
        window.addEventListener('cp-videos-updated', load)
        window.addEventListener('storage', (e) => { if (e.key === KEY) load() })
        return () => {
            window.removeEventListener('cp-videos-updated', load)
            window.removeEventListener('storage', load) // simplified cleanup
        }
    }, [])

    /** Add a new record (pending or completed) */
    const save = useCallback((record: VideoRecord) => {
        setVideos(prev => {
            const next = [record, ...prev.filter(v => v.id !== record.id)].slice(0, 200)
            persist(next)
            return next
        })
    }, [])

    /** Update an existing record by id (e.g. pending → completed) */
    const update = useCallback((id: string, patch: Partial<VideoRecord>) => {
        setVideos(prev => {
            const next = prev.map(v => v.id === id ? { ...v, ...patch } : v)
            persist(next)
            return next
        })
    }, [])

    const remove = useCallback((id: string) => {
        setVideos(prev => {
            const next = prev.filter(v => v.id !== id)
            persist(next)
            return next
        })
    }, [])

    const clear = useCallback(() => {
        try { localStorage.removeItem(KEY) } catch { /* */ }
        setVideos([])
    }, [])

    return { videos, save, update, remove, clear }
}
