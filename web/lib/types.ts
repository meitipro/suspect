/** What the contract's views answer. Money is a decimal string of wei; times are chain seconds. */

export type Label = 'EXPLAINS' | 'CONTRADICTS' | 'SILENT';
export type Cell = Label | '';
export type Status = 'LEADING' | 'STANDING' | 'UNCHECKED' | 'ELIMINATED';
export type BoardState = 'OPEN' | 'LOCKED' | 'RESOLVED';

export type Totals = { boards: number; observations: number; hypotheses: number; received: string; held: string; owed: string; paid: string };
export type NotFound = { found: false; totals: Totals; boards?: BoardRow[] };

export type BoardRow = {
  id: number;
  owner: string;
  title: string;
  state: BoardState;
  created_at: number;
  resolve_by: number;
  observations: number;
  hypotheses: number;
  pairs_tested: number;
  pairs_total: number;
  held: string;
  chosen: number;
  resolved_at: number;
  resolved_by: string;
  leading: number;
  standing: number;
  unchecked: number;
  eliminated: number;
};

export type ObsRow = { id: number; board_id: number; idx: number; author: string; text: string; deposit: string; created_at: number };

export type HypRow = {
  id: number;
  board_id: number;
  idx: number;
  author: string;
  text: string;
  bond: string;
  status: Status;
  explains: number;
  contradicts: number;
  silent: number;
  tested: number;
  labels: Cell[];
  killed_by: number;
  killed_by_idx: number;
  killed_by_text: string;
  created_at: number;
};

export type Board = BoardRow & {
  found: true;
  observation_rows: ObsRow[];
  hypothesis_rows: HypRow[];
  matrix: Cell[][];
  totals: Totals;
};

export type Hypothesis = HypRow & {
  found: true;
  observation_rows: ObsRow[];
  rank: number;
  board_title: string;
  board_state: BoardState;
  chosen: boolean;
  totals: Totals;
};

export type Listing = { found: boolean; board_id: number; items: (HypRow & { board_title?: string })[]; totals: Totals };

export type Account = {
  found: true;
  account: string;
  balance: string;
  earned: string;
  withdrawn: string;
  boards: BoardRow[];
  hypotheses: (HypRow & { board_title: string; board_state: BoardState; chosen: boolean })[];
  observations: (ObsRow & { board_title: string; board_state: BoardState })[];
  totals: Totals;
};
