import Link from 'next/link';

import { BoardWall } from '@/components/BoardWall';
import { navTargets } from '@/components/Header';
import { Orbit } from '@/components/Nav';
import { StatusStamp } from '@/components/ui';
import { plural } from '@/lib/format';
import { featuredBoard, getTotals, readError } from '@/lib/read';
import type { Board, Totals } from '@/lib/types';

export const revalidate = 20;

const FAQ = [
  ['Is it a verdict?', 'No. A leading suspect is the one the pinned clues support best, not a proven cause. Suspect narrows theories by the evidence given; it does not discover the cause, verify a clue, or weigh how likely a theory is.'],
  ['Who can pin a clue?', 'Anyone, for 1 GEN, which comes back when the board resolves. A clue is public with its author and cannot be edited or removed, so the owner cannot rig the board by pinning only what fits.'],
  ['What if nobody resolves?', 'The owner has 7 days. After that anyone may resolve in favour of the leading suspect, and when none leads, anyone may resolve with no cause and every bond returns.'],
  ['Which network is it on?', 'GenLayer Studio Next, chain 61997, on the GenVM v0.4 runtime. The contract address is in the footer, and every figure on the boards is read from it.'],
] as const;

const STEPS = [
  ['Pin', 'The team pins the observations from the incident, up to six, each a short fact. They cannot be edited.'],
  ['Name', 'Members name hypotheses with a bond, up to six, at most two from one author.'],
  ['Test', 'Anyone asks the validators to label a hypothesis and a clue: it explains it, contradicts it, or is silent on it.'],
  ['Resolve', 'One contradiction eliminates a suspect. The survivors are ranked, and when the cause is named the eliminated bonds go to whoever named it.'],
] as const;

/** The wall shown on the landing page: a real board, cut to three clues and two suspects (one standing, one out) when it has them. */
function sampleOf(board: Board): Board {
  const obs = board.observation_rows.slice(0, 3);
  const pool = board.hypothesis_rows;
  const lead = pool.find((h) => h.status === 'LEADING') ?? pool[0];
  const dead = pool.find((h) => h.status === 'ELIMINATED' && h.id !== lead?.id);
  const picked = [lead, dead].filter(Boolean) as Board['hypothesis_rows'];
  return { ...board, observation_rows: obs, hypothesis_rows: picked.map((h) => ({ ...h, labels: h.labels.slice(0, 3) })) };
}

export default async function Landing() {
  let totals: Totals | null = null;
  let board: Board | null = null;
  let error = '';
  try {
    [totals, board] = await Promise.all([getTotals(), featuredBoard()]);
  } catch (e) {
    error = readError(e);
  }
  const targets = await navTargets();
  const sample = board ? sampleOf(board) : null;
  return (
    <div className="cork">
      <div className="tape-word" aria-hidden>
        <span style={{ display: 'inline-block', paddingLeft: 14 }}>
          SUSPECT · INCIDENT BOARD · DO NOT CROSS · SUSPECT · INCIDENT BOARD · DO NOT CROSS · SUSPECT · INCIDENT BOARD · DO NOT CROSS · SUSPECT · INCIDENT BOARD · DO NOT CROSS
        </span>
      </div>
      <div className="tp" aria-hidden />

      <div className="c-wrap">
        <Orbit targets={targets} />
      </div>

      <section className="c-wrap pb-14">
        <div className="grid items-end gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="type" style={{ fontSize: 'clamp(30px, 4.4vw, 46px)', lineHeight: 1.1 }}>An incident board where each cause has to survive every clue.</h1>
            <p className="mt-3 max-w-[40em] text-[17px]">
              The team pins the facts. Members name suspects with a bond. Validators test every suspect against every clue, one contradiction eliminates a suspect, and the survivors are ranked by what they explain.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/b#open" className="c-btn solid">Open a board</Link>
              <Link href={targets.board ? `/b/${targets.board}` : '/b'} className="c-btn">See a board</Link>
            </div>
          </div>
          <ul className="card pin text-[14.5px]" style={{ ['--r' as string]: '1deg', listStyle: 'none' }}>
            <li>36 pairs judged at most per board</li>
            <li>one contradiction eliminates a suspect</li>
            <li>public record, bonds paid by rule</li>
            {totals && (
              <li className="mono mt-2 text-[12px] dim">
                {plural(totals.boards, 'board')} · {plural(totals.observations, 'clue')} · {plural(totals.hypotheses, 'suspect')} on Studio Next
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="c-wrap pb-16" aria-label="A board">
        {error && <div className="c-note">{error}</div>}
        {sample ? (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <h2 className="type text-[26px]">Incident {sample.id}: {sample.title}</h2>
              <Link href={`/b/${sample.id}`} className="c-btn small">Open the whole board</Link>
            </div>
            <BoardWall observations={sample.observation_rows} hypotheses={sample.hypothesis_rows} boardId={sample.id} />
            <p className="mt-6 flex flex-wrap items-center gap-3 text-[14px]">
              <StatusStamp status="LEADING" /> <StatusStamp status="STANDING" /> <StatusStamp status="ELIMINATED" />
              <span>The stamps are computed in code from the labels. A string joins a suspect to a clue it explains.</span>
            </p>
          </>
        ) : (
          !error && <div className="c-note">No board has been opened yet. Open the first one.</div>
        )}
      </section>

      <section id="how" className="c-dark" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
        <div className="c-wrap py-16">
          <p className="c-eyebrow">How a board works</p>
          <div className="mt-6 grid gap-6 md:grid-cols-4">
            {STEPS.map(([name, text], i) => (
              <div key={name}>
                <p className="type text-[26px]" style={{ color: 'var(--accent)' }}>0{i + 1} {name}</p>
                <p className="c-muted mt-2 text-[15px] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 grid gap-10 md:grid-cols-2">
            <div>
              <p className="c-eyebrow">For teams</p>
              <h2 className="type mt-2 text-[28px]">Post-incident reviews that keep the theories that were ruled out.</h2>
              <p className="c-muted mt-3 text-[15.5px] leading-relaxed">
                A postmortem is usually one story. Someone proposes a cause early, everyone anchors on it, and the evidence that does not fit is described as noise. A board forces the matrix of causes against clues, every pair judged the same way, so the record shows what was considered, what was eliminated, and the exact clue that did it.
              </p>
            </div>
            <div className="c-faq">
              {FAQ.map(([q, a]) => (
                <details key={q} className="border-b border-[var(--line)] py-3">
                  <summary className="cursor-pointer font-medium">{q}</summary>
                  <p className="c-muted mt-2 max-w-[62ch] text-[14.5px] leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
