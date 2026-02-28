'use client'

import { useState } from 'react'
import { ChevronDown, Zap, Sparkles } from 'lucide-react'

export type Model = 'seedance_2.0' | 'seedance_2.0_fast'
export type Ratio = '16:9' | '9:16' | '1:1'
export type Duration = 4 | 5 | 8 | 10 | 15

// ─── Pricing table (pts / second) ──────────────────────────────────────
// Fast  + no video files  = 100 pts/s
// Fast  + video files     = 200 pts/s
// Std   + no video files  = 200 pts/s
// Std   + video files     = 400 pts/s
export function calcCost(model: Model, duration: number, hasVideoFiles = false): number {
    if (model === 'seedance_2.0_fast') return (hasVideoFiles ? 200 : 100) * duration
    return (hasVideoFiles ? 400 : 200) * duration
}

export function rateLabel(model: Model, hasVideoFiles = false): string {
    const rate = model === 'seedance_2.0_fast' ? (hasVideoFiles ? 200 : 100) : (hasVideoFiles ? 400 : 200)
    return `${rate} pts/s`
}

export const MODELS: { id: Model; name: string; color: string }[] = [
    { id: 'seedance_2.0_fast', name: 'Seedance 2.0 Fast', color: '#22c55e' },
    { id: 'seedance_2.0', name: 'Seedance 2.0', color: '#7c7cf0' },
]

export const RATIOS: { val: Ratio; label: string }[] = [
    { val: '16:9', label: '16:9  Landscape' },
    { val: '9:16', label: '9:16  Portrait' },
    { val: '1:1', label: '1:1   Square' },
]

export const DURATIONS: Duration[] = [4, 5, 8, 10, 15]

interface Props {
    model: Model; setModel: (v: Model) => void
    ratio: Ratio; setRatio: (v: Ratio) => void
    duration: Duration; setDuration: (v: Duration) => void
    onGenerate: () => void
    isLoading: boolean
    canGenerate: boolean
    hasVideoFiles?: boolean   // true when omni-reference has video_files → higher rate
}

export default function GenerationToolbar({
    model, setModel, ratio, setRatio, duration, setDuration,
    onGenerate, isLoading, canGenerate, hasVideoFiles = false,
}: Props) {
    const [openModel, setOpenModel] = useState(false)
    const [openRatio, setOpenRatio] = useState(false)
    const [openDur, setOpenDur] = useState(false)
    const closeAll = () => { setOpenModel(false); setOpenRatio(false); setOpenDur(false) }

    const currentModel = MODELS.find(m => m.id === model)!
    const ratioLabel = RATIOS.find(r => r.val === ratio)?.label ?? ratio
    const totalCost = calcCost(model, duration, hasVideoFiles)
    const rateNum = model === 'seedance_2.0_fast' ? (hasVideoFiles ? 200 : 100) : (hasVideoFiles ? 400 : 200)
    const rate = rateLabel(model, hasVideoFiles)
    // e.g. "100 × 5s = 500 pts"
    const formula = `${rateNum} × ${duration}s = ${totalCost} pts`

    return (
        <div
            style={{ borderTop: '1px solid var(--border)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
            onClick={e => e.stopPropagation()}
        >
            {/* ── Selectors (left, wrappable) ──────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>

                {/* Model */}
                <div style={{ position: 'relative' }}>
                    <button className="tb-btn" onClick={() => { setOpenModel(v => !v); setOpenRatio(false); setOpenDur(false) }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: currentModel.color, display: 'inline-block', flexShrink: 0 }} />
                        {currentModel.name}
                        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>· {rate}</span>
                        <ChevronDown size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </button>
                    {openModel && (
                        <div className="dropdown" style={{ minWidth: 240, zIndex: 9999 }}>
                            <div style={{ padding: '6px 10px 8px', fontSize: 10, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                                Select model · {hasVideoFiles ? 'video reference active' : 'no video reference'}
                            </div>
                            {MODELS.map(m => {
                                const r = rateLabel(m.id, hasVideoFiles)
                                return (
                                    <button key={m.id} className={`dropdown-item ${m.id === model ? 'selected' : ''}`} onClick={() => { setModel(m.id); closeAll() }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                                            {m.name}
                                        </div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' }}>{r}</span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Ratio */}
                <div style={{ position: 'relative' }}>
                    <button className="tb-btn" onClick={() => { setOpenRatio(v => !v); setOpenModel(false); setOpenDur(false) }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="20" rx="3" /><path d="M7 2v20" />
                        </svg>
                        {ratioLabel}
                        <ChevronDown size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </button>
                    {openRatio && (
                        <div className="dropdown" style={{ minWidth: 160, zIndex: 9999 }}>
                            {RATIOS.map(r => (
                                <button key={r.val} className={`dropdown-item ${r.val === ratio ? 'selected' : ''}`} onClick={() => { setRatio(r.val); closeAll() }}>
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Duration */}
                <div style={{ position: 'relative' }}>
                    <button className="tb-btn" onClick={() => { setOpenDur(v => !v); setOpenModel(false); setOpenRatio(false) }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        {duration}s
                        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>· {totalCost} pts</span>
                        <ChevronDown size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    </button>
                    {openDur && (
                        <div className="dropdown" style={{ minWidth: 220, zIndex: 9999 }}>
                            <div style={{ padding: '6px 10px 8px', fontSize: 10, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                                {currentModel.name} · {rate}
                            </div>
                            {DURATIONS.map(d => (
                                <button key={d} className={`dropdown-item ${d === duration ? 'selected' : ''}`} onClick={() => { setDuration(d); closeAll() }}>
                                    <span>{d} seconds</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'monospace' }}>= {calcCost(model, d, hasVideoFiles)} pts</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Right side — formula + cost badge + button ────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

                {/* Price formula — always visible */}
                <div
                    title={hasVideoFiles ? '🎬 Video reference 2× rate active' : 'pts/s × duration = total pts'}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 10px', borderRadius: 999, fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
                        background: hasVideoFiles ? 'rgba(245,158,11,.12)' : 'var(--bg-pill)',
                        border: `1px solid ${hasVideoFiles ? 'rgba(245,158,11,.25)' : 'var(--border)'}`,
                        color: hasVideoFiles ? '#f59e0b' : 'var(--text-2)',
                        whiteSpace: 'nowrap',
                    }}>
                    {hasVideoFiles && <span style={{ marginRight: 2 }}>🎬</span>}
                    {formula}
                </div>

                <button id="generate-btn" className="gen-btn" onClick={onGenerate} disabled={isLoading || !canGenerate}>
                    {isLoading ? (
                        <>
                            <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1.2s linear infinite' }} />
                            Generating…
                        </>
                    ) : (
                        <><Sparkles size={13} /> Generate</>
                    )}
                </button>
            </div>
        </div>
    )
}
