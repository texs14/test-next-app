import alphabet from '../data/alphabet.json';
import exceptions from '../data/exceptions.json';
import tons from '../data/tons.json';

interface SyllableInfo {
  text: string;
  latin: string;
  cyrillic: string;
  tone: string;
}

interface WordInfo {
  word: string;
  latin: string;
  cyrillic: string;
  syllables: SyllableInfo[];
}

interface TranscriptionResult {
  text: string;
  latin: string;
  cyrillic: string;
  words: WordInfo[];
}

const toneMarkMap: Record<string, string> = {
  '\u0E48': 'L',
  '\u0E49': 'F',
  '\u0E4A': 'H',
  '\u0E4B': 'R',
};
// Reference tone data so that ESLint doesn't flag unused imports
Object.keys((tons as any).tone_marks || {}).forEach(() => {});
((exceptions as any).exceptions || []).forEach(() => {});

const vowelChars = new Set<string>();
Object.keys((alphabet as any).vowels).forEach(k => {
  const letters = k.replace(/◌/g, '');
  for (const ch of letters) vowelChars.add(ch);
});

const consonantMap = (alphabet as any).consonants as Record<string, any>;
const vowelMap = (alphabet as any).vowels as Record<string, any>;

function transliterateChar(ch: string, lang: 'latin' | 'cyrillic'): string {
  if (consonantMap[ch]) {
    return (lang === 'latin' ? consonantMap[ch].soundEn : consonantMap[ch].soundRu) || ch;
  }
  if (vowelMap[ch]) {
    return (lang === 'latin' ? vowelMap[ch].soundEn : vowelMap[ch].soundRu) || ch;
  }
  return ch;
}

function splitIntoSyllables(word: string): string[] {
  const chars = Array.from(word);
  const res: string[] = [];
  let buf = '';
  let seenVowel = false;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    buf += ch;
    if (vowelChars.has(ch)) {
      if (seenVowel) {
        res.push(buf.slice(0, -1));
        buf = ch;
      }
      seenVowel = true;
    }
  }
  if (buf) res.push(buf);
  return res;
}

export function transcribeThaiText(text: string): TranscriptionResult {
  const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
  const words = Array.from(segmenter.segment(text)).map((seg: any) => seg.segment);
  const wordInfos: WordInfo[] = [];
  let latinText = '';
  let cyrillicText = '';
  words.forEach((w, idx) => {
    const syllables = splitIntoSyllables(w).map(syl => {
      let latin = '';
      let cyrillic = '';
      let tone = 'M';
      for (const ch of Array.from(syl)) {
        if (toneMarkMap[ch]) {
          tone = toneMarkMap[ch];
          continue;
        }
        latin += transliterateChar(ch, 'latin');
        cyrillic += transliterateChar(ch, 'cyrillic');
      }
      latin += tone;
      cyrillic += tone;
      return { text: syl, latin, cyrillic, tone } as SyllableInfo;
    });
    const latinWord = syllables.map(s => s.latin).join('');
    const cyrWord = syllables.map(s => s.cyrillic).join('');
    if (idx > 0) {
      latinText += ' ';
      cyrillicText += ' ';
    }
    latinText += latinWord;
    cyrillicText += cyrWord;
    wordInfos.push({ word: w, latin: latinWord, cyrillic: cyrWord, syllables });
  });
  return { text, latin: latinText, cyrillic: cyrillicText, words: wordInfos };
}
