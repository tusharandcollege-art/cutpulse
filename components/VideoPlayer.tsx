'use client'

import { useState, useRef } from 'react'
import { Download, Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'

interface VideoPlayerProps {
    url: string
    onDownload?: () => void
}

/* Shimmer skeleton — shown while video is buffering */
function Shimmer() {
    return (
        <div style={{
            position: 'absolute', inset: 0, borderRadius: 20, overflow: 'hidden',
            background: 'var(--bg-card)',
        }}>
            {/* Animated shimmer sweep */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,.07) 45%, rgba(255,255,255,.13) 50%, rgba(255,255,255,.07) 55%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.6s infinite',
            }} />
            {/* Central play icon placeholder */}
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,.35)"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontWeight: 600 }}>Loading video…</span>
            </div>
            {/* Fake progress bar at bottom */}
            <div style={{ position: 'absolute', bottom: 52, left: 12, right: 12, height: 3, borderRadius: 99, background: 'rgba(255,255,255,.08)' }}>
                <div style={{ width: '35%', height: '100%', borderRadius: 99, background: 'rgba(255,255,255,.18)' }} />
            </div>
        </div>
    )
}

export default function VideoPlayer({ url, onDownload }: VideoPlayerProps) {
    const ref = useRef<HTMLVideoElement>(null)
    const [playing, setPlaying] = useState(false)
    const [muted, setMuted] = useState(false)
    const [progress, setProgress] = useState(0)
    const [loaded, setLoaded] = useState(false)   // ← skeleton control

    const toggle = () => {
        if (!ref.current) return
        if (playing) { ref.current.pause(); setPlaying(false) }
        else { ref.current.play(); setPlaying(true) }
    }

    const toggleMute = () => {
        if (!ref.current) return
        ref.current.muted = !muted; setMuted(!muted)
    }

    const onTimeUpdate = () => {
        if (!ref.current) return
        const p = (ref.current.currentTime / ref.current.duration) * 100
        setProgress(isNaN(p) ? 0 : p)
    }

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return
        const rect = e.currentTarget.getBoundingClientRect()
        ref.current.currentTime = ((e.clientX - rect.left) / rect.width) * ref.current.duration
    }

    const download = async () => {
        if (onDownload) { onDownload(); return }
        // Direct link download — avoids CORS issues with external CDN URLs
        try {
            const a = document.createElement('a')
            a.href = url
            a.download = `cutpulse-${Date.now()}.mp4`
            a.target = '_blank'
            a.click()
        } catch { window.open(url, '_blank') }
    }

    return (
        <>
            <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        .ctrl-btn {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,.18); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          border: none; cursor: pointer; transition: background .15s;
        }
        .ctrl-btn:hover { background: rgba(255,255,255,.28); }
      `}</style>

            <div className="video-wrap w-full animate-scaleIn" style={{ position: 'relative' }}>

                {/* ── Shimmer skeleton (hidden once video is ready) ── */}
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 2, borderRadius: 20,
                    opacity: loaded ? 0 : 1, pointerEvents: loaded ? 'none' : 'auto',
                    transition: 'opacity .5s ease',   // ← smooth fade-out
                }}>
                    <Shimmer />
                </div>

                {/* ── Actual video (fades in when ready) ── */}
                <video
                    ref={ref}
                    src={url}
                    preload="auto"           // ← start buffering immediately
                    className="w-full max-h-[440px] object-contain rounded-[20px]"
                    style={{
                        background: '#000',
                        opacity: loaded ? 1 : 0,  // ← invisible until skeleton fades out
                        transition: 'opacity .4s ease',
                    }}
                    onCanPlay={() => setLoaded(true)}     // ← first frame decoded → show it
                    onTimeUpdate={onTimeUpdate}
                    onEnded={() => setPlaying(false)}
                    playsInline
                />

                {/* ── Controls (only shown when loaded) ── */}
                {loaded && (
                    <div
                        className="absolute bottom-0 left-0 right-0 p-3 rounded-b-[20px]"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,.72), transparent)' }}
                    >
                        {/* Seek bar */}
                        <div
                            className="w-full h-1 rounded-full mb-2.5 cursor-pointer"
                            style={{ background: 'rgba(255,255,255,.2)' }}
                            onClick={seek}
                        >
                            <div
                                className="h-full rounded-full transition-all duration-200"
                                style={{ width: `${progress}%`, background: '#7c7cf0' }}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button onClick={toggle} className="ctrl-btn">
                                    {playing ? <Pause size={14} color="#fff" /> : <Play size={14} color="#fff" />}
                                </button>
                                <button onClick={toggleMute} className="ctrl-btn">
                                    {muted ? <VolumeX size={14} color="#fff" /> : <Volume2 size={14} color="#fff" />}
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => ref.current?.requestFullscreen()} className="ctrl-btn">
                                    <Maximize size={14} color="#fff" />
                                </button>
                                <button
                                    onClick={download}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                                    style={{ background: '#7c7cf0' }}
                                >
                                    <Download size={13} /> Download
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
