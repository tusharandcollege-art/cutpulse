'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const Ctx = createContext<{ theme: string; toggle: () => void }>({ theme: 'dark', toggle: () => { } })
export const useTheme = () => useContext(Ctx)

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState('light')

    useEffect(() => {
        const saved = localStorage.getItem('cp-theme') || 'light'
        setTheme(saved)
        document.documentElement.setAttribute('data-theme', saved)
    }, [])

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark'
        setTheme(next)
        document.documentElement.setAttribute('data-theme', next)
        localStorage.setItem('cp-theme', next)
    }

    return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>
}
