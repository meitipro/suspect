import type { BoardState, Cell, Status } from './types';

export const STATUS_HELP: Record<Status, string> = {
  LEADING: 'No contradiction, every clue tested, and the most EXPLAINS among the fully tested survivors. Ties share it.',
  STANDING: 'No contradiction and every clue tested, but fewer EXPLAINS than the leader.',
  UNCHECKED: 'Some pairs are not tested yet. Anyone can call check on a pair.',
  ELIMINATED: 'At least one clue CONTRADICTS it. Its bond goes to the author of the chosen cause when the board resolves.',
};

export const STATE_HELP: Record<BoardState, string> = {
  OPEN: 'Clues can be pinned, causes named and pairs checked.',
  LOCKED: 'Closed to new causes. Clues can still be pinned and pairs checked.',
  RESOLVED: 'The cause is named and the bonds are settled. Balances are withdrawn with withdraw().',
};

export const MARK: Record<Cell, string> = { EXPLAINS: '+', CONTRADICTS: '×', SILENT: '·', '': '?' };
export const MARK_WORD: Record<Cell, string> = { EXPLAINS: 'Explains', CONTRADICTS: 'Contradicts', SILENT: 'Silent', '': 'Not tested' };
