import Image from 'next/image';
import React, { useEffect, useState, DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tokenizeThaiSentence } from '../utils/thaiTokenizer';

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

// Стилизованный компонент для слов с красивым дизайном
const StyledDraggableWord: React.FC<{
  id: string;
  text: string;
  onClick?: () => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
  isPlaced?: boolean;
}> = ({ id, text, onClick, onDragStart, isPlaced = false }) => {
  return (
    <motion.div
      onClick={onClick}
      draggable
      onDragStart={(e) => onDragStart(e as any, id)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        inline-block px-4 py-2 m-1 rounded-xl text-white font-medium cursor-move shadow-lg
        transition-all duration-200 select-none
        ${isPlaced 
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
          : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
        }
        hover:shadow-xl
      `}
    >
      {text}
    </motion.div>
  );
};

// Стилизованный компонент для слотов с красивым дизайном
const StyledWordDropSlot: React.FC<{
  slotIndex: number;
  placedWord?: { id: string; text: string; } | null;
  onDropWord: (slotIndex: number, wordId: string) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onReturnWord: (wordId: string) => void;
  isCorrect?: boolean;
}> = ({ slotIndex, placedWord, onDropWord, onDragStart, onReturnWord, isCorrect }) => {
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const wordId = e.dataTransfer.getData('text/plain');
    if (!wordId) return;
    onDropWord(slotIndex, wordId);
  };

  const getSlotColor = () => {
    if (isCorrect === true) return 'border-green-400 bg-green-50';
    if (isCorrect === false) return 'border-red-400 bg-red-50';
    if (placedWord) return 'border-gray-300 bg-gray-50';
    return 'border-dashed border-gray-300 bg-gray-50';
  };

  return (
    <motion.div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        min-w-[80px] min-h-[44px] p-2 m-1 rounded-xl border-2 
        flex items-center justify-center relative
        transition-all duration-200 
        ${getSlotColor()}
      `}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {placedWord ? (
        <StyledDraggableWord
          id={placedWord.id}
          text={placedWord.text}
          onDragStart={onDragStart}
          onClick={() => onReturnWord(placedWord.id)}
          isPlaced={true}
        />
      ) : (
        <motion.div
          className="text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          {slotIndex + 1}
        </motion.div>
      )}
      
      {/* Индикатор правильности */}
      {isCorrect !== undefined && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold
            ${isCorrect ? 'bg-green-500' : 'bg-red-500'}
          `}
        >
          {isCorrect ? '✓' : '✗'}
        </motion.div>
      )}
    </motion.div>
  );
};

export default function SentenceExercise({ sentence, onComplete, isActive, index }: Props) {
  const [shuffled, setShuffled] = useState<TokenState[]>([]);
  const [slots, setSlots] = useState<(TokenState | null)[]>([]);
  const [feedback, setFeedback] = useState<boolean[] | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isDragOverAvailable, setIsDragOverAvailable] = useState(false);

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

  // HTML5 drag-and-drop функция
  const onDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDropWord = (targetSlotIndex: number, wordId: string) => {
    // Специальный случай: возврат слова в shuffled (targetSlotIndex = -1)
    if (targetSlotIndex === -1) {
      const newShuffled = [...shuffled];
      const newSlots = [...slots];

      // Находим слово в слотах и возвращаем его в shuffled
      const sourceSlotIndex = newSlots.findIndex(slot => slot?.id === wordId);
      if (sourceSlotIndex !== -1) {
        const wordToReturn = newSlots[sourceSlotIndex];
        if (wordToReturn && !newShuffled.find(token => token.id === wordToReturn.id)) {
          newShuffled.push(wordToReturn);
        }
        newSlots[sourceSlotIndex] = null;
      }

      setShuffled(newShuffled);
      setSlots(newSlots);
      setFeedback(null);
      setIsChecked(false);
      return;
    }

    // Основная логика перемещения - используем правильную логику из работающего компонента
    const newShuffled = [...shuffled];
    const newSlots = [...slots];

    let dragged: TokenState | undefined;

    // Попробуем найти слово в списке не выбранных
    const listIdx = newShuffled.findIndex(t => t.id === wordId);
    if (listIdx !== -1) {
      dragged = newShuffled.splice(listIdx, 1)[0];
    }

    // Если не нашли, ищем среди слотов
    if (!dragged) {
      const fromIdx = newSlots.findIndex(t => t?.id === wordId);
      if (fromIdx !== -1) {
        dragged = newSlots[fromIdx] || undefined;
        newSlots[fromIdx] = null;
      }
    }

    if (!dragged) return;

    const replaced = newSlots[targetSlotIndex];
    newSlots[targetSlotIndex] = dragged;
    if (replaced) {
      // возвращаем заменённое слово в список, если его там ещё нет
      if (!newShuffled.find(t => t.id === replaced!.id)) {
        newShuffled.push(replaced);
      }
    }

    setShuffled(newShuffled);
    setSlots(newSlots);
    setFeedback(null);
    setIsChecked(false);
  };

  // Функция для возврата слова из слота в неиспользованные слова
  const handleReturnWord = (wordId: string) => {
    const newShuffled = [...shuffled];
    const newSlots = [...slots];

    // Находим слово в слотах и возвращаем его в shuffled
    const sourceSlotIndex = newSlots.findIndex(slot => slot?.id === wordId);
    if (sourceSlotIndex !== -1) {
      const wordToReturn = newSlots[sourceSlotIndex];
      if (wordToReturn && !newShuffled.find(token => token.id === wordToReturn.id)) {
        newShuffled.push(wordToReturn);
      }
      newSlots[sourceSlotIndex] = null;

      setShuffled(newShuffled);
      setSlots(newSlots);
      setFeedback(null);
      setIsChecked(false);
    }
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
              className={`min-h-[60px] p-4 mb-4 border-2 border-dashed rounded-xl transition-all duration-200 ${
                isDragOverAvailable 
                  ? 'border-purple-400 bg-purple-100 shadow-lg' 
                  : 'border-purple-200 bg-purple-50'
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setIsDragOverAvailable(true);
              }}
              onDragLeave={(e) => {
                // Проверяем, что мы действительно покинули контейнер, а не дочерний элемент
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setIsDragOverAvailable(false);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                const wordId = e.dataTransfer.getData('text/plain');
                if (wordId) {
                  handleReturnWord(wordId);
                }
                setIsDragOverAvailable(false);
              }}
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
                      <StyledDraggableWord
                        id={tok.id}
                        text={tok.text}
                        onDragStart={onDragStart}
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
                      <StyledWordDropSlot
                        slotIndex={idx}
                        placedWord={slot}
                        onDropWord={onDropWord}
                        onDragStart={onDragStart}
                        onReturnWord={handleReturnWord}
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
  );
} 