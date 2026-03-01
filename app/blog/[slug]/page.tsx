import Link from 'next/link'
import { notFound } from 'next/navigation'
import { blogPosts, getPostBySlug } from '@/lib/blog-posts'
import type { Metadata } from 'next'

// ─── Static generation: build all posts at deploy time ────────────────────────
export function generateStaticParams() {
    return blogPosts.map(post => ({ slug: post.slug }))
}

// ─── Dynamic SEO metadata per post ────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const post = getPostBySlug(slug)
    if (!post) return { title: 'Post Not Found | CutPulse Blog' }
    return {
        title: `${post.title} | CutPulse Blog`,
        description: post.description,
        openGraph: {
            title: post.title,
            description: post.description,
            type: 'article',
            url: `https://cutpulse.com/blog/${post.slug}`,
            publishedTime: post.date,
            authors: ['CutPulse'],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.description,
        },
    }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const post = getPostBySlug(slug)
    if (!post) notFound()

    const relatedPosts = blogPosts.filter(p => p.slug !== post.slug).slice(0, 3)

    return (
        <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: 'var(--bg)', color: 'var(--text)' }}>
            {/* JSON-LD Article Schema for Google */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Article',
                        'headline': post.title,
                        'description': post.description,
                        'datePublished': post.date,
                        'publisher': {
                            '@type': 'Organization',
                            'name': 'CutPulse',
                            'url': 'https://cutpulse.com',
                        },
                        'mainEntityOfPage': {
                            '@type': 'WebPage',
                            '@id': `https://cutpulse.com/blog/${post.slug}`,
                        },
                    })
                }}
            />

            {/* Header */}
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
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Link href="/blog" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', textDecoration: 'none' }}>
                        ← All Articles
                    </Link>
                    <Link href="/generate" style={{
                        padding: '8px 18px', borderRadius: 999,
                        background: 'var(--accent)', color: '#fff',
                        fontWeight: 700, fontSize: 13, textDecoration: 'none',
                    }}>
                        Try Free →
                    </Link>
                </div>
            </header>

            {/* Article */}
            <article style={{ maxWidth: 760, margin: '0 auto', padding: '60px 40px' }}>
                {/* Meta */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{
                        padding: '4px 14px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                        background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                        color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                        {post.category}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>📅 {post.date}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>⏱ {post.readTime}</span>
                </div>

                {/* Title */}
                <h1 style={{
                    fontSize: 'clamp(28px, 4vw, 42px)',
                    fontWeight: 900, lineHeight: 1.15,
                    marginBottom: 24, letterSpacing: '-0.02em',
                }}>
                    {post.title}
                </h1>

                {/* Description (lead) */}
                <p style={{
                    fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.7,
                    marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 40,
                    fontStyle: 'italic',
                }}>
                    {post.description}
                </p>

                {/* Cover Emoji Hero */}
                <div style={{
                    width: '100%', height: 220, borderRadius: 16, marginBottom: 48,
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, var(--bg-card)), color-mix(in srgb, #7c3aed 15%, var(--bg-card)))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 96, border: '1px solid var(--border)',
                }}>
                    {post.coverEmoji}
                </div>

                {/* Article Content */}
                <div
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* CTA Box */}
                <div style={{
                    marginTop: 60, padding: '36px 40px', borderRadius: 20,
                    background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--bg-card)), color-mix(in srgb, #7c3aed 8%, var(--bg-card)))',
                    border: '1px solid color-mix(in srgb, var(--accent) 25%, var(--border))',
                    textAlign: 'center',
                }}>
                    <p style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Ready to try it yourself?</p>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 15 }}>
                        CutPulse is free to start. No credit card required.
                    </p>
                    <Link href="/generate" style={{
                        display: 'inline-block',
                        padding: '14px 32px', borderRadius: 12,
                        background: 'var(--accent)', color: '#fff',
                        fontWeight: 800, fontSize: 15, textDecoration: 'none',
                    }}>
                        Generate Your First AI Video →
                    </Link>
                </div>
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 40px 80px' }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24 }}>More Articles</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
                        {relatedPosts.map(p => (
                            <Link key={p.slug} href={`/blog/${p.slug}`} style={{ textDecoration: 'none' }}>
                                <div style={{
                                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                                    borderRadius: 14, overflow: 'hidden',
                                    transition: 'transform 0.2s',
                                }}
                                    className="blog-card-hover"
                                >
                                    <div style={{
                                        height: 80,
                                        background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 15%, var(--bg-card)), var(--bg-card))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 40,
                                    }}>
                                        {p.coverEmoji}
                                    </div>
                                    <div style={{ padding: 16 }}>
                                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            {p.category}
                                        </span>
                                        <p style={{ fontSize: 13, fontWeight: 700, marginTop: 6, lineHeight: 1.4, color: 'var(--text)' }}>
                                            {p.title.slice(0, 70)}{p.title.length > 70 ? '...' : ''}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Blog Article Styles */}
            <style>{`
                .blog-content { font-size: 16px; line-height: 1.8; color: var(--text-2, var(--text)); }
                .blog-content h2 { font-size: 26px; font-weight: 800; margin: 48px 0 16px; letter-spacing: -0.01em; color: var(--text); }
                .blog-content h3 { font-size: 19px; font-weight: 700; margin: 32px 0 12px; color: var(--text); }
                .blog-content p { margin-bottom: 20px; }
                .blog-content ul, .blog-content ol { margin: 0 0 20px 24px; }
                .blog-content li { margin-bottom: 8px; }
                .blog-content strong { font-weight: 700; color: var(--text); }
                .blog-content em { opacity: 0.85; }
                .blog-content blockquote { 
                    border-left: 3px solid var(--accent); 
                    padding: 16px 20px; 
                    margin: 24px 0;
                    background: color-mix(in srgb, var(--accent) 6%, transparent);
                    border-radius: 0 10px 10px 0;
                    font-style: italic;
                }
                .blog-card-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 40px -8px rgba(0,0,0,0.15); }
            `}</style>
        </div>
    )
}
