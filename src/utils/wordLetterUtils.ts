import { ThaiWordData, WordLetterManagement, LetterValidationResult } from '@/types/word.types';
import { ThaiSyllableData } from '@/components/ThaiSyllableBuilder';

/**
 * Получить все буквы слова из всех слогов
 */
export const getAllWordLetters = (wordData: ThaiWordData): string[] => {
  return wordData.syllables.flatMap(syllable => syllable.letters);
};

/**
 * Получить доступные (неиспользованные) буквы
 */
export const getAvailableLetters = (
  allLetters: string[],
  usedLetters: string[]
): string[] => {
  return allLetters.filter(letter => !usedLetters.includes(letter));
};

/**
 * Проверить, подходит ли буква для текущего слога
 */
export const isValidForCurrentSyllable = (
  letter: string,
  currentSyllable: ThaiSyllableData
): boolean => {
  return currentSyllable.letters.includes(letter);
};

/**
 * Проверить, принадлежит ли буква будущим слогам
 */
export const belongsToFutureSyllables = (
  letter: string,
  wordData: ThaiWordData,
  currentSyllableIndex: number
): boolean => {
  const futureSyllables = wordData.syllables.slice(currentSyllableIndex + 1);
  return futureSyllables.some(syllable => syllable.letters.includes(letter));
};

/**
 * Создать полную информацию об управлении буквами слова
 */
export const createWordLetterManagement = (
  wordData: ThaiWordData,
  currentSyllableIndex: number,
  usedLetters: string[]
): WordLetterManagement => {
  const allLetters = getAllWordLetters(wordData);
  const availableLetters = getAvailableLetters(allLetters, usedLetters);
  const currentSyllableLetters = wordData.syllables[currentSyllableIndex]?.letters || [];

  return {
    allLetters,
    availableLetters,
    usedLetters,
    currentSyllableLetters
  };
};

/**
 * Валидация букв для отображения в интерфейсе
 */
export const validateLettersForDisplay = (
  wordData: ThaiWordData,
  currentSyllableIndex: number,
  usedLetters: string[]
): LetterValidationResult[] => {
  const allLetters = getAllWordLetters(wordData);
  const currentSyllable = wordData.syllables[currentSyllableIndex];

  // Создаем массив букв с индексами для правильной обработки дубликатов
  const lettersWithIndices = allLetters.map((letter, index) => ({
    letter,
    originalIndex: index,
    uniqueId: `${letter}-${index}`
  }));

  // Создаем карту использованных букв с подсчетом
  const usedLettersCount = new Map<string, number>();
  usedLetters.forEach(letter => {
    usedLettersCount.set(letter, (usedLettersCount.get(letter) || 0) + 1);
  });

  // Создаем карту доступных букв с подсчетом
  const availableLettersCount = new Map<string, number>();
  allLetters.forEach(letter => {
    availableLettersCount.set(letter, (availableLettersCount.get(letter) || 0) + 1);
  });

  // Фильтруем буквы, которые еще можно использовать
  // Правильно учитываем уже отфильтрованные экземпляры той же буквы
  const availableLettersWithIndices: Array<{letter: string, originalIndex: number, uniqueId: string}> = [];
  const tempUsedCount = new Map(usedLettersCount);

  for (const letterInfo of lettersWithIndices) {
    const letter = letterInfo.letter;
    const totalCount = availableLettersCount.get(letter) || 0;
    const currentUsedCount = tempUsedCount.get(letter) || 0;
    
    if (currentUsedCount < totalCount) {
      availableLettersWithIndices.push(letterInfo);
      tempUsedCount.set(letter, currentUsedCount + 1);
    }
  }

  return availableLettersWithIndices.map(({ letter, originalIndex }) => {
    const isValidForCurrentSyllable = currentSyllable ? 
      currentSyllable.letters.includes(letter) : false;
    const belongsToFutureSyllable = belongsToFutureSyllables(
      letter, 
      wordData, 
      currentSyllableIndex
    );

    return {
      letter,
      isValidForCurrentSyllable,
      isUsed: false, // Здесь всегда false, так как мы уже отфильтровали использованные
      belongsToFutureSyllable
    };
  });
};

/**
 * Получить CSS классы для стилизации букв в зависимости от их статуса
 */
export const getLetterDisplayClasses = (
  validationResult: LetterValidationResult
): string => {
  const baseClasses = "transition-all duration-200";
  
  if (validationResult.isUsed) {
    return `${baseClasses} opacity-30 cursor-not-allowed`;
  }
  
  if (validationResult.isValidForCurrentSyllable) {
    return `${baseClasses} ring-2 ring-purple-300 shadow-md transform hover:scale-105`;
  }
  
  if (validationResult.belongsToFutureSyllable) {
    return `${baseClasses} opacity-70 hover:opacity-85`;
  }
  
  return baseClasses;
}; 