'use client'

import { useRouter } from 'next/navigation'
import { exerciseService } from '@/lib/exerciseService'
import type { ExercisePreview as ExercisePreviewType } from '@/types/index.types'

interface ExercisePreviewProps {
  exercise: ExercisePreviewType
  onDelete: (id: string) => void
}

export default function ExercisePreview({ exercise, onDelete }: ExercisePreviewProps) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('Удалить упражнение?')) return
    
    try {
      await exerciseService.deleteExercise(exercise.id)
      onDelete(exercise.id)
    } catch (error) {
      console.error('Ошибка удаления упражнения:', error)
      alert('Не удалось удалить упражнение')
    }
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'medium':
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'hard':
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
      case 'beginner':
        return 'Начинающий'
      case 'medium':
      case 'intermediate':
        return 'Средний'
      case 'hard':
      case 'advanced':
        return 'Продвинутый'
      default:
        return difficulty || 'Не указано'
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return ''
    
    try {
      // Обрабатываем Firestore Timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return ''
    }
  }

  return (
    <div className="p-4 space-y-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start">
        <h2 className="text-lg font-bold text-gray-900 flex-1 mr-3">{exercise.title}</h2>
        {exercise.difficulty && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
            {getDifficultyLabel(exercise.difficulty)}
          </span>
        )}
      </div>
      
      <p className="text-gray-700 text-sm leading-relaxed">{exercise.description}</p>
      
      {exercise.createdAt && (
        <p className="text-xs text-gray-500">
          Создано: {formatDate(exercise.createdAt)}
        </p>
      )}
      
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => router.push(`/exercises/${exercise.id}`)}
          className="px-3 py-1 text-white bg-green-600 rounded hover:bg-green-700 transition-colors text-sm"
        >
          Открыть
        </button>
        <button
          onClick={() => router.push(`/exercises/${exercise.id}/edit`)}
          className="px-3 py-1 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors text-sm"
        >
          Редактировать
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700 transition-colors text-sm"
        >
          Удалить
        </button>
      </div>
    </div>
  )
} 