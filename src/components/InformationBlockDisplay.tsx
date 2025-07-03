'use client'
import { useState } from 'react'
import type { InformationBlock } from '@/types/index.types'

interface InformationBlockDisplayProps {
  informationBlock: InformationBlock;
  className?: string;
}

export default function InformationBlockDisplay({
  informationBlock,
  className = ''
}: InformationBlockDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Стили в зависимости от типа
  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'rule':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          accent: 'border-l-purple-500',
          text: 'text-purple-700',
          icon: '📏',
          badgeColor: 'bg-purple-100 text-purple-800'
        }
      case 'exception':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          accent: 'border-l-red-500',
          text: 'text-red-700',
          icon: '⚠️',
          badgeColor: 'bg-red-100 text-red-800'
        }
      case 'explanation':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          accent: 'border-l-blue-500',
          text: 'text-blue-700',
          icon: '💬',
          badgeColor: 'bg-blue-100 text-blue-800'
        }
      case 'example':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          accent: 'border-l-green-500',
          text: 'text-green-700',
          icon: '💡',
          badgeColor: 'bg-green-100 text-green-800'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          accent: 'border-l-gray-500',
          text: 'text-gray-700',
          icon: '📝',
          badgeColor: 'bg-gray-100 text-gray-800'
        }
    }
  }

  const typeStyles = getTypeStyles(informationBlock.type)

  // Перевод типов на русский
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rule': return 'Правило'
      case 'exception': return 'Исключение'
      case 'explanation': return 'Объяснение'
      case 'example': return 'Пример'
      default: return 'Информация'
    }
  }

  return (
    <div className={`${typeStyles.bg} ${typeStyles.border} border rounded-lg ${className}`}>
      {/* Заголовок */}
      <div
        className="p-4 cursor-pointer hover:bg-white/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {/* Иконка */}
            <div className="text-xl mt-0.5">
              {typeStyles.icon}
            </div>
            
            {/* Заголовок и метаинформация */}
            <div className="flex-1">
              <h3 className={`font-medium ${typeStyles.text} mb-1`}>
                {informationBlock.title}
              </h3>
              
              {/* Бейдж типа */}
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeStyles.badgeColor}`}>
                  {getTypeLabel(informationBlock.type)}
                </span>
              </div>
              
              {/* Превью содержания (если свернуто) */}
              {!isExpanded && informationBlock.content && (
                <p className="text-sm text-gray-600 mt-2">
                  {informationBlock.content.slice(0, 120)}
                  {informationBlock.content.length > 120 ? '...' : ''}
                </p>
              )}
            </div>
          </div>
          
          {/* Стрелка раскрытия */}
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Развернутое содержание */}
      {isExpanded && (
        <div className="px-4 pb-4">
          <div className={`border-l-4 ${typeStyles.accent} pl-4 bg-white/70 rounded-r-md p-3`}>
            <div className="text-gray-700 whitespace-pre-wrap">
              {informationBlock.content}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 