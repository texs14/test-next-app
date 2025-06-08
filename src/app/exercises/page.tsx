"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore'
import { db } from '@/app/firebase'
import type { Exercise } from '@/types/index.types'

interface ExerciseWithId extends Exercise {
  id: string
}

export default function Exercises() {
  const [exercises, setExercises] = useState<ExerciseWithId[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDocs(collection(db, 'exercises'))
      setExercises(snap.docs.map(d => ({ id: d.id, ...(d.data() as Exercise) })))
    }
    fetchData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить упражнение?')) return
    await deleteDoc(doc(db, 'exercises', id))
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="w-full max-w-3xl p-4 mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Упражнения</h1>
      <button
        onClick={() => router.push('/exercises/new')}
        className="px-4 py-2 text-white bg-blue-600 rounded"
      >
        Добавить упражнение
      </button>
      {exercises.map(ex => (
        <div key={ex.id} className="p-4 space-y-2 border rounded">
          <h2 className="text-lg font-bold">{ex.title}</h2>
          <p>{ex.description}</p>
          <p className="text-sm text-gray-600">
            Тема: {ex.topic} | Сложность: {ex.difficulty}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/exercises/${ex.id}`)}
              className="px-3 py-1 text-white bg-green-600 rounded"
            >
              Открыть
            </button>
            <button
              onClick={() => router.push(`/exercises/${ex.id}/edit`)}
              className="px-3 py-1 text-white bg-blue-600 rounded"
            >
              Редактировать
            </button>
            <button
              onClick={() => handleDelete(ex.id)}
              className="px-3 py-1 text-white bg-red-600 rounded"
            >
              Удалить
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
