export type Language = 'ru' | 'en' | 'th' | 'zh';

export type Word = { word: string; start: number; end: number };
export type Segment = {
  id: number;
  start: number;
  end: number;
  text: string;
  words: Word[];
  translations: {
    en: string;
    th: string;
    ru: string;
    zh?: string;
  };
};
export type SubtitleData = {
  translation: unknown;
  segments: Segment[];
};
export type VideoDoc = {
  src: string;
  previewSrc: string;
  originalLang: Language;
  targetLangs: Language[];
  difficulty: string;
  tags: string[];
  subtitle: SubtitleData;
  name: string;
  size: number;
  updated: unknown; // Firestore Timestamp
};

export interface Sentence {
  text: string;
  rightAnswers: string[];
  translations: {
    ru: string;
    en: string;
    zh?: string;
  };
  note: {
    ru?: string;
    en?: string;
  } | null;
}

// Новые типы для информационных блоков
export interface InformationBlock {
  title: string;
  content: string;
  type: 'rule' | 'exception' | 'explanation' | 'example';
  importance: 'high' | 'medium' | 'low';
}

// Типы для форм редактирования
export interface SentenceFormData {
  text: string;
  rightAnswers: string;
  translations: {
    ru: string;
    en: string;
    zh: string;
  };
  notes: {
    ru?: string;
    en?: string;
  };
  expanded?: boolean;
}

export interface InformationBlockFormData {
  title: string;
  content: string;
  type: 'rule' | 'exception' | 'explanation' | 'example';
  importance: 'high' | 'medium' | 'low';
  expanded: boolean;
}

// Импорт типов для слов
import { ThaiWordData } from './word.types';

export interface WordFormData {
  word: string;
  syllables: import('@/components/ThaiSyllableBuilder').ThaiSyllableData[];
  meaning: string;
  difficulty: 'easy' | 'medium' | 'hard';
  expanded: boolean;
}

// Union type для элементов упражнения
export interface ExerciseItem {
  id: string;
  type: 'sentence' | 'word' | 'information';
  order: number;
  data: Sentence | ThaiWordData | InformationBlock;
}

// Типы для форм
export type ExerciseFormItem = {
  id: string;
  type: 'sentence' | 'word' | 'information';
  data: SentenceFormData | WordFormData | InformationBlockFormData;
}

// Расширенный интерфейс упражнения с обратной совместимостью
export interface ModernExercise {
  title: string;
  description: string;
  topic: string;
  difficulty: string;
  items: ExerciseItem[];
  // Обратная совместимость
  sentences?: Sentence[];
}

// Существующий интерфейс упражнения (для обратной совместимости)
export interface Exercise {
  title: string;
  description: string;
  topic: string;
  difficulty: string;
  sentences: Sentence[];
}

export interface ExercisePreview {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  createdAt?: any;
  updatedAt?: any;
}

// Утилитарные функции для работы с упражнениями
export function isModernExercise(exercise: Exercise | ModernExercise): exercise is ModernExercise {
  return 'items' in exercise && Array.isArray(exercise.items);
}

export function getExerciseItems(exercise: Exercise | ModernExercise): ExerciseItem[] {
  if (isModernExercise(exercise)) {
    return exercise.items;
  }
  
  // Конвертируем старый формат в новый
  return exercise.sentences.map((sentence, index) => ({
    id: `sentence-${index}`,
    type: 'sentence' as const,
    order: index,
    data: sentence
  }));
}

export function createModernExercise(
  title: string,
  description: string,
  topic: string,
  difficulty: string,
  items: ExerciseItem[]
): ModernExercise {
  return {
    title,
    description,
    topic,
    difficulty,
    items: items.sort((a, b) => a.order - b.order)
  };
}
