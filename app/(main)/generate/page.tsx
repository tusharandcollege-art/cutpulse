'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Sparkles, PlayCircle, Copy, Check } from 'lucide-react'
import GenerationToolbar, { Model, Ratio, Duration, calcCost } from '@/components/GenerationToolbar'
import VideoPlayer from '@/components/VideoPlayer'
import { useVideoStore } from '@/hooks/useVideoStore'
import { useNotification } from '@/hooks/useNotification'
import { usePoints } from '@/hooks/usePoints'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ToastProvider'

type MsgStatus = 'generating' | 'completed' | 'error'

interface Message {
    id: string; prompt: string; status: MsgStatus
    videoUrl?: string; error?: string
    cost: number; model: Model; duration: number; ratio: string
}

/* ── Copy button ────────────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    const copy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }
    return (
        <button onClick={copy} title="Copy prompt"
            style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
                borderRadius: 6, color: copied ? '#22c55e' : 'var(--text-muted)',
                transition: 'color .2s', display: 'flex', alignItems: 'center',
            }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
    )
}

/* ── Chat bubble ────────────────────────────────────────────────── */
function ChatBubble({ msg }: { msg: Message }) {
    const modelName = msg.model === 'seedance_2.0_fast' ? 'Fast' : 'Quality'
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 680, margin: '0 auto' }}
            className="animate-fadeIn">
            {/* User bubble */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', gap: 6 }}>
                <CopyBtn text={msg.prompt} />
                <div style={{
                    maxWidth: '75%', padding: '10px 16px', fontSize: 14, lineHeight: 1.55,
                    borderRadius: '18px 18px 4px 18px',
                    background: 'var(--indigo)', color: '#fff',
                }}>
                    {msg.prompt}
                </div>
            </div>
            {/* Meta */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-pill)', padding: '2px 8px', borderRadius: 999 }}>
                    {modelName} · {msg.ratio} · {msg.duration}s · ⚡{msg.cost} cr
                </span>
            </div>
            {/* AI bubble */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                }}>
                    <Sparkles size={14} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    {msg.status === 'generating' && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 10,
                            padding: '10px 16px', borderRadius: '18px 18px 18px 4px',
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                        }}>
                            <div style={{ display: 'flex', gap: 5 }}>
                                {[0, 1, 2].map(i => (
                                    <span key={i} className="animate-pulse-s" style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        background: 'var(--indigo)', display: 'inline-block',
                                        animationDelay: `${i * 0.18}s`,
                                    }} />
                                ))}
                            </div>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Generating your video…</span>
                        </div>
                    )}
                    {msg.status === 'completed' && msg.videoUrl && (
                        <div className="animate-scaleIn" style={{
                            borderRadius: '18px 18px 18px 4px', overflow: 'hidden',
                            border: '1px solid var(--border)', maxWidth: 460,
                        }}>
                            <VideoPlayer url={msg.videoUrl} />
                        </div>
                    )}
                    {msg.status === 'error' && (
                        <div style={{
                            padding: '10px 16px', borderRadius: '18px 18px 18px 4px', fontSize: 13,
                            background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#ef4444',
                        }}>
                            ⚠ {msg.error || 'Generation failed. Please try again.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function GeneratePage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [prompt, setPrompt] = useState('')
    const s = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('cp-settings') || '{}') : {}
    const [model, setModel] = useState<Model>(s.defaultModel ?? 'seedance_2.0_fast')
    const [ratio, setRatio] = useState<Ratio>(s.defaultRatio ?? '16:9')
    const [duration, setDuration] = useState<Duration>(s.defaultDuration ?? 5)
    const [focused, setFocused] = useState(false)
    const [promptHistory, setPromptHistory] = useState<string[]>([])
    const [historyIdx, setHistoryIdx] = useState(-1)

    const chatRef = useRef<HTMLDivElement>(null)
    const textaRef = useRef<HTMLTextAreaElement>(null)
    const { save, update } = useVideoStore()
    const { notify, requestPermission } = useNotification()
    const { deductPoints, points } = usePoints()
    const { user } = useAuth()
    const { show: toast } = useToast()
    const hasMessages = messages.length > 0
    const isGenerating = messages.some(m => m.status === 'generating')

    // Auto-scroll
    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
    }, [messages])

    // Document title while generating
    useEffect(() => {
        document.title = isGenerating ? '⏳ Generating… — CutPulse' : 'CutPulse'
        return () => { document.title = 'CutPulse' }
    }, [isGenerating])

    // Save completed videos to store + send notification
    useEffect(() => {
        messages.forEach(msg => {
            if (msg.status === 'completed' && msg.videoUrl) {
                // Save to My Videos store
                save({
                    id: msg.id, prompt: msg.prompt, mode: 'text_to_video',
                    model: msg.model, ratio: msg.ratio, duration: msg.duration,
                    cost: msg.cost, videoUrl: msg.videoUrl,
                    createdAt: new Date().toISOString(),
                })
                // Browser notification
                notify('✅ Video Ready — CutPulse', `"${msg.prompt.slice(0, 60)}${msg.prompt.length > 60 ? '…' : ''}"`)
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages.map(m => m.status + m.id).join()])

    const generate = useCallback(async (override?: string) => {
        const text = (override ?? prompt).trim()
        if (!text || isGenerating) return

        // Points gate
        const cost = calcCost(model, duration, false)
        if (user && points < cost) {
            toast(`Not enough points — need ${cost} pts, you have ${points} pts`, 'error')
            return
        }

        requestPermission()
        const msgId = Date.now().toString()
        setMessages(prev => [...prev, { id: msgId, prompt: text, status: 'generating', cost, model, duration, ratio }])

        // Add pending record to My Videos immediately
        save({ id: msgId, prompt: text, mode: 'text_to_video', model, ratio, duration, cost, videoUrl: '', createdAt: new Date().toISOString(), status: 'pending' })

        if (!override) {
            setPromptHistory(h => [text, ...h.slice(0, 49)])
            setHistoryIdx(-1)
            setPrompt('')
            if (textaRef.current) textaRef.current.style.height = 'auto'
        }
        try {
            const res = await fetch('/api/video/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: text, model, ratio, duration, functionMode: 'text_to_video', filePaths: [], uid: user?.uid ?? null, cost }) })
            const data = await res.json()
            if (res.status === 429) throw new Error('Rate limited — please wait 30 seconds and try again')
            if (!res.ok) throw new Error(data.error || 'Failed')
            update(msgId, { taskId: data.task_id }) // save for resuming
            const poll = async () => {
                const s = await fetch('/api/video/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: data.task_id }) }).then(r => r.json())
                const st = s?.data?.status
                if (st === 'completed' || st === 'success') {
                    const videoUrl = s?.data?.result?.video_url
                    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'completed', videoUrl } : m))
                    update(msgId, { status: 'completed', videoUrl })   // ← update My Videos record
                    await deductPoints(cost, { mode: 'text_to_video', model, duration, prompt: text })
                    toast('✅ Video ready!', 'success')
                } else if (st === 'failed' || st === 'error') {
                    const errObj = s?.data?.error
                    const errStr = typeof errObj === 'string' ? errObj : JSON.stringify(errObj || '')
                    if (errStr.includes('2043') || errStr.includes('审核') || errStr.includes('review')) {
                        await deductPoints(cost, { mode: 'text_to_video', model, duration, prompt: text + ' (Failed: Safety Review)' })
                        throw new Error('Video did not pass safety review (points deducted).')
                    }
                    throw new Error(errObj?.message || errStr || 'Generation failed')
                } else { await new Promise(r => setTimeout(r, 3000)); await poll() }
            }
            await poll()
        } catch (e: unknown) {
            const errMsg = e instanceof Error ? e.message : 'Error'
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'error', error: errMsg } : m))
            update(msgId, { status: 'error', error: errMsg })
            toast(errMsg, 'error')
        }
    }, [prompt, model, ratio, duration, isGenerating, points, user, requestPermission, save, update, deductPoints, toast])

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value)
        e.target.style.height = 'auto'
        e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            generate()
            return
        }
        if (e.key === 'ArrowUp' && !prompt) {
            e.preventDefault()
            const next = Math.min(historyIdx + 1, promptHistory.length - 1)
            if (next >= 0) {
                setHistoryIdx(next)
                setPrompt(promptHistory[next])
            }
        }
        if (e.key === 'ArrowDown' && historyIdx >= 0) {
            e.preventDefault()
            const next = historyIdx - 1
            setHistoryIdx(next)
            setPrompt(next < 0 ? '' : promptHistory[next])
        }
    }

    const InputCard = (
        <div className={`gen-card ${focused ? 'focused' : ''}`} style={{ width: '100%' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '14px 16px 8px' }}>
                <textarea
                    ref={textaRef} rows={1} value={prompt} onChange={handleInput}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder={hasMessages ? 'Generate another video…' : 'Describe your cinematic vision…'}
                    disabled={isGenerating}
                    style={{
                        width: '100%', resize: 'none', background: 'transparent',
                        outline: 'none', border: 'none', color: 'var(--text)',
                        fontSize: 14, lineHeight: 1.6, minHeight: 24, maxHeight: 160, overflow: 'auto'
                    }}
                />
            </div>
            <GenerationToolbar
                model={model} setModel={setModel} ratio={ratio} setRatio={setRatio}
                duration={duration} setDuration={setDuration}
                onGenerate={() => generate()} isLoading={isGenerating} canGenerate={!!prompt.trim()}
            />
        </div>
    )

    /* ── Empty (centered) ────────────────────────────────────────── */
    if (!hasMessages) {
        const suggestions = [
            'Aerial drone over mountains at golden hour',
            'Neon cyberpunk city in heavy rain at midnight',
            'Flower blooming in extreme close-up macro',
            'Liquid metal flowing in slow motion',
        ]
        return (
            <div style={{ height: '100%', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
                <div style={{ width: '100%', maxWidth: 660, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', margin: '0 auto 12px' }}>
                            <PlayCircle size={26} style={{ color: 'var(--indigo)' }} />
                        </div>
                        <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginBottom: 5 }}>What will you create today?</h2>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Type a prompt and press Enter.</p>
                    </div>
                    {InputCard}
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: -10 }}>Enter to send · Shift+Enter for new line</p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: 8, width: '100%'
                    }}>
                        {suggestions.map((s, i) => (
                            <button key={i} onClick={() => { setPrompt(s); setTimeout(() => textaRef.current?.focus(), 0) }}
                                style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 14, fontSize: 11, lineHeight: 1.45, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer', transition: 'border-color .15s' }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,.4)')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                            >"{s}"</button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    /* ── Chat state ──────────────────────────────────────────────── */
    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: 'clamp(12px,4vw,24px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
                <div style={{ height: 4 }} />
            </div>
            <div style={{ flexShrink: 0, padding: 'clamp(8px,2vw,12px) clamp(12px,4vw,24px) clamp(14px,3vw,20px)', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                <div style={{ maxWidth: 680, margin: '0 auto' }}>
                    {InputCard}
                    <p style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                        Enter to send · Shift+Enter · ↑ history{isGenerating ? '' : ` · ${calcCost(model, duration, false)} pts/video`}
                    </p>
                </div>
            </div>
        </div>
    )
}
