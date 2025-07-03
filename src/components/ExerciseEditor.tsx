'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { exerciseService } from '@/lib/exerciseService'
import { auth } from '@/app/firebase'
import type { 
  SentenceFormData, 
  InformationBlockFormData, 
  WordFormData,
  ExerciseFormItem, 
  Exercise, 
  ModernExercise,
  Sentence,
  InformationBlock
} from '@/types/index.types'
import { ThaiSyllableData } from '@/components/ThaiSyllableBuilder'
import { ThaiWordData } from '@/types/word.types'
import AddExerciseItemDropdown from './AddExerciseItemDropdown'
import SentenceForm from './SentenceForm'
import InformationBlockForm from './InformationBlockForm'
import DragDropBlock from './DragDropBlock'
// import WordForm from './WordForm' // Будет создан позже

// Функции для создания пустых форм
const emptySentenceForm = (): SentenceFormData => ({
  text: '',
  rightAnswers: '',
  translations: { ru: '', en: '', zh: '' },
  notes: { ru: '', en: '' },
  expanded: false,
})

const emptyInformationBlockForm = (): InformationBlockFormData => ({
  title: '',
  content: '',
  type: 'explanation',
  importance: 'medium',
  expanded: true,
})

const emptyWordForm = (): WordFormData => ({
  word: '',
  syllables: [],
  meaning: '',
  difficulty: 'easy',
  expanded: true,
})

export default function ExerciseEditor() {
  const params = useParams()
  const exerciseId = (params as { exerciseId?: string }).exerciseId
  const [items, setItems] = useState<ExerciseFormItem[]>([])
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('')

  // Добавление нового элемента
  const addSentence = () => {
    const newItem: ExerciseFormItem = {
      id: `sentence-${Date.now()}`,
      type: 'sentence',
      data: emptySentenceForm()
    }
    setItems(prev => [...prev, newItem])
  }

  const addWord = () => {
    const newItem: ExerciseFormItem = {
      id: `word-${Date.now()}`,
      type: 'word',
      data: emptyWordForm()
    }
    setItems(prev => [...prev, newItem])
  }

  const addInformation = () => {
    const newItem: ExerciseFormItem = {
      id: `information-${Date.now()}`,
      type: 'information',
      data: emptyInformationBlockForm()
    }
    setItems(prev => [...prev, newItem])
  }

  // Обновление элемента
  const updateItem = (index: number, updater: (item: ExerciseFormItem) => ExerciseFormItem) => {
    setItems(prev => {
      const updated = [...prev]
      updated[index] = updater(updated[index])
      return updated
    })
  }

  // Удаление элемента
  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  // Перемещение элемента
  const moveItem = (dragIndex: number, dropIndex: number) => {
    setItems(prev => {
      const arr = [...prev]
      const [draggedItem] = arr.splice(dragIndex, 1)
      arr.splice(dropIndex, 0, draggedItem)
      return arr
    })
  }

  // Функции для обновления конкретных типов форм
  const updateSentenceForm = (index: number, updater: (form: SentenceFormData) => SentenceFormData) => {
    updateItem(index, item => ({
      ...item,
      data: updater(item.data as SentenceFormData)
    }))
  }

  const updateInformationForm = (index: number, updater: (form: InformationBlockFormData) => InformationBlockFormData) => {
    updateItem(index, item => ({
      ...item,
      data: updater(item.data as InformationBlockFormData)
    }))
  }

  const updateWordForm = (index: number, updater: (form: WordFormData) => WordFormData) => {
    updateItem(index, item => ({
      ...item,
      data: updater(item.data as WordFormData)
    }))
  }

  // Загрузка упражнения
  useEffect(() => {
    if (!exerciseId) return
    const load = async () => {
      try {
        const data = await exerciseService.getExerciseById(exerciseId)
        if (data) {
          setTitle(data.title)
          setDescription(data.description)
          setTopic(data.topic)
          setDifficulty(data.difficulty)
          
          // Конвертируем старый формат в новый (только предложения)
          const sentenceItems: ExerciseFormItem[] = data.sentences.map((sentence, index) => ({
            id: `sentence-${index}`,
            type: 'sentence',
            data: {
              text: sentence.text,
              rightAnswers: sentence.rightAnswers.join('\n'),
              translations: { 
                ru: sentence.translations.ru || '', 
                en: sentence.translations.en || '',
                zh: sentence.translations.zh || ''
              },
              notes: { ru: sentence.note?.ru || '', en: sentence.note?.en || '' },
              expanded: false,
            } as SentenceFormData
          }))
          
          setItems(sentenceItems)
        }
      } catch (error) {
        console.error('Ошибка загрузки упражнения:', error)
      }
    }
    load()
  }, [exerciseId])

  // Сохранение упражнения
  const handleSave = async () => {
    setSaving(true)
    try {
      // Конвертируем формы в данные для сохранения
      const sentences: Sentence[] = items
        .filter(item => item.type === 'sentence')
        .map(item => {
          const data = item.data as SentenceFormData
          return {
            text: data.text,
            rightAnswers: data.rightAnswers
              .split('\n')
              .map(a => a.trim())
              .filter(Boolean),
            translations: { 
              ru: data.translations.ru,
              en: data.translations.en,
              zh: data.translations.zh
            },
            note:
              data.notes.ru?.trim() || data.notes.en?.trim()
                ? {
                    ru: data.notes.ru?.trim() || undefined,
                    en: data.notes.en?.trim() || undefined,
                  }
                : null,
          }
        })

      // Пока сохраняем только в старом формате (только предложения)
      // TODO: В будущем добавить поддержку ModernExercise формата
      const exercise: Exercise = {
        title,
        description,
        topic,
        difficulty,
        sentences,
      }

      if (exerciseId) {
        await exerciseService.updateExercise(exerciseId, exercise)
      } else {
        await exerciseService.createExercise(exercise)
        setItems([])
        setTitle('')
        setDescription('')
        setTopic('')
        setDifficulty('')
      }
      alert('Сохранено')
    } catch (e: any) {
      alert('Ошибка: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full max-w-2xl p-4 mx-auto space-y-4">
        <h1 className="text-xl font-semibold">
          {exerciseId ? 'Редактировать упражнение' : 'Добавить упражнение'}
        </h1>
        
        {/* Мета-информация упражнения */}
        <div className="p-4 space-y-4 border rounded">
          <div>
            <label className="block text-sm font-medium">Заголовок</label>
            <input
              value={title}
              placeholder="Заголовок"
              onChange={e => setTitle(e.target.value)}
              className="w-full mt-1 border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Описание</label>
            <textarea
              placeholder="Описание"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full mt-1 border-gray-300 rounded"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Тема</label>
              <input
                placeholder="Тема"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                className="w-full mt-1 border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Сложность</label>
              <select
                name="difficulty"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value)}
                className="w-full mt-1 border-gray-300 rounded"
              >
                <option value="beginner">beginner</option>
                <option value="intermediate">intermediate</option>
                <option value="advanced">advanced</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Список элементов упражнения */}
        <div className="space-y-4">
          {items.map((item, idx) => {
            if (item.type === 'sentence') {
              return (
                <DragDropBlock
                  key={item.id}
                  type="sentence"
                  index={idx}
                  onMove={moveItem}
                >
                  <SentenceForm
                    form={item.data as SentenceFormData}
                    index={idx}
                    onUpdate={updateSentenceForm}
                    onRemove={removeItem}
                  />
                </DragDropBlock>
              )
            } else if (item.type === 'information') {
              return (
                <DragDropBlock
                  key={item.id}
                  type="information"
                  index={idx}
                  onMove={moveItem}
                >
                  <InformationBlockForm
                    form={item.data as InformationBlockFormData}
                    index={idx}
                    onUpdate={updateInformationForm}
                    onRemove={removeItem}
                  />
                </DragDropBlock>
              )
            } else if (item.type === 'word') {
              // TODO: Добавить WordForm когда будет готов
              return (
                <DragDropBlock
                  key={item.id}
                  type="word"
                  index={idx}
                  onMove={moveItem}
                >
                  <div className="p-4 text-green-700">
                    📝 Форма для слов (в разработке)
                  </div>
                </DragDropBlock>
              )
            }
            return null
          })}
        </div>
        
        {/* Кнопки действий */}
        <div className="flex gap-4">
          <AddExerciseItemDropdown
            onAddSentence={addSentence}
            onAddWord={addWord}
            onAddInformation={addInformation}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? 'Сохранение...' : 'Сохранить упражнение'}
          </button>
        </div>
      </div>
    </DndProvider>
  )
}
