import { unstable_cache } from 'next/cache';

import { CONTRACT, readClient, retried } from './genlayer-core.mjs';
import type { Account, Board, BoardRow, Hypothesis, Listing, NotFound, Totals } from './types';

/**
 * Reads happen on the server, cached for 20 seconds under tags: Studio Next
 * rate-limits each IP at about thirty requests a minute. After a decided write
 * the page POSTs /api/refresh, which expires the tags it touched.
 */

const client = readClient();
const REVALIDATE = 20;

async function view<T>(method: string, args: (number | string)[]): Promise<T> {
  const raw = await retried(() => client.readContract({ address: CONTRACT, functionName: method, args }), 3);
  return JSON.parse(String(raw)) as T;
}

export const tags = {
  all: 'chain',
  board: (id: number) => `board:${id}`,
  hypothesis: (id: number) => `hypothesis:${id}`,
  account: (address: string) => `account:${address.toLowerCase()}`,
};

export function getTotals(): Promise<Totals> {
  return unstable_cache(async () => (await view<NotFound>('get_board', [''])).totals, ['totals'], { revalidate: REVALIDATE, tags: [tags.all] })();
}

/** The newest boards, newest first. */
export function recentBoards(): Promise<BoardRow[]> {
  return unstable_cache(async () => (await view<NotFound>('get_board', [''])).boards ?? [], ['recent-boards'], { revalidate: REVALIDATE, tags: [tags.all] })();
}

export function getBoard(id: number): Promise<Board | NotFound> {
  return unstable_cache(() => view<Board | NotFound>('get_board', [String(id)]), ['get_board', String(id)], { revalidate: REVALIDATE, tags: [tags.all, tags.board(id)] })();
}

export function getHypothesis(id: number): Promise<Hypothesis | NotFound> {
  return unstable_cache(() => view<Hypothesis | NotFound>('get_hypothesis', [id]), ['get_hypothesis', String(id)], { revalidate: REVALIDATE, tags: [tags.all, tags.hypothesis(id)] })();
}

export function getAccount(address: string): Promise<Account | NotFound> {
  return unstable_cache(() => view<Account | NotFound>('get_board', [address.toLowerCase()]), ['get_account', address.toLowerCase()], { revalidate: REVALIDATE, tags: [tags.all, tags.account(address)] })();
}

export function listHypotheses(boardId = 0): Promise<Listing> {
  return unstable_cache(() => view<Listing>('list_hypotheses', [boardId]), ['list_hypotheses', String(boardId)], { revalidate: REVALIDATE, tags: [tags.all, ...(boardId ? [tags.board(boardId)] : [])] })();
}

/** The board shown on the landing wall: the newest one with a matrix worth showing, else the newest. */
export async function featuredBoard(): Promise<Board | null> {
  const boards = await recentBoards();
  const pick = boards.find((b) => b.pairs_tested >= 4 && b.eliminated > 0) ?? boards.find((b) => b.hypotheses > 0) ?? boards[0];
  if (!pick) return null;
  const full = await getBoard(pick.id);
  return full.found ? full : null;
}

export function readError(error: unknown): string {
  const text = String((error as Error)?.message ?? error);
  if (/-32029|rate limit/i.test(text)) return 'Studio Next is rate limiting reads right now. Wait a minute and reload.';
  return 'Studio Next did not answer this read. Reload in a moment.';
}
