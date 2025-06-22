'use client'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import UserMenu from './UserMenu'

export default function Nav() {
  // Авторизация отключена
  /* const { user } = useAuth()

  if (!user) return null */

  return (
    <nav className="flex items-center justify-center gap-4 mt-3">
      <Link href="/" className='ml-auto'>Домой</Link>
      <Link href="/videos">Видео</Link>
      <Link href="/exercises">Упражнения</Link>
      <Link href="/syllables">Собираем слоги</Link>
      <Link href="/upload">Загрузить видео</Link>
      {/* <UserMenu classes='ml-auto mr-6'/> */}
    </nav>
  )
}
