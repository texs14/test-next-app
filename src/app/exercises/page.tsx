"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore'
import { db } from '@/app/firebase'
import type { Exercise } from '@/types/index.types'

interface ExerciseWithId extends Exercise {
  id: string
}

// Моковые упражнения для fallback в случае ошибки
const mockExerciseList: ExerciseWithId[] = [
  {
    id: '1',
    title: 'Основы тайского языка',
    description: 'Изучаем базовые фразы на тайском языке',
    topic: 'Базовый словарь',
    difficulty: 'easy',
    sentences: []
  },
  {
    id: '2',
    title: 'Числа на тайском',
    description: 'Учимся считать от 1 до 10',
    topic: 'Числа',
    difficulty: 'easy',
    sentences: []
  }
]

export default function Exercises() {
  const [exercises, setExercises] = useState<ExerciseWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const snap = await getDocs(collection(db, 'exercises'))
        const exercisesFromDb = snap.docs.map(d => ({ 
          id: d.id, 
          ...(d.data() as Exercise) 
        }))
        setExercises(exercisesFromDb)
      } catch (error) {
        console.error('Ошибка загрузки упражнений:', error)
        setError('Не удалось загрузить упражнения из базы данных')
        // Fallback на моковые данные
        setExercises(mockExerciseList)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить упражнение?')) return
    
    try {
      await deleteDoc(doc(db, 'exercises', id))
      setExercises(prev => prev.filter(e => e.id !== id))
    } catch (error) {
      console.error('Ошибка удаления упражнения:', error)
      alert('Не удалось удалить упражнение')
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-3xl p-4 mx-auto">
        <div className="flex items-center justify-center h-32">
          <div className="text-lg">Загрузка упражнений...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl p-4 mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Упражнения</h1>
      
      {error && (
        <div className="p-3 text-red-700 bg-red-100 border border-red-300 rounded">
          {error}
        </div>
      )}
      
      <button
        onClick={() => router.push('/exercises/new')}
        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
      >
        Добавить упражнение
      </button>
      
      {exercises.length === 0 ? (
        <div className="p-4 text-center text-gray-500 border rounded">
          Упражнения не найдены. Создайте первое упражнение!
        </div>
      ) : (
        exercises.map(ex => (
          <div key={ex.id} className="p-4 space-y-2 border rounded shadow-sm">
            <h2 className="text-lg font-bold">{ex.title}</h2>
            <p className="text-gray-700">{ex.description}</p>
            <p className="text-sm text-gray-600">
              Тема: {ex.topic} | Сложность: {ex.difficulty}
              {ex.sentences && ex.sentences.length > 0 && (
                <span> | Предложений: {ex.sentences.length}</span>
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/exercises/${ex.id}`)}
                className="px-3 py-1 text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
              >
                Открыть
              </button>
              <button
                onClick={() => router.push(`/exercises/${ex.id}/edit`)}
                className="px-3 py-1 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Редактировать
              </button>
              <button
                onClick={() => handleDelete(ex.id)}
                className="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
