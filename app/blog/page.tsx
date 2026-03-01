import Link from 'next/link'
import { blogPosts } from '@/lib/blog-posts'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Blog — AI Video Generation Tips, Guides & News | CutPulse',
    description: 'Learn how to create stunning AI videos with guides, prompt tips, and tutorials from the CutPulse team. Text to video, image to video, and more.',
    openGraph: {
        title: 'CutPulse Blog — AI Video Guides & Tips',
        description: 'Expert guides on AI video generation. Learn prompting, editing, and creative techniques to make stunning AI videos in 2025.',
        type: 'website',
        url: 'https://cutpulse.com/blog',
    },
}

export default function BlogPage() {
    return (
        <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: 'var(--bg)', color: 'var(--text)' }}>
            {/* Header Nav */}
            <header style={{
                padding: '20px 40px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'var(--bg)',
                backdropFilter: 'blur(12px)',
            }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16,
                    }}>✂</div>
                    <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>CutPulse</span>
                </Link>
                <Link href="/generate" style={{
                    padding: '8px 18px',
                    borderRadius: 999,
                    background: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none',
                }}>
                    Try Free →
                </Link>
            </header>

            {/* Hero */}
            <div style={{ padding: '72px 40px 48px', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 16px', borderRadius: 999,
                    background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
                    fontSize: 12, fontWeight: 700, color: 'var(--accent)',
                    marginBottom: 24,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
                    📚 CutPulse Blog
                </div>
                <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em' }}>
                    AI Video Guides,<br />Tips & Tutorials
                </h1>
                <p style={{ fontSize: 17, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
                    Everything you need to become an expert at AI video generation — from beginner guides to advanced prompt engineering.
                </p>
            </div>

            {/* Posts Grid */}
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px 80px' }}>
                {/* Featured Post */}
                <Link href={`/blog/${blogPosts[0].slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 32 }}>
                    <article style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 20,
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                    }}
                        className="blog-card-hover"
                    >
                        <div style={{
                            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, var(--bg-card)), color-mix(in srgb, #7c3aed 15%, var(--bg-card)))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 96, minHeight: 280,
                        }}>
                            {blogPosts[0].coverEmoji}
                        </div>
                        <div style={{ padding: '40px 40px' }}>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
                                <span style={{
                                    padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                                    background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                                    color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em',
                                }}>
                                    Featured
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                                    {blogPosts[0].category}
                                </span>
                            </div>
                            <h2 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.3, marginBottom: 14, color: 'var(--text)' }}>
                                {blogPosts[0].title}
                            </h2>
                            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 24 }}>
                                {blogPosts[0].description}
                            </p>
                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                                <span>📅 {blogPosts[0].date}</span>
                                <span>⏱ {blogPosts[0].readTime}</span>
                            </div>
                        </div>
                    </article>
                </Link>

                {/* Other Posts Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                    {blogPosts.slice(1).map((post) => (
                        <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                            <article style={{
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 16,
                                overflow: 'hidden',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                                className="blog-card-hover"
                            >
                                <div style={{
                                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 15%, var(--bg-card)), color-mix(in srgb, #7c3aed 10%, var(--bg-card)))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 64, height: 140,
                                }}>
                                    {post.coverEmoji}
                                </div>
                                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <span style={{
                                        fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                                        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'block',
                                    }}>
                                        {post.category}
                                    </span>
                                    <h2 style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.4, marginBottom: 12, color: 'var(--text)', flex: 1 }}>
                                        {post.title}
                                    </h2>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                                        {post.description.slice(0, 100)}...
                                    </p>
                                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                                        <span>📅 {post.date}</span>
                                        <span>⏱ {post.readTime}</span>
                                    </div>
                                </div>
                            </article>
                        </Link>
                    ))}
                </div>
            </div>

            <style>{`
                .blog-card-hover:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 40px -8px rgba(0,0,0,0.15);
                }
            `}</style>
        </div>
    )
}
