'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { db } from '../firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'

export default function SettingsPage() {
  // Авторизация отключена
  /* const { user } = useAuth() */
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false) // Изменено на false, так как авторизация отключена

  /* useEffect(() => {
    if (!user) return
    const load = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) {
        const data = snap.data() as { name?: string }
        setName(data.name || '')
      }
      setLoading(false)
    }
    load()
  }, [user]) */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    /* if (!user) return
    await updateDoc(doc(db, 'users', user.uid), { name })
    alert('Имя обновлено') */
    alert('Авторизация отключена')
  }

  if (loading) return <p className="p-4">Загрузка...</p>

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Настройки профиля</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Имя</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded">
          Сохранить
        </button>
      </form>
    </div>
  )
}
