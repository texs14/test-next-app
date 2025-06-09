'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '@/app/firebase'
import { doc, getDoc } from 'firebase/firestore'
import Image from "next/image";

interface Props {
  classes?: string
}


export default function UserMenu({ classes } : Props) {
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
    <div className={`relative flex gap-2 ${classes}`} ref={menuRef}>
      <Link href="/profile" className="flex items-center gap-2">
        <Image
          src={`https://i.pravatar.cc/40?u=${user.uid}`}
          alt="avatar"
          className="w-6 h-6 rounded-full"
          width={30}
          height={30}
        />
        <span>{name || user.email}</span>
      </Link>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xl leading-none"
        aria-label="Меню пользователя"
      >
        ▼
      </button>
      {open && (
        <div className="absolute right-0 top-5 z-10 mt-2 bg-white border rounded shadow">
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
