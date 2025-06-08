'use client'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Nav() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <nav className="flex gap-4 justify-center">
      <Link href="/">Домой</Link>
      <Link href="/videos">Видео</Link>
      <Link href="/exercises">Упражнения</Link>
      <Link href="/upload">Загрузить видео</Link>
      <button onClick={logout}>Выйти</button>
    </nav>
  )
}
