'use client'

import { useState } from 'react'
import { ChevronDown, Zap, Sparkles } from 'lucide-react'

export type Model = 'seedance_2.0' | 'seedance_2.0_fast' | 'seedance_v1_pro_fast' | 'seedance_v1_pro_fast_t2v'
export type Ratio = '16:9' | '9:16' | '1:1'
export type Duration = 4 | 5 | 8 | 10 | 15

// ─── Pricing table (pts / second) ──────────────────────────────────────
// Fast  + no video files  = 100 pts/s
// Fast  + video files     = 200 pts/s
// Std   + no video files  = 200 pts/s
// Std   + video files     = 400 pts/s
export function calcCost(model: Model, duration: number, hasVideoFiles = false): number {
    if (model === 'seedance_v1_pro_fast' || model === 'seedance_v1_pro_fast_t2v') return 10 * duration
    if (model === 'seedance_2.0_fast') return (hasVideoFiles ? 200 : 100) * duration
    return (hasVideoFiles ? 400 : 200) * duration
}

export function rateLabel(model: Model, hasVideoFiles = false): string {
    if (model === 'seedance_v1_pro_fast' || model === 'seedance_v1_pro_fast_t2v') return '10 pts/s'
    const rate = model === 'seedance_2.0_fast' ? (hasVideoFiles ? 200 : 100) : (hasVideoFiles ? 400 : 200)
    return `${rate} pts/s`
}

export const MODELS: { id: Model; name: string; color: string; badge?: string }[] = [
    { id: 'seedance_2.0_fast', name: 'Seedance 2.0 Fast', color: '#22c55e' },
    { id: 'seedance_2.0', name: 'Seedance 2.0', color: '#7c7cf0' },
    { id: 'seedance_v1_pro_fast_t2v', name: 'Seedance Pro Fast', color: '#f59e0b', badge: 'NEW' },
    { id: 'seedance_v1_pro_fast', name: 'Seedance Pro Fast Img', color: '#fb923c', badge: 'NEW' },
]

// Default selectable models (frames/omni pages that don't pass visibleModels)
const STANDARD_MODELS: Model[] = ['seedance_2.0_fast', 'seedance_2.0']
// Models shown as Coming Soon teaser for 500+ pt users
const COMING_SOON_MODELS: Model[] = ['seedance_2.0_fast', 'seedance_2.0']

export const RATIOS: { val: Ratio; label: string; short: string }[] = [
    { val: '16:9', label: '16:9  Landscape', short: '16:9' },
    { val: '9:16', label: '9:16  Portrait', short: '9:16' },
    { val: '1:1', label: '1:1   Square', short: '1:1' },
]

export const DURATIONS: Duration[] = [4, 5, 8, 10, 15]

interface Props {
    model: Model; setModel: (v: Model) => void
    ratio: Ratio; setRatio: (v: Ratio) => void
    duration: Duration; setDuration: (v: Duration) => void
    onGenerate: () => void
    isLoading: boolean
    canGenerate: boolean
    hasVideoFiles?: boolean
    /** If set, only these model IDs show as selectable options */
    visibleModels?: Model[]
    /** Used to show Coming Soon teaser on Seedance 2.0 for engaged users */
    userPoints?: number
}

export default function GenerationToolbar({
    model, setModel, ratio, setRatio, duration, setDuration,
    onGenerate, isLoading, canGenerate, hasVideoFiles = false,
    visibleModels, userPoints = 0,
}: Props) {
    const [openModel, setOpenModel] = useState(false)
    const [openRatio, setOpenRatio] = useState(false)
    const [openDur, setOpenDur] = useState(false)
    const closeAll = () => { setOpenModel(false); setOpenRatio(false); setOpenDur(false) }

    // When 500+ pts with no page override (frames/omni): lock all models as Coming Soon
    const selectableIds = (!visibleModels && userPoints >= 500)
        ? []   // all standard models become Coming Soon
        : (visibleModels ?? STANDARD_MODELS)
    const selectableModels = MODELS.filter(m => selectableIds.includes(m.id))

    // Show Seedance 2.0 as Coming Soon for all 500+ pt users
    const comingSoonModels = userPoints >= 500
        ? MODELS.filter(m => COMING_SOON_MODELS.includes(m.id) && !selectableIds.includes(m.id))
        : []

    const currentModel = MODELS.find(m => m.id === model)!
    const ratioFull = RATIOS.find(r => r.val === ratio)?.label ?? ratio
    const ratioShort = RATIOS.find(r => r.val === ratio)?.short ?? ratio
    const totalCost = calcCost(model, duration, hasVideoFiles)
    const rateNum = (model === 'seedance_v1_pro_fast' || model === 'seedance_v1_pro_fast_t2v') ? 10 : model === 'seedance_2.0_fast' ? (hasVideoFiles ? 200 : 100) : (hasVideoFiles ? 400 : 200)
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
                            {/* ── Selectable models ─────────────── */}
                            {selectableModels.map(m => {
                                const r = rateLabel(m.id, hasVideoFiles)
                                return (
                                    <button key={m.id} className={`dropdown-item ${m.id === model ? 'selected' : ''}`} onClick={() => { setModel(m.id); closeAll() }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                                            {m.name}
                                            {m.badge && <span style={{ fontSize: 8, fontWeight: 900, padding: '1px 5px', borderRadius: 4, background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44' }}>{m.badge}</span>}
                                        </div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' }}>{r}</span>
                                    </button>
                                )
                            })}
                            {/* ── Coming Soon teaser (500+ pts only) ─ */}
                            {comingSoonModels.length > 0 && (
                                <>
                                    <div style={{ padding: '6px 10px 4px', fontSize: 9, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Coming Soon
                                    </div>
                                    {comingSoonModels.map(m => (
                                        <button key={m.id} className="dropdown-item" disabled style={{ opacity: 0.45, cursor: 'not-allowed' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ width: 7, height: 7, borderRadius: '50%', background: m.color, display: 'inline-block' }} />
                                                {m.name}
                                                <span style={{ fontSize: 8, fontWeight: 900, padding: '1px 5px', borderRadius: 4, background: 'rgba(120,120,120,.15)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>SOON</span>
                                            </div>
                                            <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'monospace' }}>{rateLabel(m.id, hasVideoFiles)}</span>
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Ratio */}
                <div style={{ position: 'relative' }}>
                    <button className="tb-btn" onClick={() => { setOpenRatio(v => !v); setOpenModel(false); setOpenDur(false) }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="20" rx="3" /><path d="M7 2v20" />
                        </svg>
                        <span className="tb-ratio-full">{ratioFull}</span>
                        <span className="tb-ratio-short">{ratioShort}</span>
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
            <div className="tb-row-right" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

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
