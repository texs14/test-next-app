// Расширенный тест транскрипции
const fs = require('fs');

// Импортируем полную логику из оригинального файла
const phoneticRules = JSON.parse(fs.readFileSync('./src/data/thai-phonetic-rules.json', 'utf8'));

// Все карты и настройки как в оригинальном коде
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

function analyzeSyllable(syllable) {
  console.log(`\n--- Analyzing syllable: ${syllable} ---`);
  const chars = Array.from(syllable);
  let toneMark = null;
  const consonants = [];
  const vowels = [];

  chars.forEach((char, index) => {
    if (toneMarkMap[char]) {
      toneMark = toneMarkMap[char];
      console.log(`Found tone mark: ${char} (${toneMark})`);
    } else if (consonantMap.has(char)) {
      consonants.push({ char, index });
      console.log(`Found consonant: ${char} (${consonantClassMap.get(char)} class)`);
    } else if (vowelChars.has(char)) {
      vowels.push({ char, index });
      console.log(`Found vowel: ${char}`);
    }
  });

  let initialConsonant = consonants[0]?.char || '';
  let consonantClass = consonantClassMap.get(initialConsonant) || 'low';

  // Обработка комбинации ห + сонорный согласный
  if (initialConsonant === 'ห' && consonants.length > 1 && sonorantSet.has(consonants[1].char)) {
    console.log(`Special ห + sonorant rule applied`);
    consonantClass = 'high';
    initialConsonant = consonants[1].char;
  }

  const vowelKey = vowels.map(v => v.char).join('');
  let vowelInfo = vowelMap.get(vowelKey) || { 
    soundLatin: 'a', 
    soundCyrillic: 'а', 
    length: 'short' 
  };

  const finalConsonant = consonants.length > 1 ? consonants[consonants.length - 1].char : '';
  let syllableType = 'live';
  
  if (finalConsonant) {
    const finalInfo = consonantMap.get(finalConsonant);
    if (finalInfo && finalInfo.type === 'voiceless') {
      syllableType = 'dead';
    } else if (finalConsonant && !sonorantSet.has(finalConsonant)) {
      syllableType = 'dead';
    }
  }

  console.log(`Initial consonant: ${initialConsonant} (${consonantClass} class)`);
  console.log(`Final consonant: ${finalConsonant}`);
  console.log(`Vowel: ${vowelKey} (${vowelInfo.length})`);
  console.log(`Syllable type: ${syllableType}`);
  console.log(`Tone mark: ${toneMark}`);

  const tone = determineTone(consonantClass, syllableType, vowelInfo.length, toneMark);
  const toneSymbol = toneSymbolMap[tone] || '¯';

  console.log(`Final tone: ${tone} (${toneSymbol})`);

  return {
    text: syllable,
    tone,
    toneSymbol,
    details: {
      initialConsonant,
      consonantClass,
      finalConsonant,
      vowelKey,
      vowelLength: vowelInfo.length,
      syllableType,
      toneMark
    }
  };
}

// Тестируем различные проблемные случаи
console.log('=== Тестирование различных случаев ===');

const testCases = [
  'ร้าน',  // mai tho - должен быть high
  'ร่าน',  // mai ek - должен быть falling  
  'รัก',   // короткий гласный, dead syllable
  'หมา',   // ห + sonorant
  'ไก่',   // средний класс
  'ขาว',   // высокий класс
  'ครับ',  // кластер + dead syllable
  'มาก'    // длинный гласный, dead syllable
];

testCases.forEach(word => {
  analyzeSyllable(word);
}); 