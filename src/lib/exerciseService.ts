import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  writeBatch,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/app/firebase'
import type { Exercise, ExercisePreview } from '@/types/index.types'

class ExerciseService {
  private readonly EXERCISES_COLLECTION = 'exercises'
  private readonly EXERCISES_PREVIEW_COLLECTION = 'exercises-preview'

  /**
   * Создает новое упражнение в обеих коллекциях
   */
  async createExercise(exerciseData: Omit<Exercise, 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const batch = writeBatch(db)
      const now = Timestamp.now()
      
      // Создаем документ в коллекции exercises с автоматическим ID
      const exerciseRef = doc(collection(db, this.EXERCISES_COLLECTION))
      const exerciseId = exerciseRef.id
      
      // Полные данные упражнения
      const fullExercise = {
        ...exerciseData,
        createdAt: now,
        updatedAt: now
      }
      
      // Данные для превью (только необходимые поля)
      const previewData: Omit<ExercisePreview, 'id'> = {
        title: exerciseData.title,
        description: exerciseData.description,
        difficulty: exerciseData.difficulty,
        createdAt: now,
        updatedAt: now
      }
      
      // Добавляем операции в batch
      batch.set(exerciseRef, fullExercise)
      batch.set(doc(db, this.EXERCISES_PREVIEW_COLLECTION, exerciseId), previewData)
      
      // Выполняем batch операцию
      await batch.commit()
      
      return exerciseId
    } catch (error) {
      console.error('Ошибка создания упражнения:', error)
      throw error
    }
  }

  /**
   * Обновляет упражнение в обеих коллекциях
   */
  async updateExercise(exerciseId: string, exerciseData: Partial<Exercise>): Promise<void> {
    try {
      const batch = writeBatch(db)
      const now = Timestamp.now()
      
      const exerciseRef = doc(db, this.EXERCISES_COLLECTION, exerciseId)
      const previewRef = doc(db, this.EXERCISES_PREVIEW_COLLECTION, exerciseId)
      
      // Обновляем полные данные
      const fullUpdateData = {
        ...exerciseData,
        updatedAt: now
      }
      
      // Обновляем только превью поля если они есть в обновляемых данных
      const previewUpdateData: any = {
        updatedAt: now
      }
      
      if (exerciseData.title !== undefined) {
        previewUpdateData.title = exerciseData.title
      }
      if (exerciseData.description !== undefined) {
        previewUpdateData.description = exerciseData.description
      }
      if (exerciseData.difficulty !== undefined) {
        previewUpdateData.difficulty = exerciseData.difficulty
      }
      
      // Добавляем операции в batch
      batch.update(exerciseRef, fullUpdateData)
      batch.update(previewRef, previewUpdateData)
      
      // Выполняем batch операцию
      await batch.commit()
    } catch (error) {
      console.error('Ошибка обновления упражнения:', error)
      throw error
    }
  }

  /**
   * Удаляет упражнение из обеих коллекций
   */
  async deleteExercise(exerciseId: string): Promise<void> {
    try {
      const batch = writeBatch(db)
      
      const exerciseRef = doc(db, this.EXERCISES_COLLECTION, exerciseId)
      const previewRef = doc(db, this.EXERCISES_PREVIEW_COLLECTION, exerciseId)
      
      // Добавляем операции удаления в batch
      batch.delete(exerciseRef)
      batch.delete(previewRef)
      
      // Выполняем batch операцию
      await batch.commit()
    } catch (error) {
      console.error('Ошибка удаления упражнения:', error)
      throw error
    }
  }

  /**
   * Получает список превью упражнений (только основные поля)
   */
  async getExercisePreviews(): Promise<ExercisePreview[]> {
    try {
      const q = query(
        collection(db, this.EXERCISES_PREVIEW_COLLECTION),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ExercisePreview[]
    } catch (error) {
      console.error('Ошибка получения превью упражнений:', error)
      throw error
    }
  }

  /**
   * Получает полные данные одного упражнения
   */
  async getExerciseById(exerciseId: string): Promise<Exercise | null> {
    try {
      const docRef = doc(db, this.EXERCISES_COLLECTION, exerciseId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return docSnap.data() as Exercise
      }
      
      return null
    } catch (error) {
      console.error('Ошибка получения упражнения:', error)
      throw error
    }
  }

  /**
   * Получает превью одного упражнения
   */
  async getExercisePreviewById(exerciseId: string): Promise<ExercisePreview | null> {
    try {
      const docRef = doc(db, this.EXERCISES_PREVIEW_COLLECTION, exerciseId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as ExercisePreview
      }
      
      return null
    } catch (error) {
      console.error('Ошибка получения превью упражнения:', error)
      throw error
    }
  }
}

// Экспортируем единственный экземпляр сервиса
export const exerciseService = new ExerciseService()
export default exerciseService 