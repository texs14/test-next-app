// Финальный тест всех исправлений
const fs = require('fs');
const path = require('path');

// Симулируем импорт функции из TypeScript
const phoneticRules = JSON.parse(fs.readFileSync('./src/data/thai-phonetic-rules.json', 'utf8'));

// Копируем исправленную логику
const toneSymbolMap = {
  'mid': '¯',
  'low': '`',
  'falling': '^',
  'high': '´',
  'rising': 'ˇ'
};

const toneMarkMap = {
  '\u0E48': 'mai_ek',      // ◌่
  '\u0E49': 'mai_tho',     // ◌้
  '\u0E4A': 'mai_tri',     // ◌๊
  '\u0E4B': 'mai_chattawa' // ◌๋
};

const consonantMap = new Map();
const consonantClassMap = new Map();

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

const vowelMap = new Map();
const vowelChars = new Set();

Object.entries(phoneticRules.vowels.simple_vowels).forEach(([series, vowelData]) => {
  if (vowelData.short) {
    const forms = vowelData.short.form.split(', ');
    forms.forEach(form => {
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
    forms.forEach(form => {
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

vowelMap.set('ไ', { soundLatin: 'ai', soundCyrillic: 'ай', length: 'long' });
vowelMap.set('ใ', { soundLatin: 'ai', soundCyrillic: 'ай', length: 'long' });
vowelMap.set('เา', { soundLatin: 'ao', soundCyrillic: 'ао', length: 'long' });
vowelMap.set('แ', { soundLatin: 'ae', soundCyrillic: 'аэ', length: 'long' });
vowelMap.set('โ', { soundLatin: 'o', soundCyrillic: 'о', length: 'long' });
vowelMap.set('เ', { soundLatin: 'e', soundCyrillic: 'э', length: 'long' });

const sonorantSet = new Set(['ง', 'ญ', 'น', 'ม', 'ย', 'ร', 'ล', 'ว']);

function determineTone(consonantClass, syllableType, vowelLength, toneMark) {
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

function analyzeSyllableFixed(syllable) {
  const chars = Array.from(syllable);
  let toneMark = null;
  const consonants = [];
  const vowels = [];

  chars.forEach((char, index) => {
    if (toneMarkMap[char]) {
      toneMark = toneMarkMap[char];
    } else if (consonantMap.has(char)) {
      consonants.push({ char, index });
    } else if (vowelChars.has(char)) {
      vowels.push({ char, index });
    }
  });

  let initialConsonant = consonants[0]?.char || '';
  let consonantClass = consonantClassMap.get(initialConsonant) || 'low';

  if (initialConsonant === 'ห' && consonants.length > 1 && sonorantSet.has(consonants[1].char)) {
    consonantClass = 'high';
    initialConsonant = consonants[1].char;
  }

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

  const finalConsonant = consonants.length > 1 ? consonants[consonants.length - 1].char : '';
  let syllableType = 'live';
  
  if (finalConsonant) {
    const finalInfo = consonantMap.get(finalConsonant);
    if (finalInfo && (finalInfo.class === 'middle' || finalInfo.class === 'high') && 
        !sonorantSet.has(finalConsonant)) {
      syllableType = 'dead';
    } else if (finalInfo && finalInfo.type === 'voiceless' &&
        !sonorantSet.has(finalConsonant)) {
      syllableType = 'dead';
    }
    if (sonorantSet.has(finalConsonant)) {
      syllableType = 'live';
    }
  }
  
  if (!finalConsonant && vowelInfo.length === 'short') {
    syllableType = 'dead';
  }

  const tone = determineTone(consonantClass, syllableType, vowelInfo.length, toneMark);
  const toneSymbol = toneSymbolMap[tone] || '¯';

  return {
    text: syllable,
    tone,
    toneSymbol,
    initialConsonant,
    consonantClass,
    finalConsonant,
    vowelKey,
    vowelLength: vowelInfo.length,
    syllableType,
    toneMark
  };
}

console.log('=== ФИНАЛЬНЫЙ ТЕСТ ИСПРАВЛЕНИЙ ===\n');

const testCases = [
  { word: 'ร้าน', expected: 'high', description: 'low class + mai tho' },
  { word: 'ร่าน', expected: 'falling', description: 'low class + mai ek' },
  { word: 'ราน', expected: 'mid', description: 'low class, no mark' },
  { word: 'ไก่', expected: 'low', description: 'middle class + mai ek' },
  { word: 'หมา', expected: 'rising', description: 'ห + sonorant' },
  { word: 'ขาว', expected: 'rising', description: 'high class, live' },
  { word: 'รัก', expected: 'high', description: 'low class, dead short' },
  { word: 'มาก', expected: 'falling', description: 'low class, dead long' }
];

let passed = 0;
let total = testCases.length;

testCases.forEach(({ word, expected, description }) => {
  const result = analyzeSyllableFixed(word);
  const status = result.tone === expected ? '✅ PASS' : '❌ FAIL';
  
  if (result.tone === expected) passed++;
  
  console.log(`${status} ${word} (${description})`);
  console.log(`  Expected: ${expected}, Got: ${result.tone}`);
  console.log(`  Details: ${result.consonantClass} class, ${result.syllableType}, ${result.vowelLength}, mark: ${result.toneMark || 'none'}`);
  console.log();
});

console.log(`\n=== РЕЗУЛЬТАТЫ ===`);
console.log(`Пройдено: ${passed}/${total} тестов`);
console.log(`Статус: ${passed === total ? '✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ' : '❌ ЕСТЬ ОШИБКИ'}`);

if (passed === total) {
  console.log('\n🎉 Код транскрипции работает правильно!');
  console.log('Правила тонов реализованы корректно согласно тайской грамматике.');
} else {
  console.log('\n⚠️  Требуются дополнительные исправления.');
} 