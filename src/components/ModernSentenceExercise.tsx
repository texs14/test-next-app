import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { tokenizeThaiSentence } from '../utils/thaiTokenizer';
import { DraggableWord } from './DraggableWord';
import { WordDropSlot } from './WordDropSlot';

interface Sentence {
  text: string;
  rightAnswers: string[];
  translations: {
    ru: string;
    en: string;
  };
  note: {
    ru?: string;
    en?: string;
  } | null;
}

interface Props {
  sentence: Sentence;
  onComplete: () => void;
  isActive: boolean;
  index: number;
}

interface TokenState {
  id: string;
  text: string;
}

// Функция для перемешивания массива
const shuffleArray = <T,>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export default function ModernSentenceExercise({ sentence, onComplete, isActive, index }: Props) {
  const [shuffled, setShuffled] = useState<TokenState[]>([]);
  const [slots, setSlots] = useState<(TokenState | null)[]>([]);
  const [feedback, setFeedback] = useState<boolean[] | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  // Инициализация предложения
  useEffect(() => {
    if (!isActive) return;
    
    const tokens = tokenizeThaiSentence(sentence.text);
    const keyed = tokens.map((tok, idx) => ({ 
      id: `${index}-${idx}-${Date.now()}-${Math.random()}`, // Полностью уникальный ID
      text: tok 
    }));
    
    setShuffled(shuffleArray(keyed));
    setSlots(Array(keyed.length).fill(null));
    setFeedback(null);
    setIsChecked(false);
  }, [sentence.text, isActive, index]);

  const onDropWord = (targetSlotIndex: number, wordId: string) => {
    // Специальный случай: возврат слова в shuffled (targetSlotIndex = -1)
    if (targetSlotIndex === -1) {
      setSlots(prevSlots => {
        const sourceSlotIndex = prevSlots.findIndex(slot => slot?.id === wordId);
        if (sourceSlotIndex !== -1) {
          const wordToReturn = prevSlots[sourceSlotIndex];
          if (wordToReturn) {
            // Обновляем shuffled
            setShuffled(prev => {
              if (!prev.find(token => token.id === wordToReturn.id)) {
                return [...prev, wordToReturn];
              }
              return prev;
            });
            
            // Очищаем слот
            const newSlots = [...prevSlots];
            newSlots[sourceSlotIndex] = null;
            return newSlots;
          }
        }
        return prevSlots;
      });
      
      setFeedback(null);
      setIsChecked(false);
      return;
    }

    // Основная логика перемещения - используем React batch updates
    // Все setState вызовы в этой функции будут сгруппированы React автоматически
    
    // Находим слово в shuffled
    const shuffledIndex = shuffled.findIndex(token => token.id === wordId);
    if (shuffledIndex !== -1) {
      // Слово из доступных
      const draggedWord = shuffled[shuffledIndex];
      const replacedWord = slots[targetSlotIndex];
      
      // Создаем новые состояния
      const newShuffled = [...shuffled];
      const newSlots = [...slots];
      
      // Удаляем слово из shuffled
      newShuffled.splice(shuffledIndex, 1);
      
      // Если есть замещаемое слово, добавляем его в shuffled
      if (replacedWord && !newShuffled.find(token => token.id === replacedWord.id)) {
        newShuffled.push(replacedWord);
      }
      
      // Помещаем перетаскиваемое слово в целевой слот
      newSlots[targetSlotIndex] = draggedWord;
      
      // Batch update - React сгруппирует эти обновления
      setShuffled(newShuffled);
      setSlots(newSlots);
      setFeedback(null);
      setIsChecked(false);
      return;
    }
    
    // Находим слово в слотах
    const sourceSlotIndex = slots.findIndex(slot => slot?.id === wordId);
    if (sourceSlotIndex !== -1) {
      // Слово из другого слота
      const draggedWord = slots[sourceSlotIndex];
      const replacedWord = slots[targetSlotIndex];
      
      // Создаем новые состояния
      const newShuffled = [...shuffled];
      const newSlots = [...slots];
      
      // Очищаем исходный слот
      newSlots[sourceSlotIndex] = null;
      
      // Если есть замещаемое слово, добавляем его в shuffled
      if (replacedWord && !newShuffled.find(token => token.id === replacedWord.id)) {
        newShuffled.push(replacedWord);
      }
      
      // Помещаем перетаскиваемое слово в целевой слот
      newSlots[targetSlotIndex] = draggedWord;
      
      // Batch update - React сгруппирует эти обновления
      setShuffled(newShuffled);
      setSlots(newSlots);
      setFeedback(null);
      setIsChecked(false);
      return;
    }
    
    // Слово не найдено - ничего не делаем
  };

  const handleCheck = () => {
    const assembled = slots.map(s => s?.text || '').join('');
    const isCorrect = sentence.rightAnswers.includes(assembled);
    const rightTokens = tokenizeThaiSentence(sentence.rightAnswers[0]);
    const fb = slots.map((tok, idx) => (tok ? isCorrect && tok.text === rightTokens[idx] : false));
    
    setFeedback(fb);
    setIsChecked(true);
    
    if (isCorrect) {
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  };

  const handleReset = () => {
    const allTokens = [...shuffled];
    
    // Добавляем слова из слотов обратно в shuffled
    slots.forEach(slot => {
      if (slot && !allTokens.find(t => t.id === slot.id)) {
        allTokens.push(slot);
      }
    });
    
    // Перемешиваем слова при сбросе
    setShuffled(shuffleArray(allTokens));
    setSlots(slots.map(() => null));
    setFeedback(null);
    setIsChecked(false);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`border rounded-2xl p-6 mb-6 shadow-lg ${!isActive ? 'opacity-50 bg-gray-50' : 'bg-white'}`}>
        {!isActive && (
          <p className="text-gray-400 text-center">Задание #{index + 1} ещё не доступно</p>
        )}

        {isActive && (
          <>
            {/* Заголовок */}
            <motion.h3 
              className="mb-4 text-xl font-bold text-gray-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Задание {index + 1}
            </motion.h3>

            {/* Заметка */}
            {sentence.note && sentence.note.ru && (
              <motion.div 
                className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl flex items-center mb-6 border border-blue-100"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Image 
                  src="/note.png" 
                  className="mr-4" 
                  alt="note" 
                  width={30} 
                  height={35} 
                />
                <p className="text-gray-700">{sentence.note.ru}</p>
              </motion.div>
            )}

            {/* Инструкция */}
            <motion.p 
              className="text-gray-600 mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Соберите предложение:
            </motion.p>

            {/* Перевод */}
            <motion.div 
              className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-blue-500 rounded-xl mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-lg font-semibold text-gray-800">
                {sentence.translations.ru}
              </p>
            </motion.div>

            {/* Неиспользованные слова */}
            <motion.div 
              className="min-h-[60px] p-4 mb-4 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h4 className="text-purple-700 font-medium mb-2 text-sm">Доступные слова:</h4>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {shuffled.map((tok, index) => (
                    <motion.div
                      key={tok.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <DraggableWord
                        id={tok.id}
                        text={tok.text}
                        onClick={() => {
                          const emptyIdx = slots.findIndex(s => s === null);
                          if (emptyIdx !== -1) onDropWord(emptyIdx, tok.id);
                        }}
                        isPlaced={false}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Слоты для составления предложения */}
            <motion.div 
              className="min-h-[60px] p-4 mb-6 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <h4 className="text-blue-700 font-medium mb-2 text-sm">Ваше предложение:</h4>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {slots.map((slot, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + idx * 0.1 }}
                    >
                      <WordDropSlot
                        slotIndex={idx}
                        placedWord={slot}
                        onDropWord={onDropWord}
                        isCorrect={feedback ? feedback[idx] : undefined}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Кнопки управления */}
            <motion.div 
              className="flex items-center gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <motion.button
                onClick={handleCheck}
                disabled={isChecked || slots.every(s => s === null)}
                className={`
                  px-6 py-2 rounded-xl font-semibold text-white shadow-lg transition-all duration-200
                  ${isChecked || slots.every(s => s === null)
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:shadow-xl transform hover:scale-105'
                  }
                `}
                whileTap={{ scale: 0.95 }}
              >
                Проверить
              </motion.button>
              
              <motion.button
                onClick={handleReset}
                disabled={slots.every(s => s === null)}
                className={`
                  px-6 py-2 rounded-xl font-semibold text-white shadow-lg transition-all duration-200
                  ${slots.every(s => s === null)
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 hover:shadow-xl transform hover:scale-105'
                  }
                `}
                whileTap={{ scale: 0.95 }}
              >
                Сбросить
              </motion.button>
            </motion.div>
          </>
        )}
      </div>
    </DndProvider>
  );
} 