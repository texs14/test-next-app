'use client'
import { useState, useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import type { Identifier, XYCoord } from 'dnd-core'

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
  onMove: (dragIndex: number, dropIndex: number) => void
  canMoveUp: boolean
  canMoveDown: boolean
}

interface DragItem {
  index: number
  id: string
  type: string
}

export default function SentenceForm({
  form,
  index,
  onUpdate,
  onRemove,
  onMove,
  canMoveUp,
  canMoveDown,
}: SentenceFormProps) {
  const [translating, setTranslating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: 'sentence',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()

      // Get pixels to the top
      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Time to actually perform the action
      onMove(dragIndex, hoverIndex)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'sentence',
    item: () => {
      return { id: `sentence-${index}`, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const opacity = isDragging ? 0.4 : 1
  drag(drop(ref))

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
    <div 
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className={`sentence-item overflow-hidden bg-white border rounded-2xl shadow-sm ${
        isDragging ? 'dragging dragging-shadow' : ''
      }`}
    >
      {/* Основная часть с текстом и кнопками */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <div className="flex-shrink-0 mt-2">
            <div className="drag-handle flex flex-col items-center p-2 text-gray-400 cursor-move hover:text-gray-600 hover:bg-gray-50 rounded-lg group">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path>
              </svg>
              <span className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                #{index + 1}
              </span>
            </div>
          </div>
          
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
    </div>
  )
}

export type { SentenceFormData } 