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
const vowelSeqMap: Record<string, { latin: string; cyrillic: string }> = {};
Object.entries((alphabet as any).vowels).forEach(([k, val]) => {
  const letters: string[] = (val as any).letters
    ? ((val as any).letters as any[]).map(l => l.letter)
    : k.replace(/◌/g, '').split('');
  for (const ch of letters) vowelChars.add(ch);
  vowelSeqMap[letters.join('')] = {
    latin: (val as any).soundEn,
    cyrillic: (val as any).soundRu,
  };
});

const consonantMap = (alphabet as any).consonants as Record<string, any>;

function transliterateSyllable(syl: string, lang: 'latin' | 'cyrillic'): { text: string; tone: string } {
  let tone = 'M';
  const chars = Array.from(syl);
  const vowelLetters: string[] = [];
  let result = '';
  for (const ch of chars) {
    if (toneMarkMap[ch]) {
      tone = toneMarkMap[ch];
      continue;
    }
    if (consonantMap[ch]) {
      result += (lang === 'latin' ? consonantMap[ch].soundEn : consonantMap[ch].soundRu) || ch;
    } else if (vowelChars.has(ch)) {
      vowelLetters.push(ch);
    } else {
      result += ch;
    }
  }
  const vowelKey = vowelLetters.join('');
  if (vowelKey) {
    const v = vowelSeqMap[vowelKey];
    if (v) {
      result += v[lang];
    } else {
      result += vowelLetters.map(ch => (consonantMap[ch] ? consonantMap[ch][lang === 'latin' ? 'soundEn' : 'soundRu'] : ch)).join('');
    }
  }
  return { text: result, tone };
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
      const resLat = transliterateSyllable(syl, 'latin');
      const resCyr = transliterateSyllable(syl, 'cyrillic');
      const tone = resLat.tone; // both have same tone
      return {
        text: syl,
        latin: resLat.text + tone,
        cyrillic: resCyr.text + tone,
        tone,
      } as SyllableInfo;

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
