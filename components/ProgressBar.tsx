'use client'

type Status = 'idle' | 'loading' | 'generating' | 'completed' | 'error'

interface ProgressBarProps {
    status: Status
    message?: string
}

export default function ProgressBar({ status, message }: ProgressBarProps) {
    if (status === 'idle') return null

    const cfg = {
        loading: { label: 'Preparing your request…', width: '15%', color: '#555' },
        generating: { label: message || 'Generating your video…', width: '60%', color: 'var(--brand)' },
        completed: { label: 'Video ready! 🎉', width: '100%', color: 'var(--brand)' },
        error: { label: 'Something went wrong', width: '100%', color: '#f87171' },
    }[status]

    if (!cfg) return null

    const isGenerating = status === 'generating'

    return (
        <div className="w-full mt-3 animate-fadeIn">
            <div className="flex items-center gap-2 mb-2">
                {(isGenerating || status === 'loading') && (
                    <span
                        className="inline-block w-2 h-2 rounded-full animate-pulse2"
                        style={{ background: 'var(--brand)' }}
                    />
                )}
                <span
                    className="text-sm font-medium"
                    style={{ color: status === 'error' ? '#f87171' : status === 'completed' ? 'var(--brand)' : 'var(--text-muted)' }}
                >
                    {cfg.label}
                </span>
            </div>

            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                {isGenerating ? (
                    <div className="shimmer-bar h-full rounded-full" style={{ width: cfg.width }} />
                ) : (
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: cfg.width, background: cfg.color }}
                    />
                )}
            </div>
        </div>
    )
}
