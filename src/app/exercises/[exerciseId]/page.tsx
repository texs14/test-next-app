'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
// import { doc, getDoc } from 'firebase/firestore'
// import { db } from '@/app/firebase'
import ModernSentenceExercise from '@/components/ModernSentenceExercise'
import { Fireworks } from '@/components/Fireworks'
import type { Exercise } from '@/types/index.types'

// Моковые данные для тестирования (пока Firebase не настроен)
const mockExercises: { [key: string]: Exercise } = {
  '1': {
    title: 'Основы тайского языка',
    description: 'Изучаем базовые фразы на тайском языке',
    topic: 'Базовый словарь',
    difficulty: 'easy',
    sentences: [
      {
        text: 'สวัสดี',
        rightAnswers: ['สวัสดี'],
        translations: {
          ru: 'Привет',
          en: 'Hello'
        },
        note: {
          ru: 'Транскрипция: sawàt dii'
        }
      },
      {
        text: 'ขอบคุณ',
        rightAnswers: ['ขอบคุณ'],
        translations: {
          ru: 'Спасибо',
          en: 'Thank you'
        },
        note: {
          ru: 'Транскрипция: kɔ̀ɔp kun'
        }
      },
      {
        text: 'ไม่เป็นไร',
        rightAnswers: ['ไม่เป็นไร'],
        translations: {
          ru: 'Пожалуйста / Не за что',
          en: 'You\'re welcome'
        },
        note: {
          ru: 'Транскрипция: mâi pen rai'
        }
      }
    ]
  },
  '2': {
    title: 'Числа на тайском',
    description: 'Учимся считать от 1 до 10',
    topic: 'Числа',
    difficulty: 'easy',
    sentences: [
      {
        text: 'หนึ่ง',
        rightAnswers: ['หนึ่ง'],
        translations: {
          ru: 'Один',
          en: 'One'
        },
        note: {
          ru: 'Транскрипция: nɯ̀ŋ'
        }
      },
      {
        text: 'สอง',
        rightAnswers: ['สอง'],
        translations: {
          ru: 'Два',
          en: 'Two'
        },
        note: {
          ru: 'Транскрипция: sɔ̌ɔŋ'
        }
      },
      {
        text: 'สาม',
        rightAnswers: ['สาม'],
        translations: {
          ru: 'Три',
          en: 'Three'
        },
        note: {
          ru: 'Транскрипция: sǎam'
        }
      }
    ]
  }
}

export default function ExercisePage() {
  const { exerciseId } = useParams<any>()
  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showFireworks, setShowFireworks] = useState(false)

  useEffect(() => {
    if (!exerciseId) return
    
    // Имитируем загрузку данных из Firebase
    setTimeout(() => {
      const mockExercise = mockExercises[exerciseId as string]
      if (mockExercise) {
        setExercise(mockExercise)
      }
    }, 500) // Имитируем задержку загрузки
    
    // Код для работы с реальным Firebase (закомментирован пока не настроен)
    /*
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'exercises', exerciseId))
        if (snap.exists()) {
          setExercise(snap.data() as Exercise)
        }
      } catch (error) {
        console.error('Ошибка загрузки упражнения:', error)
        // Fallback на моковые данные
        const mockExercise = mockExercises[exerciseId as string]
        if (mockExercise) {
          setExercise(mockExercise)
        }
      }
    })()
    */
  }, [exerciseId])

  const total = exercise?.sentences.length ?? 0

  const handleComplete = () => {
    const newIndex = Math.min(currentIndex + 1, total)
    setCurrentIndex(newIndex)
    
    // Показываем фейерверки только при завершении всего упражнения
    if (newIndex >= total) {
      setShowFireworks(true)
      setTimeout(() => {
        setShowFireworks(false)
      }, 3000)
    }
  }

  if (!exercise) {
    return <p className="p-4">Загрузка...</p>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Заголовок упражнения */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{exercise.title}</h1>
          <p className="text-gray-600 text-lg mb-4">{exercise.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              Тема: {exercise.topic}
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full capitalize">
              Уровень: {exercise.difficulty}
            </span>
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Общий прогресс</span>
            <span className="text-sm text-gray-500">
              {Math.min(currentIndex + 1, total)} из {total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentIndex / total) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs text-gray-600">
              {Math.round((currentIndex / total) * 100)}% выполнено
            </span>
          </div>
        </div>

        {/* Упражнения */}
        {exercise.sentences.map((sent, idx) => (
          <ModernSentenceExercise
            key={idx}
            sentence={sent}
            index={idx}
            isActive={idx <= currentIndex}
            onComplete={handleComplete}
          />
        ))}

        {/* Сообщение о завершении */}
        {currentIndex >= total && (
          <div className="bg-gradient-to-r from-green-100 to-blue-100 border border-green-200 rounded-2xl p-8 text-center shadow-lg">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Поздравляем!
            </h2>
            <p className="text-gray-600 text-lg">
              Вы успешно прошли все задания урока!
            </p>
          </div>
        )}
      </div>
              <Fireworks 
          isActive={showFireworks} 
          onComplete={() => setShowFireworks(false)} 
        />
    </div>
  )
}
