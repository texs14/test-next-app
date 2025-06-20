// src/components/WordTooltip.tsx
'use client';
import React, { useEffect, useState, useRef, useMemo } from 'react';
// import type { Language } from '@/types/index.types';
import { useTooltipContext } from '../contexts/TooltipContext';

interface SyllableTr {
  text: string;
  latin: string;
  cyrillic: string;
  tone: string;
}

interface WordInfo {
  translation: string;
  examples: string[];
  transcription?: {
    latin: string;
    cyrillic: string;
    syllables: SyllableTr[];
  };
}

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
        const body = {
          segments: [{ id: 0, text: word }],
          targetLangs: ['ru'],
          sourceLang: originalLang,
        };
        const [trRes, transRes] = await Promise.all([
          fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
          originalLang === 'th'
            ? fetch(`/api/thai-transcribe?text=${encodeURIComponent(word)}`)
            : Promise.resolve(null),
        ]);
        if (!trRes.ok) throw new Error('Ошибка перевода');
        const trData = await trRes.json();
        const translation = trData.segments?.[0]?.translations?.ru || '—';
        let transcription = undefined;
        if (transRes) {
          if (!transRes.ok) throw new Error('Ошибка при получении транскрипции');
          const data = await transRes.json();
          transcription = data.words[0];
        }
        if (!cancelled) {
          setWordInfo({ translation, examples: [], transcription });
        }
      } catch {
        if (!cancelled) {
          setWordInfo({ translation: 'Не удалось получить', examples: [] });
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
        <>
          <p className="mt-2 text-sm">
            <strong>Перевод:</strong> {wordInfo.translation}
          </p>
          {wordInfo.transcription && (
            <p className="mt-2 text-sm">
              <strong>Транскрипция:</strong> {wordInfo.transcription.latin}
            </p>
          )}
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
      ) : (
        <p className="mt-2 text-sm">Нет данных</p>
      )}
    </div>
  );
}
