#!/usr/bin/env python3
"""
Seed the deployed contract beyond the golden run, with real transactions.

    python scripts/seed.py

The golden run (eval/run_golden.py) already put thirteen one-pair boards on chain.
This script adds three real boards in the states a reader should see, saved to
docs/seed.studio-next.json before anything is printed:

  - Incident 41, the spec's outage: four clues, four suspects, all 16 pairs
    labelled by the validators, resolved, and the balances withdrawn and checked
    against the wallets after finality
  - a board that is still OPEN, with suspects left UNCHECKED and one STANDING
  - a board that is LOCKED to new suspects

The labels are whatever the validators answered; this script never chooses them,
and the cause it names on the first board is read from the chain (the LEADING
survivor, else the first survivor). A step already recorded is never sent twice.
"""

from __future__ import annotations

import datetime
import json
import pathlib
import sys
import time

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import chain as C  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
RECORD = C.ROOT / "docs" / "seed.studio-next.json"

INCIDENT = "API outage, 14:02 to 15:10"
CLUES = [
    "Failure began at 14:02, TLS handshake errors in the logs.",
    "Database healthy throughout, no slow queries.",
    "The last deploy ran at 13:00 with no errors for an hour.",
    "CPU stayed flat, traffic normal.",
]
CAUSES = [
    ("ana", "The TLS certificate expired at 14:00."),
    ("ben", "The 13:00 deploy broke the API."),
    ("cal", "The database ran out of disk."),
    ("ben", "A traffic spike from one region."),
]
OPEN_BOARD = "Checkout is slow since the launch"
OPEN_CLUES = ["Checkout p95 went from 400 ms to 2.1 s at 09:15.", "The payment provider status page shows no incident.", "The cart service was deployed at 09:10."]
OPEN_CAUSES = [("ana", "The 09:10 cart deploy added a slow query."), ("cal", "The payment provider is degraded."), ("ben", "A cache was flushed at launch.")]
OPEN_TESTS = [(0, 0), (0, 2), (1, 1), (1, 0)]
LOCKED_BOARD = "Bridge withdrawals paused at 03:40"
LOCKED_CLUES = ["The pause was triggered by the guardian multisig.", "No funds left the bridge contract."]
LOCKED_CAUSES = [("ana", "A guardian paused the bridge after an anomaly alert."), ("cal", "The bridge was drained by an exploit.")]


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def step(record: dict, key: str, chain: C.Chain, address: str, method: str, args: list, value: int = 0) -> dict:
    if key in record["steps"]:
        return record["steps"][key]
    out = chain.send(address, method, args, value=value)
    row = {"method": method, "tx": out["hash"], "ok": out["ok"], "returned": out["result"], "refusal": out["refusal"], "at": now_iso()}
    record["steps"][key] = row
    RECORD.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(f"  {key}: {'ok' if out['ok'] else 'FAILED ' + (out['refusal'] or out['detail'])}  {C.EXPLORER}/tx/{out['hash']}")
    if not out["ok"]:
        raise SystemExit(f"{key} did not succeed; nothing already recorded is sent twice.")
    return row


def main() -> int:
    address = C.address()
    names = ["seed_owner", "seed_ana", "seed_ben", "seed_cal", "seed_judge"]
    people = C.accounts(*names)
    chains = {n: C.Chain(people[n]) for n in names}
    who = {"owner": chains["seed_owner"], "ana": chains["seed_ana"], "ben": chains["seed_ben"], "cal": chains["seed_cal"], "judge": chains["seed_judge"]}
    reader = C.Chain()
    record = json.loads(RECORD.read_text(encoding="utf-8")) if RECORD.exists() else {"steps": {}}
    record.update({"contract": address, "accounts": {n: people[n].address for n in names}})
    for n in names:
        chains[n].ensure(people[n].address, minimum_gen=40)

    def board(prefix: str, title: str, clues: list[str], causes: list[tuple[str, str]]) -> tuple[int, list[int], list[int]]:
        bid = int(step(record, f"{prefix}_board", who["owner"], address, "open_board", [title])["returned"])
        oids = [int(step(record, f"{prefix}_clue_{i + 1}", who["owner"], address, "add_observation", [bid, c], C.GEN)["returned"]) for i, c in enumerate(clues)]
        hids = [int(step(record, f"{prefix}_cause_{i + 1}", who[a], address, "propose", [bid, t], 3 * C.GEN)["returned"]) for i, (a, t) in enumerate(causes)]
        return bid, oids, hids

    print("\nIncident 41, resolved")
    bid, oids, hids = board("incident", INCIDENT, CLUES, CAUSES)
    for hi, h in enumerate(hids):
        for oi, o in enumerate(oids):
            step(record, f"incident_check_h{hi + 1}_c{oi + 1}", who["judge"], address, "check", [h, o])
    view = reader.read_json(address, "get_board", [str(bid)])
    survivors = [h for h in view["hypothesis_rows"] if h["status"] != "ELIMINATED"]
    leaders = [h for h in survivors if h["status"] == "LEADING"]
    chosen = (leaders or survivors or [None])[0]
    if chosen is not None:
        step(record, "incident_resolve", who["owner"], address, "resolve", [bid, chosen["id"]])
        record["incident_chosen"] = {"hypothesis_id": chosen["id"], "status": chosen["status"], "text": chosen["text"]}
    else:
        step(record, "incident_resolve", who["owner"], address, "resolve", [bid, 0])  # only valid after the window; fails loudly otherwise

    print("\nOpen board")
    obid, ooids, ohids = board("open", OPEN_BOARD, OPEN_CLUES, OPEN_CAUSES)
    for hi, oi in OPEN_TESTS:
        step(record, f"open_check_h{hi + 1}_c{oi + 1}", who["judge"], address, "check", [ohids[hi], ooids[oi]])

    print("\nLocked board")
    lbid, loids, lhids = board("locked", LOCKED_BOARD, LOCKED_CLUES, LOCKED_CAUSES)
    step(record, "locked_check_h1_c1", who["judge"], address, "check", [lhids[0], loids[0]])
    step(record, "locked_lock", who["owner"], address, "lock_board", [lbid])

    print("\nWithdrawals")
    for name in ("seed_owner", "seed_ana", "seed_ben", "seed_cal"):
        owed = int(reader.read_json(address, "get_board", [people[name].address.lower()])["balance"])
        if owed > 0 and f"withdraw_{name}" not in record["steps"]:
            before = chains[name].balance(people[name].address)
            row = step(record, f"withdraw_{name}", chains[name], address, "withdraw", [])
            chains[name].wait(row["tx"], "finalized")
            after = C.retry("balance", chains[name].balance, people[name].address)
            for _ in range(24):  # the payout lands at finality, a moment after the receipt says so
                if after > before:
                    break
                time.sleep(5)
                after = C.retry("balance", chains[name].balance, people[name].address)
            row.update({"owed": str(owed), "balance_before": str(before), "balance_after_finality": str(after)})
            RECORD.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
            print(f"  {name}: owed {owed / C.GEN} GEN, wallet {before / C.GEN:.4f} -> {after / C.GEN:.4f} after finality")
    record["boards"] = {"incident": bid, "open": obid, "locked": lbid}
    record["finished_at"] = now_iso()
    RECORD.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    for b in (bid, obid, lbid):
        v = reader.read_json(address, "get_board", [str(b)])
        print(f"  board {b}: {v['state']}, {v['pairs_tested']} of {v['pairs_total']} pairs, {[h['status'] for h in v['hypothesis_rows']]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
