# Suspect

**An incident board where each cause has to survive every clue.**

Suspect is an incident investigation board on [GenLayer](https://www.genlayer.com). A team pins up to six observations from an outage, exploit or failed launch. Members propose up to six hypotheses for the cause, each with a bond. Validators check every hypothesis against every observation and label the pair EXPLAINS, CONTRADICTS or SILENT. A hypothesis with a single contradiction is eliminated, the survivors are ranked by how much they explain, and when the cause is named the bonds of the eliminated hypotheses go to whoever named it.

One contract (`contracts/suspect.py`, ten methods), a Next.js corkboard site with a `/docs` section, deployed on **GenLayer Studio Next** (chain 61997) on the **GenVM v0.4** runtime. The build spec is the source of truth; where this build departs from it, [Honest departures](#honest-departures) says so.

| | |
|---|---|
| Live site | https://suspect-genlayer.vercel.app |
| Network | GenLayer Studio Next, chain 61997 |
| Contract | [`0xCAB6b984814166181b0eA7eeB451F635C945C7de`](https://explorer-studio-dev.genlayer.com/address/0xCAB6b984814166181b0eA7eeB451F635C945C7de) |
| Deploy transaction | [`0x3150ac6d…`](https://explorer-studio-dev.genlayer.com/tx/0x3150ac6df71e9c16407bafb771c25e2bd13c04b6330dbcb123b1f17951e9fa68) |
| Source sha256 | `8b656a2126206ce20792179c8cdfd94ce3fad3a462ce254678c275f7d92ffdff` (held to the deployed bytes by `scripts/verify.py`) |
| Golden pairs through real consensus | **8 of 10**, the two misses published, nothing tuned ([`eval/results.md`](eval/results.md)) |
| Held-out pairs | H1, H2 and H3 all `EXPLAINS`, as they came out |
| Tests | 172 passing, offline |
| Mutations | 75 defences broken one at a time, 75 caught ([`docs/MUTATIONS.md`](docs/MUTATIONS.md)) |

## How it works

1. **Open.** A team opens a board with a title (at most 80 characters). It has a 7 day window to resolve.
2. **Pin.** Anyone pins an observation (one line, at most 200 characters) for 1 GEN, up to six. A clue cannot be edited or removed, and the 1 GEN comes back to whoever pinned it when the board resolves.
3. **Name.** Members propose hypotheses with a bond of at least 3 GEN, up to six per board and two per author.
4. **Test.** Anyone asks the validators to label one hypothesis and one observation pair, once per pair. At most 36 pairs per board.
5. **Resolve.** The owner names the cause among the survivors. The bonds of the eliminated hypotheses go to its author, every other bond returns.

| Status | Rule, computed in code from the labels |
|---|---|
| ELIMINATED | at least one pair is CONTRADICTS |
| UNCHECKED | no contradiction, and some pair is not tested yet |
| LEADING | no contradiction, every clue tested, the most EXPLAINS among the fully tested survivors (ties share it) |
| STANDING | no contradiction, every clue tested, fewer EXPLAINS than the leader |

Money moves only in `withdraw()`, a top-level transfer to the caller. `check`, `resolve` and `lock_board` only move balances. A test asserts after every step that `received == held + owed + paid`.

## The ten methods

`open_board`, `add_observation` (payable), `propose` (payable), `check`, `resolve`, `lock_board`, `withdraw`, `get_board`, `get_hypothesis`, `list_hypotheses`. The reference in the docs is generated from the source, so a method cannot exist in code and be missing there.

## What came out of the validators

Ten golden pairs, each on its own board, through the deployed contract: **8 matched**. Cases 4 ("The 13:00 deploy broke the API" against "Failed at 14:02, no errors for the first hour") and 7 ("A bad config" against "Config unchanged for a year, nothing else changed") were expected CONTRADICTS and came out SILENT. They are published as they came out; the prompt, the spec's word for word, was not touched. The held-out pairs were written before the first run, run once, and were never used to tune anything.

The seed ([`docs/seed.studio-next.json`](docs/seed.studio-next.json)) put three real boards on chain: Incident 14, the spec's outage with all 16 pairs labelled, resolved on the leading cause with the three eliminated bonds credited to its author and withdrawn; one board left OPEN with suspects UNCHECKED; and one LOCKED. A board in the "expired" state cannot be seeded, because its window is 7 days.

## Honest departures

- **The runtime header.** The spec names `py-genlayer:5jycge4q…`. Studio Next has since removed GenVM v0.3 and requires v0.4, so the contract starts from `# v0.4.0` and the v0.4 runner `py-genlayer:kzybg95x…`, checked with the network's own `gen_getContractSchemaForCode`. The installed `genvm-lint` does not know that runner, so `scripts/deploy.py` and `scripts/verify.py` lint the same bytes with the header swapped, and the live runtime's verdict is the authority.
- **A hypothesis that explains nothing does not lead.** The spec says ties share LEADING; here LEADING also needs at least one EXPLAINS, so a board where every pair is SILENT has no leader.
- **UNCHECKED when there is no clue.** A hypothesis on a board with no observation yet is UNCHECKED, not vacuously tested.
- **Pin deposits come back.** The spec prices a pin at 1 GEN without saying where it goes. Here it is a deposit returned to the pinner on resolve, so the only price of an investigation is a bond.
- **Resolving with no cause.** After the window, with no LEADING hypothesis, anyone may call `resolve(board, 0)` and every bond returns, so a board cannot be stuck.
- **Checks stop at resolve.** A resolved board takes no more checks.
- **Rank among fully tested survivors.** UNCHECKED hypotheses do not set the bar for LEADING.

## Run it

```bash
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt    # genlayer-py 0.19.0rc2
.venv/Scripts/python -m pytest                       # 172 offline tests
.venv/Scripts/python scripts/mutate.py               # 75 mutants, each must be caught
.venv/Scripts/python scripts/deploy.py --check       # lint and validate against the live runtime
.venv/Scripts/python scripts/verify.py               # the deployed bytes equal this repository
.venv/Scripts/python eval/run_golden.py              # the golden pairs through real consensus
cd web && npm ci && npm run dev                      # the site on :3211
```

Test keys live only in `~/.suspect/accounts.json`, outside the repository, and nothing prints a key.

## Layout

```
contracts/suspect.py     one contract, the judge prompt pinned inside
tests/                   direct tests (judge mocked), static tests, the GenVM double
eval/                    golden.json (locked before the first run), run_golden.py, results
scripts/                 chain.py, deploy.py, verify.py, mutate.py, seed.py, gen_docs.py
web/app/                 the corkboard pages and /docs (Fumadocs)
web/content/docs/        the docs; the reference pages are generated from the contract
submission/              portal text, X post, demo script, 512 px icon
```
