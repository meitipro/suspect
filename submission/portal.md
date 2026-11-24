# Portal entry

The fields in the order the portal shows them. `python submission/count.py` counts every limited field.

## Project name

Suspect - an incident board where each cause has to survive every clue

## Project tag

Dispute Resolution

## Tag 1

Evidence Assessment

## Tag 2

Appeal Review

## Icon

`submission/suspect-icon-512.png` (512 × 512, the site's own mark, safe for a circular crop)

## One-liner

An incident board: validators test every suspected cause against every clue.

## Description

Suspect is an incident board on GenLayer. A team pins the clues from an outage or exploit and members propose causes with a bond. Validators label every cause and clue pair as explains, contradicts or silent, and the contract eliminates any cause with a contradiction and ranks the rest. When the cause is named, the bonds of eliminated causes go to whoever named it, so a postmortem tests every theory against every clue. Deployed on Studio Next on the GenVM v0.4 runtime, with golden pairs run through real consensus and published as they came out: 8 of 10, the two misses shown.

## Show it in action

Demo video: not recorded yet (`submission/demo-script.md` has the shot list).

## Write the exact path

### 1. Fund a wallet

Open suspect-genlayer.vercel.app, select Open a board in the yellow disc, then Connect wallet, Switch network (the site adds GenLayer Studio Next, chain 61997) and Get test GEN, which pays 20 test GEN from the site's faucet.

### 2. Open a board

On the All boards page, write an incident title in the Open a board card (for example API outage, 14:02 to 15:10), then select Open the board and confirm. The page of your board opens.

### 3. Pin clues

On the board, write a fact in the Pin a clue note and select Pin it, 1 GEN, then confirm. Pin two or three clues; each comes back to you when the board resolves.

### 4. Name suspects

Select Name a suspect, 3 GEN, write a cause, keep the bond at 3 and select Name the suspect and confirm. Name a second suspect, from the same wallet or another.

### 5. Test the pairs

Select The matrix, then Check on a cell and confirm. Validators are reading, then the cell shows EXPLAINS, CONTRADICTS or SILENT. A suspect with one CONTRADICTS gets the ELIMINATED stamp.

### 6. Resolve and withdraw

On the board, choose a survivor in the resolve box and select Name the cause. Then open My boards and select Withdraw. Resolving only moves balances; withdraw is the one call that pays.

## Prove the path works

### Expected verification outcome

The board page shows the clue notes, the suspect cards with their stamps and the red strings to the clues they explain, and the matrix shows every pair with its label. To confirm on chain, open a check transaction: consensus_data.leader_receipt[0] has execution_result SUCCESS and result.status return; a refusal is also ACCEPTED, so status alone proves nothing. get_board(id) returns the clues, the suspects, their statuses and the matrix. The same path ran from fresh accounts against the live site: https://github.com/meitipro/suspect/blob/main/docs/reviewer-path.studio-next.json

### Contract link

https://explorer-studio-dev.genlayer.com/address/0xCAB6b984814166181b0eA7eeB451F635C945C7de

## Send people to it

- Website: https://suspect-genlayer.vercel.app
- GitHub: https://github.com/meitipro/suspect

## Steward note

Studio Next removed GenVM v0.3, so the contract starts from the v0.4 runner instead of the one in the spec. The golden set was locked before the first run and nothing was tuned: 8 of 10, with cases 4 and 7 expected CONTRADICTS and labelled SILENT. A hypothesis that explains nothing does not lead, and a pin deposit returns to its pinner.

## Evidence

- Contract: https://explorer-studio-dev.genlayer.com/address/0xCAB6b984814166181b0eA7eeB451F635C945C7de
- Deploy: https://explorer-studio-dev.genlayer.com/tx/0x3150ac6df71e9c16407bafb771c25e2bd13c04b6330dbcb123b1f17951e9fa68
- Evaluation: https://github.com/meitipro/suspect/blob/main/eval/results.md
- Mutations, 75 of 75: https://github.com/meitipro/suspect/blob/main/docs/MUTATIONS.md
- Seed, a pair that eliminated a suspect: https://explorer-studio-dev.genlayer.com/tx/0x5532b232656d8d425b023961fa7dcce1d4649be89415e86699dd16d360ef21ac
- Seed, a board resolved: https://explorer-studio-dev.genlayer.com/tx/0x3c8ab09791b9993a3e0e6452ac218bab6117b2c493f449d64416dad3fd9846fc
- Seed, the bonds withdrawn: https://explorer-studio-dev.genlayer.com/tx/0x800d341db0214d362070042cf927c69dcd2a4a61e2d5617d4138103bcfd2f532
- Reviewer path on the live site: https://github.com/meitipro/suspect/blob/main/docs/reviewer-path.studio-next.json
