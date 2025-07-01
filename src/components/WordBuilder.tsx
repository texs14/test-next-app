"use client";

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import ThaiSyllableBuilder from './ThaiSyllableBuilder';
import CompletedSyllablesDisplay from './CompletedSyllablesDisplay';
import { 
  WordProgressState, 
  ThaiWordData,
  CompletedSyllableInfo 
} from '@/types/word.types';
import { syllableToCompleted } from '@/utils/syllableUtils';

interface Props {
  wordData: ThaiWordData;
  onWordComplete: (word: string, syllables: CompletedSyllableInfo[]) => void;
  onReset?: () => void;
}

export default function WordBuilder({ wordData, onWordComplete, onReset }: Props) {
  // Состояние прогресса слова с управлением использованными буквами
  const [progress, setProgress] = useState<WordProgressState>({
    currentSyllableIndex: 0,
    completedSyllables: [],
    isWordComplete: false,
    totalSyllables: wordData.syllables.length,
    usedLetters: [] // Новое поле для отслеживания использованных букв
  });

  // Обработка завершения слога
  const handleSyllableComplete = useCallback(() => {
    const currentSyllable = wordData.syllables[progress.currentSyllableIndex];
    if (!currentSyllable) return;

    // Конвертируем слог в завершенный
    const completedSyllable = syllableToCompleted(currentSyllable);
    
    // Обновляем прогресс
    const newCompletedSyllables = [...progress.completedSyllables, completedSyllable];
    const newUsedLetters = [...progress.usedLetters, ...currentSyllable.letters];
    const nextIndex = progress.currentSyllableIndex + 1;
    const isWordComplete = nextIndex >= wordData.syllables.length;

    setProgress(prev => ({
      ...prev,
      completedSyllables: newCompletedSyllables,
      usedLetters: newUsedLetters,
      currentSyllableIndex: nextIndex,
      isWordComplete
    }));

    // Если слово завершено, автоматически вызываем onWordComplete через задержку
    if (isWordComplete) {
      setTimeout(() => {
        onWordComplete(wordData.word, newCompletedSyllables);
      }, 2000); // Даем время пользователю увидеть результат
    }

  }, [progress, wordData, onWordComplete]);

  // Обработка нажатия кнопки "Продолжить" (если слово завершено)
  const handleContinueToNextWord = useCallback(() => {
    onWordComplete(wordData.word, progress.completedSyllables);
  }, [wordData.word, progress.completedSyllables, onWordComplete]);

  // Сброс состояния
  const handleReset = useCallback(() => {
    setProgress({
      currentSyllableIndex: 0,
      completedSyllables: [],
      isWordComplete: false,
      totalSyllables: wordData.syllables.length,
      usedLetters: []
    });
    onReset?.();
  }, [wordData, onReset]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Заголовок с информацией о слове */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl shadow-sm"
      >
        <h1 className="first-letter:uppercase text-3xl font-bold text-gray-800 mb-2">
          {wordData.meaning}
        </h1>
        <div className="text-sm text-gray-600">
          Слог {progress.currentSyllableIndex + 1} из {progress.totalSyllables}
        </div>
      </motion.div>

      {/* Текущий слог для составления */}
      {!progress.isWordComplete && (
        <motion.div
          key={`syllable-${progress.currentSyllableIndex}`}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
        >
          <ThaiSyllableBuilder
            data={wordData.syllables[progress.currentSyllableIndex]}
            index={progress.currentSyllableIndex}
            onComplete={handleSyllableComplete}
          />
        </motion.div>
      )}

      {/* Упрощенный блок прогресса по слову */}
      {progress.completedSyllables.length > 0 && (
        <CompletedSyllablesDisplay
          completedSyllables={progress.completedSyllables}
          totalSyllables={progress.totalSyllables}
        />
      )}

      {/* Управление */}
      <div className="flex justify-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleReset}
          className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          Начать заново
        </motion.button>
        
        {progress.isWordComplete && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleContinueToNextWord}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            Продолжить к следующему слову
          </motion.button>
        )}
      </div>
    </div>
  );
} 