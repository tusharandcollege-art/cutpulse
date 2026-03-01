'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Sparkles, Image as ImageIcon, X } from 'lucide-react'
import GenerationToolbar, { Model, Ratio, Duration, calcCost } from '@/components/GenerationToolbar'
import VideoPlayer from '@/components/VideoPlayer'
import { uploadToFirebase } from '@/lib/uploadToFirebase'
import { useVideoStore } from '@/hooks/useVideoStore'
import { useNotification } from '@/hooks/useNotification'
import { usePoints } from '@/hooks/usePoints'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'

type MsgStatus = 'generating' | 'completed' | 'error'
interface Message {
    id: string; prompt: string; imagePreview: string
    status: MsgStatus; cost: number; videoUrl?: string; error?: string
}


export default function ImageToVideoPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [prompt, setPrompt] = useState('')
    const [image, setImage] = useState<string | null>(null)
    const s = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('cp-settings') || '{}') : {}
    const [model, setModel] = useState<Model>(s.defaultModel ?? 'seedance_2.0_fast')
    const [ratio, setRatio] = useState<Ratio>(s.defaultRatio ?? '16:9')
    const [duration, setDuration] = useState<Duration>(s.defaultDuration ?? 5)
    const [focused, setFocused] = useState(false)
    const chatRef = useRef<HTMLDivElement>(null)
    const textaRef = useRef<HTMLTextAreaElement>(null)
    // Convert base64 data URL → Blob so FormData sends a real file not a string
    const base64ToBlob = async (dataUrl: string): Promise<Blob> => {
        const res = await fetch(dataUrl)
        return res.blob()
    }

    const { save, update } = useVideoStore()
    const { notify, requestPermission } = useNotification()
    const { deductPoints, points } = usePoints()
    const { user } = useAuth()
    const { show: toast } = useToast()
    const [uploading, setUploading] = useState(false)
    const hasMessages = messages.length > 0
    const isGenerating = messages.some(m => m.status === 'generating')

    useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [messages])

    const generate = useCallback(async () => {
        if (!image || isGenerating || uploading) return
        const cost = calcCost(model, duration)

        // Points gate
        if (user && points < cost) {
            toast(`Not enough points — need ${cost} pts, you have ${points} pts`, 'error')
            return
        }

        const msgId = Date.now().toString()
        setMessages(prev => [...prev, { id: msgId, prompt: prompt || '(image motion)', imagePreview: image, status: 'generating', cost }])
        save({ id: msgId, prompt: prompt || '(image motion)', mode: 'image_to_video', model, ratio, duration, cost, videoUrl: '', createdAt: new Date().toISOString(), status: 'pending' })
        setPrompt('')
        try {
            setUploading(true)
            const imageBlob = await base64ToBlob(image)
            const imageUrl = await uploadToFirebase(imageBlob, 'images')
            setUploading(false)
            const res = await fetch('/api/video/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, filePaths: [imageUrl], model, ratio, duration, functionMode: 'image_to_video', uid: user?.uid ?? null, cost }) })
            const data = await res.json()
            if (res.status === 429) throw new Error('Rate limited — please wait 30 seconds and try again')
            if (!res.ok) throw new Error(data.error || 'Failed')
            update(msgId, { taskId: data.task_id })
            const poll = async () => {
                const s = await fetch('/api/video/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: data.task_id }) }).then(r => r.json())
                const st = s?.data?.status
                if (st === 'completed' || st === 'success') {
                    const videoUrl = s?.data?.result?.video_url || s?.data?.result
                    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'completed', videoUrl } : m))
                    update(msgId, { status: 'completed', videoUrl })
                    notify('✅ Video Ready — CutPulse', prompt || 'Image animation complete')
                    await deductPoints(cost, { mode: 'image_to_video', model, duration, prompt })
                    toast('✅ Video ready!', 'success')
                }
                else if (st === 'failed' || st === 'error') {
                    const errObj = s?.data?.error
                    const errStr = typeof errObj === 'string' ? errObj : JSON.stringify(errObj || '')
                    if (errStr.includes('2043') || errStr.includes('审核') || errStr.includes('review')) {
                        await deductPoints(cost, { mode: 'image_to_video', model, duration, prompt: (prompt || 'Image animation') + ' (Failed: Safety Review)' })
                        throw new Error('Video did not pass safety review (points deducted).')
                    }
                    throw new Error(errObj?.message || errStr || 'Failed')
                }
                else { await new Promise(r => setTimeout(r, 3000)); await poll() }
            }
            await poll()
        } catch (e: unknown) {
            setUploading(false)
            const errMsg = e instanceof Error ? e.message : 'Error'
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'error', error: errMsg } : m))
            update(msgId, { status: 'error', error: errMsg })
            toast(errMsg, 'error')
        }
    }, [prompt, image, model, ratio, duration, isGenerating, uploading, points, user, save, update, notify, requestPermission, deductPoints, toast])

    /* ─ Input card ─────────────────────────────────────────────────── */
    const InputCard = (
        <div className={`gen-card ${focused ? 'focused' : ''}`} style={{ width: '100%' }}>
            <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Image slot */}
                {image ? (
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={image} alt="upload" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />
                        <button onClick={() => setImage(null)} style={{
                            position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                            borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none',
                            cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><X size={10} /></button>
                    </div>
                ) : (
                    <label style={{
                        width: 52, height: 52, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        border: '2px dashed var(--border-hover)', background: 'var(--bg-input)',
                    }}>
                        <ImageIcon size={16} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 3, fontWeight: 700 }}>Upload</span>
                        <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) { const r = new FileReader(); r.onload = ev => setImage(ev.target?.result as string); r.readAsDataURL(f) }
                        }} />
                    </label>
                )}
                <textarea
                    ref={textaRef} rows={1} value={prompt}
                    onChange={e => { setPrompt(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate() } }}
                    placeholder={image ? 'Describe how this image should move…' : 'Upload an image first…'}
                    disabled={isGenerating}
                    className="w-full resize-none bg-transparent outline-none border-none text-sm leading-relaxed"
                    style={{ color: 'var(--text)', minHeight: 36, maxHeight: 120, overflow: 'auto', flex: 1 }}
                />
            </div>
            <GenerationToolbar model={model} setModel={setModel} ratio={ratio} setRatio={setRatio} duration={duration} setDuration={setDuration} onGenerate={generate} isLoading={isGenerating} canGenerate={!!image} />
        </div>
    )

    /* ─ Empty state ─────────────────────────────────────────────────── */
    if (!hasMessages) {
        return (
            <div style={{ height: '100%', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
                <div style={{ width: '100%', maxWidth: 660, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--indigo-light)', border: '1px solid rgba(99,102,241,.22)' }}>
                            <ImageIcon size={26} style={{ color: 'var(--indigo)' }} />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>Image to Video</h2>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320 }}>Upload an image, describe the motion, and watch it come to life.</p>
                    </div>
                    {InputCard}
                    <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Upload an image · Enter to generate</p>
                </div>
            </div>
        )
    }

    /* ─ Chat state ───────────────────────────────────────────────────── */
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{ maxWidth: 680, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }} className="animate-fadeIn">
                        {/* User bubble with image */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                <img src={msg.imagePreview} alt="input" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: '14px 14px 4px 14px' }} />
                                {msg.prompt && msg.prompt !== '(image motion)' && (
                                    <div style={{ maxWidth: '75%', padding: '8px 14px', borderRadius: '14px 14px 4px 14px', background: 'var(--indigo)', color: '#fff', fontSize: 13 }}>{msg.prompt}</div>
                                )}
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>⚡ {msg.cost} cr</span>
                            </div>
                        </div>
                        {/* AI bubble */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                                <Sparkles size={14} color="#fff" />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {msg.status === 'generating' && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', gap: 5 }}>{[0, 1, 2].map(i => <span key={i} className="animate-pulse-s" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--indigo)', display: 'inline-block', animationDelay: `${i * .18}s` }} />)}</div>
                                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Animating your image…</span>
                                    </div>
                                )}
                                {msg.status === 'completed' && msg.videoUrl && (
                                    <div style={{ borderRadius: '18px 18px 18px 4px', overflow: 'hidden', border: '1px solid var(--border)', maxWidth: 460 }}><VideoPlayer url={msg.videoUrl} /></div>
                                )}
                                {msg.status === 'error' && (
                                    <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', fontSize: 13, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#ef4444' }}>⚠ {msg.error}</div>
                                )}
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
