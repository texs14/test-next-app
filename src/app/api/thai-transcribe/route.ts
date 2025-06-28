import { NextResponse } from 'next/server';
import { transcribeThaiText, transcribeThaiWord } from '@/utils/thaiTranscriptionService';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || '';
  
  if (!text) {
    return NextResponse.json({ error: 'Text parameter is required' }, { status: 400 });
  }
  
  try {
    // Если текст содержит только одно слово, используем transcribeThaiWord
    const trimmedText = text.trim();
    const words = trimmedText.split(/\s+/);
    
    if (words.length === 1) {
      const result = transcribeThaiWord(trimmedText);
      return NextResponse.json({
        text: trimmedText,
        latin: result.latin,
        cyrillic: result.cyrillic,
        words: [result]
      });
    } else {
      const result = transcribeThaiText(trimmedText);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}
