import type { Metadata } from 'next';

import { OpenBoardForm } from '@/components/BoardActions';
import { Header } from '@/components/Header';
import { BoardCard, Empty, ReadError } from '@/components/ui';
import { recentBoards, readError } from '@/lib/read';
import type { BoardRow } from '@/lib/types';

export const revalidate = 20;
export const metadata: Metadata = { title: 'Boards' };

function Group({ title, boards, offset = 0 }: { title: string; boards: BoardRow[]; offset?: number }) {
  return (
    <section className="mt-10">
      <h2 className="type text-[24px]">{title}</h2>
      {boards.length === 0 ? (
        <div className="mt-3">
          <Empty>None yet.</Empty>
        </div>
      ) : (
        <div className="mt-5 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b, i) => (
            <BoardCard key={b.id} b={b} tilt={(((i + offset) * 29) % 5) - 2 > 0 ? 0.8 : -0.8} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function Boards() {
  let boards: BoardRow[] = [];
  let error = '';
  try {
    boards = await recentBoards();
  } catch (e) {
    error = readError(e);
  }
  const open = boards.filter((b) => b.state === 'OPEN' || b.state === 'LOCKED');
  const resolved = boards.filter((b) => b.state === 'RESOLVED');
  const now = Math.floor(Date.now() / 1000);
  const expired = open.filter((b) => now >= b.resolve_by);
  const running = open.filter((b) => now < b.resolve_by);
  return (
    <div className="cork">
      <Header />
      <div className="c-wrap py-10">
        <p className="c-eyebrow" style={{ color: 'var(--paper-ink)' }}>All boards</p>
        <h1 className="type mt-1" style={{ fontSize: 40 }}>The wall of incidents</h1>
        <div className="mt-8">
          <OpenBoardForm />
        </div>
        {error ? (
          <div className="mt-8">
            <ReadError message={error} />
          </div>
        ) : (
          <>
            <Group title="Open" boards={running} />
            <Group title="Expired, anyone may resolve" boards={expired} offset={1} />
            <Group title="Resolved" boards={resolved} offset={2} />
          </>
        )}
      </div>
    </div>
  );
}
