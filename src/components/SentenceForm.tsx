'use client'
import { useState } from 'react'

interface SentenceFormData {
  text: string
  rightAnswers: string
  translations: { ru: string; en: string; zh: string }
  notes: { ru?: string; en?: string }
  expanded?: boolean
}

interface SentenceFormProps {
  form: SentenceFormData
  index: number
  onUpdate: (index: number, updater: (form: SentenceFormData) => SentenceFormData) => void
  onRemove: (index: number) => void
}



export default function SentenceForm({
  form,
  index,
  onUpdate,
  onRemove,
}: SentenceFormProps) {
  const [translating, setTranslating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const updateForm = (updater: (form: SentenceFormData) => SentenceFormData) => {
    onUpdate(index, updater)
  }

  const toggleExpanded = () => {
    updateForm(form => ({ ...form, expanded: !form.expanded }))
  }

  const handleRemove = () => {
    if (showDeleteConfirm) {
      onRemove(index)
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
      // Скрыть подтверждение через 3 секунды
      setTimeout(() => setShowDeleteConfirm(false), 3000)
    }
  }

  const translateText = async () => {
    if (!form.text.trim()) {
      alert('Введите текст для перевода')
      return
    }

    setTranslating(true)
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: [{ id: 1, text: form.text }],
          targetLangs: ['ru', 'en', 'zh'],
          sourceLang: 'th',
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка перевода')
      }

      const data = await response.json()
      const translations = data.segments[0]?.translations || {}

      updateForm(form => ({
        ...form,
        translations: {
          ru: translations.ru || form.translations.ru,
          en: translations.en || form.translations.en,
          zh: translations.zh || form.translations.zh,
        },
        // Если правильные варианты пустые, добавляем текст из основного поля
        rightAnswers: form.rightAnswers.trim() || form.text,
      }))
    } catch (error) {
      console.error('Ошибка перевода:', error)
      alert('Ошибка при переводе текста')
    } finally {
      setTranslating(false)
    }
  }

  return (
    <>
      {/* Основная часть с текстом и кнопками */}
      <div className="flex items-start gap-4">
        {/* Большой инпут для текста на тайском */}
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">
                Предложение на тайском языке
              </label>
              <button
                onClick={translateText}
                disabled={translating}
                className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {translating ? 'Переводим...' : '🌐 Перевести'}
              </button>
            </div>
            <textarea
              placeholder="พิมพ์ประโยคภาษาไทยที่นี่..."
              value={form.text}
              onChange={e => updateForm(f => ({ ...f, text: e.target.value }))}
              className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl resize-none focus:border-blue-500 focus:ring-0 focus:outline-none transition-colors"
              rows={2}
              dir="ltr"
              lang="th"
            />
          </div>
          
          {/* Кнопки управления */}
          <div className="flex flex-col gap-2">
            <button
              onClick={toggleExpanded}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={form.expanded ? "Свернуть" : "Развернуть"}
            >
              <svg 
                className={`w-5 h-5 transition-transform duration-200 ${form.expanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <button
              onClick={handleRemove}
              className={`p-2 text-sm font-bold rounded transition-all ${
                showDeleteConfirm
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'text-red-500 hover:text-red-700 hover:bg-red-50'
              }`}
              title={showDeleteConfirm ? "Нажмите еще раз для удаления" : "Удалить предложение"}
            >
              {showDeleteConfirm ? '⚠️ Удалить?' : '🗑️'}
            </button>
          </div>
        </div>

      {/* Дополнительная информация с анимацией */}
      {form.expanded && (
        <div className="border-t border-gray-100 animate-fadeIn">
          <div className="px-6 pb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Правильные варианты (каждый на новой строке)
              </label>
              <textarea
                placeholder="Правильные варианты (каждый на новой строке)"
                value={form.rightAnswers}
                onChange={e => updateForm(f => ({ ...f, rightAnswers: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0 focus:outline-none"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Перевод (RU)</label>
                <input
                  placeholder="Перевод на русский"
                  value={form.translations.ru}
                  onChange={e =>
                    updateForm(f => ({
                      ...f,
                      translations: { ...f.translations, ru: e.target.value },
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Перевод (EN)</label>
                <input
                  placeholder="English translation"
                  value={form.translations.en}
                  onChange={e =>
                    updateForm(f => ({
                      ...f,
                      translations: { ...f.translations, en: e.target.value },
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Перевод (中文)</label>
                <input
                  placeholder="中文翻译"
                  value={form.translations.zh}
                  onChange={e =>
                    updateForm(f => ({
                      ...f,
                      translations: { ...f.translations, zh: e.target.value },
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Примечание (RU)</label>
                <input
                  placeholder="Примечание на русском"
                  value={form.notes.ru || ''}
                  onChange={e =>
                    updateForm(f => ({
                      ...f,
                      notes: { ...f.notes, ru: e.target.value },
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note (EN)</label>
                <input
                  placeholder="Note in English"
                  value={form.notes.en || ''}
                  onChange={e =>
                    updateForm(f => ({
                      ...f,
                      notes: { ...f.notes, en: e.target.value },
                    }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export type { SentenceFormData } 