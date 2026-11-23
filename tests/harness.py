"""
Loads the REAL contract file against the doubles in genvm_double.py.

Nothing is copied or re-implemented here, so a change to contracts/suspect.py is
a change to what these tests exercise.
"""

from __future__ import annotations

import datetime
import importlib.util
import json
import os
import pathlib
import sys
import types

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
#: SUSPECT_CONTRACT points the suite at a mutant; scripts/mutate.py sets it.
CONTRACT = pathlib.Path(os.environ.get("SUSPECT_CONTRACT") or ROOT / "contracts" / "suspect.py")

sys.path.insert(0, str(HERE))

import genvm_double as D  # noqa: E402

GEN = 10**18
HOUR = 3600
DAY = 86400
PIN = 1 * GEN
BOND = 3 * GEN
#: 2026-11-01T00:00:00Z. Every world starts here.
T0 = 1793491200

TITLE = "API outage, Incident 41"
CLUES = [
    "The API failed at 14:02 with TLS handshake errors in the logs.",
    "Database metrics were healthy throughout, no slow queries.",
    "The last deploy ran at 13:00 and had no errors for an hour.",
    "CPU stayed flat and traffic was normal.",
]
CAUSES = [
    "The TLS certificate expired at 14:00.",
    "The 13:00 deploy broke the API.",
    "The database ran out of disk.",
    "A traffic spike from one region.",
]


def _install(gl: D.GL) -> None:
    storage = types.ModuleType("genlayer.storage")
    storage.TreeMap = D.TreeMap
    storage.DynArray = D.DynArray
    storage.allow = D.allow_storage
    module = types.ModuleType("genlayer")
    module.Address = D.Address
    for name in ("u8", "u16", "u32", "u64", "u256"):
        setattr(module, name, getattr(D, name))
    for name in ("contract", "vm", "message", "public", "nondet", "evm"):
        setattr(module, name, getattr(gl, name))
    module.storage = storage
    module.__all__ = ["Address", "u8", "u16", "u32", "u64", "u256"]
    sys.modules["genlayer"] = module
    sys.modules["genlayer.storage"] = storage


def load(gl: D.GL, path: pathlib.Path | None = None, name: str = "suspect_contract") -> types.ModuleType:
    _install(gl)
    spec = importlib.util.spec_from_file_location(name, path or CONTRACT)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def answer(label: str) -> str:
    """A model answer, as the model would type it. `label` is E, C or S, or the word."""
    word = {"E": "EXPLAINS", "C": "CONTRADICTS", "S": "SILENT"}.get(label, label)
    return json.dumps({"label": word})


class World:
    """One Suspect contract and the accounts around it. Time is explicit: `at(seconds)` sets the transaction datetime."""

    OWNER = "0x" + "3e" * 20
    ANA = "0x" + "41" * 20
    BEN = "0x" + "a2" * 20
    CAL = "0x" + "c7" * 20
    STRANGER = "0x" + "d4" * 20

    def __init__(self) -> None:
        self.gl = D.GL()
        self.mod = load(self.gl)
        self.at(T0)
        self.sender(self.OWNER)
        self.c = self.mod.Suspect()

    def at(self, seconds: int) -> "World":
        self.t = int(seconds)
        stamp = datetime.datetime.fromtimestamp(self.t, datetime.timezone.utc)
        self.gl.message.raw["datetime"] = stamp.strftime("%Y-%m-%dT%H:%M:%SZ")
        return self

    def advance(self, seconds: int) -> "World":
        return self.at(self.t + seconds)

    def sender(self, address: str, value: int = 0) -> "World":
        self.gl.message.sender_address = D.Address(address)
        self.gl.message.origin_address = D.Address(address)
        self.gl.message.value = int(value)
        return self

    @property
    def leader(self) -> D.NodeWorld:
        return self.gl.nondet.leader

    @property
    def validators(self) -> list[D.NodeWorld]:
        return self.gl.nondet.validators

    # -- shorthands --------------------------------------------------------

    def board(self, title: str = TITLE, who=None) -> int:
        self.sender(who or self.OWNER)
        return int(self.c.open_board(title))

    def pin(self, bid: int = 1, text: str = CLUES[0], who=None, value: int = PIN) -> int:
        self.sender(who or self.OWNER, value)
        try:
            return int(self.c.add_observation(bid, text))
        finally:
            self.sender(who or self.OWNER)

    def propose(self, bid: int = 1, text: str = CAUSES[0], who=None, value: int = BOND) -> int:
        self.sender(who or self.ANA, value)
        try:
            return int(self.c.propose(bid, text))
        finally:
            self.sender(who or self.ANA)

    def queue(self, label: str, validator_label: str | None = None) -> None:
        self.leader.answers.append(answer(label))
        for world in self.validators:
            world.answers.append(answer(validator_label or label))

    def check(self, hid: int, oid: int, label: str | None = "E", who=None, validator_label: str | None = None) -> str:
        if label is not None:
            self.queue(label, validator_label)
        self.sender(who or self.STRANGER)
        return str(self.c.check(hid, oid))

    def lock(self, bid: int = 1, who=None) -> int:
        self.sender(who or self.OWNER)
        return int(self.c.lock_board(bid))

    def resolve(self, bid: int, hid: int, who=None) -> int:
        self.sender(who or self.OWNER)
        return int(self.c.resolve(bid, hid))

    def withdraw(self, who: str) -> int:
        self.sender(who)
        return int(self.c.withdraw())

    def get_board(self, bid=1) -> dict:
        return json.loads(self.c.get_board(str(bid)))

    def hyp(self, hid: int = 1) -> dict:
        return json.loads(self.c.get_hypothesis(hid))

    def listing(self, bid: int = 0) -> dict:
        return json.loads(self.c.list_hypotheses(bid))

    def account(self, address: str) -> dict:
        return json.loads(self.c.get_board(address))

    def totals(self) -> dict:
        return json.loads(self.c.get_board(""))["totals"]

    def balance_of(self, address: str) -> int:
        return int(self.account(address)["balance"])

    def paid_to(self, address: str) -> int:
        return sum(t.value for t in self.gl.bus.transfers if t.to.lower() == address.lower())

    def paid_out(self) -> int:
        return sum(t.value for t in self.gl.bus.transfers)

    def status(self, hid: int) -> str:
        return self.hyp(hid)["status"]

    def full_board(self) -> tuple[int, list[int], list[int]]:
        """Board 1 with four clues and four causes proposed by ANA, BEN, CAL and BEN. Returns (board, observation ids, hypothesis ids)."""
        bid = self.board()
        oids = [self.pin(bid, c) for c in CLUES]
        authors = [self.ANA, self.BEN, self.CAL, self.BEN]
        hids = [self.propose(bid, t, who=w) for t, w in zip(CAUSES, authors)]
        return bid, oids, hids


def refused(prefix: str, fn, *args, **kwargs) -> str:
    try:
        fn(*args, **kwargs)
    except D.UserError as error:
        message = str(error)
        assert message.startswith("[EXPECTED] "), f"unprefixed refusal: {message}"
        assert prefix in message, f"expected {prefix!r}, got {message!r}"
        return message
    raise AssertionError(f"expected a refusal containing {prefix!r}, nothing was raised")


def books_balance(w: World) -> None:
    """received == held + owed + paid, and the contract's own total of what was paid is what left."""
    t = w.totals()
    assert int(t["received"]) == int(t["held"]) + int(t["owed"]) + int(t["paid"]), t
    assert int(t["paid"]) == w.paid_out(), t
