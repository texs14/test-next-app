import { ThaiSyllableData } from '@/components/ThaiSyllableBuilder';
import { CompletedSyllableInfo } from '@/types/word.types';

// Маппинг тонов на буквы и названия (ОБНОВЛЕНО для M L H F R)
const TONE_CONFIG = {
  'mid': {
    icon: 'M',
    name: 'средний',
    color: 'text-blue-600'
  },
  'low': {
    icon: 'L',
    name: 'низкий',
    color: 'text-green-600'
  },
  'falling': {
    icon: 'F',
    name: 'падающий',
    color: 'text-red-600'
  },
  'high': {
    icon: 'H',
    name: 'высокий',
    color: 'text-purple-600'
  },
  'rising': {
    icon: 'R',
    name: 'восходящий',
    color: 'text-orange-600'
  }
};

/**
 * Получает иконку тона по названию
 */
export function getToneIcon(tone: string): string {
  return TONE_CONFIG[tone as keyof typeof TONE_CONFIG]?.icon || '?';
}

/**
 * Получает цвет тона для стилизации
 */
export function getToneColor(tone: string): string {
  return TONE_CONFIG[tone as keyof typeof TONE_CONFIG]?.color || 'text-gray-600';
}

/**
 * Получает русское название тона
 */
export function getToneName(tone: string): string {
  return TONE_CONFIG[tone as keyof typeof TONE_CONFIG]?.name || tone;
}

/**
 * Создает транскрипцию слога на основе его компонентов
 */
export function createSyllableTranscription(data: ThaiSyllableData): string {
  const initial = data.initial_consonant.sound;
  const vowel = data.vowel.sound;
  const final = data.final_consonant?.sound || '';
  
  return `${initial}${vowel}${final}`;
}

/**
 * Конвертирует данные слога в информацию о завершенном слоге
 */
export function syllableToCompleted(data: ThaiSyllableData): CompletedSyllableInfo {
  return {
    syllable: data.syllable,
    transcription: createSyllableTranscription(data),
    tone: getToneName(data.tone),
    toneIcon: getToneIcon(data.tone),
    completedAt: new Date()
  };
}

/**
 * Создает полную транскрипцию слова из завершенных слогов
 */
export function createWordTranscription(completedSyllables: CompletedSyllableInfo[]): string {
  return completedSyllables.map(s => s.transcription).join('-');
} 