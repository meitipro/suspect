'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { gen } from '@/lib/format';
import type { Account } from '@/lib/types';

import { TxProgress, useWrite } from './Actions';
import { WalletGate, useWallet } from './Wallet';
import { Empty, Money, StatePill, StatusStamp } from './ui';

type Mine = Partial<Account> & { balance: string; earned: string; withdrawn: string };

/** The visitor's own boards, suspects and clues, and the one button that pays: withdraw. */
export function MePanel() {
  const w = useWallet();
  const { state, busy, run } = useWrite([]);
  const [mine, setMine] = useState<Mine | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!w.account) return;
    try {
      const r = await fetch(`/api/account?address=${w.account}`, { cache: 'no-store' });
      const body = await r.json();
      if (body.error) setError(body.error);
      else {
        setError('');
        setMine(body.account);
      }
    } catch {
      setError('The site could not read your account. Reload in a moment.');
    }
  }, [w.account]);

  useEffect(() => {
    load();
  }, [load, state.phase]);

  async function withdraw() {
    await run('withdraw', []);
    await load();
  }

  return (
    <WalletGate action="see your boards">
      {error && <div className="c-note">{error}</div>}
      {mine && (
        <div className="grid gap-8">
          <div className="card pin" style={{ maxWidth: 560 }}>
            <p className="c-eyebrow" style={{ color: 'var(--paper-ink-2)' }}>Your balance in the contract</p>
            <p className="type mt-1 text-[34px]">{gen(mine.balance)}</p>
            <p className="mono mt-1 text-[12px]">earned {gen(mine.earned)} · withdrawn {gen(mine.withdrawn)}</p>
            <p className="mt-2 text-[13.5px]">Verdicts and resolving only move balances inside the contract. Withdraw is the one call that pays.</p>
            <div className="mt-3 flex items-center gap-3">
              <button className="c-btn solid" disabled={busy || BigInt(mine.balance) === 0n} onClick={withdraw}>
                Withdraw {gen(mine.balance)}
              </button>
            </div>
            <div className="mt-3">
              <TxProgress state={state} waiting="Paying your balance." />
            </div>
          </div>

          <section>
            <h2 className="type text-[24px]">Your suspects</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {(mine.hypotheses ?? []).length === 0 && <Empty>You have not named a suspect yet.</Empty>}
              {(mine.hypotheses ?? []).map((h, i) => (
                <Link key={h.id} href={`/b/${h.board_id}`} className={`card pin link ${h.status === 'ELIMINATED' ? 'dead' : ''}`} style={{ ['--r' as string]: `${i % 2 ? 0.7 : -0.7}deg`, textDecoration: 'none' }}>
                  <p className="mono text-[12px]">Incident {h.board_id} · H{h.idx} · <Money wei={h.bond} /></p>
                  <p className="type h mt-1 text-[18px]">{h.text}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusStamp status={h.status} />
                    {h.chosen && <span className="stamp leading">the cause</span>}
                    <StatePill state={h.board_state} />
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="type text-[24px]">Your clues</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(mine.observations ?? []).length === 0 && <Empty>You have not pinned a clue yet.</Empty>}
              {(mine.observations ?? []).map((o, i) => (
                <Link key={o.id} href={`/b/${o.board_id}`} className="note pin" style={{ ['--r' as string]: `${i % 2 ? 0.8 : -0.8}deg`, textDecoration: 'none' }}>
                  <p className="mono text-[12px]">Incident {o.board_id} · clue {o.idx} · {o.board_state}</p>
                  <p className="type mt-1 text-[16px]">{o.text}</p>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="type text-[24px]">Your boards</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {(mine.boards ?? []).length === 0 && <Empty>You have not opened a board yet.</Empty>}
              {(mine.boards ?? []).map((b) => (
                <Link key={b.id} href={`/b/${b.id}`} className="card pin link block" style={{ textDecoration: 'none' }}>
                  <p className="type text-[20px]">Incident {b.id}: {b.title}</p>
                  <p className="mt-2"><StatePill state={b.state} /></p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}
    </WalletGate>
  );
}
