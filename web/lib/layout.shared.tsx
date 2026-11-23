import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

import { Mark } from '@/components/Nav';

import { gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="inline-flex items-center gap-2 font-semibold">
          <Mark size={22} />
          <span className="type" style={{ fontSize: 18 }}>Suspect</span>
          <span className="c-pill" style={{ height: 22, fontSize: 10.5 }}>
            <span className="dot" />
            Studio Next
          </span>
        </span>
      ),
      url: '/',
    },
    links: [
      { text: 'Boards', url: '/b' },
      { text: 'Docs', url: '/docs' },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
