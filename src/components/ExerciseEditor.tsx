'use client'
import { useEffect, useState } from 'react'
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore'
import { useParams } from 'next/navigation'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { db, auth } from '@/app/firebase'
import type { Sentence, Exercise } from '@/types/index.types'
import SentenceForm, { SentenceFormData } from './SentenceForm'

const emptyForm = (): SentenceFormData => ({
  text: '',
  rightAnswers: '',
  translations: { ru: '', en: '', zh: '' },
  notes: { ru: '', en: '' },
  expanded: false,
})

export default function ExerciseEditor() {
  const params = useParams()
  const exerciseId = (params as { exerciseId?: string }).exerciseId
  const [forms, setForms] = useState<SentenceFormData[]>([emptyForm()])
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('')

  const addForm = () => setForms(prev => [...prev, emptyForm()])

  const updateForm = (index: number, updater: (form: SentenceFormData) => SentenceFormData) => {
    setForms(prev => {
      const updated = [...prev]
      updated[index] = updater(updated[index])
      return updated
    })
  }

  const removeForm = (index: number) => setForms(prev => prev.filter((_, i) => i !== index))

  const moveForm = (dragIndex: number, dropIndex: number) => {
    setForms(prev => {
      const arr = [...prev]
      const [draggedItem] = arr.splice(dragIndex, 1)
      arr.splice(dropIndex, 0, draggedItem)
      return arr
    })
  }

  useEffect(() => {
    if (!exerciseId) return
    const load = async () => {
      if (!exerciseId) return

      const snap = await getDoc(doc(db, 'exercises', exerciseId))
      if (snap.exists()) {
        const data = snap.data() as Exercise
        setTitle(data.title)
        setDescription(data.description)
        setTopic(data.topic)
        setDifficulty(data.difficulty)
        setForms(
          data.sentences.map(s => ({
            text: s.text,
            rightAnswers: s.rightAnswers.join('\n'),
            translations: { 
              ru: s.translations.ru || '', 
              en: s.translations.en || '',
              zh: s.translations.zh || ''
            },
            notes: { ru: s.note?.ru || '', en: s.note?.en || '' },
            expanded: false,
          }))
        )
      }
    }
    load()
  }, [exerciseId])

  const handleSave = async () => {
    const payload: Sentence[] = forms.map(f => ({
      text: f.text,
      rightAnswers: f.rightAnswers
        .split('\n')
        .map(a => a.trim())
        .filter(Boolean),
      translations: { 
        ru: f.translations.ru,
        en: f.translations.en,
        zh: f.translations.zh
      },
      note:
        f.notes.ru?.trim() || f.notes.en?.trim()
          ? {
              ru: f.notes.ru?.trim() || undefined,
              en: f.notes.en?.trim() || undefined,
            }
          : null,
    }))

    setSaving(true)
    try {
      const exercise: Exercise = {
        title,
        description,
        topic,
        difficulty,
        sentences: payload,
      }

      if (exerciseId) {
        await updateDoc(doc(db, 'exercises', exerciseId), exercise as any)
      } else {
        // Добавляем поле createdBy для новых упражнений
        const exerciseWithCreator = {
          ...exercise,
          createdBy: auth.currentUser?.uid || null,
          createdAt: new Date()
        }
        await addDoc(collection(db, 'exercises'), exerciseWithCreator)
        setForms([emptyForm()])
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
        
        {/* Список предложений */}
        <div className="space-y-4">
          {forms.map((form, idx) => (
            <SentenceForm
              key={idx}
              form={form}
              index={idx}
              onUpdate={updateForm}
              onRemove={removeForm}
              onMove={moveForm}
              canMoveUp={idx > 0}
              canMoveDown={idx < forms.length - 1}
            />
          ))}
        </div>
        
        {/* Кнопки действий */}
        <div className="flex gap-4">
          <button 
            onClick={addForm} 
            className="px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Добавить предложение
          </button>
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
