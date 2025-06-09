'use client'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import UserMenu from './UserMenu'

export default function Nav() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <nav className="flex items-center justify-center gap-4">
      <Link href="/">Домой</Link>
      <Link href="/videos">Видео</Link>
      <Link href="/exercises">Упражнения</Link>
      <Link href="/upload">Загрузить видео</Link>
      <UserMenu />
    </nav>
  )
}
