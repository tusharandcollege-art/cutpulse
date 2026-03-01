import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'About CutPulse — Seedance 2.0 Powered AI Video Studio',
    description: 'CutPulse is an Indian AI video generation platform powered by Seedance 2.0. Learn our story, why we chose Seedance 2.0, and who we built this for.',
    openGraph: {
        title: 'About CutPulse — Seedance 2.0 AI Video Studio Made in India',
        description: 'Small indie team from India. Big technology. We built CutPulse on Seedance 2.0 so anyone can create professional AI videos without expensive cameras or editors.',
        type: 'website',
        url: 'https://cutpulse.com/about',
    },
    keywords: ['Seedance 2.0', 'CutPulse', 'AI video generator India', 'Seedance 2.0 video generator', 'about CutPulse', 'AI video India'],
}

export default function AboutPage() {
    return (
        <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: 'var(--bg)', color: 'var(--text)' }}>
            {/* JSON-LD for Google */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Organization',
                        'name': 'CutPulse',
                        'url': 'https://cutpulse.com',
                        'description': 'AI video generation platform powered by Seedance 2.0, made in India',
                        'foundingLocation': 'India',
                        'contactPoint': { '@type': 'ContactPoint', 'email': 'support@cutpulse.com' },
                    })
                }}
            />

            {/* Header */}
            <header style={{
                padding: '16px 40px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)',
            }}>
                {/* Logo */}
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>✂</div>
                    <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>CutPulse</span>
                </Link>

                {/* Nav Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link href="/blog" style={{
                        fontSize: 13, fontWeight: 600,
                        color: 'var(--text-muted)', textDecoration: 'none',
                        padding: '7px 14px', borderRadius: 8,
                    }}>Blog</Link>

                    <Link href="/" style={{
                        fontSize: 13, fontWeight: 600,
                        color: 'var(--text-muted)', textDecoration: 'none',
                        padding: '7px 14px', borderRadius: 8,
                        border: '1px solid var(--border)',
                    }}>← Homepage</Link>

                    <Link href="/generate" style={{
                        padding: '8px 20px', borderRadius: 999,
                        background: '#6d28d9', color: '#ffffff',
                        fontWeight: 700, fontSize: 13, textDecoration: 'none',
                    }}>Open App →</Link>
                </div>
            </header>

            {/* Content */}
            <article style={{ maxWidth: 720, margin: '0 auto', padding: '60px 40px 100px' }}>

                {/* Badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 16px', borderRadius: 999, marginBottom: 32,
                    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                    fontSize: 12, fontWeight: 700, color: 'var(--accent)',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                    🇮🇳 Made in India
                </div>

                <h1 style={{ fontSize: 'clamp(30px, 5vw, 46px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 48, letterSpacing: '-0.02em' }}>
                    About CutPulse<br />
                    <span style={{ color: 'var(--accent)' }}>Powered by Seedance 2.0</span>
                </h1>

                <div className="about-content">

                    <p>We are just two-three people sitting in India who got frustrated with paying for video editors.</p>

                    <p>Seriously. You give someone ₹4,000, wait 4 days, the video comes and it&apos;s just okay. Not great. Not terrible. Just okay. And then you need another video next week and you do the whole thing again.</p>

                    <p>That&apos;s why we made CutPulse.</p>

                    <p>CutPulse is an AI video generator powered by <strong>Seedance 2.0</strong>. You write what you want to see, and Seedance 2.0 makes the video for you. No camera, no editor, nobody to chase on WhatsApp.</p>

                    <h2>Why Seedance 2.0 Specifically?</h2>

                    <p>Because we tried many models and honestly most of them look fake. You can always tell it&apos;s AI. The motion is slightly wrong, the camera movement is robotic, things move like they are underwater.</p>

                    <p><strong>Seedance 2.0 is different.</strong></p>

                    <p>When we first tested Seedance 2.0, one of us actually asked &quot;wait is this AI?&quot; That&apos;s the moment we decided to build CutPulse on top of Seedance 2.0 and nothing else.</p>

                    <p>Seedance 2.0 understands how things actually move in real life. Wind, water, camera angles, lighting, it all looks real. Not perfect — real. There is a difference.</p>

                    <p>Seedance 2.0 also supports all the generation types we wanted to offer:</p>

                    <ul>
                        <li><strong>Text to Video</strong> — describe a scene and Seedance 2.0 brings it to life</li>
                        <li><strong>Image to Video</strong> — upload any photo and animate it with Seedance 2.0</li>
                        <li><strong>Frames to Video</strong> — give start and end frame, Seedance 2.0 fills the middle</li>
                        <li><strong>All-Rounder Mode</strong> — mix images, videos and text for complex scenes</li>
                    </ul>

                    <p>No other model at this price point gives you what Seedance 2.0 gives you. That is our honest opinion after months of testing.</p>

                    {/* Mid-article CTA 1 */}
                    <div style={{ margin: '28px 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <Link href="/generate" style={{
                            display: 'inline-block', padding: '12px 24px', borderRadius: 10,
                            background: '#6d28d9', color: '#ffffff',
                            fontWeight: 700, fontSize: 14, textDecoration: 'none',
                        }}>
                            🎬 Try Text to Video Free →
                        </Link>
                        <Link href="/image-to-video" style={{
                            display: 'inline-block', padding: '12px 24px', borderRadius: 10,
                            background: 'transparent', color: 'var(--text)',
                            fontWeight: 700, fontSize: 14, textDecoration: 'none',
                            border: '1px solid var(--border)',
                        }}>
                            🖼️ Try Image to Video →
                        </Link>
                    </div>

                    <h2>Who is CutPulse For?</h2>

                    <p>Honestly? Anyone in India who needs videos and doesn&apos;t want to spend thousands for it.</p>

                    <p>Content creators who post daily. Small business owners who want product videos. Students making projects. Marketing people who need 10 videos not next month, this week.</p>

                    <p>If you have ₹200 and a decent idea, CutPulse with Seedance 2.0 can make something that looks like it cost 50x more. That&apos;s not marketing talk, we genuinely believe this.</p>

                    {/* Mid-article CTA 2 */}
                    <div style={{ margin: '28px 0', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <Link href="/generate" style={{
                            display: 'inline-block', padding: '12px 24px', borderRadius: 10,
                            background: '#6d28d9', color: '#ffffff',
                            fontWeight: 700, fontSize: 14, textDecoration: 'none',
                        }}>
                            ✨ Start Creating for Free
                        </Link>
                        <Link href="/pricing" style={{
                            display: 'inline-block', padding: '12px 24px', borderRadius: 10,
                            background: 'transparent', color: 'var(--text)',
                            fontWeight: 700, fontSize: 14, textDecoration: 'none',
                            border: '1px solid var(--border)',
                        }}>
                            See Pricing →
                        </Link>
                    </div>

                    <h2>A Bit About Us</h2>

                    <p>We are a small indie team, based in India, no big funding, no fancy office. We started CutPulse because we knew Seedance 2.0 was something special and we wanted regular people to actually be able to use it without paying in dollars or figuring out complicated APIs.</p>

                    <p>We are still building, still fixing bugs (yes we know, we are working on it), still adding features. But we are proud of what CutPulse can already do with Seedance 2.0.</p>

                    <h2>Our Mission</h2>

                    <p>Make Seedance 2.0 quality video creation affordable and simple for every creator in India and beyond.</p>

                    <p>Video is the most powerful way to communicate in 2025. It should not be locked behind expensive cameras and production teams. With Seedance 2.0 powering CutPulse, now it is not.</p>

                    <h2>Say Hello</h2>

                    <p>If anything is broken or you just want to say hi, email us at <strong>support@cutpulse.com</strong></p>

                    <p>We actually read those emails.</p>

                    <p style={{ marginTop: 8 }}>— CutPulse Team 🇮🇳</p>
                </div>

                {/* CTA */}
                <div style={{
                    marginTop: 56, padding: '40px 40px', borderRadius: 20, textAlign: 'center',
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--bg-card)), color-mix(in srgb, #7c3aed 8%, var(--bg-card)))',
                    border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--border))',
                }}>
                    <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>Try Seedance 2.0 for free</p>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14, lineHeight: 1.6 }}>
                        No credit card. No complicated setup.<br />Just open the app and start generating.
                    </p>
                    {/* Two clear buttons */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/generate" style={{
                            display: 'inline-block', padding: '14px 32px', borderRadius: 12,
                            background: '#6d28d9', color: '#ffffff', fontWeight: 800, fontSize: 15, textDecoration: 'none',
                        }}>
                            🎬 Start Generating Videos
                        </Link>
                        <Link href="/" style={{
                            display: 'inline-block', padding: '14px 32px', borderRadius: 12,
                            background: 'transparent', color: 'var(--text)', fontWeight: 700, fontSize: 15,
                            textDecoration: 'none', border: '1px solid var(--border)',
                        }}>
                            ← Go to Homepage
                        </Link>
                    </div>
                </div>
            </article>

            <style>{`
                .about-content { font-size: 16px; line-height: 1.85; }
                .about-content p { margin-bottom: 20px; }
                .about-content h2 { font-size: 24px; font-weight: 800; margin: 44px 0 14px; letter-spacing: -0.01em; color: var(--text); }
                .about-content ul { margin: 0 0 20px 22px; }
                .about-content li { margin-bottom: 10px; }
                .about-content strong { font-weight: 700; color: var(--text); }
            `}</style>
        </div>
    )
}
