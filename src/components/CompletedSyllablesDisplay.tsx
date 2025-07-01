"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CompletedSyllableInfo } from '@/types/word.types';
import { createWordTranscription } from '@/utils/syllableUtils';

interface Props {
  completedSyllables: CompletedSyllableInfo[];
  totalSyllables: number;
}

export default function CompletedSyllablesDisplay({ completedSyllables, totalSyllables }: Props) {
  if (completedSyllables.length === 0) {
    return null;
  }

  const completionPercentage = (completedSyllables.length / totalSyllables) * 100;
  const wordTranscription = createWordTranscription(completedSyllables);
  const isWordComplete = completedSyllables.length === totalSyllables;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md border border-purple-100"
    >
      {/* Заголовок и прогресс */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 mb-3">
          Прогресс слова
        </h3>
        
        {/* Прогресс-бар */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <span className="text-lg font-medium text-gray-700">
            {completedSyllables.length} / {totalSyllables}
          </span>
          <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
            />
          </div>
          <span className="text-sm text-gray-600">
            {Math.round(completionPercentage)}%
          </span>
        </div>

        {/* Индикаторы слогов */}
        <div className="flex justify-center space-x-2">
          {Array.from({ length: totalSyllables }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`w-4 h-4 rounded-full ${
                index < completedSyllables.length
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Транскрипция слова (только если есть несколько слогов) */}
      {completedSyllables.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center p-4 bg-white rounded-lg shadow-sm border border-gray-100 mb-4"
        >
          <div className="text-sm text-gray-600 mb-2">
            Транскрипция слова
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {wordTranscription}
          </div>
        </motion.div>
      )}

      {/* Индикатор завершения слова */}
      {isWordComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
          className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
        >
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, repeat: 2 }}
            className="text-4xl mb-3"
          >
            🎉
          </motion.div>
          <div className="text-2xl font-bold text-green-800 mb-2">
            Слово составлено!
          </div>
          <div className="text-lg text-green-700">
            Все слоги собраны правильно
          </div>
          
          {/* Финальная транскрипция для завершенного слова */}
          <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
            <div className="text-sm text-green-600 mb-1">
              Полная транскрипция
            </div>
            <div className="text-xl font-bold text-green-800">
              {wordTranscription}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 