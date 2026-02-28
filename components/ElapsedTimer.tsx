'use client'
import { useState, useEffect } from 'react'

function formatElapsed(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m < 60) return `${m}m ${s}s`
    const h = Math.floor(m / 60)
    const rm = m % 60
    return `${h}h ${rm}m`
}

interface Props {
    /** ISO string of when generation started */
    since: string
    /** Optional additional label before the time e.g. "Generating" */
    label?: string
}

export default function ElapsedTimer({ since, label = 'Generating' }: Props) {
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        const startMs = new Date(since).getTime()

        const tick = () => {
            const secs = Math.floor((Date.now() - startMs) / 1000)
            setElapsed(Math.max(0, secs))
        }

        tick() // run immediately
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [since])

    return (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            ⏳ {label}… {formatElapsed(elapsed)}
        </span>
    )
}
