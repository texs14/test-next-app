'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/app/firebase'
import SentenceExercise from '@/components/SentenceExercise'
import type { Exercise } from '@/types/index.types'

export default function ExercisePage() {
  const { exerciseId } = useParams<any>()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  useEffect(() => {
    if (!exerciseId) return
    ;(async () => {
      const snap = await getDoc(doc(db, 'exercises', exerciseId))
      if (snap.exists()) {
        setExercise(snap.data() as Exercise)
      }
    })()
  }, [exerciseId])

  const total = exercise?.sentences.length ?? 0

  const handleComplete = () => {
    setCurrentIndex(prev => Math.min(prev + 1, total))
  }

  if (!exercise) {
    return <p className="p-4">Загрузка...</p>
  }

  return (
    <div className="max-w-2xl p-6 mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{exercise.title}</h1>
      <p className="mb-4 text-gray-600">{exercise.description}</p>
      <p className="mb-4 text-gray-600">
        Тема: {exercise.topic}; Уровень:{' '}
        <span className="font-semibold capitalize">{exercise.difficulty}</span>
      </p>

      <div className="w-full h-4 mb-2 overflow-hidden bg-gray-200 rounded">
        <div
          className="h-full transition-all bg-green-500"
          style={{ width: `${(currentIndex / total) * 100}%` }}
        />
      </div>
      <p className="text-sm text-right text-gray-700">
        Задание {Math.min(currentIndex + 1, total)} из {total}
      </p>

      {exercise.sentences.map((sent, idx) => (
        <SentenceExercise
          key={idx}
          sentence={sent}
          index={idx}
          isActive={idx <= currentIndex}
          onComplete={handleComplete}
        />
      ))}

      {currentIndex >= total && (
        <div className="p-4 text-blue-900 bg-blue-100 rounded">
          <p className="font-medium">Поздравляем! Вы прошли все задания урока.</p>
        </div>
      )}
    </div>
  )
}
