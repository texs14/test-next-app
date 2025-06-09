'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/app/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) {
        const data = snap.data() as { name?: string }
        setName(data.name || '')
      }
    }
    load()
  }, [user])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (!user) return null

  return (
    <div className="relative" ref={menuRef}>
      <Link href="/profile" className="flex items-center gap-2">
        <img
          src={`https://i.pravatar.cc/40?u=${user.uid}`}
          alt="avatar"
          className="w-6 h-6 rounded-full"
        />
        <span>{name || user.email}</span>
      </Link>
      <button
        onClick={() => setOpen((o) => !o)}
        className="ml-1 text-xl leading-none"
        aria-label="Меню пользователя"
      >
        ▼
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 bg-white border rounded shadow">
          <Link
            href="/settings"
            className="block px-4 py-2 hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            Настройки
          </Link>
          <button
            onClick={() => {
              logout()
              setOpen(false)
            }}
            className="block w-full px-4 py-2 text-left hover:bg-gray-100"
          >
            Выход
          </button>
        </div>
      )}
    </div>
  )
}
