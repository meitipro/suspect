import type { Metadata } from 'next';
import Link from 'next/link';

import { CheckButton } from '@/components/BoardActions';
import { Header } from '@/components/Header';
import { CellMark, NotFoundCard, ReadError, StatusStamp, Tx } from '@/components/ui';
import { txIndex } from '@/lib/explorer';
import { until } from '@/lib/format';
import { getBoard, readError } from '@/lib/read';

export const revalidate = 20;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: `Matrix, incident ${(await params).id}` };
}

export default async function MatrixPage({ params }: { params: Promise<{ id: string }> }) {
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
  const resolved = board.state === 'RESOLVED';
  const dead = board.hypothesis_rows.filter((h) => h.status === 'ELIMINATED');
  return (
    <div className="cork">
      <Header />
      <div className="tape-word" aria-hidden>
        <span style={{ display: 'inline-block', paddingLeft: 14 }}>EVIDENCE MATRIX · EVIDENCE MATRIX · EVIDENCE MATRIX · EVIDENCE MATRIX · EVIDENCE MATRIX · EVIDENCE MATRIX · EVIDENCE MATRIX · EVIDENCE MATRIX</span>
      </div>
      <div className="c-wrap py-8">
        <p className="c-eyebrow" style={{ color: 'var(--paper-ink)' }}>
          Suspect / <Link href={`/b/${board.id}`} className="c-link">Incident {board.id}</Link> / matrix
        </p>
        <h1 className="type mt-1" style={{ fontSize: 'clamp(26px, 3.6vw, 38px)' }}>Every suspect against every clue</h1>

        {board.hypotheses === 0 || board.observations === 0 ? (
          <div className="c-note mt-6">The matrix needs at least one clue and one suspect. <Link href={`/b/${board.id}`} className="c-link">Back to the board</Link>.</div>
        ) : (
          <div className="mt-6" style={{ overflowX: 'auto' }}>
            <table className="matrix">
              <thead>
                <tr>
                  <th scope="col">Suspect</th>
                  {board.observation_rows.map((o) => (
                    <th scope="col" key={o.id}>
                      <span className="mono text-[11px]">CLUE {o.idx}</span>
                      <br />
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13 }}>{o.text}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {board.hypothesis_rows.map((h) => (
                  <tr key={h.id}>
                    <th scope="row" style={{ background: '#fbf6e4', minWidth: 200 }}>
                      <span className="mono text-[11px]">H{h.idx}</span> {h.text}
                      <div className="mt-2">
                        <StatusStamp status={h.status} />
                      </div>
                    </th>
                    {board.observation_rows.map((o, i) => {
                      const cell = h.labels[i] ?? '';
                      const tx = index.check[`${h.id}#${o.id}`];
                      return (
                        <td key={o.id} className={`cell ${cell || 'untested'}`}>
                          {cell ? (
                            <>
                              <CellMark cell={cell} />
                              {tx && <div className="mt-1"><Tx hash={tx.hash} /></div>}
                            </>
                          ) : resolved ? (
                            <span className="mono text-[11px]">not tested</span>
                          ) : (
                            <CheckButton boardId={board.id} hid={h.id} oid={o.id} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="card pin">
            <p className="c-eyebrow" style={{ color: 'var(--paper-ink-2)' }}>Why a suspect was eliminated</p>
            {dead.length === 0 ? (
              <p className="mt-2 text-[14.5px]">Nothing is eliminated yet. One CONTRADICTS eliminates a suspect, whatever else it explains.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-3 text-[14.5px]">
                {dead.map((h) => (
                  <li key={h.id}>
                    <b>H{h.idx}</b> was eliminated: clue {h.killed_by_idx} says &ldquo;{h.killed_by_text}&rdquo;, and the pair is CONTRADICTS.
                    {index.check[`${h.id}#${h.killed_by}`] && <> <Tx hash={index.check[`${h.id}#${h.killed_by}`].hash} label="check" /></>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card pin">
            <p className="c-eyebrow" style={{ color: 'var(--paper-ink-2)' }}>Pairs tested</p>
            <p className="type mt-2 text-[22px]">{board.pairs_tested} of {board.pairs_total} are labelled.</p>
            <p className="mt-2 text-[14.5px]">
              {board.leading} leading, {board.standing} standing, {board.unchecked} unchecked, {board.eliminated} eliminated.
              {!resolved && <> Resolve in {until(board.resolve_by)}, or now by the owner.</>}
            </p>
            <p className="mono mt-3 text-[11.5px]">A pair is judged once. Validators compare the one label, nothing else.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
