# Универсальный сервис Firebase Firestore

Этот сервис предоставляет удобные методы для работы с Firebase Firestore базой данных, включая все CRUD операции (создание, чтение, обновление, удаление) с дополнительными возможностями.

## Установка и настройка

Убедитесь, что у вас правильно настроен Firebase в файле `src/app/firebase.ts` и установлены все необходимые зависимости:

```json
{
  "dependencies": {
    "firebase": "^11.9.0"
  }
}
```

## Импорт и использование

```typescript
import firestoreService from '@/lib/firestoreService'
import type { FirestoreQuery, FirestoreOrder, QueryOptions } from '@/lib/firestoreService'
```

## Основные методы

### 1. Создание документов

#### `create<T>(collectionName: string, data: T)`
Создает новый документ с автоматически сгенерированным ID.

```typescript
interface User {
  name: string
  email: string
  age: number
  isActive: boolean
}

const userData: User = {
  name: 'Иван Петров',
  email: 'ivan@example.com',
  age: 30,
  isActive: true
}

const result = await firestoreService.create('users', userData)
console.log('Создан пользователь с ID:', result.id)
```

#### `set<T>(collectionName: string, docId: string, data: T, merge?: boolean)`
Создает документ с заданным ID или обновляет существующий.

```typescript
// Создание с конкретным ID
await firestoreService.set('users', 'user_123', userData)

// Обновление с объединением данных
await firestoreService.set('users', 'user_123', { age: 31 }, true)
```

### 2. Чтение документов

#### `getById<T>(collectionName: string, docId: string)`
Получает документ по ID.

```typescript
const user = await firestoreService.getById<User>('users', 'user_123')
if (user) {
  console.log('Найден пользователь:', user)
}
```

#### `getAll<T>(collectionName: string, options?: QueryOptions)`
Получает все документы коллекции с возможностью фильтрации и сортировки.

```typescript
// Получить всех пользователей
const allUsers = await firestoreService.getAll<User>('users')

// С фильтрацией
const activeUsers = await firestoreService.getAll<User>('users', {
  where: [
    { field: 'isActive', operator: '==', value: true },
    { field: 'age', operator: '>=', value: 18 }
  ]
})

// С сортировкой и лимитом
const sortedUsers = await firestoreService.getAll<User>('users', {
  orderBy: [
    { field: 'age', direction: 'desc' },
    { field: 'name', direction: 'asc' }
  ],
  limit: 10
})
```

#### `getPaginated<T>(collectionName: string, pageSize: number, options?, lastDoc?)`
Получает документы с пагинацией.

```typescript
// Первая страница
const firstPage = await firestoreService.getPaginated<User>('users', 5, {
  orderBy: [{ field: 'createdAt', direction: 'desc' }]
})

// Следующая страница
if (firstPage.hasNext && firstPage.lastDoc) {
  const nextPage = await firestoreService.getPaginated<User>(
    'users', 
    5, 
    { orderBy: [{ field: 'createdAt', direction: 'desc' }] },
    firstPage.lastDoc
  )
}
```

### 3. Обновление документов

#### `update<T>(collectionName: string, docId: string, data: Partial<T>)`
Частично обновляет документ.

```typescript
await firestoreService.update('users', 'user_123', {
  age: 31,
  isActive: false
})
```

### 4. Удаление документов

#### `delete(collectionName: string, docId: string)`
Удаляет один документ.

```typescript
await firestoreService.delete('users', 'user_123')
```

#### `deleteBatch(collectionName: string, docIds: string[])`
Удаляет несколько документов в пакетном режиме.

```typescript
await firestoreService.deleteBatch('users', ['user_1', 'user_2', 'user_3'])
```

## Продвинутые возможности

### Пакетные операции

#### `batchWrite(operations)`
Выполняет несколько операций в одной транзакции.

```typescript
const operations = [
  {
    type: 'set',
    collectionName: 'users',
    docId: 'user_1',
    data: { name: 'Пользователь 1', email: 'user1@example.com' }
  },
  {
    type: 'update',
    collectionName: 'users',
    docId: 'user_2',
    data: { age: 25 }
  },
  {
    type: 'delete',
    collectionName: 'users',
    docId: 'user_3'
  }
]

await firestoreService.batchWrite(operations)
```

### Транзакции

#### `runTransaction<T>(callback)`
Выполняет атомарную транзакцию.

```typescript
await firestoreService.runTransaction(async (transaction) => {
  // Чтение данных
  const userRef = firestoreService.getDocRef('users', 'user_123')
  const userDoc = await transaction.get(userRef)
  
  if (!userDoc.exists()) {
    throw new Error('Пользователь не найден')
  }
  
  const userData = userDoc.data()
  
  // Обновление данных
  transaction.update(userRef, {
    balance: userData.balance + 100
  })
  
  return { success: true }
})
```

## Типы данных

### FirestoreQuery
```typescript
interface FirestoreQuery {
  field: string
  operator: WhereFilterOp  // '==', '!=', '<', '<=', '>', '>=', 'array-contains', 'in', 'not-in', 'array-contains-any'
  value: any
}
```

### FirestoreOrder
```typescript
interface FirestoreOrder {
  field: string
  direction: 'asc' | 'desc'
}
```

### QueryOptions
```typescript
interface QueryOptions {
  where?: FirestoreQuery[]
  orderBy?: FirestoreOrder[]
  limit?: number
  startAfter?: any
}
```

### PaginationResult
```typescript
interface PaginationResult<T> {
  data: T[]
  lastDoc?: DocumentSnapshot
  hasNext: boolean
}
```

## Операторы фильтрации

| Оператор | Описание | Пример |
|----------|----------|--------|
| `==` | Равно | `{ field: 'status', operator: '==', value: 'active' }` |
| `!=` | Не равно | `{ field: 'status', operator: '!=', value: 'deleted' }` |
| `<` | Меньше | `{ field: 'age', operator: '<', value: 30 }` |
| `<=` | Меньше или равно | `{ field: 'age', operator: '<=', value: 30 }` |
| `>` | Больше | `{ field: 'age', operator: '>', value: 18 }` |
| `>=` | Больше или равно | `{ field: 'age', operator: '>=', value: 18 }` |
| `array-contains` | Массив содержит | `{ field: 'tags', operator: 'array-contains', value: 'important' }` |
| `array-contains-any` | Массив содержит любой из | `{ field: 'tags', operator: 'array-contains-any', value: ['urgent', 'important'] }` |
| `in` | Значение в массиве | `{ field: 'category', operator: 'in', value: ['electronics', 'books'] }` |
| `not-in` | Значение не в массиве | `{ field: 'status', operator: 'not-in', value: ['deleted', 'banned'] }` |

## Автоматические поля

Сервис автоматически добавляет временные метки:
- `createdAt` - при создании документа
- `updatedAt` - при создании и обновлении документа

```typescript
// Эти поля добавляются автоматически
interface AutoFields {
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

## Обработка ошибок

Все методы сервиса оборачивают операции в try-catch блоки и логируют ошибки в консоль. Рекомендуется дополнительно обрабатывать ошибки в вашем коде:

```typescript
try {
  const user = await firestoreService.getById<User>('users', 'user_123')
  // Обработка успешного результата
} catch (error) {
  console.error('Ошибка получения пользователя:', error)
  // Обработка ошибки
}
```

## Примеры использования

Более подробные примеры смотрите в файле `firestoreService.examples.ts`.

### Создание пользователя
```typescript
const newUser = await firestoreService.create('users', {
  name: 'Новый пользователь',
  email: 'user@example.com',
  age: 25,
  isActive: true
})
```

### Поиск активных пользователей старше 18 лет
```typescript
const adults = await firestoreService.getAll<User>('users', {
  where: [
    { field: 'isActive', operator: '==', value: true },
    { field: 'age', operator: '>=', value: 18 }
  ],
  orderBy: [{ field: 'age', direction: 'asc' }],
  limit: 50
})
```

### Обновление нескольких документов
```typescript
const userIds = ['user_1', 'user_2', 'user_3']
const updateOperations = userIds.map(id => ({
  type: 'update' as const,
  collectionName: 'users',
  docId: id,
  data: { lastLogin: new Date() }
}))

await firestoreService.batchWrite(updateOperations)
```

## Лучшие практики

1. **Типизация**: Всегда используйте TypeScript интерфейсы для ваших данных
2. **Обработка ошибок**: Оборачивайте вызовы в try-catch блоки
3. **Пагинация**: Используйте пагинацию для больших наборов данных
4. **Индексы**: Создавайте индексы в Firebase Console для часто используемых запросов
5. **Пакетные операции**: Используйте пакетные операции для множественных изменений
6. **Транзакции**: Используйте транзакции для атомарных операций

## Ограничения Firestore

- Максимум 500 операций в одной пакетной операции
- Максимум 10 МБ на документ
- Максимальная глубина вложенности: 20 уровней
- Ограничения на количество составных запросов

Для полной информации об ограничениях см. [документацию Firebase](https://firebase.google.com/docs/firestore/quotas). 