import React, { useEffect, useState, DragEvent } from 'react';
import { WordChip } from './WordChip';
import { DropSlot } from './DropSlot';

export interface ThaiSyllableData {
  syllable: string;
  initial_consonant: { sound: string; letter: string };
  vowel: {
    sound: string;
    letter: string;
    length: string;
    letters?:{
      position: string;
      letter: string;
    }[]
    position: string[];
  };
  final_consonant?: { sound: string; letter: string } | null;
  tone: string;
  tone_mark: string | null;
  letters: string[];
}

interface Token {
  id: string;
  text: string;
}

interface Props {
  data: ThaiSyllableData;
  index: number;
  onComplete: () => void;
}

const SLOT_TOP = 0;
const SLOT_TOP2 = 1;
const SLOT_LEFT = 2;
const SLOT_CENTER = 3;
const SLOT_RIGHT = 4;
const SLOT_RIGHT2 = 5;
const SLOT_BOTTOM = 6;
const SLOT_COUNT = 7;

function computeExpected(data: ThaiSyllableData): (string | null)[] {
  const res: (string | null)[] = Array(SLOT_COUNT).fill(null);
  res[SLOT_CENTER] = data.initial_consonant.letter;

  const pos = data.vowel.position;
  let main: string | null = null;
  if (pos.includes('above')) main = 'above';
  else if (pos.includes('left')) main = 'left';
  else if (pos.includes('right')) main = 'right';
  else if (pos.includes('below')) main = 'below';

  if (main === 'above') {
    res[SLOT_TOP] = data.vowel.letter;
    if (data.tone_mark) res[SLOT_TOP2] = data.tone_mark;
  } else {
    if (data.tone_mark) res[SLOT_TOP] = data.tone_mark;
    if (main === 'left') res[SLOT_LEFT] = data.vowel.letter;
    else if (main === 'right') res[SLOT_RIGHT] = data.vowel.letter;
    else if (main === 'below') res[SLOT_BOTTOM] = data.vowel.letter;
  }

  if (data.final_consonant) {
    if (res[SLOT_RIGHT]) res[SLOT_RIGHT2] = data.final_consonant.letter;
    else res[SLOT_RIGHT] = data.final_consonant.letter;
  }

  return res;
}

export default function ThaiSyllableBuilder({ data, index, onComplete }: Props) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [slots, setSlots] = useState<(Token | null)[]>(Array(SLOT_COUNT).fill(null));
  const [expected, setExpected] = useState<(string | null)[]>([]);
  const [feedback, setFeedback] = useState<boolean[] | null>(null);
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tks = data.letters.map((l, idx) => ({ id: `${index}-${idx}`, text: l }));
    setTokens(tks);
    setSlots(Array(SLOT_COUNT).fill(null));
    setExpected(computeExpected(data));
    setFeedback(null);
    setActiveTokenId(null);
    setActiveSlot(null);
    setError(null);
  }, [data, index]);

  const onDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const findToken = (id: string): Token | undefined => {
    return tokens.find(t => t.id === id) || slots.find(s => s?.id === id) || undefined;
  };

  const placeToken = (slotIdx: number, token: Token) => {
    const expectedLetter = expected[slotIdx];
    if (!expectedLetter || token.text !== expectedLetter) {
      setError('Нельзя поместить сюда этот символ');
      return;
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
    setFeedback(null);
    setError(null);
  };

  const onDropWord = (slotIdx: number, id: string) => {
    const tok = findToken(id);
    if (!tok) return;
    placeToken(slotIdx, tok);
  };

  const handleChipClick = (id: string) => {
    if (activeTokenId === id) {
      setActiveTokenId(null);
    } else {
      setActiveTokenId(id);
      if (activeSlot !== null) {
        const tok = findToken(id);
        if (tok) placeToken(activeSlot, tok);
      }
    }
  };

  const handleSlotClick = (idx: number) => {
    if (activeSlot === idx) {
      setActiveSlot(null);
    } else {
      setActiveSlot(idx);
      if (activeTokenId) {
        const tok = findToken(activeTokenId);
        if (tok) placeToken(idx, tok);
      }
    }
  };

  const checkAnswer = () => {
    const fb = expected.map((letter, idx) => {
      const tok = slots[idx];
      if (!letter) return tok === null;
      return tok?.text === letter;
    });
    setFeedback(fb);
    const correct = fb.every(Boolean);
    if (correct) {
      setTimeout(onComplete, 800);
    }
  };

  const handleReset = () => {
    const back = [...tokens];
    slots.forEach(s => {
      if (s) back.push(s);
    });
    setTokens(back);
    setSlots(Array(SLOT_COUNT).fill(null));
    setFeedback(null);
    setActiveTokenId(null);
    setActiveSlot(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Слог {index + 1}: {data.syllable}</h3>
      {error && <p className="text-red-600">{error}</p>}
      <div className="grid grid-cols-4 grid-rows-4 gap-2 justify-items-center w-[270px]">
        <div className="col-start-2 row-start-1">
          <DropSlot
            slotIndex={SLOT_TOP}
            placedWord={slots[SLOT_TOP]}
            onDropWord={onDropWord}
            onDragStart={onDragStart}
            onClick={() => handleSlotClick(SLOT_TOP)}
            isActive={activeSlot === SLOT_TOP}
            isCorrect={feedback ? feedback[SLOT_TOP] : undefined}
          />
        </div>
        <div className="col-start-2 row-start-2">
          <DropSlot
            slotIndex={SLOT_TOP2}
            placedWord={slots[SLOT_TOP2]}
            onDropWord={onDropWord}
            onDragStart={onDragStart}
            onClick={() => handleSlotClick(SLOT_TOP2)}
            isActive={activeSlot === SLOT_TOP2}
            isCorrect={feedback ? feedback[SLOT_TOP2] : undefined}
          />
        </div>
        <div className="col-start-1 row-start-3">
          <DropSlot
            slotIndex={SLOT_LEFT}
            placedWord={slots[SLOT_LEFT]}
            onDropWord={onDropWord}
            onDragStart={onDragStart}
            onClick={() => handleSlotClick(SLOT_LEFT)}
            isActive={activeSlot === SLOT_LEFT}
            isCorrect={feedback ? feedback[SLOT_LEFT] : undefined}
          />
        </div>
        <div className="col-start-2 row-start-3">
          <DropSlot
            slotIndex={SLOT_CENTER}
            placedWord={slots[SLOT_CENTER]}
            onDropWord={onDropWord}
            onDragStart={onDragStart}
            onClick={() => handleSlotClick(SLOT_CENTER)}
            isActive={activeSlot === SLOT_CENTER}
            isCorrect={feedback ? feedback[SLOT_CENTER] : undefined}
          />
        </div>
        <div className="col-start-3 row-start-3">
          <DropSlot
            slotIndex={SLOT_RIGHT}
            placedWord={slots[SLOT_RIGHT]}
            onDropWord={onDropWord}
            onDragStart={onDragStart}
            onClick={() => handleSlotClick(SLOT_RIGHT)}
            isActive={activeSlot === SLOT_RIGHT}
            isCorrect={feedback ? feedback[SLOT_RIGHT] : undefined}
          />
        </div>
        <div className="col-start-4 row-start-3">
          <DropSlot
            slotIndex={SLOT_RIGHT2}
            placedWord={slots[SLOT_RIGHT2]}
            onDropWord={onDropWord}
            onDragStart={onDragStart}
            onClick={() => handleSlotClick(SLOT_RIGHT2)}
            isActive={activeSlot === SLOT_RIGHT2}
            isCorrect={feedback ? feedback[SLOT_RIGHT2] : undefined}
          />
        </div>
        <div className="col-start-2 row-start-4">
          <DropSlot
            slotIndex={SLOT_BOTTOM}
            placedWord={slots[SLOT_BOTTOM]}
            onDropWord={onDropWord}
            onDragStart={onDragStart}
            onClick={() => handleSlotClick(SLOT_BOTTOM)}
            isActive={activeSlot === SLOT_BOTTOM}
            isCorrect={feedback ? feedback[SLOT_BOTTOM] : undefined}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border border-dashed rounded p-2 min-h-[48px]">
        {tokens.map(tok => (
          <WordChip
            key={tok.id}
            word={tok.text}
            id={tok.id}
            onDragStart={onDragStart}
            onClick={() => handleChipClick(tok.id)}
            isPlaced={false}
            isActive={activeTokenId === tok.id}
          />
        ))}
      </div>
      <div className="flex gap-4">
        <button onClick={checkAnswer} className="px-4 py-2 text-white bg-blue-600 rounded">Проверить</button>
        <button onClick={handleReset} className="px-4 py-2 text-white bg-gray-500 rounded">Сбросить</button>
      </div>
    </div>
  );
}
