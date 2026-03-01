'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Sparkles, Layers, Image as ImageIcon, Video as VideoIcon, X, RotateCcw } from 'lucide-react'
import GenerationToolbar, { Model, Ratio, Duration, calcCost } from '@/components/GenerationToolbar'
import VideoPlayer from '@/components/VideoPlayer'
import ElapsedTimer from '@/components/ElapsedTimer'
import { uploadFile, deleteUploadedFiles } from '@/lib/uploadToFirebase'
import { useVideoStore } from '@/hooks/useVideoStore'
import { useNotification } from '@/hooks/useNotification'
import { usePoints } from '@/hooks/usePoints'
import { useAuth } from '@/hooks/useAuth'

type MsgStatus = 'generating' | 'uploading' | 'completed' | 'error'
interface Message {
    id: string; prompt: string; imageCount: number; videoCount: number
    status: MsgStatus; cost: number; videoUrl?: string; error?: string
    createdAt: string
}

export default function OmniReferencePage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [prompt, setPrompt] = useState('')
    const [images, setImages] = useState<{ file: File, preview: string }[]>([])  // native File + object URL
    const [videos, setVideos] = useState<{ file: File, preview: string }[]>([])
    const [model, setModel] = useState<Model>('seedance_2.0_fast')
    const [ratio, setRatio] = useState<Ratio>('16:9')
    const [duration, setDuration] = useState<Duration>(5)
    const [focused, setFocused] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)  // 0-100 overall
    const [promptHistory, setPromptHistory] = useState<string[]>([])
    const [historyIdx, setHistoryIdx] = useState(-1)

    const chatRef = useRef<HTMLDivElement>(null)
    const textaRef = useRef<HTMLTextAreaElement>(null)
    const { save, update } = useVideoStore()
    const { user } = useAuth()
    const { notify } = useNotification()
    const { deductPoints } = usePoints()

    const hasMessages = messages.length > 0
    const isGenerating = messages.some(m => m.status === 'generating' || m.status === 'uploading')
    const hasVideoFiles = videos.length > 0

    useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [messages])

    // Document title
    useEffect(() => {
        document.title = isGenerating ? '⏳ Generating… — CutPulse' : 'CutPulse'
        return () => { document.title = 'CutPulse' }
    }, [isGenerating])

    const addImages = (files: FileList) => {
        if (images.length >= 4) { alert('Maximum 4 images allowed.'); return }
        const toAdd = Array.from(files).slice(0, 4 - images.length)
        setImages(prev => [
            ...prev,
            ...toAdd.map(f => ({ file: f, preview: URL.createObjectURL(f) }))
        ])
    }
    const getVideoDuration = (file: File): Promise<number> =>
        new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file)
            const vid = document.createElement('video')
            vid.preload = 'metadata'
            vid.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(vid.duration) }
            vid.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read video')) }
            vid.src = url
        })

    const addVideos = async (files: FileList) => {
        if (videos.length >= 3) {
            alert('Maximum 3 videos allowed.')
            return
        }
        const toAdd = Array.from(files).slice(0, 3 - videos.length)
        const accepted: { file: File; preview: string }[] = []
        const rejected: string[] = []

        for (const f of toAdd) {
            try {
                const dur = await getVideoDuration(f)
                if (dur > 15) {
                    rejected.push(`"${f.name}" is ${Math.round(dur)}s — max 15s allowed`)
                } else {
                    accepted.push({ file: f, preview: URL.createObjectURL(f) })
                }
            } catch {
                rejected.push(`"${f.name}" could not be read`)
            }
        }

        if (rejected.length) {
            alert('⚠ Some videos were skipped:\n' + rejected.join('\n'))
        }
        if (accepted.length) {
            setVideos(prev => [...prev, ...accepted])
        }
    }

    const tagInsert = (tag: string) => {
        setPrompt(p => p + (p.endsWith(' ') || !p ? '' : ' ') + tag + ' ')
        textaRef.current?.focus()
    }

    const generate = useCallback(async (overridePrompt?: string) => {
        const text = (overridePrompt ?? prompt).trim()
        if (!text || isGenerating) return
        const msgId = Date.now().toString()
        const cost = calcCost(model, duration, hasVideoFiles)

        setMessages(prev => [...prev, { id: msgId, prompt: text, imageCount: images.length, videoCount: videos.length, status: 'uploading', cost, createdAt: new Date().toISOString() }])
        save({ id: msgId, prompt: text, mode: 'omni_reference', model, ratio, duration, cost, videoUrl: '', createdAt: new Date().toISOString(), status: 'pending' })

        if (!overridePrompt) {
            setPromptHistory(h => [text, ...h.slice(0, 49)])
            setHistoryIdx(-1)
            setPrompt('')
        }

        try {
            // Upload all images and videos to Firebase with per-file progress
            setUploading(true)
            setUploadProgress(0)

            const allFiles = [
                ...images.map(img => ({ file: img.file, folder: 'images' as const })),
                ...videos.map(vid => ({ file: vid.file, folder: 'videos' as const })),
            ]
            const total = allFiles.length
            const progresses = new Array(total).fill(0)

            const updateOverall = (idx: number, pct: number) => {
                progresses[idx] = pct
                const avg = progresses.reduce((a, b) => a + b, 0) / total
                setUploadProgress(Math.round(avg))
            }

            const uploadResults = await Promise.all(
                allFiles.map(({ file, folder }, idx) =>
                    uploadFile(file, folder, (pct) => updateOverall(idx, pct))
                )
            )

            const imageUrls = uploadResults.slice(0, images.length).map(r => r.url)
            const videoUrls = uploadResults.slice(images.length).map(r => r.url)
            setUploading(false)
            setUploadProgress(0)
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'generating' } : m))

            const res = await fetch('/api/video/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text, image_files: imageUrls, video_files: videoUrls, model, ratio, duration, functionMode: 'omni_reference', uid: user?.uid ?? null, cost }),
            })
            if (res.status === 429) throw new Error('Rate limited - please wait 30 seconds and try again')
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            update(msgId, { taskId: data.task_id })

            // ── Clean up temp files from Cloudinary ─────────────────────────
            // xskill already has the URLs queued — these files are no longer needed.
            deleteUploadedFiles(uploadResults.map(r => ({ publicId: r.publicId, resourceType: r.resourceType })))

            // Adaptive poll: 5s for first 2 min, 20s after (saves API calls for long generations)
            const pollStart = Date.now()
            let done = false
            while (!done) {
                const elapsed = Date.now() - pollStart
                const interval = elapsed < 2 * 60 * 1000 ? 5_000 : 20_000
                await new Promise(r => setTimeout(r, interval))

                const s = await fetch('/api/video/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: data.task_id }) }).then(r => r.json())
                const st = s?.data?.status

                if (st === 'completed' || st === 'success') {
                    const videoUrl = s?.data?.result?.video_url
                    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'completed', videoUrl } : m))
                    update(msgId, { status: 'completed', videoUrl })
                    notify('✅ Video Ready — CutPulse', text.slice(0, 60))
                    await deductPoints(cost)
                    done = true
                } else if (st === 'failed' || st === 'error') {
                    const errObj = s?.data?.error
                    const errStr = typeof errObj === 'string' ? errObj : JSON.stringify(errObj || '')
                    if (errStr.includes('2043') || errStr.includes('审核') || errStr.includes('review')) {
                        await deductPoints(cost, { mode: 'omni_reference', model, duration, prompt: text + ' (Failed: Safety Review)' })
                        throw new Error('Video did not pass safety review (points deducted).')
                    }
                    throw new Error(errObj?.message || errStr || 'Generation failed')
                }
                // else: still processing → loop again
            }
        } catch (e: unknown) {
            setUploading(false)
            setUploadProgress(0)
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'error', error: e instanceof Error ? e.message : 'Error' } : m))
        }
    }, [prompt, images, videos, model, ratio, duration, isGenerating, hasVideoFiles, save, notify])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); return }
        if (e.key === 'ArrowUp' && !prompt) {
            e.preventDefault()
            const next = Math.min(historyIdx + 1, promptHistory.length - 1)
            setHistoryIdx(next); setPrompt(promptHistory[next] ?? '')
        }
        if (e.key === 'ArrowDown' && historyIdx >= 0) {
            e.preventDefault()
            const next = historyIdx - 1
            setHistoryIdx(next); setPrompt(next < 0 ? '' : promptHistory[next])
        }
    }

    const InputCard = (
        <div className={`gen-card ${focused ? 'focused' : ''}`} style={{ width: '100%' }}>
            {/* Asset shelf */}
            <div style={{ padding: '12px 16px 12px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', borderBottom: '1px solid var(--border)' }}>
                {images.map((img, i) => (
                    <div key={`img-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div style={{ position: 'relative', width: 44, height: 44 }}>
                            <img src={img.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                            <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -5, right: -5, width: 14, height: 14, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={8} /></button>
                        </div>
                        <button onClick={() => tagInsert(`@image_file_${i + 1}`)} style={{ fontSize: 8, fontFamily: 'monospace', color: 'var(--indigo)', background: 'var(--indigo-light)', border: 'none', borderRadius: 4, padding: '1px 4px', cursor: 'pointer' }}>@img_{i + 1}</button>
                    </div>
                ))}
                {videos.map((vid, i) => (
                    <div key={`vid-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <div style={{ position: 'relative', width: 44, height: 44 }}>
                            <video src={vid.preview} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                            <button onClick={() => setVideos(prev => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -5, right: -5, width: 14, height: 14, borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={8} /></button>
                        </div>
                        <button onClick={() => tagInsert(`@video_file_${i + 1}`)} style={{ fontSize: 8, fontFamily: 'monospace', color: 'var(--teal)', background: 'var(--teal-light)', border: 'none', borderRadius: 4, padding: '1px 4px', cursor: 'pointer' }}>@vid_{i + 1}</button>
                    </div>
                ))}
                {images.length < 4 && (
                    <label style={{ width: 44, height: 44, borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed var(--border-hover)', background: 'var(--bg-input)' }} title="Add image (max 4)">
                        <ImageIcon size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 7, color: 'var(--text-muted)', marginTop: 1 }}>+IMG</span>
                        <input type="file" style={{ display: 'none' }} accept="image/*" multiple onChange={e => e.target.files && addImages(e.target.files)} />
                    </label>
                )}
                {videos.length < 3 && (
                    <label style={{ width: 44, height: 44, borderRadius: 8, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed var(--border-hover)', background: 'var(--bg-input)' }} title="Add video (max 3, each ≤15s)">
                        <VideoIcon size={13} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: 7, color: 'var(--text-muted)', marginTop: 1 }}>+VID</span>
                        <input type="file" style={{ display: 'none' }} accept="video/*" multiple onChange={e => e.target.files && addVideos(e.target.files)} />
                    </label>
                )}
                {/* ── Rate-change banner (appears when video files are added) ── */}
                {hasVideoFiles && (
                    <div className="animate-fadeIn" style={{
                        width: '100%', marginTop: 4,
                        padding: '7px 12px', borderRadius: 10,
                        background: 'rgba(245,158,11,.08)',
                        border: '1px solid rgba(245,158,11,.25)',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <span style={{ fontSize: 15 }}>🎬</span>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b' }}>
                                Video reference detected — 2× rate active
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginTop: 1 }}>
                                Images only: {model === 'seedance_2.0_fast' ? '100' : '200'} pts/s &nbsp;→&nbsp;
                                <strong style={{ color: '#f59e0b' }}>
                                    With video: {model === 'seedance_2.0_fast' ? '200' : '400'} pts/s
                                </strong>
                                &nbsp;· Remove video refs to return to base rate
                            </span>
                        </div>
                    </div>
                )}
                {!hasVideoFiles && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 4 }}>
                        {'{Max 4 imgs · 3 vids ≤15s}'} · Adding video refs doubles the rate
                    </span>
                )}
            </div>
            {/* Prompt */}
            <div style={{ padding: '10px 16px 8px' }}>
                <textarea
                    ref={textaRef} rows={1} value={prompt}
                    onChange={e => { setPrompt(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe the scene and reference assets using @img_1, @vid_1… (↑ for history)"
                    disabled={isGenerating}
                    className="w-full resize-none bg-transparent outline-none border-none text-sm leading-relaxed"
                    style={{ color: 'var(--text)', minHeight: 24, maxHeight: 120, overflow: 'auto' }}
                />
            </div>
            <GenerationToolbar
                model={model} setModel={setModel} ratio={ratio} setRatio={setRatio}
                duration={duration} setDuration={setDuration}
                onGenerate={() => generate()} isLoading={isGenerating || uploading}
                canGenerate={!!prompt.trim()} hasVideoFiles={hasVideoFiles}
            />
        </div>
    )

    if (!hasMessages) return (
        <div style={{ height: '100%', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
            <div style={{ width: '100%', maxWidth: 660, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                        <Layers size={26} style={{ color: 'var(--indigo)' }} />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>Omni Reference</h2>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 360 }}>Add up to 4 images + 3 videos as references. Click the tag buttons to reference them in your prompt.</p>
                </div>
                {InputCard}
                <p style={{ fontSize: 10, color: 'var(--text-muted)' }}>Add assets · Enter to generate · ↑ for prompt history</p>
            </div>
        </div>
    )

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{ maxWidth: 680, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }} className="animate-fadeIn">
                        {/* User bubble */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                <div style={{ display: 'flex', gap: 4 }}>
                                    {msg.imageCount > 0 && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: 'var(--indigo-light)', color: 'var(--indigo)' }}>📷 {msg.imageCount} img{msg.imageCount > 1 ? 's' : ''}</span>}
                                    {msg.videoCount > 0 && <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 999, background: 'var(--teal-light)', color: 'var(--teal)' }}>🎬 {msg.videoCount} vid{msg.videoCount > 1 ? 's' : ''}</span>}
                                </div>
                                <div style={{ maxWidth: '75%', padding: '10px 16px', borderRadius: '18px 18px 4px 18px', background: 'var(--indigo)', color: '#fff', fontSize: 13 }}>{msg.prompt}</div>
                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>⚡ {msg.cost} pts</span>
                            </div>
                        </div>
                        {/* AI bubble */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--indigo)' }}><Sparkles size={14} color="#fff" /></div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                {(msg.status === 'uploading' || msg.status === 'generating') && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', gap: 5 }}>{[0, 1, 2].map(i => <span key={i} className="animate-pulse-s" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--indigo)', display: 'inline-block', animationDelay: `${i * .18}s` }} />)}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                                {msg.status === 'uploading'
                                                    ? `☁ Uploading assets… ${uploadProgress}%`
                                                    : <ElapsedTimer since={msg.createdAt} label="Generating" />}
                                            </span>
                                            {msg.status === 'uploading' && (
                                                <div style={{ width: 180, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                                                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--indigo)', borderRadius: 2, transition: 'width 0.3s ease' }} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {msg.status === 'completed' && msg.videoUrl && (
                                    <div className="animate-scaleIn" style={{ borderRadius: '18px 18px 18px 4px', overflow: 'hidden', border: '1px solid var(--border)', maxWidth: 460 }}>
                                        <VideoPlayer url={msg.videoUrl} />
                                    </div>
                                )}
                                {msg.status === 'error' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ padding: '10px 16px', borderRadius: '18px 18px 4px 18px', fontSize: 13, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#ef4444' }}>⚠ {msg.error}</div>
                                        <button onClick={() => generate(msg.prompt)} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                                            <RotateCcw size={11} /> Try Again
                                        </button>
                                    </div>
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
