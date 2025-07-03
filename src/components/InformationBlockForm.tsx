'use client'
import { useState } from 'react'
import type { InformationBlockFormData } from '@/types/index.types'

interface InformationBlockFormProps {
  form: InformationBlockFormData;
  index: number;
  onUpdate: (index: number, updater: (form: InformationBlockFormData) => InformationBlockFormData) => void;
  onRemove: (index: number) => void;
}

export default function InformationBlockForm({
  form,
  index,
  onUpdate,
  onRemove,
}: InformationBlockFormProps) {

  const update = (updater: (form: InformationBlockFormData) => InformationBlockFormData) => {
    onUpdate(index, updater)
  }

  const toggleExpanded = () => {
    update(f => ({ ...f, expanded: !f.expanded }))
  }

  // Цветовая схема в зависимости от типа
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'rule':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-purple-700',
          icon: '📏'
        }
      case 'exception':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          icon: '⚠️'
        }
      case 'explanation':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          icon: '💬'
        }
      case 'example':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: '💡'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: '📝'
        }
    }
  }

  const typeStyles = getTypeStyles(form.type)

  return (
    <>
      {/* Заголовок с кнопками управления */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Информационный блок
          </span>
          {form.title && (
            <span className="text-sm text-gray-600">
              - {form.title.slice(0, 30)}{form.title.length > 30 ? '...' : ''}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Кнопка сворачивания */}
          <button
            type="button"
            onClick={toggleExpanded}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title={form.expanded ? 'Свернуть' : 'Развернуть'}
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
          
          {/* Кнопка удаления */}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Удалить"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Краткая информация (всегда видна) */}
      <div className="mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="capitalize">{form.type}</span>
          <span>•</span>
          <span className="capitalize">{form.importance}</span>
          {form.content && (
            <>
              <span>•</span>
              <span>{form.content.length} символов</span>
            </>
          )}
        </div>
      </div>

      {/* Развернутая форма */}
      {form.expanded && (
        <div className="space-y-4">
          {/* Заголовок */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Заголовок
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update(f => ({ ...f, title: e.target.value }))}
              placeholder="Введите заголовок информационного блока"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Тип и важность */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип
              </label>
              <select
                value={form.type}
                onChange={(e) => update(f => ({ ...f, type: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="rule">Правило</option>
                <option value="exception">Исключение</option>
                <option value="explanation">Объяснение</option>
                <option value="example">Пример</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Важность
              </label>
              <select
                value={form.importance}
                onChange={(e) => update(f => ({ ...f, importance: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="high">Высокая</option>
                <option value="medium">Средняя</option>
                <option value="low">Низкая</option>
              </select>
            </div>
          </div>

          {/* Содержание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Содержание
            </label>
            <textarea
              value={form.content}
              onChange={(e) => update(f => ({ ...f, content: e.target.value }))}
              placeholder="Введите содержание информационного блока..."
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical"
            />
          </div>

          {/* Предварительный просмотр */}
          {form.content && (
            <div className="mt-4 p-3 bg-white border border-gray-200 rounded-md">
              <div className="text-sm text-gray-600 mb-2">Предварительный просмотр:</div>
              <div className={`border-l-4 pl-3 ${typeStyles.border.replace('border-', 'border-l-')}`}>
                {form.title && (
                  <div className="font-medium text-gray-900 mb-1">{form.title}</div>
                )}
                <div className="text-gray-700 whitespace-pre-wrap">{form.content}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
} 