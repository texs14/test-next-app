export interface ThaiLetter {
  sound: string;
  endSound?: string;
  type: 'short-vowel' | 'long-vowel' | 'consonant';
  position?: string | string[];
  letters?: { position: string; letter: string }[];
  typeEnd?: 'live' | 'dead';
  classs?: 'low' | 'mid' | 'high';
}
