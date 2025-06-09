// src/components/SentenceExercise.tsx
import Image from 'next/image';
import React, { useEffect, useState, DragEvent } from 'react';
import { tokenizeThaiSentence } from '../utils/thaiTokenizer';
import { WordChip } from './WordChip';
import { DropSlot } from './DropSlot';

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

export default function SentenceExercise({ sentence, onComplete, isActive, index }: Props) {
  const [shuffled, setShuffled] = useState<TokenState[]>([]);
  const [slots, setSlots] = useState<(TokenState | null)[]>([]);
  const [feedback, setFeedback] = useState<boolean[] | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    const tokens = tokenizeThaiSentence(sentence.text);
    const keyed = tokens.map((tok, idx) => ({ id: `${index}-${idx}`, text: tok }));
    const copy = [...keyed];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setShuffled(copy);
    setSlots(Array(keyed.length).fill(null));
    setFeedback(null);
    setIsChecked(false);
  }, [sentence.text, isActive, index]);

  const onDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDropWord = (slotIdx: number, wordId: string) => {
    let dragged: TokenState | undefined;

    // Remove from shuffled if present
    setShuffled(prev => {
      const idx = prev.findIndex(w => w.id === wordId);
      if (idx !== -1) {
        dragged = prev[idx];
        return prev.filter((_, i) => i !== idx);
      }
      return prev;
    });

    setSlots(prev => {
      const updated = [...prev];

      if (!dragged) {
        const fromIdx = prev.findIndex(t => t?.id === wordId);
        if (fromIdx !== -1) {
          dragged = prev[fromIdx] || undefined;
          updated[fromIdx] = null;
        }
      }

      if (!dragged) return prev;

      const replaced = updated[slotIdx];
      updated[slotIdx] = dragged;
      if (replaced) {
        setShuffled(sPrev => [...sPrev, replaced]);
      }
      return updated;
    });

    setFeedback(null);
    setIsChecked(false);
  };

  const handleCheck = () => {
    const assembled = slots.map(s => s?.text || '').join('');
    const isCorrect = sentence.rightAnswers.includes(assembled);
    const rightTokens = tokenizeThaiSentence(sentence.rightAnswers[0]);
    const fb = slots.map((tok, idx) => (tok ? isCorrect && tok.text === rightTokens[idx] : false));
    setFeedback(fb);
    setIsChecked(true);
    if (isCorrect) {
      setTimeout(onComplete, 800);
    }
  };

  const handleReset = () => {
    setShuffled(prev => [...prev, ...slots.filter(Boolean) as TokenState[]]);
    setSlots(slots.map(() => null));
    setFeedback(null);
    setIsChecked(false);
  };

  return (
    <div className={`border rounded p-4 mb-6 ${!isActive ? 'opacity-50' : ''}`}>

      {!isActive && <p className="text-gray-400">Задание #{index + 1} ещё не доступно</p>}

      {isActive && (
        <>
          <h3 className="mb-2 text-lg font-semibold">Задание {index + 1}</h3>
          {sentence.note && sentence.note.ru && (
            <div className="p-5 bg-gray-100 rounded-[20px] flex items-center">
              <Image src="/note.png" className="inline mr-2" alt="thai" width={30} height={35} />
              <p>{sentence.note.ru}</p>
            </div>
          )}

          <p className="mt-3 mb-3">Соберите предложение:</p>
          <p className="p-4 mt-3 mb-4 bg-gray-100 border rounded-lg text-[18px] font-bold">
            {sentence.translations.ru}
          </p>

          <div className="flex flex-wrap gap-2 mb-4 border-2 border-dashed rounded">
            {shuffled.map(tok => (
              <WordChip
                key={tok.id}
                word={tok.text}
                id={tok.id}
                onDragStart={onDragStart}
                onClick={() => {
                  const emptyIdx = slots.findIndex(s => s === null);
                  if (emptyIdx !== -1) onDropWord(emptyIdx, tok.id);
                }}
                isPlaced={false}
              />
            ))}
          </div>

          <div className="min-h-[48px] border-2 border-dashed rounded p-2 mb-4 flex flex-wrap gap-2">
            {slots.map((slot, idx) => (
              <DropSlot
                key={idx}
                slotIndex={idx}
                placedWord={slot}
                onDropWord={onDropWord}
                onDragStart={onDragStart}
                isCorrect={feedback ? feedback[idx] : undefined}
              />
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleCheck}
              disabled={isChecked || slots.every(s => s === null)}
              className="px-4 py-2 text-white bg-blue-600 rounded disabled:opacity-50"
            >
              Проверить
            </button>
            <button
              onClick={handleReset}
              disabled={slots.every(s => s === null)}
              className="px-4 py-2 text-white bg-gray-400 rounded disabled:opacity-50"
            >
              Сбросить
            </button>
          </div>
        </>
      )}
    </div>
  );
}
