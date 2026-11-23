'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { gen, toWei, until } from '@/lib/format';
import type { Cell, HypRow } from '@/lib/types';

import { TxProgress, useWrite } from './Actions';
import { WalletGate } from './Wallet';

const GEN = 10n ** 18n;

/** Open a board. The returned id is the board; the page then moves to it. */
export function OpenBoardForm() {
  const { w, state, busy, run } = useWrite([]);
  const router = useRouter();
  const [title, setTitle] = useState('');
  const left = 80 - title.length;
  async function go() {
    const done = await run('open_board', [title.trim()]);
    if (done.phase === 'done' && typeof done.returned === 'number') router.push(`/b/${done.returned}`);
  }
  return (
    <div id="open" className="card" style={{ maxWidth: 640 }}>
      <h2 className="type text-[24px]">Open a board</h2>
      <p className="mt-1 text-[14px]">One board for one incident. It opens a 7 day window; after that anyone may resolve it in favour of the leading suspect.</p>
      <div className="mt-4">
        <WalletGate action="open a board">
          <div className="field">
            <label htmlFor="title">Incident</label>
            <input id="title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="API outage, 14:02 to 15:10" />
            <p className="count">{left} left</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button className="c-btn solid" disabled={busy || !w.account || title.trim() === '' || title.length > 80} onClick={go}>
              Open the board
            </button>
          </div>
          <div className="mt-3">
            <TxProgress state={state} waiting="Opening the board." />
          </div>
        </WalletGate>
      </div>
    </div>
  );
}

/** Pin a clue for 1 GEN, which comes back to whoever pinned it when the board resolves. */
export function PinForm({ boardId, full, resolved }: { boardId: number; full: boolean; resolved: boolean }) {
  const { w, state, busy, run } = useWrite([`board:${boardId}`]);
  const [text, setText] = useState('');
  if (resolved) return <div className="c-note">This board is resolved. No more clues can be pinned.</div>;
  if (full) return <div className="c-note">The wall holds six clues. That is the most a board takes.</div>;
  async function go() {
    const done = await run('add_observation', [boardId, text.trim()], GEN);
    if (done.phase === 'done') setText('');
  }
  return (
    <div className="note pin" style={{ ['--r' as string]: '-0.6deg' }}>
      <h3 className="type text-[20px]">Pin a clue</h3>
      <p className="mt-1 text-[13.5px]">A fact recorded about the incident. 1 GEN, returned when the board resolves. A clue cannot be edited or removed.</p>
      <div className="mt-3">
        <WalletGate action="pin a clue">
          <div className="field">
            <label htmlFor="clue">Clue</label>
            <textarea id="clue" rows={3} maxLength={200} value={text} onChange={(e) => setText(e.target.value)} placeholder="CPU stayed flat, traffic normal." />
            <p className="count">{200 - text.length} left</p>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button className="c-btn solid" disabled={busy || !w.account || text.trim() === '' || text.includes('\n')} onClick={go}>
              Pin it, 1 GEN
            </button>
          </div>
          <div className="mt-3">
            <TxProgress state={state} waiting="Pinning the clue." />
          </div>
        </WalletGate>
      </div>
    </div>
  );
}

/** Name a suspect with a bond of at least 3 GEN. */
export function ProposeForm({ boardId, clues }: { boardId: number; clues: { idx: number; text: string }[] }) {
  const { w, state, busy, run } = useWrite([`board:${boardId}`]);
  const router = useRouter();
  const [text, setText] = useState('');
  const [bond, setBond] = useState('3');
  const [preview, setPreview] = useState<Record<number, string>>({});
  const wei = toWei(bond);
  const ok = text.trim() !== '' && wei !== null && wei >= 3n * GEN;
  async function go() {
    const done = await run('propose', [boardId, text.trim()], wei ?? 0n);
    if (done.phase === 'done') router.push(`/b/${boardId}`);
  }
  async function ask(idx: number, clue: string) {
    setPreview((p) => ({ ...p, [idx]: '…' }));
    try {
      const r = await fetch('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hypothesis: text, observation: clue }) });
      const body = await r.json();
      setPreview((p) => ({ ...p, [idx]: body.label ?? body.message ?? 'No answer.' }));
    } catch {
      setPreview((p) => ({ ...p, [idx]: 'The preview did not answer.' }));
    }
  }
  return (
    <div className="card pin" style={{ maxWidth: 720 }}>
      <h2 className="type text-[24px]">Name a suspect</h2>
      <p className="mt-1 text-[14px]">A cause, in one line, with a bond of at least 3 GEN. A suspect that survives gets the bond back; one that is eliminated gives it to the author of the chosen cause. At most 2 suspects per author on a board.</p>
      <div className="mt-4">
        <WalletGate action="name a suspect">
          <div className="field">
            <label htmlFor="cause">The cause</label>
            <textarea id="cause" rows={3} maxLength={200} value={text} onChange={(e) => setText(e.target.value)} placeholder="The TLS certificate expired at 14:00." />
            <p className="count">{200 - text.length} left</p>
          </div>
          <div className="field mt-3" style={{ maxWidth: 220 }}>
            <label htmlFor="bond">Bond, GEN (at least 3)</label>
            <input id="bond" inputMode="decimal" value={bond} onChange={(e) => setBond(e.target.value)} />
          </div>
          {clues.length > 0 && (
            <div className="mt-4">
              <p className="c-eyebrow" style={{ color: 'var(--paper-ink-2)' }}>Check against the clues first (one model, never on chain)</p>
              <ul className="mt-2 flex flex-col gap-2">
                {clues.map((c) => (
                  <li key={c.idx} className="flex flex-wrap items-center gap-3 text-[14px]">
                    <span className="mono text-[12px]">Clue {c.idx}</span>
                    <span className="min-w-0 flex-1">{c.text}</span>
                    <button className="c-btn small" disabled={text.trim() === ''} onClick={() => ask(c.idx, c.text)}>
                      Preview
                    </button>
                    {preview[c.idx] && <span className="mono text-[12px]">{preview[c.idx]}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button className="c-btn solid" disabled={busy || !w.account || !ok} onClick={go}>
              Name the suspect{wei !== null ? `, ${gen(wei)}` : ''}
            </button>
          </div>
          <div className="mt-3">
            <TxProgress state={state} waiting="Naming the suspect." />
          </div>
        </WalletGate>
      </div>
    </div>
  );
}

/** Ask the validators to label one pair. Anyone may. */
export function CheckButton({ boardId, hid, oid, label }: { boardId: number; hid: number; oid: number; label?: string }) {
  const { w, state, busy, run } = useWrite([`board:${boardId}`, `hypothesis:${hid}`]);
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <button className="c-btn small" disabled={busy || !w.account} onClick={() => run('check', [hid, oid])} title={w.account ? 'Ask the validators to label this pair' : 'Connect a wallet to check a pair'}>
        {busy ? 'Reading…' : (label ?? 'Check')}
      </button>
      {state.phase !== 'idle' && state.phase !== 'done' && <TxProgress state={state} waiting="Validators are reading." />}
    </span>
  );
}

/** Owner only: close the board to new suspects. */
export function LockButton({ boardId }: { boardId: number }) {
  const { w, state, busy, run } = useWrite([`board:${boardId}`]);
  return (
    <div>
      <button className="c-btn small" disabled={busy || !w.account} onClick={() => run('lock_board', [boardId])}>
        Lock the board to new suspects
      </button>
      <div className="mt-2">
        <TxProgress state={state} waiting="Locking the board." />
      </div>
    </div>
  );
}

/**
 * Resolve: the owner names any survivor at any time; after the window anyone may
 * name a LEADING one, and with none leading anyone may resolve with no cause and
 * every bond returns. The contract decides; this only explains the rule.
 */
export function ResolveBox({ boardId, owner, resolveBy, hypotheses, state: boardState }: { boardId: number; owner: string; resolveBy: number; hypotheses: HypRow[]; state: string }) {
  const { w, state, busy, run } = useWrite([`board:${boardId}`]);
  const [pick, setPick] = useState(0);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30000);
    return () => clearInterval(t);
  }, []);
  if (boardState === 'RESOLVED') return null;
  const expired = now >= resolveBy;
  const mine = !!w.account && w.account.toLowerCase() === owner.toLowerCase();
  const survivors = hypotheses.filter((h) => h.status !== 'ELIMINATED');
  const leaders = survivors.filter((h) => h.status === 'LEADING');
  const options = mine ? survivors : expired ? leaders : [];
  const noLeader = expired && leaders.length === 0;
  return (
    <div className="card pin">
      <h3 className="type text-[22px]">{expired ? 'The window is over' : `Resolve in ${until(resolveBy)}`}</h3>
      <p className="mt-1 text-[13.5px]">
        The owner names the cause among the survivors. After the window anyone may resolve in favour of the leading suspect. The bonds of the eliminated suspects go to the author of the chosen cause.
      </p>
      <div className="mt-3">
        <WalletGate action="resolve the board">
          {options.length === 0 && !noLeader && <p className="text-[14px]">Only the owner can resolve before the window ends.</p>}
          {options.length > 0 && (
            <fieldset className="flex flex-col gap-2" style={{ border: 0, padding: 0 }}>
              <legend className="sr-only">Choose the cause</legend>
              {options.map((h) => (
                <label key={h.id} className="flex items-start gap-2 text-[14px]">
                  <input type="radio" name="cause" checked={pick === h.id} onChange={() => setPick(h.id)} />
                  <span>
                    H{h.idx} · {h.text} <span className="mono text-[11.5px]">({h.status})</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {options.length > 0 && (
              <button className="c-btn solid" disabled={busy || !w.account || pick === 0} onClick={() => run('resolve', [boardId, pick])}>
                Name the cause
              </button>
            )}
            {noLeader && (
              <button className="c-btn" disabled={busy || !w.account} onClick={() => run('resolve', [boardId, 0])}>
                Resolve with no cause, every bond returns
              </button>
            )}
          </div>
          <div className="mt-3">
            <TxProgress state={state} waiting="Resolving the board." />
          </div>
        </WalletGate>
      </div>
    </div>
  );
}

/** What a cell of the matrix offers: the label, or a button to ask for it. */
export function PairCell({ boardId, hid, oid, cell }: { boardId: number; hid: number; oid: number; cell: Cell }) {
  if (cell) return null;
  return <CheckButton boardId={boardId} hid={hid} oid={oid} />;
}
