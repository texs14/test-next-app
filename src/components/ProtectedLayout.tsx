'use client'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading) {
      if (!user && pathname !== '/login' && pathname !== '/register') {
        router.push('/login')
      } else if (user && (pathname === '/login' || pathname === '/register')) {
        router.push('/')
      }
    }
  }, [user, loading, pathname, router])

  if (loading || (!user && pathname !== '/login' && pathname !== '/register')) {
    return null
  }

  return <>{children}</>
}
