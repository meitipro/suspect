import type { Metadata } from 'next';

import { Header } from '@/components/Header';
import { MePanel } from '@/components/MePanel';

export const metadata: Metadata = { title: 'My boards' };

export default function Me() {
  return (
    <div className="cork">
      <Header />
      <div className="c-wrap py-10">
        <p className="c-eyebrow" style={{ color: 'var(--paper-ink)' }}>Your account</p>
        <h1 className="type mt-1" style={{ fontSize: 40 }}>My boards</h1>
        <div className="mt-8">
          <MePanel />
        </div>
      </div>
    </div>
  );
}
