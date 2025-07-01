import { ThaiSyllableData } from '@/components/ThaiSyllableBuilder';

export interface CompletedSyllableInfo {
  syllable: string;
  transcription: string;
  tone: string;
  toneIcon: string;
  completedAt: Date;
}

export interface ThaiWordData {
  word: string;
  syllables: ThaiSyllableData[];
  meaning?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface WordProgressState {
  currentSyllableIndex: number;
  completedSyllables: CompletedSyllableInfo[];
  isWordComplete: boolean;
  totalSyllables: number;
  usedLetters: string[];
}

export interface SyllableTransitionState {
  isTransitioning: boolean;
  nextSyllablePreview?: ThaiSyllableData;
  transitionDelay: number;
  canCancel: boolean;
}

export interface ThaiSyllableBuilderProps {
  wordData: ThaiWordData;
  currentSyllableIndex: number;
  completedSyllables: CompletedSyllableInfo[];
  usedLetters: string[];
  index: number;
  onComplete: (usedLettersInSyllable: string[]) => void;
}

export interface LetterValidationResult {
  letter: string;
  isValidForCurrentSyllable: boolean;
  isUsed: boolean;
  belongsToFutureSyllable: boolean;
}

export interface WordLetterManagement {
  allLetters: string[];
  availableLetters: string[];
  usedLetters: string[];
  currentSyllableLetters: string[];
} 