import phoneticRules from '../data/thai-phonetic-rules.json';

// Типы для транскрипции
interface SyllableInfo {
  text: string;
  latin: string;
  cyrillic: string;
  tone: string;
  toneSymbol: string;
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

// Карты символов тонов
const toneSymbolMap: Record<string, string> = {
  'mid': '¯',
  'low': '`',
  'falling': '^',
  'high': '´',
  'rising': 'ˇ'
};

const toneMarkMap: Record<string, string> = {
  '\u0E48': 'mai_ek',      // ◌่
  '\u0E49': 'mai_tho',     // ◌้
  '\u0E4A': 'mai_tri',     // ◌๊
  '\u0E4B': 'mai_chattawa' // ◌๋
};

// Инициализация карт согласных
const consonantMap = new Map<string, any>();
const consonantClassMap = new Map<string, string>();

// Загружаем согласные из JSON
Object.entries(phoneticRules.consonants.high_class.letters).forEach(([char, info]) => {
  consonantMap.set(char, { ...info, class: 'high' });
  consonantClassMap.set(char, 'high');
});

Object.entries(phoneticRules.consonants.middle_class.letters).forEach(([char, info]) => {
  consonantMap.set(char, { ...info, class: 'middle' });
  consonantClassMap.set(char, 'middle');
});

Object.entries(phoneticRules.consonants.low_class.sonorant.letters).forEach(([char, info]) => {
  consonantMap.set(char, { ...info, class: 'low', type: 'sonorant' });
  consonantClassMap.set(char, 'low');
});

Object.entries(phoneticRules.consonants.low_class.voiceless.letters).forEach(([char, info]) => {
  consonantMap.set(char, { ...info, class: 'low', type: 'voiceless' });
  consonantClassMap.set(char, 'low');
});

// Инициализация карт гласных
const vowelMap = new Map<string, any>();
const vowelChars = new Set<string>();

// Простые гласные
Object.entries(phoneticRules.vowels.simple_vowels).forEach(([series, vowelData]: [string, any]) => {
  if (vowelData.short) {
    const forms = vowelData.short.form.split(', ');
    forms.forEach((form: string) => {
      const cleanForm = form.replace(/◌/g, '');
      if (cleanForm) {
        vowelMap.set(cleanForm, {
          soundLatin: vowelData.short.soundLatin,
          soundCyrillic: vowelData.short.soundCyrillic,
          length: 'short'
        });
        cleanForm.split('').forEach(char => vowelChars.add(char));
      }
    });
  }
  if (vowelData.long) {
    const forms = vowelData.long.form.split(', ');
    forms.forEach((form: string) => {
      const cleanForm = form.replace(/◌/g, '');
      if (cleanForm) {
        vowelMap.set(cleanForm, {
          soundLatin: vowelData.long.soundLatin,
          soundCyrillic: vowelData.long.soundCyrillic,
          length: 'long'
        });
        cleanForm.split('').forEach(char => vowelChars.add(char));
      }
    });
  }
});

// Добавляем специальные гласные
vowelChars.add('เ');
vowelChars.add('แ');
vowelChars.add('โ');
vowelChars.add('ใ');
vowelChars.add('ไ');
vowelChars.add('ฤ');
vowelChars.add('ฦ');

// Дополнительные сопоставления гласных
vowelMap.set('ไ', { soundLatin: 'ai', soundCyrillic: 'ай', length: 'long' });
vowelMap.set('ใ', { soundLatin: 'ai', soundCyrillic: 'ай', length: 'long' });
vowelMap.set('เา', { soundLatin: 'ao', soundCyrillic: 'ао', length: 'long' });
vowelMap.set('แ', { soundLatin: 'ae', soundCyrillic: 'аэ', length: 'long' });
vowelMap.set('โ', { soundLatin: 'o', soundCyrillic: 'о', length: 'long' });
vowelMap.set('เ', { soundLatin: 'e', soundCyrillic: 'э', length: 'long' });

// Множество сонорных согласных
const sonorantSet = new Set(['ง', 'ญ', 'น', 'ม', 'ย', 'ร', 'ล', 'ว']);

// Функция определения тона
function determineTone(
  consonantClass: string,
  syllableType: 'live' | 'dead',
  vowelLength: 'short' | 'long',
  toneMark: string | null
): string {
  if (toneMark) {
    const toneRules = phoneticRules.tone_rules.tone_markers[toneMark];
    if (toneRules && toneRules.effects) {
      const classKey = consonantClass + '_class';
      return toneRules.effects[classKey] || 'mid';
    }
  }

  if (syllableType === 'live') {
    const liveRules = phoneticRules.tone_rules.tone_determination_rules.live_syllable_rules;
    const classKey = consonantClass + '_class';
    return liveRules[classKey]?.no_mark || 'mid';
  } else {
    const deadRules = phoneticRules.tone_rules.tone_determination_rules.dead_syllable_rules;
    const lengthRules = vowelLength === 'short' ? deadRules.short_vowel : deadRules.long_vowel;
    const classKey = consonantClass + '_class';
    return lengthRules[classKey] || 'mid';
  }
}

// Функция анализа слога
function analyzeSyllable(syllable: string): SyllableInfo {
  const chars = Array.from(syllable);
  let toneMark: string | null = null;
  const consonants: Array<{ char: string; index: number }> = [];
  const vowels: Array<{ char: string; index: number }> = [];

  // Анализ символов
  chars.forEach((char, index) => {
    if (toneMarkMap[char]) {
      toneMark = toneMarkMap[char];
    } else if (consonantMap.has(char)) {
      consonants.push({ char, index });
    } else if (vowelChars.has(char)) {
      vowels.push({ char, index });
    }
  });

  // Определение начального согласного и его класса
  let initialConsonant = consonants[0]?.char || '';
  let consonantClass = consonantClassMap.get(initialConsonant) || 'low';

  // Обработка комбинации ห + сонорный согласный
  if (initialConsonant === 'ห' && consonants.length > 1 && sonorantSet.has(consonants[1].char)) {
    consonantClass = 'high';
    initialConsonant = consonants[1].char;
  }

  // Определение гласного звука
  let vowelKey = vowels.map(v => v.char).join('');
  
  // Обработка специальных гласных
  if (vowelKey === '' && syllable.includes('ไ')) {
    vowelKey = 'ไ';
  } else if (vowelKey === '' && syllable.includes('ใ')) {
    vowelKey = 'ใ';
  } else if (vowelKey === '' && syllable.includes('แ')) {
    vowelKey = 'แ';
  } else if (vowelKey === '' && syllable.includes('โ')) {
    vowelKey = 'โ';
  } else if (vowelKey === '' && syllable.includes('เ')) {
    vowelKey = 'เ';
  }
  
  let vowelInfo = vowelMap.get(vowelKey) || { 
    soundLatin: 'a', 
    soundCyrillic: 'а', 
    length: 'short' 
  };

  // Определение конечного согласного
  const finalConsonant = consonants.length > 1 ? consonants[consonants.length - 1].char : '';
  let syllableType: 'live' | 'dead' = 'live';
  
  if (finalConsonant) {
    const finalInfo = consonantMap.get(finalConsonant);
    // Слог мертвый если заканчивается на непроизносимый согласный или короткий гласный + стоп
    if (finalInfo && (finalInfo.class === 'middle' || finalInfo.class === 'high') && 
        !sonorantSet.has(finalConsonant)) {
      syllableType = 'dead';
    } else if (finalInfo && finalInfo.type === 'voiceless' &&
        !sonorantSet.has(finalConsonant)) {
      syllableType = 'dead';
    }
    // Если конечный согласный - сонорный, слог живой
    if (sonorantSet.has(finalConsonant)) {
      syllableType = 'live';
    }
  }
  
  // Особые случаи для коротких гласных без финального согласного
  if (!finalConsonant && vowelInfo.length === 'short') {
    syllableType = 'dead';
  }

  // Определение тона
  const tone = determineTone(consonantClass, syllableType, vowelInfo.length, toneMark);
  const toneSymbol = toneSymbolMap[tone] || '¯';

  // Построение транскрипции
  const initialInfo = consonantMap.get(initialConsonant);
  const finalInfo = consonantMap.get(finalConsonant);

  let latin = (initialInfo?.soundLatin || '') + (vowelInfo.soundLatin || '');
  let cyrillic = (initialInfo?.soundCyrillic || '') + (vowelInfo.soundCyrillic || '');

  if (finalConsonant && finalInfo) {
    latin += finalInfo.finalSoundLatin || finalInfo.soundLatin || '';
    cyrillic += finalInfo.finalSoundCyrillic || finalInfo.soundCyrillic || '';
  }

  return {
    text: syllable,
    latin: latin,
    cyrillic: cyrillic,
    tone,
    toneSymbol
  };
}

// Функция разделения на слоги (упрощенная)
function splitIntoSyllables(word: string): string[] {
  const chars = Array.from(word);
  const syllables: string[] = [];
  let currentSyllable = '';
  let hasVowel = false;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    currentSyllable += char;

    if (vowelChars.has(char)) {
      if (hasVowel && currentSyllable.length > 1) {
        // Начинаем новый слог
        syllables.push(currentSyllable.slice(0, -1));
        currentSyllable = char;
      }
      hasVowel = true;
    } else if (consonantMap.has(char) && hasVowel && i < chars.length - 1) {
      // Проверяем, не начинается ли новый слог
      const nextChar = chars[i + 1];
      if (vowelChars.has(nextChar) || nextChar === 'เ' || nextChar === 'แ' || nextChar === 'โ') {
        syllables.push(currentSyllable.slice(0, -1));
        currentSyllable = char;
        hasVowel = false;
      }
    }
  }

  if (currentSyllable) {
    syllables.push(currentSyllable);
  }

  return syllables.length > 0 ? syllables : [word];
}

// Главная функция транскрипции
export function transcribeThaiWord(word: string): WordInfo {
  const syllables = splitIntoSyllables(word).map(analyzeSyllable);
  
  return {
    word,
    latin: syllables.map(s => s.latin).join(''),
    cyrillic: syllables.map(s => s.cyrillic).join(''),
    syllables
  };
}

export function transcribeThaiText(text: string): TranscriptionResult {
  // Используем Thai word segmentation если доступен
  let words: string[];
  
  try {
    const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
    words = Array.from(segmenter.segment(text)).map((seg: any) => seg.segment);
  } catch {
    // Fallback: простое разделение по пробелам
    words = text.split(/\s+/).filter(w => w.length > 0);
  }

  const wordInfos = words.map(transcribeThaiWord);
  
  return {
    text,
    latin: wordInfos.map(w => w.latin).join(' '),
    cyrillic: wordInfos.map(w => w.cyrillic).join(' '),
    words: wordInfos
  };
}
