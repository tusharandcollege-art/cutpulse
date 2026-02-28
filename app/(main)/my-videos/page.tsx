'use client'

import { useState, useRef } from 'react'
import { PlaySquare, Download, Copy, Check, Trash2, Share2, Clock } from 'lucide-react'
import { useVideoStore, VideoRecord } from '@/hooks/useVideoStore'
import { useToast } from '@/components/ToastProvider'
import { usePendingPoller } from '@/hooks/usePendingPoller'
import { usePoints } from '@/hooks/usePoints'
import ElapsedTimer from '@/components/ElapsedTimer'

type FilterMode = 'all' | 'text_to_video' | 'image_to_video' | 'frames_to_video' | 'omni_reference'

const MODE_LABELS: Record<FilterMode, string> = {
    all: 'All Videos',
    text_to_video: 'Text to Video',
    image_to_video: 'Image to Video',
    frames_to_video: 'Frames to Video',
    omni_reference: 'Omni Reference',
}

const MODE_COLORS: Record<string, { bg: string; text: string }> = {
    text_to_video: { bg: 'rgba(99,102,241,.12)', text: '#818cf8' },
    image_to_video: { bg: 'rgba(20,184,166,.12)', text: '#2dd4bf' },
    frames_to_video: { bg: 'rgba(245,158,11,.12)', text: '#fbbf24' },
    omni_reference: { bg: 'rgba(168,85,247,.12)', text: '#c084fc' },
}

/* ── Single video card ─────────────────────────────────────────── */
function VideoCard({ record, onDelete }: { record: VideoRecord; onDelete: () => void }) {
    const [copied, setCopied] = useState(false)
    const [shared, setShared] = useState(false)
    const [confirm, setConfirm] = useState(false)
    const [playing, setPlaying] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const { show: toast } = useToast()

    const copyPrompt = () => {
        navigator.clipboard.writeText(record.prompt)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const shareVideo = async () => {
        try {
            await navigator.clipboard.writeText(record.videoUrl)
            setShared(true)
            toast('Link copied to clipboard!', 'success')
            setTimeout(() => setShared(false), 2000)
        } catch {
            toast('Could not copy link', 'error')
        }
    }

    const handleDelete = () => {
        if (!confirm) { setConfirm(true); setTimeout(() => setConfirm(false), 3000); return }
        onDelete()
    }

    const download = () => {
        const a = document.createElement('a')
        a.href = `/api/video/download?url=${encodeURIComponent(record.videoUrl)}`
        a.download = `cutpulse-${record.id}.mp4`
        a.click()
    }

    const date = new Date(record.createdAt)
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const color = MODE_COLORS[record.mode] ?? MODE_COLORS.text_to_video

    return (
        <div
            className="animate-fadeIn"
            style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)',
                display: 'flex', flexDirection: 'column',
                transition: 'border-color .2s, box-shadow .2s',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,.3)'
                    ; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(99,102,241,.12)'
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-card)'
                    ; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)'
            }}
        >
            <div style={{ position: 'relative', background: '#000', aspectRatio: '16/9', cursor: 'pointer' }}
                onMouseEnter={() => { setPlaying(true); videoRef.current?.play() }}
                onMouseLeave={() => { setPlaying(false); if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0 } }}
            >
                <video
                    ref={videoRef}
                    src={record.videoUrl} muted playsInline loop
                    controls={playing}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {!playing && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        </div>
                    </div>
                )}
                {/* Mode badge */}
                <div style={{
                    position: 'absolute', top: 10, left: 10,
                    padding: '3px 9px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                    background: color.bg, color: color.text, backdropFilter: 'blur(8px)',
                }}>
                    {MODE_LABELS[record.mode as FilterMode]}
                </div>
            </div>

            {/* Info */}
            <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Prompt */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{
                        fontSize: 13, lineHeight: 1.5, color: 'var(--text)', flex: 1,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                        {record.prompt}
                    </p>
                    <button onClick={copyPrompt} title="Copy prompt" style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                        borderRadius: 6, color: copied ? '#22c55e' : 'var(--text-muted)',
                        flexShrink: 0, transition: 'color .2s',
                    }}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                </div>

                {/* Meta chips */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {[
                        record.model === 'seedance_2.0_fast' ? 'Fast' : 'Standard',
                        record.ratio,
                        `${record.duration}s`,
                        `⚡ ${record.cost} pts`,
                    ].map(chip => (
                        <span key={chip} style={{
                            fontSize: 10, padding: '2px 8px', borderRadius: 999,
                            background: 'var(--bg-pill)', color: 'var(--text-2)', fontWeight: 600,
                        }}>{chip}</span>
                    ))}
                </div>

                {/* Date + Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {dateStr} · {timeStr}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={shareVideo} title="Copy video link"
                            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: shared ? 'rgba(34,197,94,.1)' : 'none', color: shared ? '#22c55e' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
                            {shared ? <Check size={13} /> : <Share2 size={13} />}
                        </button>
                        <button onClick={download} title="Download"
                            style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--indigo-light)', color: 'var(--indigo)', cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Download size={12} /> Save
                        </button>
                        <button onClick={handleDelete} title={confirm ? 'Click again to confirm' : 'Delete'}
                            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: confirm ? 'rgba(239,68,68,.1)' : 'none', color: confirm ? '#ef4444' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ── Main page ─────────────────────────────────────────────────── */
export default function MyVideosPage() {
    const { videos, remove, clear, update } = useVideoStore()
    const { deductPoints } = usePoints()
    const [filter, setFilter] = useState<FilterMode>('all')
    const [showClearConfirm, setShowClearConfirm] = useState(false)

    // ── Auto-resume any pending jobs from a previous session ──────────────────
    usePendingPoller({ videos, update, deductPoints })

    const pending = videos.filter(v => v.status === 'pending')
    const filtered = filter === 'all'
        ? videos.filter(v => v.status !== 'pending')
        : videos.filter(v => v.mode === filter && v.status !== 'pending')

    const handleClear = () => {
        if (!showClearConfirm) { setShowClearConfirm(true); setTimeout(() => setShowClearConfirm(false), 3000); return }
        clear()
        setShowClearConfirm(false)
    }

    return (
        <div style={{ height: '100%', overflowY: 'auto' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 40px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', marginBottom: 3 }}>My Videos</h1>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {videos.length} video{videos.length !== 1 ? 's' : ''} saved locally
                        </p>
                    </div>
                    {videos.length > 0 && (
                        <button onClick={handleClear}
                            style={{
                                padding: '7px 14px', borderRadius: 10, border: '1px solid var(--border)',
                                background: showClearConfirm ? 'rgba(239,68,68,.1)' : 'var(--bg-card)',
                                color: showClearConfirm ? '#ef4444' : 'var(--text-muted)',
                                cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .2s',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                            <Trash2 size={13} />
                            {showClearConfirm ? 'Confirm clear all' : 'Clear all'}
                        </button>
                    )}
                </div>

                {/* Filter tabs */}
                {videos.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
                        {(Object.keys(MODE_LABELS) as FilterMode[]).map(mode => {
                            const count = mode === 'all' ? videos.length : videos.filter(v => v.mode === mode).length
                            if (mode !== 'all' && count === 0) return null
                            return (
                                <button key={mode} onClick={() => setFilter(mode)}
                                    style={{
                                        padding: '5px 14px', borderRadius: 10, border: '1px solid var(--border)',
                                        background: filter === mode ? 'var(--indigo)' : 'var(--bg-card)',
                                        color: filter === mode ? '#fff' : 'var(--text-2)',
                                        cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all .2s',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                    }}>
                                    {MODE_LABELS[mode]}
                                    <span style={{
                                        fontSize: 10, padding: '1px 6px', borderRadius: 999,
                                        background: filter === mode ? 'rgba(255,255,255,.25)' : 'var(--bg-pill)',
                                        color: filter === mode ? '#fff' : 'var(--text-muted)',
                                    }}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Empty state */}
                {videos.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--indigo-light)', border: '1px solid rgba(99,102,241,.22)', marginBottom: 18 }}>
                            <PlaySquare size={30} style={{ color: 'var(--indigo)' }} />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>No videos yet</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, marginBottom: 24 }}>
                            Generate your first video and it will appear here automatically.
                        </p>
                        <a href="/generate" style={{
                            padding: '9px 22px', borderRadius: 12, background: 'var(--indigo)', color: '#fff',
                            textDecoration: 'none', fontSize: 13, fontWeight: 800,
                            boxShadow: '0 4px 16px var(--indigo-glow)',
                        }}>
                            Start Generating →
                        </a>
                    </div>
                )}

                {/* No results for this filter */}
                {videos.length > 0 && filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)', fontSize: 14 }}>
                        <PlaySquare size={28} style={{ margin: '0 auto 12px', opacity: .5 }} />
                        No {MODE_LABELS[filter].toLowerCase()} yet
                    </div>
                )}

                {/* Pending / generating cards */}
                {pending.length > 0 && (
                    <div style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                                {pending.length} Generating…
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                            {pending.map(p => (
                                <div key={p.id} style={{
                                    background: 'var(--bg-card)', border: '1px solid rgba(245,158,11,.25)',
                                    borderRadius: 20, overflow: 'hidden',
                                }}>
                                    {/* shimmer video area */}
                                    <div style={{ aspectRatio: '16/9', background: 'var(--bg-input)', position: 'relative', overflow: 'hidden' }}>
                                        <div style={{
                                            position: 'absolute', inset: 0,
                                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,.06) 50%, transparent 100%)',
                                            backgroundSize: '200% 100%', animation: 'shimmer 1.6s infinite',
                                        }} />
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                            <Clock size={22} style={{ color: '#f59e0b', opacity: .7 }} />
                                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', fontWeight: 700 }}>
                                                <ElapsedTimer since={p.createdAt} label="Generating" />
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px 14px' }}>
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.prompt || '(no prompt)'}</p>
                                        <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
                                            {[p.model === 'seedance_2.0_fast' ? 'Fast' : 'Standard', p.ratio, `${p.duration}s`, `⚡ ${p.cost} pts`].map(c => (
                                                <span key={c} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 999, background: 'var(--bg-pill)', color: 'var(--text-muted)', fontWeight: 600 }}>{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Video grid */}
                {filtered.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                        {filtered.map(record => (
                            <VideoCard key={record.id} record={record} onDelete={() => remove(record.id)} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
