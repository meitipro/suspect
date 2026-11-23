import Link from 'next/link';

import { DEPLOYMENT } from '@/lib/genlayer-core.mjs';
import { REPO_URL } from '@/lib/shared';

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="tp" aria-hidden />
      <div className="c-dark" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
        <div className="c-wrap grid gap-8 py-10 text-[14px] md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="type" style={{ fontSize: 22 }}>Suspect</p>
            <p className="c-muted mt-3 max-w-[34em] text-[13.5px] leading-relaxed">
              An incident board. It narrows the theories by the clues pinned to it. It does not verify that a clue is true, discover causes nobody proposed, or weigh how likely a theory is: a leading cause is the one the given evidence supports best, not a proven cause.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="c-eyebrow">The contract</p>
            <a className="c-link mono break-all text-[12.5px]" href={`${DEPLOYMENT.explorer}/address/${DEPLOYMENT.suspect}`} target="_blank" rel="noreferrer">
              {DEPLOYMENT.suspect}
            </a>
            <span className="c-faint text-[13px]">GenLayer Studio Next · chain {DEPLOYMENT.chainId}</span>
          </div>
          <div className="flex flex-col gap-2">
            <p className="c-eyebrow">Links</p>
            <Link href="/docs" className="c-muted hover:text-[var(--ink)]">Docs</Link>
            <Link href="/docs/more/evaluation" className="c-muted hover:text-[var(--ink)]">Evaluation results</Link>
            <a href={REPO_URL} className="c-muted hover:text-[var(--ink)]" target="_blank" rel="noreferrer">GitHub</a>
            <Link href="/llms.txt" className="c-muted hover:text-[var(--ink)]">llms.txt</Link>
          </div>
        </div>
      </div>
      <div className="tp" aria-hidden />
    </footer>
  );
}
