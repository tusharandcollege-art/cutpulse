import Link from 'next/link'

export default function TermsOfService() {
    return (
        <div className="min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]" style={{ background: 'var(--bg-main)', color: 'var(--text)' }}>
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all mb-10" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    ← Back to Home
                </Link>

                <h1 className="text-4xl font-black tracking-tight mb-4 text-white">Terms of Service</h1>
                <p className="text-sm font-bold mb-10" style={{ color: 'var(--text-muted)' }}>Last updated: February 28, 2026</p>

                <div className="space-y-8 text-sm/relaxed" style={{ color: 'var(--text-2)' }}>
                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">1. Acceptance of Terms</h2>
                        <p>By accessing and using CutPulse ("we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">2. Description of Service</h2>
                        <p>CutPulse is a SaaS platform providing AI-powered video generation tools. We offer access to these tools through a point-based subscription model. We reserve the right to modify, suspend, or discontinue the service at any time without prior notice.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">3. Accounts and Subscriptions</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>You must provide accurate information when creating an account.</li>
                            <li>You are responsible for maintaining the security of your account and password.</li>
                            <li>Subscriptions are billed in advance on a monthly or yearly basis and are non-refundable for the active billing period.</li>
                            <li>You can cancel your subscription at any time. Your access will continue until the end of your current billing cycle.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">4. Acceptable Use and Content Policies</h2>
                        <p>You retain all rights to the content you generate using our service. However, you agree NOT to use CutPulse to generate:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Content that is illegal, abusive, harassing, or harmful.</li>
                            <li>Deepfakes or content intended to deceive or impersonate real individuals.</li>
                            <li>Content that infringes on third-party intellectual property or copyright.</li>
                            <li>Explicitly adult, violent, or highly sensitive material.</li>
                        </ul>
                        <p>We reserve the right to ban accounts that violate these terms.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">5. Intellectual Property</h2>
                        <p>The CutPulse brand, website design, original code, logos, and infrastructure are the intellectual property of CutPulse. Access to our service does not grant you ownership of our platform.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">6. Limitation of Liability</h2>
                        <p>CutPulse is provided "as is". We make no warranties regarding the uptime or specific quality of the AI-generated outputs. In no event shall we be liable for any indirect, incidental, or consequential damages resulting from your use of the service.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">7. Changes to Terms</h2>
                        <p>We may update these terms from time to time. We will notify you of any changes by posting the new Terms of Service on this page. Continued use of the service constitutes acceptance of the new terms.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">Contact Us</h2>
                        <p>If you have any questions about these Terms, please contact us at <strong className="text-white">support@cutpulse.com</strong>.</p>
                    </section>
                </div>
            </div>
        </div>
    )
}
