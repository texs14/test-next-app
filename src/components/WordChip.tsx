// src/components/WordChip.tsx
import React, { DragEvent } from 'react';
const cx = (...classes: Array<string | Record<string, boolean>>) => {
  return classes
    .flatMap(c => {
      if (typeof c === 'string') return c;
      return Object.entries(c)
        .filter(([, cond]) => cond)
        .map(([cls]) => cls);
    })
    .join(' ');
};

interface WordChipProps {
  word: string;
  id: string;
  onDragStart: (ev: DragEvent<HTMLDivElement>, id: string) => void;
  onClick?: () => void;
  isPlaced: boolean; // true, если слово уже помещено в “слот”
  isCorrect?: boolean; // undefined (не проверяли), true (правильно), false (неправильно)
}

export const WordChip: React.FC<WordChipProps> = ({
  word,
  id,
  onDragStart,
  onClick,
  isPlaced,
  isCorrect,
}) => {
  // Определяем класс для цвета фона:
  //  - если isCorrect === true → зелёный фон
  //  - если isCorrect === false → светло-красный
  //  - иначе обычный серый
  const base = 'px-3 py-1 rounded cursor-grab select-none';
  const statusClass =
    isCorrect === undefined
      ? 'bg-gray-200'
      : isCorrect
        ? 'bg-green-300'
        : 'bg-red-200';

  return (
    <div
      className={cx(base, statusClass, {
        'shadow-md': isPlaced,
      })}
      draggable
      onDragStart={e => {
        onDragStart(e, id);
      }}
      onClick={() => {
        if (onClick) onClick();
      }}
      data-interactive="true"
    >
      {word}
    </div>
  );
};
