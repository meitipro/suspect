import type { Metadata } from 'next';
import Link from 'next/link';

import { BoardWall } from '@/components/BoardWall';
import { LockButton, PinForm, ResolveBox } from '@/components/BoardActions';
import { Header } from '@/components/Header';
import { Addr, Money, NotFoundCard, ReadError, StatePill, Tx } from '@/components/ui';
import { txIndex } from '@/lib/explorer';
import { dayTime, plural, until } from '@/lib/format';
import { getBoard, readError } from '@/lib/read';
import { STATE_HELP } from '@/lib/claims';

export const revalidate = 20;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: `Incident ${(await params).id}` };
}

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) return <NotFoundCard what="board" back="/b" backLabel="All boards" />;
  let board;
  try {
    board = await getBoard(id);
  } catch (e) {
    return (
      <div className="cork">
        <Header />
        <div className="c-wrap py-10">
          <ReadError message={readError(e)} />
        </div>
      </div>
    );
  }
  if (!board.found) return <NotFoundCard what="board" back="/b" backLabel="All boards" />;
  const index = await txIndex();
  const open = index.board[String(id)];
  const resolved = board.state === 'RESOLVED';
  const chosen = board.hypothesis_rows.find((h) => h.id === board.chosen);
  return (
    <div className="cork">
      <Header />
      <div className="c-wrap py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="c-eyebrow" style={{ color: 'var(--paper-ink)' }}>
              Suspect / Incident {board.id}
            </p>
            <h1 className="type mt-1" style={{ fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.1 }}>{board.title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-[14px]">
              <StatePill state={board.state} />
              <span>opened by <Addr address={board.owner} /></span>
              <span>{dayTime(board.created_at)}</span>
              {open && <Tx hash={open.hash} label="open" />}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/b/${board.id}/matrix`} className="c-btn">The matrix</Link>
            {!resolved && board.state === 'OPEN' && <Link href={`/b/${board.id}/propose`} className="c-btn solid">Name a suspect, 3 GEN</Link>}
          </div>
        </div>
        <p className="mt-2 max-w-[56em] text-[14px]">{STATE_HELP[board.state]}</p>

        {resolved && (
          <div className="card pin mt-6" style={{ maxWidth: 760 }}>
            <p className="c-eyebrow" style={{ color: 'var(--paper-ink-2)' }}>Resolved {dayTime(board.resolved_at)} by <Addr address={board.resolved_by} /></p>
            <p className="type mt-1 text-[22px]">
              {chosen ? <>The cause: {chosen.text}</> : 'Resolved with no cause: every bond returned.'}
            </p>
            {index.resolve[String(id)] && <p className="mt-2"><Tx hash={index.resolve[String(id)].hash} label="resolve" /></p>}
          </div>
        )}

        <div className="mt-8">
          <BoardWall observations={board.observation_rows} hypotheses={board.hypothesis_rows} boardId={board.id} />
        </div>

        <div className="mt-12 grid items-start gap-8 md:grid-cols-2">
          <PinForm boardId={board.id} full={board.observations >= 6} resolved={resolved} />
          <div className="flex flex-col gap-6">
            <ResolveBox boardId={board.id} owner={board.owner} resolveBy={board.resolve_by} hypotheses={board.hypothesis_rows} state={board.state} />
            {!resolved && board.state === 'OPEN' && <LockButton boardId={board.id} />}
            <div className="card">
              <p className="c-eyebrow" style={{ color: 'var(--paper-ink-2)' }}>The numbers, read from the contract</p>
              <p className="mono mt-2 text-[13px] leading-7">
                {plural(board.observations, 'clue')} · {plural(board.hypotheses, 'suspect')}<br />
                {board.pairs_tested} of {board.pairs_total} pairs tested<br />
                {board.leading} leading · {board.standing} standing · {board.unchecked} unchecked · {board.eliminated} eliminated<br />
                held <Money wei={board.held} /> · resolve by {dayTime(board.resolve_by)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
