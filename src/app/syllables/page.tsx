"use client";

import { useState } from 'react';
import ThaiSyllableBuilder, { ThaiSyllableData } from '@/components/ThaiSyllableBuilder';

const data: ThaiSyllableData[] = [
  {
    syllable: "กราด",
    initial_consonant: { sound: "kr", letter: "กร" },
    vowel: {
      sound: "a",
      letter: "◌า",
      length: "long",
      position: ["right"],
    },
    final_consonant: { sound: "d", letter: "ด" },
    tone: "low",
    tone_mark: null,
    letters: ["กร", "◌า", "ด"],
  },
  {
    syllable: "เปรี้ยว",
    initial_consonant: { sound: "pr", letter: "ปร" },
    vowel: {
      sound: "ia",
      letter: "เ◌ีย",
      letters: [
        {
          position: "above",
          letter: '◌ี'
        },
        {
          position: "right",
          letter: '◌ย'
        },
        {
          position: "left",
          letter: 'เ◌'
        }
      ],
      length: "long",
      position: ["left", "above", "right"],
    },
    final_consonant: { sound: "w", letter: "ว" },
    tone: "falling",
    tone_mark: "◌้",
    letters: ["ปร", "เ◌ี้ย", "◌้", "ว"],
  },
  {
    syllable: "จ้าง",
    initial_consonant: { sound: "ch", letter: "จ" },
    vowel: {
      sound: "a",
      letter: "◌า",
      length: "long",
      position: ["right"],
    },
    final_consonant: { sound: "ng", letter: "ง" },
    tone: "falling",
    tone_mark: "◌้",
    letters: ["จ", "◌้", "◌า", "ง"],
  },
];

export default function SyllableExercisePage() {
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);

  const handleComplete = () => {
    const nextCount = count + 1;
    setCount(nextCount);
    if (nextCount >= 3) {
      setIndex(0);
      setCount(0);
    } else {
      setIndex((i) => (i + 1) % data.length);
    }
  };

  return (
    <div className="max-w-xl p-4 mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Составление тайских слогов</h1>
      <p className="text-sm text-gray-600">Собрано слогов: {count} из 3</p>
      <ThaiSyllableBuilder data={data[index]} index={index} onComplete={handleComplete} />
    </div>
  );
}
