import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import { DraggableWord, ItemTypes } from './DraggableWord';

interface WordDropSlotProps {
  slotIndex: number;
  placedWord?: { id: string; text: string; } | null;
  onDropWord: (slotIndex: number, wordId: string) => void;
  isCorrect?: boolean;
}

export const WordDropSlot: React.FC<WordDropSlotProps> = ({
  slotIndex,
  placedWord,
  onDropWord,
  isCorrect,
}) => {
  const dropRef = useRef<HTMLDivElement>(null);
  
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.WORD,
    drop: (item: { id: string; text: string }) => {
      onDropWord(slotIndex, item.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  // Подключаем drop к ref
  drop(dropRef);

  const handleWordClick = () => {
    if (placedWord) {
      // При клике на слово в слоте - возвращаем его в доступные слова
      // Передаем специальный индекс -1 чтобы показать, что это возврат в shuffled
      onDropWord(-1, placedWord.id);
    }
  };

  const getSlotColor = () => {
    if (isCorrect === true) return 'border-green-400 bg-green-50';
    if (isCorrect === false) return 'border-red-400 bg-red-50';
    if (isOver && canDrop) return 'border-blue-400 bg-blue-50';
    if (placedWord) return 'border-gray-300 bg-gray-50';
    return 'border-dashed border-gray-300 bg-gray-50';
  };

  return (
    <div ref={dropRef}>
      <motion.div
        className={`
          min-w-[80px] min-h-[44px] p-2 m-1 rounded-xl border-2 
          flex items-center justify-center relative
          transition-all duration-200 
          ${getSlotColor()}
          ${isOver && canDrop ? 'scale-105 shadow-lg' : ''}
        `}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: isOver && canDrop ? 1.05 : 1 
        }}
        transition={{ duration: 0.2 }}
      >
      {placedWord ? (
        <DraggableWord
          id={placedWord.id}
          text={placedWord.text}
          onClick={handleWordClick}
          isPlaced={true}
        />
      ) : (
        <motion.div
          className="text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: isOver && canDrop ? 0 : 1 }}
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
    </div>
  );
}; 