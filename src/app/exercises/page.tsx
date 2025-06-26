"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { exerciseService } from '@/lib/exerciseService'
import ExercisePreview from '@/components/ExercisePreview'
import type { ExercisePreview as ExercisePreviewType } from '@/types/index.types'

// Моковые упражнения для fallback в случае ошибки
const mockExerciseList: ExercisePreviewType[] = [
  {
    id: '1',
    title: 'Основы тайского языка',
    description: 'Изучаем базовые фразы на тайском языке',
    difficulty: 'easy'
  },
  {
    id: '2',
    title: 'Числа на тайском',
    description: 'Учимся считать от 1 до 10',
    difficulty: 'easy'
  }
]

export default function Exercises() {
  const [exercises, setExercises] = useState<ExercisePreviewType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Получаем только превью упражнений
        const exercisePreviews = await exerciseService.getExercisePreviews()
        setExercises(exercisePreviews)
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

  const handleDelete = (id: string) => {
    setExercises(prev => prev.filter(e => e.id !== id))
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exercises.map(exercise => (
            <ExercisePreview
              key={exercise.id}
              exercise={exercise}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
