"use client";

import React, { useState, useCallback, useEffect, DragEvent } from 'react';
import { motion } from 'framer-motion';
import { WordChip } from './WordChip';
import { DropSlot } from './DropSlot';
import { ThaiWordData, CompletedSyllableInfo } from '@/types/word.types';
import { ThaiSyllableData } from './ThaiSyllableBuilder';
import { syllableToCompleted } from '@/utils/syllableUtils';

// Интерфейсы для компонента
interface WordSyllableBuilderProps {
  wordData: ThaiWordData;
  onWordComplete: (completedSyllables: CompletedSyllableInfo[]) => void;
  onReset?: () => void;
}

interface WordSyllableBuilderState {
  currentSyllableIndex: number;
  completedSyllables: CompletedSyllableInfo[];
  usedLetters: string[];
  availableLetters: string[];
  isWordComplete: boolean;
}

interface Token {
  id: string;  
  text: string;
}

// Константы слотов (из ThaiSyllableBuilder)
const SLOT_TOP = 0;
const SLOT_TOP2 = 1;
const SLOT_LEFT = 2;
const SLOT_CENTER = 3;
const SLOT_RIGHT = 4;
const SLOT_RIGHT2 = 5;
const SLOT_BOTTOM = 6;
const SLOT_COUNT = 7;

export default function WordSyllableBuilder({ wordData, onWordComplete, onReset }: WordSyllableBuilderProps) {
  // Инициализация состояния слова
  const initializeWordState = useCallback((): WordSyllableBuilderState => {
    const allLetters = wordData.syllables.flatMap(syllable => syllable.letters);
    return {
      currentSyllableIndex: 0,
      completedSyllables: [],
      usedLetters: [],
      availableLetters: allLetters,
      isWordComplete: false
    };
  }, [wordData]);

  // Основное состояние
  const [wordState, setWordState] = useState<WordSyllableBuilderState>(initializeWordState);
  
  // Состояние для текущего слога (аналогично ThaiSyllableBuilder)
  const [tokens, setTokens] = useState<Token[]>([]);
  const [slots, setSlots] = useState<(Token | null)[]>(Array(SLOT_COUNT).fill(null));
  const [expected, setExpected] = useState<(string | null)[]>([]);
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [visible, setVisible] = useState<boolean[]>(() => {
    const v = Array(SLOT_COUNT).fill(false);
    v[SLOT_CENTER] = true;
    return v;
  });

  // Получение текущего слога
  const getCurrentSyllable = useCallback((): ThaiSyllableData => {
    return wordData.syllables[wordState.currentSyllableIndex];
  }, [wordData.syllables, wordState.currentSyllableIndex]);

  // Функция для вычисления ожидаемого размещения (из ThaiSyllableBuilder)
  const computeExpected = useCallback((syllableData: ThaiSyllableData): (string | null)[] => {
    const res: (string | null)[] = Array(SLOT_COUNT).fill(null);
    res[SLOT_CENTER] = syllableData.initial_consonant.letter;

    const vowelParts = syllableData.vowel.letters ?? [{ position: syllableData.vowel.position[0], letter: syllableData.vowel.letter }];

    let hasAbove = false;
    let hasRight = false;

    for (const part of vowelParts) {
      switch (part.position) {
        case 'above':
          res[SLOT_TOP] = part.letter;
          hasAbove = true;
          break;
        case 'left':
          res[SLOT_LEFT] = part.letter;
          break;
        case 'right':
          res[SLOT_RIGHT] = part.letter;
          hasRight = true;
          break;
        case 'below':
          res[SLOT_BOTTOM] = part.letter;
          break;
      }
    }

    if (syllableData.tone_mark) {
      if (hasAbove) res[SLOT_TOP2] = syllableData.tone_mark;
      else res[SLOT_TOP] = syllableData.tone_mark;
    }

    if (syllableData.final_consonant) {
      if (hasRight) res[SLOT_RIGHT2] = syllableData.final_consonant.letter;
      else res[SLOT_RIGHT] = syllableData.final_consonant.letter;
    }

    return res;
  }, []);

  // Инициализация текущего слога
  useEffect(() => {
    if (wordState.isWordComplete) return;
    
    const currentSyllable = getCurrentSyllable();
    const availableTokens = wordState.availableLetters.map((letter, idx) => ({
      id: `${wordState.currentSyllableIndex}-${idx}`,
      text: letter
    }));

    setTokens(availableTokens);
    setSlots(Array(SLOT_COUNT).fill(null));
    setExpected(computeExpected(currentSyllable));
    setActiveTokenId(null);
    setActiveSlot(null);
    
    const v = Array(SLOT_COUNT).fill(false);
    v[SLOT_CENTER] = true;
    setVisible(v);
  }, [wordState.currentSyllableIndex, wordState.availableLetters, wordState.isWordComplete, getCurrentSyllable, computeExpected]);

  // Валидация размещения буквы
  const isValidPlacement = useCallback((letter: string, slotIndex: number): boolean => {
    const expectedLetter = expected[slotIndex];
    if (!expectedLetter) return false;
    
    const currentSyllable = getCurrentSyllable();
    return expectedLetter === letter && currentSyllable.letters.includes(letter);
  }, [expected, getCurrentSyllable]);

  // Обработка завершения слога
  const handleSyllableComplete = useCallback(() => {
    const currentSyllable = getCurrentSyllable();
    const completedSyllable = syllableToCompleted(currentSyllable);
    
    // Правильно исключаем использованные буквы
    const syllableLetters = currentSyllable.letters;
    const newAvailableLetters = [...wordState.availableLetters];
    
    // Удаляем каждую букву слога из доступных (учитываем повторяющиеся буквы)
    syllableLetters.forEach(letter => {
      const index = newAvailableLetters.indexOf(letter);
      if (index !== -1) {
        newAvailableLetters.splice(index, 1);
      }
    });
    
    const newUsedLetters = [...wordState.usedLetters, ...syllableLetters];
    const nextIndex = wordState.currentSyllableIndex + 1;
    const isWordComplete = nextIndex >= wordData.syllables.length;

    setWordState(prev => ({
      ...prev,
      currentSyllableIndex: nextIndex,
      completedSyllables: [...prev.completedSyllables, completedSyllable],
      usedLetters: newUsedLetters,
      availableLetters: newAvailableLetters,
      isWordComplete
    }));

    // Если слово завершено, вызываем callback
    if (isWordComplete) {
      setTimeout(() => {
        onWordComplete([...wordState.completedSyllables, completedSyllable]);
      }, 1500);
    }
  }, [wordState, wordData.syllables.length, getCurrentSyllable, onWordComplete]);

  // ======= ЛОГИКА РАЗМЕЩЕНИЯ ТОКЕНОВ (из ThaiSyllableBuilder) =======
  
  const onDragStart = useCallback((e: DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const findToken = useCallback((id: string): Token | undefined => {
    return tokens.find(t => t.id === id) || slots.find(s => s?.id === id) || undefined;
  }, [tokens, slots]);

  const placeToken = useCallback((slotIdx: number, token: Token) => {
    const expectedLetter = expected[slotIdx];
    if (!expectedLetter || token.text !== expectedLetter) {
      return; // Просто игнорируем неправильное размещение
    }

    const newSlots = [...slots];
    const newTokens = tokens.filter(t => t.id !== token.id);

    const prevIdx = newSlots.findIndex(s => s?.id === token.id);
    if (prevIdx !== -1) {
      newSlots[prevIdx] = null;
    }

    if (newSlots[slotIdx]) {
      newTokens.push(newSlots[slotIdx]!);
    }

    newSlots[slotIdx] = token;
    setSlots(newSlots);
    setTokens(newTokens);
    setActiveTokenId(null);
    setActiveSlot(null);

    // Показать дополнительные слоты после размещения центрального символа
    if (slotIdx === SLOT_CENTER && token.text === expected[SLOT_CENTER]) {
      setVisible(v => {
        const n = [...v];
        n[SLOT_LEFT] = true;
        n[SLOT_RIGHT] = true;
        n[SLOT_TOP] = true;
        n[SLOT_BOTTOM] = true;
        return n;
      });
    }
    if (
      slotIdx === SLOT_RIGHT &&
      getCurrentSyllable().vowel.position.includes('right') &&
      token.text === expected[SLOT_RIGHT]
    ) {
      setVisible(v => {
        const n = [...v];
        n[SLOT_RIGHT2] = true;
        return n;
      });
    }
    if (
      slotIdx === SLOT_TOP &&
      getCurrentSyllable().vowel.position.includes('above') &&
      token.text === expected[SLOT_TOP]
    ) {
      setVisible(v => {
        const n = [...v];
        n[SLOT_TOP2] = true;
        return n;
      });
    }

    // Проверить завершение слога
    const updatedSlots = [...newSlots];
    const isComplete = expected.every((letter, idx) => {
      if (!letter) return updatedSlots[idx] === null;
      return updatedSlots[idx]?.text === letter;
    });

    if (isComplete) {
      setTimeout(() => {
        handleSyllableComplete();
      }, 800);
    }
  }, [expected, slots, tokens, getCurrentSyllable, handleSyllableComplete]);

  const onDropWord = useCallback((slotIdx: number, id: string) => {
    const tok = findToken(id);
    if (!tok) return;
    placeToken(slotIdx, tok);
  }, [findToken, placeToken]);

  const handleChipClick = useCallback((id: string) => {
    if (activeTokenId === id) {
      setActiveTokenId(null);
    } else {
      setActiveTokenId(id);
      if (activeSlot !== null) {
        const tok = findToken(id);
        if (tok) placeToken(activeSlot, tok);
      }
    }
  }, [activeTokenId, activeSlot, findToken, placeToken]);

  const handleSlotClick = useCallback((idx: number) => {
    if (activeSlot === idx) {
      setActiveSlot(null);
    } else {
      setActiveSlot(idx);
      if (activeTokenId) {
        const tok = findToken(activeTokenId);
        if (tok) placeToken(idx, tok);
      }
    }
  }, [activeSlot, activeTokenId, findToken, placeToken]);

  // Сброс состояния
  const handleReset = useCallback(() => {
    setWordState(initializeWordState());
    onReset?.();
  }, [initializeWordState, onReset]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Заголовок с информацией о слове и прогрессе */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl shadow-sm"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {wordData.word}
        </h1>
        <div className="text-lg text-gray-700 mb-2">
          {wordData.meaning}
        </div>
        <div className="text-sm text-gray-600">
          Слог {wordState.currentSyllableIndex + 1} из {wordData.syllables.length}
        </div>
        
        {/* Прогресс-бар */}
        <div className="flex items-center justify-center space-x-4 mt-4">
          <div className="w-64 h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(wordState.currentSyllableIndex / wordData.syllables.length) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
            />
          </div>
          <span className="text-sm text-gray-600">
            {Math.round((wordState.currentSyllableIndex / wordData.syllables.length) * 100)}%
          </span>
        </div>
      </motion.div>

      {/* Отображение завершенных слогов - всегда видимо */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 min-h-[120px]"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">
          Прогресс сборки слова
        </h3>
        
        {wordState.completedSyllables.length > 0 ? (
          <div className="text-center">
            {/* Собранное слово - слоги объединены */}
            <div className="text-4xl font-bold text-gray-800 mb-2">
              {wordState.completedSyllables.map(syllable => syllable.syllable).join('')}
            </div>
            
            {/* Транскрипция - разделена точками */}
            <div className="text-lg text-gray-600 mb-1">
              {wordState.completedSyllables.map(syllable => syllable.transcription).join(' • ')}
            </div>
            
            {/* Тоны - разделены пробелами */}
            <div className="text-sm text-gray-500">
              {wordState.completedSyllables.map(syllable => syllable.toneIcon).join(' ')}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <div className="text-2xl mb-2">🔧</div>
            <div className="text-sm">
              Здесь будет отображаться прогресс сборки слова
            </div>
          </div>
        )}
      </motion.div>

      {/* Сетка сборки слогов */}
      {!wordState.isWordComplete && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">
            Соберите слог: {getCurrentSyllable().syllable}
          </h3>
          
          {/* Сетка слотов */}
          <div className="grid grid-cols-4 grid-rows-4 gap-2 justify-items-center w-[270px] mx-auto">
            <div
              className={`col-start-2 row-start-2 transition-opacity ${visible[SLOT_TOP] ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <DropSlot
                slotIndex={SLOT_TOP}
                placedWord={slots[SLOT_TOP]}
                onDropWord={onDropWord}
                onDragStart={onDragStart}
                onClick={() => handleSlotClick(SLOT_TOP)}
                isActive={activeSlot === SLOT_TOP}
                isCorrect={undefined}
              />
            </div>
            <div
              className={`col-start-2 row-start-1 transition-opacity ${visible[SLOT_TOP2] ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <DropSlot
                slotIndex={SLOT_TOP2}
                placedWord={slots[SLOT_TOP2]}
                onDropWord={onDropWord}
                onDragStart={onDragStart}
                onClick={() => handleSlotClick(SLOT_TOP2)}
                isActive={activeSlot === SLOT_TOP2}
                isCorrect={undefined}
              />
            </div>
            <div
              className={`col-start-1 row-start-3 transition-opacity ${visible[SLOT_LEFT] ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <DropSlot
                slotIndex={SLOT_LEFT}
                placedWord={slots[SLOT_LEFT]}
                onDropWord={onDropWord}
                onDragStart={onDragStart}
                onClick={() => handleSlotClick(SLOT_LEFT)}
                isActive={activeSlot === SLOT_LEFT}
                isCorrect={undefined}
              />
            </div>
            <div
              className={`col-start-2 row-start-3 transition-opacity ${visible[SLOT_CENTER] ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <DropSlot
                slotIndex={SLOT_CENTER}
                placedWord={slots[SLOT_CENTER]}
                onDropWord={onDropWord}
                onDragStart={onDragStart}
                onClick={() => handleSlotClick(SLOT_CENTER)}
                isActive={activeSlot === SLOT_CENTER}
                isCorrect={undefined}
              />
            </div>
            <div
              className={`col-start-3 row-start-3 transition-opacity ${visible[SLOT_RIGHT] ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <DropSlot
                slotIndex={SLOT_RIGHT}
                placedWord={slots[SLOT_RIGHT]}
                onDropWord={onDropWord}
                onDragStart={onDragStart}
                onClick={() => handleSlotClick(SLOT_RIGHT)}
                isActive={activeSlot === SLOT_RIGHT}
                isCorrect={undefined}
              />
            </div>
            <div
              className={`col-start-4 row-start-3 transition-opacity ${visible[SLOT_RIGHT2] ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <DropSlot
                slotIndex={SLOT_RIGHT2}
                placedWord={slots[SLOT_RIGHT2]}
                onDropWord={onDropWord}
                onDragStart={onDragStart}
                onClick={() => handleSlotClick(SLOT_RIGHT2)}
                isActive={activeSlot === SLOT_RIGHT2}
                isCorrect={undefined}
              />
            </div>
            <div
              className={`col-start-2 row-start-4 transition-opacity ${visible[SLOT_BOTTOM] ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <DropSlot
                slotIndex={SLOT_BOTTOM}
                placedWord={slots[SLOT_BOTTOM]}
                onDropWord={onDropWord}
                onDragStart={onDragStart}
                onClick={() => handleSlotClick(SLOT_BOTTOM)}
                isActive={activeSlot === SLOT_BOTTOM}
                isCorrect={undefined}
              />
            </div>
          </div>
          
          {/* Поле доступных букв */}
          <div className="flex flex-wrap gap-2 border border-dashed rounded p-4 min-h-[48px] justify-center bg-gray-50">
            {tokens.map(tok => (
              <WordChip
                key={tok.id}
                word={tok.text}
                id={tok.id}
                onDragStart={onDragStart}
                onClick={() => handleChipClick(tok.id)}
                isPlaced={false}
                isActive={activeTokenId === tok.id}
                classes={'text-[26px]'}
              />
            ))}
          </div>
        </div>
      )}

      {/* Завершение слова */}
      {wordState.isWordComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
          className="text-center p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200"
        >
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.6, repeat: 2 }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>
          <div className="text-3xl font-bold text-green-800 mb-2">
            Слово составлено!
          </div>
          <div className="text-xl text-green-700 mb-4">
            {wordData.word} • {wordData.meaning}
          </div>
          <div className="text-lg text-green-600">
            Все {wordData.syllables.length} слогов собраны правильно
          </div>
        </motion.div>
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
      </div>
    </div>
  );
} 