import { recentBoards } from '@/lib/read';

import { Strip } from './Nav';

/** The links of the header point at the board that has the most to show: the first with a suspect on it, else the newest. */
export async function navTargets(): Promise<{ board: number | null }> {
  try {
    const boards = await recentBoards();
    const pick = boards.find((b) => b.pairs_tested > 0) ?? boards.find((b) => b.hypotheses > 0) ?? boards[0];
    return { board: pick?.id ?? null };
  } catch {
    return { board: null };
  }
}

export async function Header() {
  return <Strip targets={await navTargets()} />;
}
