# Handoff

Only the user can do these:

- Send the portal entry (`submission/portal.md`, counted with `python submission/count.py`). The two tags are suggestions; pick the closest in the portal's list.
- Send the X post (`submission/x-post.md`).
- Record the silent demo from `submission/demo-script.md`.
- Optional: set `OPENROUTER_API_KEY` on the Vercel project to switch on the Preview button on the Name a suspect form. It is untested here because no key was available, and it never reaches the chain.

Worth knowing:

- The runtime differs from the spec's because Studio Next removed GenVM v0.3. See the README, "Honest departures".
- The two golden misses (cases 4 and 7) are published as they came out and were not tuned.
- No board in the "expired" state is seeded: its window is 7 days.
- The seed's first read of one wallet after finality preceded the payout; the record carries both reads.
- Test keys live in `~/.suspect/accounts.json`, outside the repository. Nothing prints a key.
