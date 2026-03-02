'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function OldAffiliatePage() {
    const router = useRouter()
    useEffect(() => { router.replace('/affiliate') }, [router])
    return null
}
