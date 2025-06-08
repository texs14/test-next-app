export function tokenizeThaiSentence(text: string): string[] {
  try {
    const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
    return Array.from(segmenter.segment(text)).map((seg: any) => seg.segment);
  } catch {
    return text.split(' ');
  }
}
