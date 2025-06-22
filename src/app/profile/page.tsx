'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

interface UserInfo {
  name: string
  age: number
  login: string
}

export default function ProfilePage() {
  // Авторизация отключена
  /* const { user } = useAuth() */
  const [info, setInfo] = useState<UserInfo | null>({
    name: 'Тестовый пользователь',
    age: 25,
    login: 'test_user'
  }) // Заглушка для демонстрации

  /* useEffect(() => {
    if (!user) return
    const load = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) {
        setInfo(snap.data() as UserInfo)
      }
    }
    load()
  }, [user]) */

  if (!info) {
    return <p className="p-4">Загрузка...</p>
  }

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-2xl font-bold">Профиль пользователя</h1>
      <p>
        <strong>Имя:</strong> {info.name}
      </p>
      <p>
        <strong>Возраст:</strong> {info.age}
      </p>
      <p>
        <strong>Логин:</strong> {info.login}
      </p>
    </div>
  )
}
