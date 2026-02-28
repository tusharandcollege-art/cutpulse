'use client'
import { useCallback } from 'react'

export function useNotification() {
    const notify = useCallback((title: string, body?: string) => {
        if (!('Notification' in window)) return
        const send = () => {
            try {
                new Notification(title, {
                    body,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: 'cutpulse-video',
                })
            } catch { /* Firefox in some contexts */ }
        }
        if (Notification.permission === 'granted') {
            send()
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(p => { if (p === 'granted') send() })
        }
    }, [])

    /** Call this on first user interaction to warm up permission */
    const requestPermission = useCallback(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    return { notify, requestPermission }
}
