'use client';

import Link from 'next/link';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { short } from '@/lib/format';
import { gen } from '@/lib/format';
import type { HypRow, ObsRow } from '@/lib/types';

import { StatusStamp } from './ui';

type Line = { id: string; d: string };

/**
 * The wall: the clues as yellow notes on the left, the suspects as index cards
 * on the right, and a red string from a suspect to every clue it EXPLAINS. The
 * strings are measured from the rendered cards, so they follow the layout at any
 * width; below 800 px the wall is one column and the strings are dropped.
 */
export function BoardWall({ observations, hypotheses, boardId }: { observations: ObsRow[]; hypotheses: HypRow[]; boardId: number }) {
  const wall = useRef<HTMLDivElement>(null);
  const notes = useRef<Record<number, HTMLElement | null>>({});
  const cards = useRef<Record<number, HTMLElement | null>>({});
  const [lines, setLines] = useState<Line[]>([]);

  const measure = useCallback(() => {
    const root = wall.current;
    if (!root || window.innerWidth <= 800) {
      setLines([]);
      return;
    }
    const base = root.getBoundingClientRect();
    const next: Line[] = [];
    for (const h of hypotheses) {
      const card = cards.current[h.id];
      if (!card) continue;
      const c = card.getBoundingClientRect();
      h.labels.forEach((label, i) => {
        if (label !== 'EXPLAINS') return;
        const note = notes.current[observations[i]?.id];
        if (!note) return;
        const n = note.getBoundingClientRect();
        const x1 = c.left - base.left + 8;
        const y1 = c.top - base.top + 18;
        const x2 = n.right - base.left - 8;
        const y2 = n.top - base.top + 16;
        const sag = 26 + Math.abs(y2 - y1) * 0.12;
        next.push({ id: `${h.id}-${i}`, d: `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.max(y1, y2) + sag} ${x2} ${y2}` });
      });
    }
    setLines(next);
  }, [hypotheses, observations]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    const t = setTimeout(measure, 400);
    return () => {
      window.removeEventListener('resize', measure);
      clearTimeout(t);
    };
  }, [measure]);

  const tilt = (i: number) => (((i * 37) % 5) - 2) * 0.7;

  return (
    <div className="wall" ref={wall}>
      <svg className="strings" aria-hidden>
        {lines.map((l) => (
          <path key={l.id} d={l.d} fill="none" stroke="#d63b3b" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
        ))}
      </svg>

      <section className="col" aria-label="Clues">
        <h2 className="c-eyebrow" style={{ color: 'var(--paper-ink)' }}>
          Clues · {observations.length} of 6
        </h2>
        {observations.length === 0 && <div className="c-note">No clue is pinned yet. Pin the facts the cause has to survive.</div>}
        {observations.map((o, i) => (
          <article key={o.id} className="note pin" style={{ ['--r' as string]: `${tilt(i)}deg` }} ref={(el) => { notes.current[o.id] = el; }}>
            <p className="c-eyebrow" style={{ color: 'var(--paper-ink)' }}>Clue {o.idx}</p>
            <p className="type mt-1 text-[17px] leading-snug">{o.text}</p>
            <p className="mono mt-2 text-[11px]">pinned by {short(o.author)}</p>
          </article>
        ))}
      </section>

      <section className="col" aria-label="Suspects" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 26, alignContent: 'start' }}>
        <h2 className="c-eyebrow" style={{ color: 'var(--paper-ink)', gridColumn: '1 / -1' }}>
          Suspects · {hypotheses.length} of 6
        </h2>
        {hypotheses.length === 0 && <div className="c-note" style={{ gridColumn: '1 / -1' }}>Nobody has named a suspect yet.</div>}
        {hypotheses.map((h, i) => {
          const dead = h.status === 'ELIMINATED';
          return (
            <article key={h.id} className={`card pin ${dead ? 'dead' : ''}`} style={{ ['--r' as string]: `${tilt(i + 2)}deg` }} ref={(el) => { cards.current[h.id] = el; }}>
              <div className="flex items-start justify-between gap-2">
                <p className="mono text-[12px]">H{h.idx} · {gen(h.bond)} · by {short(h.author)}</p>
                <StatusStamp status={h.status} />
              </div>
              <p className="type h mt-2 text-[18px] leading-snug">{h.text}</p>
              {dead && (
                <p className="mt-3 text-[13px]" style={{ color: 'var(--red)' }}>
                  × CONTRADICTS by clue {h.killed_by_idx}: {h.killed_by_text}
                </p>
              )}
              {!dead && h.explains > 0 && <p className="mt-3 text-[13px]" style={{ color: 'var(--green)' }}>+ EXPLAINS {h.explains} of {observations.length}</p>}
              <p className="mono mt-2 text-[11.5px] dim">
                {h.tested} of {observations.length} pairs tested ·{' '}
                <Link href={`/b/${boardId}/matrix`} className="c-link">matrix</Link>
              </p>
            </article>
          );
        })}
      </section>
    </div>
  );
}
