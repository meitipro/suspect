import { NextResponse } from 'next/server';
import { isAddress } from 'viem';

import { getAccount, readError } from '@/lib/read';

/**
 * One account's balance, boards, hypotheses and clues, read through the site so
 * the browser spends no RPC budget of its own and the answer is cached with the rest.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = String(url.searchParams.get('address') ?? '');
  if (!isAddress(address, { strict: false })) return NextResponse.json({ error: 'Send a wallet address.' }, { status: 400 });
  try {
    const account = await getAccount(address);
    if (!account.found) return NextResponse.json({ account: { found: false, balance: '0', earned: '0', withdrawn: '0', boards: [], hypotheses: [], observations: [] } });
    return NextResponse.json({ account });
  } catch (error) {
    return NextResponse.json({ error: readError(error) }, { status: 502 });
  }
}
