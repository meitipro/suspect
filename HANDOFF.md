# Handoff (session stopped at the usage limit)

Done: contract (10 methods, 172 tests, 75/75 mutations), deployed on Studio Next
(0xCAB6b984814166181b0eA7eeB451F635C945C7de, v0.4 runner), golden 8/10 (misses: cases 4 and 7,
published as they came out), held-out H1-H3 run once, site (corkboard, orbit header) and docs build.

Running when stopped: `python scripts/seed.py` (3 boards; resumes safely, writes docs/seed.studio-next.json/.log).

Left:
1. Wait for/rerun the seed; read the final board lines from docs/seed.studio-next.log.
2. README.md, submission/portal.md, x-post.md, demo-script.md (use `python submission/count.py`; adapt it to the new headings), TASKS.md.
3. `gh repo create meitipro/suspect --public --source . --push`, then Vercel (`npx vercel link --project suspect-genlayer`, `deploy --prod`, Skew Protection off), then `node web/scripts/reviewer-path.mjs https://suspect-genlayer.vercel.app` from web/.
4. Re-run `node web/scripts/docs-dates.mjs`, `python scripts/gen_docs.py`, commit, push.
Use D:\skim\.venv\Scripts\python.exe (genlayer-py 0.19.0rc2).
