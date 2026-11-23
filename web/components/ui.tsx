import Link from 'next/link';

import { MARK, MARK_WORD } from '@/lib/claims';
import { gen, short, shortHash } from '@/lib/format';
import { DEPLOYMENT } from '@/lib/genlayer-core.mjs';
import type { BoardState, Cell, Status } from '@/lib/types';

export const EXPLORER = DEPLOYMENT.explorer as string;
export const CONTRACT = DEPLOYMENT.suspect as string;

export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const addressUrl = (address: string) => `${EXPLORER}/address/${address}`;

export function Tx({ hash, label }: { hash?: string; label?: string }) {
  if (!hash) return null;
  return (
    <a className="c-link mono text-[12.5px]" href={txUrl(hash)} target="_blank" rel="noreferrer">
      {label ? `${label} ` : ''}
      {shortHash(hash)} ↗
    </a>
  );
}

export function Addr({ address }: { address: string }) {
  if (!address) return null;
  return (
    <a className="c-link mono text-[12.5px]" href={addressUrl(address)} target="_blank" rel="noreferrer" title={address}>
      {short(address)}
    </a>
  );
}

export function Money({ wei, strong }: { wei: string | bigint; strong?: boolean }) {
  return <span className={`mono ${strong ? 'font-semibold' : ''}`}>{gen(wei)}</span>;
}

/** A rubber stamp: green for leading, ochre for standing, dashed for unchecked, red for eliminated. */
export function StatusStamp({ status, big }: { status: Status; big?: boolean }) {
  return <span className={`stamp ${status.toLowerCase()} ${big ? 'big' : ''}`}>{status}</span>;
}

export function StatePill({ state }: { state: BoardState }) {
  return <span className={`state-pill ${state.toLowerCase()}`}>{state}</span>;
}

/** One pair's mark: a plus, a cross or a dot, with the word beside it for screen readers. */
export function CellMark({ cell }: { cell: Cell }) {
  return (
    <span className={`lab ${cell}`} title={MARK_WORD[cell]}>
      <span className="mark" aria-hidden>{MARK[cell]}</span>
      <span>{cell || 'NOT TESTED'}</span>
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="c-note">{children}</div>;
}

export function ReadError({ message }: { message: string }) {
  return (
    <div className="c-card pad">
      <p className="type text-[18px]">The chain did not answer.</p>
      <p className="mt-1 text-[14px]">{message}</p>
    </div>
  );
}

export function NotFoundCard({ what, back, backLabel }: { what: string; back: string; backLabel: string }) {
  return (
    <div className="c-wrap py-16">
      <div className="card" style={{ maxWidth: 560 }}>
        <p className="c-eyebrow" style={{ color: 'var(--paper-ink-2)' }}>Not found</p>
        <h1 className="type mt-2 text-[28px]">There is no {what}.</h1>
        <p className="mt-2">It may not exist yet on Studio Next, or the number is wrong.</p>
        <Link href={back} className="c-btn mt-4">
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

/** A board as an index card: title, state, and how far the testing has got. */
export function BoardCard({ b, tilt = 0 }: { b: { id: number; title: string; state: BoardState; observations: number; hypotheses: number; pairs_tested: number; pairs_total: number; leading: number; eliminated: number }; tilt?: number }) {
  return (
    <Link href={`/b/${b.id}`} className="card pin link block" style={{ ['--r' as string]: `${tilt}deg`, textDecoration: 'none' }}>
      <p className="c-eyebrow" style={{ color: 'var(--paper-ink-2)' }}>Incident {b.id}</p>
      <p className="type mt-1 text-[21px] leading-tight">{b.title}</p>
      <p className="mt-3 text-[13.5px]">
        {b.observations} {b.observations === 1 ? 'clue' : 'clues'} · {b.hypotheses} {b.hypotheses === 1 ? 'suspect' : 'suspects'} · {b.pairs_tested} of {b.pairs_total} pairs tested
      </p>
      <p className="mt-3 flex flex-wrap items-center gap-2">
        <StatePill state={b.state} />
        {b.leading > 0 && <span className="stamp leading">{b.leading} leading</span>}
        {b.eliminated > 0 && <span className="stamp eliminated">{b.eliminated} out</span>}
      </p>
    </Link>
  );
}
