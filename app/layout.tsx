import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata: Metadata = {
    title: 'CutPulse — AI Video Studio',
    description: 'AI Video Generation powered by Seedance 2.0 · CutPulse Studio',
}

const GA_ID = 'AW-17985390147'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" data-theme="light" suppressHydrationWarning>
            <body>
                {/* ── Google Ads Tag ────────────────────────────── */}
                <Script
                    src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
                    strategy="afterInteractive"
                />
                <Script id="google-ads-init" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', '${GA_ID}');
                    `}
                </Script>

                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    )
}
