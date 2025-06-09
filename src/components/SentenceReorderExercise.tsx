// src/components/SentenceReorderExercise.tsx
import React, { useState, useEffect, DragEvent } from 'react';
import { tokenizeThaiSentence } from '../utils/thaiTokenizer';
import { WordChip } from './WordChip';
import { DropSlot } from './DropSlot';

export interface ExerciseSentence {
  text: string;
  // The “correct” full sentence(s) as joined tokens
  rightAnswers: string[];
  translations: { [lang: string]: string };
  note: { [lang: string]: string } | null;
}

export interface ReorderExerciseData {
  name: string;
  originalLang: 'th' | string;
  difficulty: string;
  tags: string[];
  sentences: ExerciseSentence[];
}

interface TokenState {
  id: string; // unique ID per token (e.g. sentenceIdx + '-' + tokenIdx)
  text: string; // the token itself
}

interface SentenceReorderExerciseProps {
  data: ReorderExerciseData;
}

export default function SentenceReorderExercise({ data }: SentenceReorderExerciseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledTokens, setShuffledTokens] = useState<TokenState[]>([]);
  const [slots, setSlots] = useState<(TokenState | null)[]>([]);
  const [feedback, setFeedback] = useState<boolean[] | null>(null);

  // Whenever currentIndex changes, re-tokenize & shuffle
  useEffect(() => {
    const sentenceObj = data.sentences[currentIndex];
    // Tokenize
    const rawTokens = tokenizeThaiSentence(sentenceObj.text);
    // Build TokenState array
    const keyed: TokenState[] = rawTokens.map((tok, idx) => ({
      id: `${currentIndex}-${idx}`,
      text: tok,
    }));

    // Shuffle (Fisher–Yates)
    const copy = [...keyed];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setShuffledTokens(copy);
    setSlots(Array(keyed.length).fill(null));
    setFeedback(null);
  }, [currentIndex, data.sentences]);

  const onDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onDropWord = (slotIdx: number, wordId: string) => {
    setShuffledTokens(prev => {
      const idx = prev.findIndex(w => w.id === wordId);
      if (idx === -1) return prev;
      const word = prev[idx];
      const remaining = prev.filter((_, i) => i !== idx);
      setSlots(sPrev => {
        const updated = [...sPrev];
        const replaced = updated[slotIdx];
        updated[slotIdx] = word;
        if (replaced) remaining.push(replaced);
        return updated;
      });
      return remaining;
    });
    setFeedback(null);
  };

  const checkAnswer = () => {
    const sentenceObj = data.sentences[currentIndex];
    const userJoined = slots.map(s => s?.text || '').join('');
    const isCorrect = sentenceObj.rightAnswers.includes(userJoined);
    const rightTokens = tokenizeThaiSentence(sentenceObj.rightAnswers[0]);
    const fb = slots.map((tok, idx) => {
      return tok ? isCorrect && tok.text === rightTokens[idx] : false;
    });
    setFeedback(fb);
  };

  const goToNext = () => {
    if (currentIndex + 1 < data.sentences.length) {
      setCurrentIndex(i => i + 1);
    }
  };
  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
  };

  const sentenceObj = data.sentences[currentIndex];

  return (
    <div className="max-w-2xl p-6 mx-auto space-y-6">
      <h2 className="text-2xl font-bold">{data.name}</h2>
      <p className="text-sm text-gray-600">
        Упражнение: предложение {currentIndex + 1} из {data.sentences.length}
      </p>
      <div className="p-4 space-y-4 border border-gray-300 rounded">
        {/* Translation/note */}
        <div className="text-sm italic text-gray-700">
          <div>RU: {sentenceObj.translations.ru}</div>
          <div>EN: {sentenceObj.translations.en}</div>
          {sentenceObj.note && (
            <div className="mt-2 text-gray-500">Note: {sentenceObj.note.en}</div>
          )}
        </div>

        {/* Shuffled tokens container */}
        <div
          className="flex flex-wrap gap-2 p-2 border border-dashed border-gray-400 rounded min-h-[3rem]"
          onDragOver={onDragOver}
        >
          {shuffledTokens.map(tok => (
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

        {/* Drop slots */}
        <div className="flex flex-wrap gap-2 p-2 border border-dashed border-blue-400 rounded min-h-[3rem] bg-blue-50">
          {slots.map((slot, idx) => (
            <DropSlot
              key={idx}
              slotIndex={idx}
              placedWordText={slot?.text || ''}
              onDropWord={onDropWord}
              isCorrect={feedback ? feedback[idx] : undefined}
            />
          ))}
        </div>

        <div className="flex space-x-4">
          <button onClick={checkAnswer} className="px-4 py-2 text-white bg-blue-600 rounded">
            Проверить
          </button>
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="px-4 py-2 text-gray-700 bg-gray-300 rounded disabled:opacity-50"
          >
            Назад
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === data.sentences.length - 1}
            className="px-4 py-2 text-gray-700 bg-gray-300 rounded disabled:opacity-50"
          >
            Вперёд
          </button>
        </div>
      </div>
    </div>
  );
}
