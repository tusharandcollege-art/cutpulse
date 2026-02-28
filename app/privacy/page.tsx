import Link from 'next/link'

export default function PrivacyPolicy() {
    return (
        <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', padding: '32px 80px', background: 'var(--bg)', color: 'var(--text)' }}>
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all mb-10" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    ← Back to Home
                </Link>

                <h1 className="text-4xl font-black tracking-tight mb-4" style={{ color: 'var(--text)' }}>Privacy Policy</h1>
                <p className="text-sm font-bold mb-10" style={{ color: 'var(--text-muted)' }}>Last updated: February 28, 2026</p>

                <div className="space-y-8 text-sm/relaxed" style={{ color: 'var(--text-2)' }}>
                    <section className="space-y-3">
                        <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>1. Introduction</h2>
                        <p>This Privacy Policy explains how CutPulse (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and protects your information when you use our website and services.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>2. Information We Collect</h2>
                        <p>We may collect the following types of information:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Account Information:</strong> Name, email address, password, and Google account details if logging in via OAuth.</li>
                            <li><strong>Payment Information:</strong> We do NOT store your credit card details. All transactions are securely processed by third-party payment gateways (Cashfree, Stripe, Lemon Squeezy, Dodo Payments, NOWPayments).</li>
                            <li><strong>Session &amp; Usage Data:</strong> Your video generation prompts, uploaded reference images, timestamps, and IP addresses for security and to improve AI outputs.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>3. How We Use Your Information</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>To provide, maintain, and improve our services.</li>
                            <li>To process your transactions and manage your point balance securely.</li>
                            <li>To send you important system updates, security alerts, and support messages.</li>
                            <li>To monitor for fraud, spam, or abusive content generation that violates our Terms of Service.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>4. Data Sharing and Third Parties</h2>
                        <p>We do NOT sell your personal data to advertisers. We only share information with:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Cloud Providers:</strong> To host the website and store your generated videos securely.</li>
                            <li><strong>Payment Processors:</strong> To complete financial transactions.</li>
                            <li><strong>AI Partners:</strong> When generating videos, your prompts and reference assets are securely transmitted to our backend AI infrastructure for processing.</li>
                            <li><strong>Law Enforcement:</strong> If legally required or to prevent serious harm.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>5. Cookies and Tracking</h2>
                        <p>We use essential cookies to keep you signed in securely. We may also use analytics cookies (e.g., Google Analytics) to understand how users navigate the site to improve the design.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>6. Data Deletion and Your Rights</h2>
                        <p>You have the right to request access, correction, or deletion of your personal data. If you wish to delete your CutPulse account and all associated video data, please email us from the address tied to your account.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>7. Young Users</h2>
                        <p>Our service is not intended for individuals under 13. We do not knowingly collect personal data from children.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>Contact Us</h2>
                        <p>For privacy inquiries or to exercise your data rights, please contact us at <strong style={{ color: 'var(--text)' }}>support@cutpulse.com</strong>.</p>
                    </section>
                </div>
            </div>
        </div>
    )
}
