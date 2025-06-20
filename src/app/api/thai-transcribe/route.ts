import { NextResponse } from 'next/server';
import { transcribeThaiText } from '@/utils/thaiTranscription';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text') || '';
  try {
    const result = transcribeThaiText(text);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return new NextResponse('Error', { status: 500 });
  }
}
