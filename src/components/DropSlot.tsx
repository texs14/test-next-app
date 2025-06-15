// src/components/DropSlot.tsx
import React, { DragEvent, useCallback } from 'react';
import { WordChip } from './WordChip';
const cx = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(' ');

interface TokenData {
  id: string;
  text: string;
}

interface DropSlotProps {
  slotIndex: number;
  placedWord: TokenData | null;
  onDropWord: (slotIdx: number, wordId: string) => void;
  onDragStart: (ev: DragEvent<HTMLDivElement>, id: string) => void;
  isCorrect?: boolean; // для подсветки: true / false / undefined
  onClick?: () => void;
  isActive?: boolean;
}

export const DropSlot: React.FC<DropSlotProps> = ({
  slotIndex,
  placedWord,
  onDropWord,
  onDragStart,
  isCorrect,
  onClick,
  isActive,
}) => {
  // Делаем слот реагирующим на drop
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      // извлекаем идентификатор слова из dataTransfer
      const wordId = e.dataTransfer.getData('text/plain');
      if (!wordId) return;
      onDropWord(slotIndex, wordId);
    },
    [slotIndex, onDropWord],
  );

  // Выбираем цвет фона:
  //  - если isCorrect === true → зелёный обвод
  //  - если false → красный обвод
  //  - иначе обычный серый пунктир
  const borderClass =
    isCorrect === undefined
      ? 'border-2 border-gray-300 border-dashed'
      : isCorrect
        ? 'border-2 border-green-500'
        : 'border-2 border-red-500';

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => {
        if (onClick) onClick();
      }}
      className={cx(
        'min-w-[4rem] min-h-[2rem] flex items-center justify-center m-1 p-2 text-[26px]',
        borderClass,
        'rounded',
        isActive && 'ring-2 ring-blue-500',
      )}
    >
      {placedWord ? (
        <WordChip
          word={placedWord.text}
          id={placedWord.id}
          onDragStart={onDragStart}
          isPlaced={true}
          isCorrect={isCorrect}
        />
      ) : (
        <span className="text-gray-400">…</span>
      )}
    </div>
  );
};
