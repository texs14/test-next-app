'use client'

// src/components/WordTooltip.tsx
import React, { useEffect, useState, useRef, useMemo } from 'react'
import { useTooltipContext } from '../contexts/TooltipContext'

interface ThaiInfo {
  romanized: string
  wordTones: { word: string; tone: string }[]
  pos: { text: string; tag: string }[]
  translations: Record<string, string>
  examples: { text: string; translations: Record<string, string> }[]
}

type WordInfo =
  | { type: 'th'; data: ThaiInfo }
  | { type: 'en'; translation: string; examples: string[] }

export function WordTooltip() {
  const { tooltip, hideTooltip } = useTooltipContext();
  const [wordInfo, setWordInfo] = useState<WordInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBelow, setShowBelow] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Если тултип не видим или отсутствует — оставить хуки на месте, но рендерить null
  const word = tooltip?.word || '';
  const coords = useMemo(
    () => tooltip?.coords || { x: 0, yAbove: 0, yBelow: 0 },
    [tooltip],
  );
  const originalLang = tooltip?.originalLang || 'en';

  useEffect(() => {
    if (!tooltip || !tooltip.visible) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setWordInfo(null);
    setShowBelow(false); // сброс перед измерением

    (async () => {
      try {
        if (originalLang === 'th') {
          const res = await fetch('/api/thai-info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: word }),
          })
          if (!res.ok) throw new Error('Ошибка при получении данных')
          const data: ThaiInfo = await res.json()
          if (!cancelled) {
            setWordInfo({ type: 'th', data })
          }
        } else {
          const res = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
          );
          if (!res.ok) throw new Error('Ошибка при получении данных');
          const data = await res.json();
          const entry = data[0];
          const meaning = entry?.meanings?.[0] || {};
          const defObj = meaning.definitions?.[0] || {};
          const translation = defObj.definition || '—';
          const examples = defObj.example ? [defObj.example] : [];
          if (!cancelled) {
            setWordInfo({ type: 'en', translation, examples });
          }
        }
      } catch {
        if (!cancelled) {
          setWordInfo({ type: 'en', translation: 'Не удалось получить', examples: [] });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tooltip, word, originalLang]);

  useEffect(() => {
    if (!tooltip || !tooltip.visible || !tooltipRef.current) {
      return;
    }
    const el = tooltipRef.current;
    const rect = el.getBoundingClientRect();
    // Если сверху не хватает места, показываем снизу
    if (coords.yAbove - rect.height < 0) {
      setShowBelow(true);
    } else {
      setShowBelow(false);
    }
  }, [tooltip, coords]);

  if (!tooltip || !tooltip.visible) {
    return null;
  }

  // Выбираем y: yAbove (при showBelow=false) или yBelow (при showBelow=true)
  const topPosition = showBelow ? coords.yBelow : coords.yAbove;
  // Трансформация: если сверху, сдвигаем на -100%, если снизу — на 0%
  const translateY = showBelow ? '0%' : '-100%';

  return (
    <div
      ref={tooltipRef}
      className="absolute z-50 max-w-xs p-3 text-black bg-white rounded shadow-lg"
      style={{
        left: coords.x,
        top: topPosition,
        transform: `translate(-50%, ${translateY})`,
      }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{word}</h4>
        <button onClick={hideTooltip} className="text-xs text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>

      {loading ? (
        <p className="mt-2 text-sm">Загрузка...</p>
      ) : wordInfo ? (
        wordInfo.type === 'th' ? (
          <div className="mt-2 text-sm space-y-2">
            <p>
              <strong>Romanization:</strong> {wordInfo.data.romanized}
            </p>
            {Object.keys(wordInfo.data.translations).length > 0 && (
              <div>
                <strong>Translations:</strong>
                <ul className="ml-4 list-disc list-inside">
                  {Object.entries(wordInfo.data.translations).map(([lang, text]) => (
                    <li key={lang}>
                      {lang}: {text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {wordInfo.data.wordTones.length > 0 && (
              <div>
                <strong>Tones:</strong>
                <ul className="ml-4 list-disc list-inside">
                  {wordInfo.data.wordTones.map((wt, i) => (
                    <li key={i}>
                      {wt.word} - {wt.tone}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {wordInfo.data.pos.length > 0 && (
              <div>
                <strong>POS:</strong>
                <ul className="ml-4 list-disc list-inside">
                  {wordInfo.data.pos.map((p, i) => (
                    <li key={i}>
                      {p.text} - {p.tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {wordInfo.data.examples.length > 0 && (
              <div>
                <strong>Examples:</strong>
                <ul className="ml-4 list-disc list-inside">
                  {wordInfo.data.examples.map((ex, i) => (
                    <li key={i}>
                      {ex.text}
                      <ul className="ml-4 list-disc list-inside">
                        {Object.entries(ex.translations).map(([lang, txt]) => (
                          <li key={lang}>
                            {lang}: {txt}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm">
              <strong>Перевод:</strong> {wordInfo.translation}
            </p>
            {wordInfo.examples.length > 0 && (
              <div className="mt-2 text-sm">
                <strong>Примеры:</strong>
                <ul className="ml-4 list-disc list-inside">
                  {wordInfo.examples.map((ex, i) => (
                    <li key={i}>{ex}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )
      ) : (
        <p className="mt-2 text-sm">Нет данных</p>
      )}
    </div>
  );
}
