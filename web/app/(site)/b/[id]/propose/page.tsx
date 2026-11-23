import type { Metadata } from 'next';
import Link from 'next/link';

import { ProposeForm } from '@/components/BoardActions';
import { Header } from '@/components/Header';
import { NotFoundCard, ReadError } from '@/components/ui';
import { getBoard, readError } from '@/lib/read';

export const revalidate = 20;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: `Name a suspect, incident ${(await params).id}` };
}

export default async function ProposePage({ params }: { params: Promise<{ id: string }> }) {
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
  const closed = board.state !== 'OPEN' || board.hypotheses >= 6;
  return (
    <div className="cork">
      <Header />
      <div className="c-wrap py-8">
        <p className="c-eyebrow" style={{ color: 'var(--paper-ink)' }}>
          Suspect / <Link href={`/b/${board.id}`} className="c-link">Incident {board.id}</Link> / name a suspect
        </p>
        <h1 className="type mt-1" style={{ fontSize: 'clamp(26px, 3.6vw, 38px)' }}>{board.title}</h1>
        <div className="mt-6">
          {closed ? (
            <div className="c-note" style={{ maxWidth: 640 }}>
              {board.state !== 'OPEN' ? `This board is ${board.state.toLowerCase()} and takes no new suspects.` : 'The wall holds six suspects. That is the most a board takes.'}{' '}
              <Link href={`/b/${board.id}`} className="c-link">Back to the board</Link>.
            </div>
          ) : (
            <ProposeForm boardId={board.id} clues={board.observation_rows.map((o) => ({ idx: o.idx, text: o.text }))} />
          )}
        </div>
        <section className="mt-10" aria-label="The clues">
          <h2 className="c-eyebrow" style={{ color: 'var(--paper-ink)' }}>The clues it has to survive</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {board.observation_rows.length === 0 && <div className="c-note">No clue is pinned yet.</div>}
            {board.observation_rows.map((o, i) => (
              <article key={o.id} className="note pin" style={{ ['--r' as string]: `${((i * 37) % 5 - 2) * 0.7}deg` }}>
                <p className="c-eyebrow" style={{ color: 'var(--paper-ink)' }}>Clue {o.idx}</p>
                <p className="type mt-1 text-[16px] leading-snug">{o.text}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
