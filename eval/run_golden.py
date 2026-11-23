#!/usr/bin/env python3
"""
Run the golden pairs through the deployed Suspect contract on Studio Next,
through real consensus, and publish what came out.

    python eval/run_golden.py --lock       # hash and timestamp eval/golden.json, once, before the first run
    python eval/run_golden.py              # the ten golden pairs
    python eval/run_golden.py H1 H2 H3     # the held-out pairs, once
    python eval/run_golden.py --report     # rewrite results.md from results.json

eval/golden.json was written, hashed and timestamped before the first run, and
this script refuses to run if it has changed since. Each case gets its own board
so it varies exactly one thing, the pair: golden_owner opens the board and pins
the observation, golden_author proposes the hypothesis with a 3 GEN bond, and
golden_judge calls check. The label is read back from the contract with
get_hypothesis, not from this script's memory. Every step is saved before
anything is printed, so a run can stop at any point and resume without sending
anything twice. H1 to H3 are held out: run once, reported as they came out.
A check whose round produced no label (the committee could not agree) may be
sent again, and every attempt stays in the record. A case that produced a label
is never sent again, whatever the label was.
"""

from __future__ import annotations

import ast
import datetime
import hashlib
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "scripts"))

import chain as C  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = pathlib.Path(__file__).resolve().parent
GOLDEN, LOCK, RESULTS, REPORT = HERE / "golden.json", HERE / "golden.lock.json", HERE / "results.json", HERE / "results.md"
OWNER, AUTHOR, JUDGE = "golden_owner", "golden_author", "golden_judge"


def judge_sha() -> str:
    tree = ast.parse(C.CONTRACT_FILE.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign) and ast.unparse(node.targets[0]) == "JUDGE":
            return hashlib.sha256(ast.literal_eval(node.value).encode("utf-8")).hexdigest()
    raise SystemExit("no JUDGE constant")


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_results() -> dict:
    return json.loads(RESULTS.read_text(encoding="utf-8")) if RESULTS.exists() else {"cases": {}, "attempts": []}


def save(results: dict) -> None:
    RESULTS.write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def finished(results: dict, case_id: str) -> bool:
    return any(a["case"] == case_id and a.get("label") for a in results["attempts"])


def must(outcome: dict, what: str) -> dict:
    if not outcome["ok"]:
        raise SystemExit(f"{what} failed: {outcome['detail']}  {C.EXPLORER}/tx/{outcome['hash']}")
    return outcome


def matches(a: dict) -> bool:
    return bool(a.get("label")) if a["expected"] == "EITHER" else a.get("label") == a["expected"]


def lock() -> None:
    if LOCK.exists():
        raise SystemExit("eval/golden.lock.json already exists; the golden set is locked once")
    LOCK.write_text(json.dumps({"file": "eval/golden.json", "sha256": C.sha256_file(GOLDEN), "locked_at": now_iso()}, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"locked eval/golden.json  sha256 {C.sha256_file(GOLDEN)}")


def run_case(case: dict, results: dict, address: str, owner: C.Chain, author: C.Chain, judge: C.Chain, reader: C.Chain) -> None:
    cid = case["id"]
    row = results["cases"].setdefault(cid, {})
    if "board_id" not in row:
        outcome = must(owner.send(address, "open_board", [f"Golden pair {cid}"]), f"open_board for case {cid}")
        row.update({"board_tx": outcome["hash"], "board_id": int(outcome["result"])})
        save(results)
        print(f"  board {row['board_id']}  {C.EXPLORER}/tx/{outcome['hash']}")
    if "observation_id" not in row:
        outcome = must(owner.send(address, "add_observation", [row["board_id"], case["observation"]], value=C.GEN), f"add_observation for case {cid}")
        row.update({"observation_tx": outcome["hash"], "observation_id": int(outcome["result"])})
        save(results)
    if "hypothesis_id" not in row:
        outcome = must(author.send(address, "propose", [row["board_id"], case["hypothesis"]], value=3 * C.GEN), f"propose for case {cid}")
        row.update({"hypothesis_tx": outcome["hash"], "hypothesis_id": int(outcome["result"])})
        save(results)
    attempt = {"case": cid, "attempt": sum(1 for a in results["attempts"] if a["case"] == cid) + 1, "held_out": bool(case.get("held_out")), "expected": case["expected"], "hypothesis_id": row["hypothesis_id"], "observation_id": row["observation_id"]}
    outcome = judge.send(address, "check", [row["hypothesis_id"], row["observation_id"]])
    attempt.update({"tx": outcome["hash"], "sent_at": now_iso(), "consensus": "decided" if outcome["ok"] else outcome["detail"]})
    read = reader.read_json(address, "get_hypothesis", [row["hypothesis_id"]])
    label = next((x for x in read.get("labels", []) if x), "")
    if label:
        attempt.update({"label": label, "status": read["status"]})
    results["attempts"].append(attempt)
    save(results)
    print(f"  {'MATCH' if matches(attempt) else 'MISS '} {attempt.get('label') or 'no label: ' + attempt['consensus']} -> {attempt.get('status', '')}")
    print(f"  {C.EXPLORER}/tx/{attempt['tx']}")


def run(ids: list[str]) -> None:
    lock_data = json.loads(LOCK.read_text(encoding="utf-8"))
    if C.sha256_file(GOLDEN) != lock_data["sha256"]:
        raise SystemExit("eval/golden.json changed after it was locked; the golden set is not edited after the first run")
    golden = json.loads(GOLDEN.read_text(encoding="utf-8"))
    address = C.address()
    people = C.accounts(OWNER, AUTHOR, JUDGE)
    owner, author, judge, reader = C.Chain(people[OWNER]), C.Chain(people[AUTHOR]), C.Chain(people[JUDGE]), C.Chain()
    results = load_results()
    results.update({"contract": address, "contract_sha256": C.deployment().get("suspect_sha256"), "golden_sha256": lock_data["sha256"], "golden_locked_at": lock_data["locked_at"], "judge_sha256": judge_sha(), "network": C.NETWORK, "explorer": C.EXPLORER, "owner": people[OWNER].address})
    save(results)
    wanted = ids or [c["id"] for c in golden["cases"] if not c.get("held_out")]
    todo = [c for c in golden["cases"] if c["id"] in wanted and not finished(results, c["id"])]
    if todo:
        owner.ensure(people[OWNER].address, minimum_gen=40)
        author.ensure(people[AUTHOR].address, minimum_gen=60)
        judge.ensure(people[JUDGE].address, minimum_gen=20)
    for case in todo:
        print(f"\n{case['id']} {case['title']} (expected {case['expected']})")
        run_case(case, results, address, owner, author, judge, reader)
    report()


def report() -> None:
    results = load_results()
    golden = json.loads(GOLDEN.read_text(encoding="utf-8"))
    final = {a["case"]: a for a in results["attempts"] if a.get("label")}
    scored = [a for a in final.values() if not a["held_out"]]
    hit = sum(1 for a in scored if matches(a))
    explorer = results.get("explorer", C.EXPLORER)
    contract = results.get("contract", "")
    lines = [
        "# Golden pairs, through real consensus", "",
        f"Contract [`{contract}`]({explorer}/address/{contract}) on Studio Next (chain 61997). Each case is its own board, so it varies exactly one thing, the pair: one observation pinned for 1 GEN, one hypothesis proposed with a 3 GEN bond, and one `check` transaction asked the validators. The label is read back from the contract with `get_hypothesis`, not from the script's memory. Cases are scored on the one label, the only thing validators compare; elimination and ranking are what the contract derives from it.", "",
        f"- Golden set: **{hit} of {len(scored)}** matched.",
        f"- Held-out pairs: **{sum(1 for a in final.values() if a['held_out'])} run**, labels exactly as they came out (H1 to H3 have no expected answer, so any label counts as a run, and none is scored).",
        f"- `eval/golden.json` sha256 `{results.get('golden_sha256', '')}`, locked at {results.get('golden_locked_at', '')}, before the first run.",
        f"- Judge prompt sha256 `{results.get('judge_sha256', '')}`.", "",
        "Nothing here was tuned. The prompt is the spec's, word for word, and no case was edited after the lock.", "",
        "| Case | What it tests | Hypothesis | Observation | Expected | Got | Status | Transaction |", "|---|---|---|---|---|---|---|---|",
    ]
    for case in golden["cases"]:
        a = final.get(case["id"])
        tag = case["id"] + (" (held out)" if case.get("held_out") else "")
        cells = f"| {tag} | {case['title']} | {case['hypothesis']} | {case['observation']} | {case['expected']} |"
        if not a:
            lines.append(cells + " not run yet | | |")
            continue
        mark = "" if case["expected"] == "EITHER" else (" ✓" if matches(a) else " ✗ miss")
        lines.append(f"{cells} {a['label']}{mark} | {a['status']} | [{a['tx'][:10]}…]({explorer}/tx/{a['tx']}) |")
    lines += ["", "With one clue and one hypothesis on the board, the status is the rule applied to that one pair: ELIMINATED on CONTRADICTS, LEADING on EXPLAINS, STANDING on SILENT.", "", "## Every attempt", ""]
    others = [a for a in results["attempts"] if not a.get("label")]
    lines += [f"- case {a['case']} attempt {a['attempt']}: {a['consensus'][:200]} ([tx]({explorer}/tx/{a['tx']}))" for a in others] or ["Every check produced a label on its first attempt; nothing was sent twice."]
    lines += ["", "## The boards", ""]
    for case in golden["cases"]:
        row = results.get("cases", {}).get(case["id"])
        if row and "hypothesis_tx" in row:
            lines.append(f"- case {case['id']}: board {row['board_id']} ([open]({explorer}/tx/{row['board_tx']})), observation {row['observation_id']} ([pin]({explorer}/tx/{row['observation_tx']})), hypothesis {row['hypothesis_id']} ([propose]({explorer}/tx/{row['hypothesis_tx']}))")
    lines.append("")
    REPORT.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    print(f"\nwrote eval/results.md: golden {hit}/{len(scored)}")


if __name__ == "__main__":
    if "--lock" in sys.argv:
        lock()
    elif "--report" in sys.argv:
        report()
    else:
        run([a for a in sys.argv[1:] if not a.startswith("--")])
