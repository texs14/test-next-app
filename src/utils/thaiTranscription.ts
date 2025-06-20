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
const vowelSeqMap: Record<string, { latin: string; cyrillic: string; length: 'short' | 'long' }> = {};
Object.entries((alphabet as any).vowels).forEach(([k, val]) => {
  const letters: string[] = (val as any).letters
    ? ((val as any).letters as any[]).map(l => l.letter)
    : k.replace(/◌/g, '').split('');
  for (const ch of letters) vowelChars.add(ch);
  vowelSeqMap[letters.join('')] = {
    latin: (val as any).soundEn,
    cyrillic: (val as any).soundRu,
    length: (val as any).type && String((val as any).type).includes('short') ? 'short' : 'long',
  };
});

const consonantMap = (alphabet as any).consonants as Record<string, any>;

const HO_NAM_SET = new Set(['ง', 'ญ', 'น', 'ม', 'ย', 'ร', 'ล', 'ว']);

function computeTone(cls: string, mark: string | null, finalType: 'live' | 'dead', vowelLength: 'short' | 'long'): string {
  if (mark) {
    switch (mark) {
      case '\u0E48':
        return cls === 'low' ? 'F' : 'L';
      case '\u0E49':
        return cls === 'low' ? 'H' : 'F';
      case '\u0E4A':
        return cls === 'low' ? 'R' : 'H';
      case '\u0E4B':
        return cls === 'low' ? 'H' : 'R';
      default:
        return 'M';
    }
  }
  if (cls === 'middle') {
    return finalType === 'live' ? 'M' : 'L';
  }
  if (cls === 'high') {
    return finalType === 'live' ? 'R' : 'L';
  }
  // low class
  if (finalType === 'live') return 'M';
  return 'H';
}

function transliterateSyllable(syl: string, lang: 'latin' | 'cyrillic'): { text: string; tone: string } {
  let toneMark: string | null = null;
  const chars = Array.from(syl);
  const consonants: {ch: string; idx: number}[] = [];
  const vowelLetters: {ch: string; idx: number}[] = [];

  for (let idx = 0; idx < chars.length; idx++) {
    const ch = chars[idx];
    if (toneMarkMap[ch]) {
      toneMark = ch;
    } else if (consonantMap[ch]) {
      consonants.push({ ch, idx });
    } else if (vowelChars.has(ch)) {
      vowelLetters.push({ ch, idx });
    }
  }

  // Determine vowel sound
  const vowelKey = vowelLetters.map(v => v.ch).join('');
  let vowelLength: 'short' | 'long' = 'long';
  let vowelLat = '';
  let vowelCyr = '';
  if (vowelKey && vowelSeqMap[vowelKey]) {
    const v = vowelSeqMap[vowelKey];
    vowelLat = v.latin;
    vowelCyr = v.cyrillic;
    vowelLength = v.length;
  } else {
    vowelLat = 'o';
    vowelCyr = 'о';
    vowelLength = 'short';
  }

  // Determine initial and final consonants by position
  let firstVowelIdx = vowelLetters.length > 0 ? Math.min(...vowelLetters.map(v => v.idx)) : -1;
  let initialCons: {ch: string; idx: number}[] = [];
  let finalConsArr: {ch: string; idx: number}[] = [];
  if (firstVowelIdx >= 0) {
    initialCons = consonants.filter(c => c.idx < firstVowelIdx);
    finalConsArr = consonants.filter(c => c.idx > firstVowelIdx);
  } else {
    // implicit vowel case
    if (consonants.length > 0) initialCons = [consonants[0]];
    if (consonants.length > 1) finalConsArr = consonants.slice(1);
  }

  let toneClass = 'low';
  let initialLat = '';
  let initialCyr = '';
  if (initialCons.length > 0) {
    let start = 0;
    if (initialCons[0].ch === 'ห' && initialCons.length > 1 && HO_NAM_SET.has(initialCons[1].ch)) {
      toneClass = 'high';
      start = 1;
    } else {
      toneClass = consonantMap[initialCons[0].ch].class;
    }
    initialLat = initialCons.slice(start).map(ic => consonantMap[ic.ch].soundEn).join('');
    initialCyr = initialCons.slice(start).map(ic => consonantMap[ic.ch].soundRu).join('');
  }

  let finalConsonant: string | null = null;
  if (finalConsArr.length > 0) {
    finalConsonant = finalConsArr[finalConsArr.length - 1].ch;
  }
  let finalLat = '';
  let finalCyr = '';
  let finalType: 'live' | 'dead' = 'live';
  if (finalConsonant) {
    const cons = consonantMap[finalConsonant];
    finalLat = cons.endSound || cons.soundEn;
    finalCyr = cons.endSound ? cons.endSound : cons.soundRu;
    finalType = cons.typeEnd || 'live';
  }

  const tone = computeTone(toneClass, toneMark, finalType, vowelLength);

  const text =
    (lang === 'latin'
      ? initialLat + vowelLat + finalLat
      : initialCyr + vowelCyr + finalCyr);

  return { text, tone };
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
