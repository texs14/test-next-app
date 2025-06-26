import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentReference,
  CollectionReference,
  QuerySnapshot,
  DocumentSnapshot,
  WhereFilterOp,
  OrderByDirection,
  QueryConstraint,
  runTransaction,
  writeBatch,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/app/firebase'

export interface FirestoreQuery {
  field: string
  operator: WhereFilterOp
  value: any
}

export interface FirestoreOrder {
  field: string
  direction: OrderByDirection
}

export interface QueryOptions {
  where?: FirestoreQuery[]
  orderBy?: FirestoreOrder[]
  limit?: number
  startAfter?: any
}

export interface PaginationResult<T> {
  data: T[]
  lastDoc?: DocumentSnapshot
  hasNext: boolean
}

/**
 * Универсальный сервис для работы с Firebase Firestore
 */
class FirestoreService {
  /**
   * Создает новый документ в коллекции с автоматически сгенерированным ID
   */
  async create<T extends Record<string, any>>(
    collectionName: string, 
    data: T
  ): Promise<{ id: string; data: T }> {
    try {
      const collectionRef = collection(db, collectionName)
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      
      return {
        id: docRef.id,
        data: {
          ...data,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      }
    } catch (error) {
      console.error(`Ошибка создания документа в коллекции ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Создает документ с заданным ID или обновляет существующий
   */
  async set<T extends Record<string, any>>(
    collectionName: string, 
    docId: string, 
    data: T, 
    merge: boolean = false
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId)
      const dataWithTimestamp = {
        ...data,
        updatedAt: Timestamp.now(),
        ...(!merge && { createdAt: Timestamp.now() })
      }
      
      await setDoc(docRef, dataWithTimestamp, { merge })
    } catch (error) {
      console.error(`Ошибка записи документа ${docId} в коллекции ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Получает документ по ID
   */
  async getById<T>(collectionName: string, docId: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, docId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as T
      }
      
      return null
    } catch (error) {
      console.error(`Ошибка получения документа ${docId} из коллекции ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Получает все документы коллекции с возможностью фильтрации и сортировки
   */
  async getAll<T>(
    collectionName: string, 
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      const collectionRef = collection(db, collectionName)
      let queryRef = query(collectionRef)

      // Применяем фильтры
      if (options?.where) {
        for (const condition of options.where) {
          queryRef = query(queryRef, where(condition.field, condition.operator, condition.value))
        }
      }

      // Применяем сортировку
      if (options?.orderBy) {
        for (const order of options.orderBy) {
          queryRef = query(queryRef, orderBy(order.field, order.direction))
        }
      }

      // Применяем лимит
      if (options?.limit) {
        queryRef = query(queryRef, limit(options.limit))
      }

      // Применяем пагинацию
      if (options?.startAfter) {
        queryRef = query(queryRef, startAfter(options.startAfter))
      }

      const querySnapshot = await getDocs(queryRef)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[]
    } catch (error) {
      console.error(`Ошибка получения документов из коллекции ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Получает документы с пагинацией
   */
  async getPaginated<T>(
    collectionName: string,
    pageSize: number,
    options?: Omit<QueryOptions, 'limit' | 'startAfter'>,
    lastDoc?: DocumentSnapshot
  ): Promise<PaginationResult<T>> {
    try {
      const collectionRef = collection(db, collectionName)
      let queryRef = query(collectionRef)

      // Применяем фильтры
      if (options?.where) {
        for (const condition of options.where) {
          queryRef = query(queryRef, where(condition.field, condition.operator, condition.value))
        }
      }

      // Применяем сортировку
      if (options?.orderBy) {
        for (const order of options.orderBy) {
          queryRef = query(queryRef, orderBy(order.field, order.direction))
        }
      }

      // Применяем пагинацию
      if (lastDoc) {
        queryRef = query(queryRef, startAfter(lastDoc))
      }

      // Запрашиваем на 1 документ больше, чтобы проверить наличие следующей страницы
      queryRef = query(queryRef, limit(pageSize + 1))

      const querySnapshot = await getDocs(queryRef)
      const docs = querySnapshot.docs

      const hasNext = docs.length > pageSize
      const data = docs.slice(0, pageSize).map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[]

      const newLastDoc = hasNext ? docs[pageSize - 1] : undefined

      return {
        data,
        lastDoc: newLastDoc,
        hasNext
      }
    } catch (error) {
      console.error(`Ошибка пагинированного получения документов из коллекции ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Обновляет документ по ID
   */
  async update<T extends Record<string, any>>(
    collectionName: string, 
    docId: string, 
    data: Partial<T>
  ): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId)
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      console.error(`Ошибка обновления документа ${docId} в коллекции ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Удаляет документ по ID
   */
  async delete(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId)
      await deleteDoc(docRef)
    } catch (error) {
      console.error(`Ошибка удаления документа ${docId} из коллекции ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Удаляет несколько документов в пакетном режиме
   */
  async deleteBatch(collectionName: string, docIds: string[]): Promise<void> {
    try {
      const batch = writeBatch(db)
      
      docIds.forEach(docId => {
        const docRef = doc(db, collectionName, docId)
        batch.delete(docRef)
      })
      
      await batch.commit()
    } catch (error) {
      console.error(`Ошибка пакетного удаления документов из коллекции ${collectionName}:`, error)
      throw error
    }
  }

  /**
   * Выполняет транзакцию
   */
  async runTransaction<T>(
    callback: (transaction: any) => Promise<T>
  ): Promise<T> {
    try {
      return await runTransaction(db, callback)
    } catch (error) {
      console.error('Ошибка выполнения транзакции:', error)
      throw error
    }
  }

  /**
   * Создает пакетную операцию для массовых изменений
   */
  async batchWrite(operations: {
    type: 'set' | 'update' | 'delete'
    collectionName: string
    docId: string
    data?: any
    merge?: boolean
  }[]): Promise<void> {
    try {
      const batch = writeBatch(db)
      
      operations.forEach(operation => {
        const docRef = doc(db, operation.collectionName, operation.docId)
        
        switch (operation.type) {
          case 'set':
            batch.set(docRef, {
              ...operation.data,
              updatedAt: Timestamp.now()
            }, { merge: operation.merge || false })
            break
          case 'update':
            batch.update(docRef, {
              ...operation.data,
              updatedAt: Timestamp.now()
            })
            break
          case 'delete':
            batch.delete(docRef)
            break
        }
      })
      
      await batch.commit()
    } catch (error) {
      console.error('Ошибка выполнения пакетной операции:', error)
      throw error
    }
  }

  /**
   * Получает ссылку на коллекцию
   */
  getCollectionRef(collectionName: string): CollectionReference {
    return collection(db, collectionName)
  }

  /**
   * Получает ссылку на документ
   */
  getDocRef(collectionName: string, docId: string): DocumentReference {
    return doc(db, collectionName, docId)
  }

  /**
   * Создает запрос с заданными условиями
   */
  createQuery(collectionName: string, ...constraints: QueryConstraint[]) {
    const collectionRef = collection(db, collectionName)
    return query(collectionRef, ...constraints)
  }
}

// Экспортируем единственный экземпляр сервиса
export const firestoreService = new FirestoreService()
export default firestoreService 