import Link from 'next/link'

export default function RefundPolicy() {
    return (
        <div className="min-h-screen p-8 sm:p-20 font-[family-name:var(--font-geist-sans)]" style={{ background: 'var(--bg-main)', color: 'var(--text)' }}>
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all mb-10" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    ← Back to Home
                </Link>

                <h1 className="text-4xl font-black tracking-tight mb-4 text-white">Refund & Return Policy</h1>
                <p className="text-sm font-bold mb-10" style={{ color: 'var(--text-muted)' }}>Last updated: February 28, 2026</p>

                <div className="space-y-8 text-sm/relaxed" style={{ color: 'var(--text-2)' }}>
                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">1. Core Policy</h2>
                        <p>At CutPulse, we provide digital subscription services that grant credits for AI video generation. Due to the immediate and irreversible nature of AI compute costs (GPU time), <strong>we generally do not offer refunds</strong> for used credits or active subscriptions.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">2. Subscription Cancellations</h2>
                        <p>You can cancel your subscription at any time. When you cancel, you will not be billed for the next cycle, and you will retain access to your plan and remaining points until the end of the current billing period.</p>
                        <p className="font-medium text-white">We do not provide prorated refunds or partial returns for unused time in a billing cycle.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">3. Accidental Charges and Exceptions</h2>
                        <p>We want to ensure our customers have a positive experience. We may grant a refund on a case-by-case basis under the following strict conditions:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Accidental Renewal:</strong> If your monthly or yearly plan renewed automatically and you completely forgot to cancel, you must request a refund within <strong>48 hours</strong> of the charge AND you must not have spent any points from that renewed billing cycle.</li>
                            <li><strong>Duplicate Charges:</strong> If a technical error resulted in you being billed twice for the same transaction.</li>
                            <li><strong>Service Outage:</strong> If CutPulse experiences a massive, multi-day technical failure making the service entirely inaccessible for a major portion of your billing cycle.</li>
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">4. Artificial Intelligence Generations</h2>
                        <p>Because AI generation involves unpredictable outcomes, we do not issue refunds for "poor quality" results or videos that did not align perfectly with your creative vision. The points are consumed directly by the compute resources required to process your request.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">5. How to Request a Refund</h2>
                        <p>If you believe you meet the criteria for an exception (such as an accidental renewal within 48 hours without point usage), please contact our support team immediately.</p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-black text-white">Contact Us</h2>
                        <p>To request a refund or cancel your subscription, please log into your account settings or contact us at <strong className="text-white">support@cutpulse.com</strong>.</p>
                    </section>
                </div>
            </div>
        </div>
    )
}
