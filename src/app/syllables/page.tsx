"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import ThaiSyllableBuilder, { ThaiSyllableData } from '@/components/ThaiSyllableBuilder';
import WordBuilder from '@/components/WordBuilder';
import WordSyllableBuilder from '@/components/WordSyllableBuilder';
import { CompletedSyllableInfo } from '@/types/word.types';
import { THAI_WORDS, SINGLE_SYLLABLES } from '@/data/wordData';

type ExerciseMode = 'words' | 'syllables' | 'word-building';

export default function SyllableExercisePage() {
  const [mode, setMode] = useState<ExerciseMode>('word-building');
  const [wordIndex, setWordIndex] = useState(0);
  const [syllableIndex, setSyllableIndex] = useState(0);
  const [syllableCount, setSyllableCount] = useState(0);
  const [wordsCompleted, setWordsCompleted] = useState(0);

  // Обработчики для режима слов
  const handleWordComplete = (word: string, syllables: CompletedSyllableInfo[]) => {
    console.log(`Слово "${word}" завершено!`, syllables);
    setWordsCompleted(prev => prev + 1);
    
    // Переход к следующему слову
    setTimeout(() => {
      setWordIndex((prev) => (prev + 1) % THAI_WORDS.length);
    }, 2000);
  };

  const handleWordReset = () => {
    // Сброс состояния слова если нужно
  };

  // Обработчики для нового режима word-building
  const handleWordSyllableComplete = (syllables: CompletedSyllableInfo[]) => {
    console.log(`Слово завершено через WordSyllableBuilder!`, syllables);
    setWordsCompleted(prev => prev + 1);
    
    // Переход к следующему слову
    setTimeout(() => {
      setWordIndex((prev) => (prev + 1) % THAI_WORDS.length);
    }, 2000);
  };

  const handleWordSyllableReset = () => {
    // Сброс состояния если нужно
  };

  // Обработчики для режима отдельных слогов
  const handleSyllableComplete = () => {
    const nextCount = syllableCount + 1;
    setSyllableCount(nextCount);
    
    if (nextCount >= 3) {
      setSyllableIndex(0);
      setSyllableCount(0);
    } else {
      setSyllableIndex((i) => (i + 1) % SINGLE_SYLLABLES.length);
    }
  };

  const toggleMode = (newMode: ExerciseMode) => {
    setMode(newMode);
    // Сброс состояния при переключении режима
    setWordIndex(0);
    setSyllableIndex(0);
    setSyllableCount(0);
    setWordsCompleted(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        
        {/* Заголовок и переключатель режимов */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Составление тайских слогов
          </h1>
          <p className="text-gray-600 mb-6">
            Изучайте тайскую письменность через интерактивные упражнения
          </p>

          {/* Переключатель режимов */}
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-xl p-2 shadow-lg border border-gray-200">
              <button
                onClick={() => toggleMode('word-building')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 text-sm ${
                  mode === 'word-building'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                }`}
              >
                🧩 Составление по словам
              </button>
              <button
                onClick={() => toggleMode('words')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 text-sm ${
                  mode === 'words'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                🏗️ Составление слов
              </button>
              <button
                onClick={() => toggleMode('syllables')}
                className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 text-sm ${
                  mode === 'syllables'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                📝 Отдельные слоги
              </button>
            </div>
          </div>
        </motion.div>

        {/* Статистика */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {mode === 'word-building' ? wordsCompleted : mode === 'words' ? wordsCompleted : syllableCount}
                </div>
                <div className="text-sm text-gray-600">
                  {mode === 'word-building' ? 'Слов завершено (новый)' : mode === 'words' ? 'Слов завершено' : 'Слогов собрано'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {mode === 'syllables' ? SINGLE_SYLLABLES.length : THAI_WORDS.length}
                </div>
                <div className="text-sm text-gray-600">
                  {mode === 'syllables' ? 'Доступно слогов' : 'Доступно слов'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {mode === 'word-building' ? 'НОВЫЙ' : mode === 'words' ? 'СТАРЫЙ' : 'ОДИНОЧНЫЙ'}
                </div>
                <div className="text-sm text-gray-600">
                  Тип режима
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Основной контент */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, x: mode === 'word-building' ? 50 : mode === 'words' ? 0 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {mode === 'word-building' ? (
            <div>
              {/* Новый режим составления слов через WordSyllableBuilder */}
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg text-center">
                <div className="text-orange-800 font-bold">🚧 НОВЫЙ РЕЖИМ - В РАЗРАБОТКЕ</div>
                <div className="text-orange-700 text-sm mt-1">
                  Режим составления слов по слогам с единым интерфейсом
                </div>
              </div>
              <WordSyllableBuilder
                key={wordIndex}
                wordData={THAI_WORDS[wordIndex]}
                onWordComplete={handleWordSyllableComplete}
                onReset={handleWordSyllableReset}
              />
            </div>
          ) : mode === 'words' ? (
            <div>
              {/* Режим составления слов */}
              <WordBuilder
                key={wordIndex}
                wordData={THAI_WORDS[wordIndex]}
                onWordComplete={handleWordComplete}
                onReset={handleWordReset}
              />
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-6">
              {/* Режим отдельных слогов */}
              <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  Тренировка отдельных слогов
                </h2>
                <p className="text-sm text-gray-600">
                  Собрано слогов: {syllableCount} из 3
                </p>
              </div>
              
              <motion.div
                key={`syllable-${syllableIndex}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ThaiSyllableBuilder 
                  data={SINGLE_SYLLABLES[syllableIndex]}
                  index={syllableIndex} 
                  onComplete={handleSyllableComplete} 
                />
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Инструкции */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              💡 Как пользоваться
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-orange-800 mb-2">🧩 Режим составления по словам:</h4>
                <ul className="space-y-1">
                  <li>• НОВЫЙ подход к составлению слов</li>
                  <li>• Единый интерфейс без пересоздания</li>
                  <li>• Показаны все буквы слова сразу</li>
                  <li>• Автоматический переход между слогами</li>
                  <li>• Встроенный прогресс сборки</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-purple-800 mb-2">🏗️ Режим слов:</h4>
                <ul className="space-y-1">
                  <li>• Составляйте слова по слогам последовательно</li>
                  <li>• Смотрите прогресс в блоке завершенных слогов</li>
                  <li>• Изучайте транскрипцию и тоны каждого слога</li>
                  <li>• Переходите к следующему слову после завершения</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">📝 Режим слогов:</h4>
                <ul className="space-y-1">
                  <li>• Тренируйтесь на отдельных слогах</li>
                  <li>• Перетаскивайте символы в правильные позиции</li>
                  <li>• Используйте клики для размещения символов</li>
                  <li>• Изучайте структуру тайских слогов</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

