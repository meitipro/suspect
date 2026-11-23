import Link from 'next/link';

import { WalletButton } from './Wallet';

/** The site's mark, the same drawing as app/icon.svg: a pin on a yellow disc, a red string leaving it. */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden style={{ flexShrink: 0 }}>
      <circle cx="256" cy="256" r="248" fill="#fde047" stroke="#2a1f10" strokeWidth="14" />
      <path d="M256 258 C 330 330, 380 300, 430 400" fill="none" stroke="#d63b3b" strokeWidth="14" strokeLinecap="round" />
      <circle cx="256" cy="200" r="58" fill="#d63b3b" stroke="#2a1f10" strokeWidth="14" />
      <circle cx="238" cy="182" r="14" fill="#fff" opacity="0.55" />
    </svg>
  );
}

export type NavTargets = { board: number | null };

const links = (t: NavTargets) => [
  { label: 'The board', href: t.board ? `/b/${t.board}` : '/b' },
  { label: 'Matrix', href: t.board ? `/b/${t.board}/matrix` : '/b' },
  { label: 'Name a suspect', href: t.board ? `/b/${t.board}/propose` : '/b' },
  { label: 'All boards', href: '/b' },
  { label: 'Docs', href: '/docs' },
];

const ANGLES = [-90, -18, 54, 126, 198];

/**
 * The landing header: the product name and the call to action in a yellow disc,
 * the five links on a red dashed ring around it, each a pinned index card. The
 * ring turns once in 48 s and the cards counter-rotate to stay upright. Hovering
 * or focusing anywhere on the stage pauses it. On a phone the ring is replaced
 * by a vertical stack, and with reduced motion nothing moves.
 */
export function Orbit({ targets }: { targets: NavTargets }) {
  const items = links(targets);
  return (
    <div className="stage" role="navigation" aria-label="Main">
      <div className="ring" aria-hidden={false}>
        {items.map((l, i) => (
          <div className="sl" key={l.label} style={{ ['--a' as string]: `${ANGLES[i]}deg` }}>
            <div className="up" style={{ ['--a' as string]: `${ANGLES[i]}deg` }}>
              <Link href={l.href}>{l.label}</Link>
            </div>
          </div>
        ))}
      </div>
      <div className="core">
        <span className="kicker">INCIDENT BOARD</span>
        <span className="name">Suspect</span>
        <p>Every cause has to survive every clue.</p>
        <Link href="/b#open" className="go">
          Open a board
        </Link>
      </div>
      <div className="stack-links">
        {items.map((l) => (
          <Link key={l.label} href={l.href}>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Every other page: tape on top, the disc and the same five cards in a row, and the wallet. */
export function Strip({ targets }: { targets: NavTargets }) {
  return (
    <header>
      <div className="tp" aria-hidden />
      <div className="c-wrap strip">
        <Link href="/" className="disc" aria-label="Suspect home">
          <small>INCIDENT BOARD</small>
          Suspect
        </Link>
        <nav className="links" aria-label="Main">
          {links(targets).map((l) => (
            <Link key={l.label} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <span className="c-pill hidden sm:inline-flex" title="GenLayer Studio Next, chain 61997">
            <span className="dot" />
            Studio Next
          </span>
          <Link href="/me" className="c-pill" style={{ textDecoration: 'none' }}>My boards</Link>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
