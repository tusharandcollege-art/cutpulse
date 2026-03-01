'use client'

import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="w-full border-t flex flex-col sm:flex-row items-center justify-between px-6 py-4 text-xs mt-auto" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <div className="mb-4 sm:mb-0">
                &copy; {new Date().getFullYear()} CutPulse. All rights reserved.
            </div>
            <div className="flex items-center gap-6 font-medium">
                <Link href="/about" className="hover:text-white transition-colors" style={{ textDecoration: 'none' }}>About Us</Link>
                <Link href="/blog" className="hover:text-white transition-colors" style={{ textDecoration: 'none' }}>Blog</Link>
                <Link href="/terms" className="hover:text-white transition-colors" style={{ textDecoration: 'none' }}>Terms of Service</Link>
                <Link href="/privacy" className="hover:text-white transition-colors" style={{ textDecoration: 'none' }}>Privacy Policy</Link>
                <Link href="/refund" className="hover:text-white transition-colors" style={{ textDecoration: 'none' }}>Refund Policy</Link>
            </div>
        </footer>
    )
}
