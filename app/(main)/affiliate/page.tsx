'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AffiliateRedirect() {
    const router = useRouter()
    useEffect(() => { router.replace('/affiliates') }, [router])
    return null
}
