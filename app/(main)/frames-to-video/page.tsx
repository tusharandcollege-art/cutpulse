'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Sparkles, Film, Plus, X } from 'lucide-react'
import GenerationToolbar, { Model, Ratio, Duration, calcCost } from '@/components/GenerationToolbar'
import VideoPlayer from '@/components/VideoPlayer'
import { uploadToFirebase } from '@/lib/uploadToFirebase'
import { useVideoStore } from '@/hooks/useVideoStore'
import { useNotification } from '@/hooks/useNotification'
import { usePoints } from '@/hooks/usePoints'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'

type MsgStatus = 'generating' | 'completed' | 'error'
interface Message { id: string; frame1: string; frame2?: string; prompt: string; status: MsgStatus; cost: number; videoUrl?: string; error?: string }

export default function FramesToVideoPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [prompt, setPrompt] = useState('')
    const [frame1, setFrame1] = useState<string | null>(null)
    const [frame2, setFrame2] = useState<string | null>(null)
    const s = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('cp-settings') || '{}') : {}
    const [model, setModel] = useState<Model>(s.defaultModel ?? 'seedance_2.0_fast')
    const [ratio, setRatio] = useState<Ratio>(s.defaultRatio ?? '16:9')
    const [duration, setDuration] = useState<Duration>(s.defaultDuration ?? 5)
    const [focused, setFocused] = useState(false)
    const chatRef = useRef<HTMLDivElement>(null)
    const hasMessages = messages.length > 0
    const isGenerating = messages.some(m => m.status === 'generating')

    useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [messages])

    const readFile = (f: File): Promise<string> => new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target?.result as string); r.readAsDataURL(f) })

    // Convert base64 data URL → Blob so FormData sends a real file not a string
    const base64ToBlob = async (dataUrl: string): Promise<Blob> => {
        const res = await fetch(dataUrl)
        return res.blob()
    }

    const { save, update } = useVideoStore()
    const { notify } = useNotification()
    const { deductPoints, points } = usePoints()
    const { user } = useAuth()
    const { show: toast } = useToast()
    const [uploading, setUploading] = useState(false)

    const generate = useCallback(async () => {
        if (!frame1 || isGenerating || uploading) return
        const cost = calcCost(model, duration)
        if (user && points < cost) {
            toast(`Not enough points — need ${cost} pts, you have ${points} pts`, 'error')
            return
        }
        const msgId = Date.now().toString()
        setMessages(prev => [...prev, { id: msgId, frame1, frame2: frame2 || undefined, prompt, status: 'generating', cost }])
        save({ id: msgId, prompt, mode: 'frames_to_video', model, ratio, duration, cost, videoUrl: '', createdAt: new Date().toISOString(), status: 'pending' })
        setPrompt('')
        try {
            setUploading(true)
            const [f1Blob, f2Blob] = await Promise.all([
                base64ToBlob(frame1),
                frame2 ? base64ToBlob(frame2) : Promise.resolve(null),
            ])
            const [f1Url, f2Url] = await Promise.all([
                uploadToFirebase(f1Blob, 'images'),
                f2Blob ? uploadToFirebase(f2Blob, 'images') : Promise.resolve(null),
            ])
            setUploading(false)
            const filePaths = f2Url ? [f1Url, f2Url] : [f1Url]
            const res = await fetch('/api/video/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, filePaths, model, ratio, duration, functionMode: 'frames_to_video', uid: user?.uid ?? null, cost }) })
            const data = await res.json()
            if (res.status === 429) throw new Error('Rate limited — please wait 30 seconds and try again')
            if (!res.ok) throw new Error(data.error || 'Failed')
            update(msgId, { taskId: data.task_id })
            const poll = async () => {
                const s = await fetch('/api/video/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: data.task_id }) }).then(r => r.json())
                const st = s?.data?.status
                if (st === 'completed' || st === 'success') {
                    const videoUrl = s?.data?.result?.video_url
                    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'completed', videoUrl } : m))
                    update(msgId, { status: 'completed', videoUrl })
                    notify('✅ Video Ready — CutPulse', prompt || 'Frame transition complete')
                    await deductPoints(cost, { mode: 'frames_to_video', model, duration, prompt })
                    toast('✅ Video ready!', 'success')
                } else if (st === 'failed' || st === 'error') {
                    const errObj = s?.data?.error
                    const errStr = typeof errObj === 'string' ? errObj : JSON.stringify(errObj || '')
                    if (errStr.includes('2043') || errStr.includes('审核') || errStr.includes('review')) {
                        await deductPoints(cost, { mode: 'frames_to_video', model, duration, prompt: (prompt || 'Frame transition') + ' (Failed: Safety Review)' })
                        throw new Error('Video did not pass safety review (points deducted).')
                    }
                    throw new Error(errObj?.message || errStr || 'Failed')
                } else { await new Promise(r => setTimeout(r, 3000)); await poll() }
            }
            await poll()
        } catch (e: unknown) {
            setUploading(false)
            const errMsg = e instanceof Error ? e.message : 'Error'
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'error', error: errMsg } : m))
            update(msgId, { status: 'error', error: errMsg })
            toast(errMsg, 'error')
        }
    }, [prompt, frame1, frame2, model, ratio, duration, isGenerating, uploading, points, user, save, update, notify, deductPoints, toast])

    const FrameSlot = ({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', position: 'relative', border: '2px dashed var(--border-hover)', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {value ? (
                    <>
                        <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => onChange(null)} style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={9} /></button>
                    </>
                ) : (
                    <label style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Plus size={16} style={{ color: 'var(--text-muted)' }} />
                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={async e => { const f = e.target.files?.[0]; if (f) onChange(await readFile(f)) }} />
                    </label>
                )}
            </div>
        </div>
    )

    const InputCard = (
        <div className={`gen-card ${focused ? 'focused' : ''}`} style={{ width: '100%' }}>
            <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <FrameSlot label="Start" value={frame1} onChange={setFrame1} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Film size={14} />
                    <span style={{ fontSize: 10, fontWeight: 600 }}>→</span>
                </div>
                <FrameSlot label="End (opt)" value={frame2} onChange={setFrame2} />
                <div style={{ width: 1, height: 44, background: 'var(--border)', flexShrink: 0 }} />
                <textarea
                    rows={1} value={prompt}
                    onChange={e => { setPrompt(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px' }}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate() } }}
                    placeholder={frame1 ? 'Describe the motion (optional)…' : 'Upload start frame first…'}
                    disabled={isGenerating}
                    className="w-full resize-none bg-transparent outline-none border-none text-sm leading-relaxed"
                    style={{ color: 'var(--text)', minHeight: 32, maxHeight: 100, overflow: 'auto', flex: 1 }}
                />
            </div>
            <GenerationToolbar model={model} setModel={setModel} ratio={ratio} setRatio={setRatio} duration={duration} setDuration={setDuration} onGenerate={generate} isLoading={isGenerating} canGenerate={!!frame1} />
        </div>
    )

    if (!hasMessages) {
        return (
            <div style={{ height: '100%', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
                <div style={{ width: '100%', maxWidth: 660, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--indigo-light)', border: '1px solid rgba(99,102,241,.22)' }}>
                            <Film size={26} style={{ color: 'var(--indigo)' }} />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>Frames to Video</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320 }}>Set a start frame and optional end frame — AI fills the motion between them.</p>
                    </div>
                    {InputCard}
                    <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Upload start frame · Enter to generate</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{ maxWidth: 680, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }} className="animate-fadeIn">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 6 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <img src={msg.frame1} alt="start" style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 10 }} />
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>→</span>
                                    {msg.frame2 ? <img src={msg.frame2} alt="end" style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 10 }} /> : <div style={{ width: 80, height: 56, borderRadius: 10, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Auto end</span></div>}
                                </div>
                                {msg.prompt && <div style={{ maxWidth: '75%', padding: '6px 12px', borderRadius: '12px 12px 4px 12px', background: 'var(--indigo)', color: '#fff', fontSize: 12 }}>{msg.prompt}</div>}
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>⚡ {msg.cost} cr</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><Sparkles size={14} color="#fff" /></div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {msg.status === 'generating' && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}><div style={{ display: 'flex', gap: 5 }}>{[0, 1, 2].map(i => <span key={i} className="animate-pulse-s" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--indigo)', display: 'inline-block', animationDelay: `${i * .18}s` }} />)}</div><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Generating transition…</span></div>}
                                {msg.status === 'completed' && msg.videoUrl && <div style={{ borderRadius: '18px 18px 18px 4px', overflow: 'hidden', border: '1px solid var(--border)', maxWidth: 460 }}><VideoPlayer url={msg.videoUrl} /></div>}
                                {msg.status === 'error' && <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', fontSize: 13, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#ef4444' }}>⚠ {msg.error}</div>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ flexShrink: 0, padding: '12px 24px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                <div style={{ maxWidth: 680, margin: '0 auto' }}>{InputCard}</div>
            </div>
        </div>
    )
}
