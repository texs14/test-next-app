import { ThaiWordData } from '@/types/word.types';

export const THAI_WORDS: ThaiWordData[] = [
  {
    word: "นานา",
    meaning: "дедушка",
    difficulty: "easy", 
    syllables: [
      {
        syllable: "นา",
        initial_consonant: { sound: "n", letter: "น" },
        vowel: {
          sound: "a",
          letter: "า",
          length: "long", 
          position: ["right"],
        },
        final_consonant: null,
        tone: "mid",
        tone_mark: null,
        letters: ["น", "า"],
      },
      {
        syllable: "นา",
        initial_consonant: { sound: "n", letter: "น" },
        vowel: {
          sound: "a",
          letter: "า",
          length: "long", 
          position: ["right"],
        },
        final_consonant: null,
        tone: "mid",
        tone_mark: null,
        letters: ["น", "า"],
      }
    ]
  },
  {
    word: "สุ่มไก่",
    meaning: "случайная курица",
    difficulty: "medium",
    syllables: [
      {
        syllable: "สุ่ม",
        initial_consonant: { sound: "s", letter: "ส" },
        vowel: {
          sound: "u",
          letter: "ุ",
          length: "short",
          position: ["below"],
        },
        final_consonant: { sound: "m", letter: "ม" },
        tone: "low",
        tone_mark: "่",
        letters: ["ส", "ุ", "่", "ม"],
      },
      {
        syllable: "ไก่",
        initial_consonant: { sound: "g", letter: "ก" },
        vowel: {
          sound: "ai",
          letter: "ไ",
          length: "long",
          position: ["left"],
        },
        final_consonant: null,
        tone: "low",
        tone_mark: "่",
        letters: ["ไ", "ก", "่"],
      }
    ]
  },
  {
    word: "กา",
    meaning: "ворона",
    difficulty: "easy",
    syllables: [
      {
        syllable: "กา",
        initial_consonant: { sound: "k", letter: "ก" },
        vowel: {
          sound: "a",
          letter: "า",
          length: "long",
          position: ["right"],
        },
        final_consonant: null,
        tone: "mid",
        tone_mark: null,
        letters: ["ก", "า"],
      }
    ]
  },
  {
    word: "มามา", 
    meaning: "приходи-приходи",
    difficulty: "easy",
    syllables: [
      {
        syllable: "มา",
        initial_consonant: { sound: "m", letter: "ม" },
        vowel: {
          sound: "a",
          letter: "า",
          length: "long",
          position: ["right"],
        },
        final_consonant: null,
        tone: "mid",
        tone_mark: null,
        letters: ["ม", "า"],
      },
      {
        syllable: "มา",
        initial_consonant: { sound: "m", letter: "ม" },
        vowel: {
          sound: "a",
          letter: "า",
          length: "long",
          position: ["right"],
        },
        final_consonant: null,
        tone: "mid",
        tone_mark: null,
        letters: ["ม", "า"],
      }
    ]
  },
  {
    word: "ดีดี",
    meaning: "хорошо-хорошо",
    difficulty: "easy", 
    syllables: [
      {
        syllable: "ดี",
        initial_consonant: { sound: "d", letter: "ด" },
        vowel: {
          sound: "i",
          letter: "ี",
          length: "long", 
          position: ["above"],
        },
        final_consonant: null,
        tone: "mid",
        tone_mark: null,
        letters: ["ด", "ี"],
      },
      {
        syllable: "ดี",
        initial_consonant: { sound: "d", letter: "ด" },
        vowel: {
          sound: "i",
          letter: "ี",
          length: "long", 
          position: ["above"],
        },
        final_consonant: null,
        tone: "mid",
        tone_mark: null,
        letters: ["ด", "ี"],
      }
    ]
  },
  {
    word: "บาบา",
    meaning: "папа-папа",
    difficulty: "easy", 
    syllables: [
      {
        syllable: "บา",
        initial_consonant: { sound: "b", letter: "บ" },
        vowel: {
          sound: "a",
          letter: "า",
          length: "long", 
          position: ["right"],
        },
        final_consonant: null,
        tone: "mid",
        tone_mark: null,
        letters: ["บ", "า"],
      },
      {
        syllable: "บา",
        initial_consonant: { sound: "b", letter: "บ" },
        vowel: {
          sound: "a",
          letter: "า",
          length: "long", 
          position: ["right"],
        },
        final_consonant: null,
        tone: "mid",
        tone_mark: null,
        letters: ["บ", "า"],
      }
    ]
  }
];

// Отдельные слоги для режима одиночных слогов
export const SINGLE_SYLLABLES = [
  {
    syllable: "กา",
    initial_consonant: { sound: "k", letter: "ก" },
    vowel: {
      sound: "a",
      letter: "า",
      length: "long",
      position: ["right"],
    },
    final_consonant: null,
    tone: "mid",
    tone_mark: null,
    letters: ["ก", "า"],
  },
  {
    syllable: "มา",
    initial_consonant: { sound: "m", letter: "ม" },
    vowel: {
      sound: "a",
      letter: "า",
      length: "long",
      position: ["right"],
    },
    final_consonant: null,
    tone: "mid",
    tone_mark: null,
    letters: ["ม", "า"],
  },
  {
    syllable: "ดี",
    initial_consonant: { sound: "d", letter: "ด" },
    vowel: {
      sound: "i",
      letter: "ี",
      length: "long",
      position: ["above"],
    },
    final_consonant: null,
    tone: "mid",
    tone_mark: null,
    letters: ["ด", "ี"],
  },
  {
    syllable: "บา",
    initial_consonant: { sound: "b", letter: "บ" },
    vowel: {
      sound: "a",
      letter: "า",
      length: "long",
      position: ["right"],
    },
    final_consonant: null,
    tone: "mid",
    tone_mark: null,
    letters: ["บ", "า"],
  },
  {
    syllable: "นา",
    initial_consonant: { sound: "n", letter: "น" },
    vowel: {
      sound: "a",
      letter: "า",
      length: "long",
      position: ["right"],
    },
    final_consonant: null,
    tone: "mid",
    tone_mark: null,
    letters: ["น", "า"],
  },
]; 