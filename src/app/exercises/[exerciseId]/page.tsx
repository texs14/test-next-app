'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { exerciseService } from '@/lib/exerciseService'
import SentenceExercise from '@/components/SentenceExercise'
import InformationBlockDisplay from '@/components/InformationBlockDisplay'
import { Fireworks } from '@/components/Fireworks'
import type { Exercise, ModernExercise, ExerciseItem, InformationBlock } from '@/types/index.types'
import { getExerciseItems } from '@/types/index.types'

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
      },
      {
        text: 'ฉัน รัก คุณ',
        rightAnswers: ['ฉันรักคุณ', 'ฉัน รัก คุณ'],
        translations: {
          ru: 'Я тебя люблю',
          en: 'I love you'
        },
        note: {
          ru: 'Транскрипция: chǎn rák khun'
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
      },
      {
        text: 'ฉัน ชอบ กิน ข้าว',
        rightAnswers: ['ฉันชอบกินข้าว', 'ฉัน ชอบ กิน ข้าว'],
        translations: {
          ru: 'Я люблю есть рис',
          en: 'I like to eat rice'
        },
        note: {
          ru: 'Многословное тестовое упражнение'
        }
      }
    ]
  }
}

// Тестовое упражнение с информационными блоками
const mockModernExercise: ModernExercise = {
  title: 'Тестовое смешанное упражнение',
  description: 'Упражнение с информационными блоками и предложениями',
  topic: 'Тестирование',
  difficulty: 'easy',
  items: [
    {
      id: 'info-1',
      type: 'information',
      order: 0,
      data: {
        title: 'Тоны в тайском языке',
        content: 'В тайском языке есть 5 тонов:\n1. Средний тон (без обозначения)\n2. Низкий тон (`)\n3. Падающий тон (^)\n4. Высокий тон (´)\n5. Восходящий тон (~)\n\nТоны меняют значение слова!',
        type: 'rule',
        importance: 'high'
      } as InformationBlock
    },
    {
      id: 'sentence-1',
      type: 'sentence',
      order: 1,
      data: {
        text: 'สวัสดี',
        rightAnswers: ['สวัสดี'],
        translations: {
          ru: 'Привет',
          en: 'Hello'
        },
        note: {
          ru: 'Транскрипция: sawàt dii'
        }
      }
    },
    {
      id: 'info-2',
      type: 'information',
      order: 2,
      data: {
        title: 'Исключения в произношении',
        content: 'Слово สวัสดี произносится как "sawàt dii", но пишется с разными буквами.\n\nЭто распространенное явление в тайском языке - написание и произношение могут отличаться.',
        type: 'exception',
        importance: 'medium'
      } as InformationBlock
    }
  ]
}

export default function ExercisePage() {
  const { exerciseId } = useParams<any>()
  const [exercise, setExercise] = useState<Exercise | ModernExercise | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showFireworks, setShowFireworks] = useState(false)

  useEffect(() => {
    if (!exerciseId) return
    
    const fetchExercise = async () => {
      try {
        // Тестовое упражнение с информационными блоками
        if (exerciseId === 'test-mixed') {
          setExercise(mockModernExercise)
          return
        }

        // Получаем полные данные упражнения из коллекции exercises
        const exerciseData = await exerciseService.getExerciseById(exerciseId as string)
        if (exerciseData) {
          setExercise(exerciseData)
        } else {
          // Fallback на моковые данные если упражнение не найдено
          const mockExercise = mockExercises[exerciseId as string]
          if (mockExercise) {
            setExercise(mockExercise)
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки упражнения:', error)
        // Fallback на моковые данные при ошибке
        const mockExercise = mockExercises[exerciseId as string]
        if (mockExercise) {
          setExercise(mockExercise)
        }
      }
    }
    
    fetchExercise()
  }, [exerciseId])

  if (!exercise) {
    return <p className="p-4">Загрузка...</p>
  }

  // Получаем элементы упражнения (работает с обоими форматами)
  const exerciseItems = getExerciseItems(exercise)
  const interactiveItems = exerciseItems.filter(item => item.type === 'sentence' || item.type === 'word')
  const total = interactiveItems.length

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
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
              Элементов: {exerciseItems.length}
            </span>
          </div>
        </div>

        {/* Прогресс-бар (только для интерактивных элементов) */}
        {total > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">Прогресс выполнения</span>
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
        )}

        {/* Отображение элементов упражнения */}
        <div className="space-y-6">
          {exerciseItems.map((item, idx) => {
            if (item.type === 'information') {
              return (
                <InformationBlockDisplay
                  key={item.id}
                  informationBlock={item.data as InformationBlock}
                  className="mb-6"
                />
              )
            } else if (item.type === 'sentence') {
              const sentenceIndex = interactiveItems.findIndex(i => i.id === item.id)
              return (
                <SentenceExercise
                  key={item.id}
                  sentence={item.data as any}
                  index={sentenceIndex}
                  isActive={sentenceIndex <= currentIndex}
                  onComplete={handleComplete}
                />
              )
            } else if (item.type === 'word') {
              // TODO: Добавить поддержку WordSyllableBuilder
              return (
                <div key={item.id} className="bg-green-50 border border-green-200 rounded-2xl p-8">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🔤</div>
                    <h3 className="text-xl font-medium text-green-800 mb-2">Упражнение со словом</h3>
                    <p className="text-green-600">Поддержка слов будет добавлена в следующей версии</p>
                  </div>
                </div>
              )
            }
            return null
          })}
        </div>

        {/* Сообщение о завершении */}
        {currentIndex >= total && total > 0 && (
          <div className="bg-gradient-to-r from-green-100 to-blue-100 border border-green-200 rounded-2xl p-8 text-center shadow-lg mt-8">
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
