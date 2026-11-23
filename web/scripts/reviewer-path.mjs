/**
 * The reviewer's path, run from FRESH accounts through the site's own code.
 *
 *   node scripts/reviewer-path.mjs [site url]
 *
 * Three accounts are made for this run only, each funded by the site's own faucet
 * route (POST /api/faucet), then every write goes through lib/genlayer-core.mjs
 * with a stand-in EIP-1193 wallet, the same code the browser runs:
 *
 *   owner:  faucet, open a board, pin two clues (a pin of the wrong amount is refused)
 *   ana:    faucet, name a suspect with a bond (a bond under 3 GEN is refused)
 *   ben:    faucet, name a second suspect
 *   anyone: check all four pairs; the statuses are compared with the rule written again here
 *   ben:    cannot lock the board and cannot resolve it before the window
 *   owner:  names a survivor; the books add up
 *   ana:    withdraws, compared with the wallet after finality
 *
 * It also fetches every page of the site. Writes docs/reviewer-path.studio-next.json.
 * Exits 1 on the first step that fails.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseEther } from 'viem';

import { CONTRACT, outcomeOf, readClient, retried, submit, waitDecided, waitFinal, walletClient } from '../lib/genlayer-core.mjs';
import { balanceOf, ensureAccount, standinWallet } from './standin-wallet.mjs';

const SITE = (process.argv[2] ?? 'http://localhost:3211').replace(/\/$/, '');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', 'docs', 'reviewer-path.studio-next.json');
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
const OWNER = `reviewer_owner_${stamp}`;
const ANA = `reviewer_ana_${stamp}`;
const BEN = `reviewer_ben_${stamp}`;

const record = { site: SITE, contract: CONTRACT, started: new Date().toISOString(), steps: [] };
const reader = readClient();
const sent = {};

function say(step, detail = {}) {
  record.steps.push({ step, ...detail });
  console.error(`  ${step}`, JSON.stringify(detail, (k, v) => (typeof v === 'bigint' ? v.toString() : v)).slice(0, 230));
}

function fail(step, why) {
  record.failed = { step, why };
  fs.writeFileSync(OUT, JSON.stringify(record, null, 2));
  console.error(`FAILED at ${step}: ${why}`);
  process.exit(1);
}

/** One write through the site's code. With `expectRefusal` the contract must refuse, and the site's success test must say so. */
async function write(name, method, args, value = 0n, expectRefusal = false) {
  const { address, provider } = standinWallet(name);
  const client = walletClient(address, provider);
  const hash = await submit(client, { method, args, value, sender: address });
  (sent[name] ??= []).push({ hash, client });
  const outcome = outcomeOf(await waitDecided(client, hash, method));
  if (expectRefusal) {
    if (outcome.ok) fail(method, 'expected a refusal, the write succeeded');
    return { hash, outcome, client };
  }
  if (!outcome.ok) fail(method, outcome.refusal || `${outcome.status} ${outcome.execution}`);
  return { hash, outcome, client };
}

async function finalize(client, hash) {
  for (let i = 0; ; i++) {
    try {
      return await waitFinal(client, hash);
    } catch (error) {
      if (i >= 25) throw error;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

const view = async (method, args) => JSON.parse(await retried(() => reader.readContract({ address: CONTRACT, functionName: method, args }), 4));

// -- accounts and the site's faucet ------------------------------------------------------
const addrs = {};
for (const name of [OWNER, ANA, BEN]) {
  addrs[name] = ensureAccount(name);
  const before = await balanceOf(addrs[name]);
  const response = await fetch(`${SITE}/api/faucet`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: addrs[name].toLowerCase() }) });
  const body = await response.json();
  if (!response.ok) fail('faucet', `${name}: ${body.error}`);
  const after = await balanceOf(addrs[name]);
  if (after <= before) fail('faucet', `${name}: the balance did not move`);
  say('faucet', { account: name, address: addrs[name], from: before.toString(), to: after.toString(), note: 'a lowercase address, checksummed by the route' });
}

// -- the owner opens a board and pins two clues ---------------------------------------------
const opened = await write(OWNER, 'open_board', [`Reviewer path ${stamp}`]);
const bid = Number(opened.outcome.returned);
const board0 = await view('get_board', [String(bid)]);
if (board0.owner.toLowerCase() !== addrs[OWNER].toLowerCase() || board0.state !== 'OPEN') fail('open_board', 'the stored board is not what was sent');
say('open_board', { boardId: bid, hash: opened.hash, resolve_by: board0.resolve_by });

const wrongPin = await write(OWNER, 'add_observation', [bid, 'A clue.'], parseEther('2'), true);
say('pin_wrong_amount', { hash: wrongPin.hash, refusal: wrongPin.outcome.refusal, note: "refused with the contract's own sentence: accepted, but not a success" });
const CLUES = ['The API failed at 14:02 with TLS handshake errors in the logs.', 'Database metrics were healthy throughout, no slow queries.'];
const oids = [];
for (const clue of CLUES) {
  const pinned = await write(OWNER, 'add_observation', [bid, clue], parseEther('1'));
  oids.push(Number(pinned.outcome.returned));
  say('pin', { observationId: oids.at(-1), hash: pinned.hash });
}

// -- two suspects, with bonds -------------------------------------------------------------------
const lowBond = await write(ANA, 'propose', [bid, 'The TLS certificate expired at 14:00.'], parseEther('2'), true);
say('propose_low_bond', { hash: lowBond.hash, refusal: lowBond.outcome.refusal });
const h1 = await write(ANA, 'propose', [bid, 'The TLS certificate expired at 14:00.'], parseEther('3'));
const h2 = await write(BEN, 'propose', [bid, 'The database ran out of disk.'], parseEther('3'));
const hids = [Number(h1.outcome.returned), Number(h2.outcome.returned)];
say('propose', { hypothesisIds: hids, hashes: [h1.hash, h2.hash] });

// -- test all four pairs, by whoever asks ------------------------------------------------------------
const labels = [[], []];
for (let hi = 0; hi < 2; hi++) {
  for (let oi = 0; oi < 2; oi++) {
    const checked = await write(OWNER, 'check', [hids[hi], oids[oi]]);
    labels[hi][oi] = String(checked.outcome.returned).replace(/"/g, '');
    say('check', { hypothesis: hids[hi], observation: oids[oi], label: labels[hi][oi], hash: checked.hash });
  }
}
const board1 = await view('get_board', [String(bid)]);
const reference = labels.map((row) => (row.includes('CONTRADICTS') ? 'ELIMINATED' : null));
const best = Math.max(0, ...labels.filter((r) => !r.includes('CONTRADICTS')).map((r) => r.filter((l) => l === 'EXPLAINS').length));
labels.forEach((row, i) => {
  if (reference[i]) return;
  const e = row.filter((l) => l === 'EXPLAINS').length;
  reference[i] = best >= 1 && e === best ? 'LEADING' : 'STANDING';
});
const got = board1.hypothesis_rows.map((h) => h.status);
if (JSON.stringify(got) !== JSON.stringify(reference)) fail('rank', `the contract says ${got}, the rule says ${reference}`);
if (board1.pairs_tested !== 4) fail('check', 'not every pair was labelled');
say('rank', { statuses: got, note: 'the statuses are what the rule of the spec gives for the labels the validators agreed on' });
const repeated = await write(OWNER, 'check', [hids[0], oids[0]], 0n, true);
say('check_again', { hash: repeated.hash, refusal: repeated.outcome.refusal });

// -- the wrong accounts, then the owner names a survivor ----------------------------------------------------
const lock = await write(BEN, 'lock_board', [bid], 0n, true);
say('lock_by_the_wrong_account', { hash: lock.hash, refusal: lock.outcome.refusal });
const survivors = board1.hypothesis_rows.filter((h) => h.status !== 'ELIMINATED');
if (survivors.length === 0) fail('resolve', 'every suspect was eliminated, nothing to name');
const early = await write(BEN, 'resolve', [bid, survivors[0].id], 0n, true);
say('resolve_before_the_window', { hash: early.hash, refusal: early.outcome.refusal });
const chosen = survivors.find((h) => h.status === 'LEADING') ?? survivors[0];
const resolved = await write(OWNER, 'resolve', [bid, chosen.id]);
const board2 = await view('get_board', [String(bid)]);
if (board2.state !== 'RESOLVED' || board2.chosen !== chosen.id) fail('resolve', 'the board is not resolved on the cause that was named');
say('resolve', { hash: resolved.hash, chosen: chosen.id, status: chosen.status, credited: String(resolved.outcome.returned) });

const totals = (await view('get_board', [''])).totals;
const sum = BigInt(totals.held) + BigInt(totals.owed) + BigInt(totals.paid);
if (BigInt(totals.received) !== sum) fail('books', `received ${totals.received} is not ${sum}`);
say('books', { ...totals, note: 'received = held + owed + paid' });

// -- the chosen author withdraws, after finality ----------------------------------------------------------------------
const winner = board2.hypothesis_rows.find((h) => h.id === chosen.id).author.toLowerCase();
const winnerName = winner === addrs[ANA].toLowerCase() ? ANA : winner === addrs[BEN].toLowerCase() ? BEN : null;
if (!winnerName) fail('withdraw', 'the chosen author is not one of the accounts of this run');
const account = await view('get_board', [winner]);
const owed = BigInt(account.balance);
const expected = BigInt(parseEther('3')) * BigInt(1 + board2.hypothesis_rows.filter((h) => h.status === 'ELIMINATED').length);
if (owed !== expected) fail('balance', `the contract owes ${owed}, the chosen bond and the eliminated bonds are ${expected}`);
for (const { hash, client } of sent[winnerName]) await finalize(client, hash);
const walletBefore = await balanceOf(addrs[winnerName]);
const withdrawn = await write(winnerName, 'withdraw', []);
const final = await finalize(withdrawn.client, withdrawn.hash);
const walletAfter = await balanceOf(addrs[winnerName]);
const gained = walletAfter - walletBefore;
say('withdraw', { account: winnerName, hash: withdrawn.hash, owed: owed.toString(), wallet_before: walletBefore.toString(), wallet_after_finality: walletAfter.toString(), gained: gained.toString(), fee_difference: (owed - gained).toString(), final_status: outcomeOf(final).status, note: 'the wallet gains what was owed, less the fee of the withdraw transaction' });
if (gained <= 0n || gained > owed) fail('withdraw', `the wallet moved by ${gained}, which is not within what was owed (${owed})`);
if ((await view('get_board', [winner])).balance !== '0') fail('withdraw', 'the balance was not cleared');

// -- the pages --------------------------------------------------------------------------------------------------------
const pages = ['/', '/b', `/b/${bid}`, `/b/${bid}/matrix`, `/b/${bid}/propose`, '/me', '/docs', '/docs/quickstart', '/docs/concepts/elimination-and-ranking', '/docs/reference/contract', '/docs/more/evaluation', '/llms.txt'];
for (const page of pages) {
  const response = await fetch(SITE + page, { redirect: 'follow' });
  if (response.status !== 200) fail('pages', `${page} answered ${response.status}`);
}
const text = await (await fetch(`${SITE}/b/${bid}`)).text();
if (!text.includes('RESOLVED')) fail('pages', `/b/${bid} does not show RESOLVED`);
say('pages', { checked: pages.length, all: 200, board_page_shows: 'RESOLVED' });

record.finished = new Date().toISOString();
fs.writeFileSync(OUT, JSON.stringify(record, null, 2));
console.log(JSON.stringify({ ok: true, boardId: bid, statuses: got, chosen: chosen.id, steps: record.steps.length }));
