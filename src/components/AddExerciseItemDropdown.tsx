'use client'
import { useState, useRef, useEffect } from 'react'

interface AddExerciseItemDropdownProps {
  onAddSentence: () => void;
  onAddWord: () => void;
  onAddInformation: () => void;
}

export default function AddExerciseItemDropdown({
  onAddSentence,
  onAddWord,
  onAddInformation
}: AddExerciseItemDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Закрытие при клике вне области
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleAddSentence = () => {
    onAddSentence()
    setIsOpen(false)
  }

  const handleAddWord = () => {
    onAddWord()
    setIsOpen(false)
  }

  const handleAddInformation = () => {
    onAddInformation()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Основная кнопка */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
      >
        <span>Добавить...</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {/* Предложение */}
          <button
            onClick={handleAddSentence}
            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-lg">📝</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">Предложение</div>
              <div className="text-sm text-gray-500">Для составления предложений по словам</div>
            </div>
          </button>

          {/* Слово */}
          <button
            onClick={handleAddWord}
            className="w-full px-4 py-3 text-left hover:bg-green-50 transition-colors border-b border-gray-100 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-lg">🔤</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">Слово</div>
              <div className="text-sm text-gray-500">Для сбора слов по слогам</div>
            </div>
          </button>

          {/* Информационный блок */}
          <button
            onClick={handleAddInformation}
            className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-lg">💡</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">Информация</div>
              <div className="text-sm text-gray-500">Правила, исключения, пояснения</div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
} 