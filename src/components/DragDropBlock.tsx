'use client'
import { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import type { Identifier } from 'dnd-core'

// Типы для drag&drop системы
interface DragItem {
  index: number
  id: string
  type: 'EXERCISE_ITEM'
}

// Цветовые схемы для разных типов блоков
interface ColorScheme {
  primary: string
  accent: string
  icon: string
  borderLeft: string
}

const COLOR_SCHEMES: Record<string, ColorScheme> = {
  sentence: {
    primary: '#3b82f6', // синий
    accent: '#dbeafe',
    icon: '📝',
    borderLeft: 'border-l-blue-500'
  },
  word: {
    primary: '#10b981', // зеленый
    accent: '#d1fae5',
    icon: '🔤',
    borderLeft: 'border-l-emerald-500'
  },
  information: {
    primary: '#8b5cf6', // фиолетовый
    accent: '#ede9fe',
    icon: '💡',
    borderLeft: 'border-l-purple-500'
  }
}

// Props для DragDropBlock
interface DragDropBlockProps {
  type: 'sentence' | 'word' | 'information'
  index: number
  onMove: (dragIndex: number, dropIndex: number) => void
  children: React.ReactNode
  className?: string
}

export default function DragDropBlock({
  type,
  index,
  onMove,
  children,
  className = ''
}: DragDropBlockProps) {
  const ref = useRef<HTMLDivElement>(null)
  const colorScheme = COLOR_SCHEMES[type]

  // Drop логика - простая и понятная
  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: Identifier | null }>({
    accept: 'EXERCISE_ITEM',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: DragItem) {
      if (!ref.current) {
        return
      }
      
      const dragIndex = item.index
      const hoverIndex = index

      // Не заменяем элементы сами на себя
      if (dragIndex === hoverIndex) {
        return
      }

      // Выполняем перемещение
      onMove(dragIndex, hoverIndex)
      
      // Обновляем индекс в драгаемом элементе для производительности
      item.index = hoverIndex
    },
  })

  // Drag логика
  const [{ isDragging }, drag] = useDrag({
    type: 'EXERCISE_ITEM',
    item: () => {
      return { 
        id: `${type}-${index}`, 
        index,
        type: 'EXERCISE_ITEM' as const
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  // Объединяем drag и drop refs
  drag(drop(ref))

  const opacity = isDragging ? 0.4 : 1

  return (
    <div 
      ref={ref}
      style={{ opacity }}
      data-handler-id={handlerId}
      className={`
        unified-block overflow-hidden bg-white border rounded-2xl shadow-sm 
        border-l-4 ${colorScheme.borderLeft}
        transition-all duration-200
        ${isDragging ? 'dragging-shadow scale-105' : ''}
        ${className}
      `}
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Универсальная Drag Handle */}
          <div className="flex-shrink-0 mt-2">
            <div className="drag-handle flex flex-col items-center p-2 text-gray-400 cursor-move hover:text-gray-600 hover:bg-gray-50 rounded-lg group transition-all duration-200">
              {/* Иконка drag points */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"></path>
              </svg>
              {/* Номер элемента */}
              <span className="text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                #{index + 1}
              </span>
            </div>
          </div>
          
          {/* Цветовая иконка типа */}
          <div className="flex-shrink-0 mt-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: colorScheme.accent }}
            >
              {colorScheme.icon}
            </div>
          </div>
          
          {/* Контент блока */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// CSS стили для анимаций (добавить в глобальные стили)
export const dragDropStyles = `
.unified-block {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dragging-shadow {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.drag-handle:hover {
  transform: scale(1.05);
}

.unified-block:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
` 