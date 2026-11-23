/**
 * Quickstart: open a board, pin a clue, name a suspect, test the pair, read the board.
 *
 *   PRIVATE_KEY=0x... node examples/quickstart.mjs
 *
 * The account needs test GEN on Studio Next. Reads need no account at all.
 */
import { createAccount, createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import { parseEther } from "viem";

const SUSPECT = "0xCAB6b984814166181b0eA7eeB451F635C945C7de";
const chain = { ...studioDevnet, id: 61997, rpcUrls: { default: { http: ["https://studio-next.genlayer.com/api"] } } };
const client = createClient({ chain, account: createAccount(process.env.PRIVATE_KEY) });

// Every write on Studio Next carries a fee deposit. check() runs the model, so it gets 3 rotations.
async function send(functionName, args, value = 0n, rotations = 1) {
  const estimate = await client.estimateTransactionFees({
    leaderTimeunitsAllocation: 600,
    validatorTimeunitsAllocation: 600,
    totalMessageFees: 0,
    rotations: [rotations],
  });
  const fees = { distribution: estimate.distribution, feeValue: estimate.feeValue };
  const hash = await client.writeContract({ address: SUSPECT, functionName, args, value, fees });
  return client.waitForTransactionReceipt({ hash, waitUntil: "decided", interval: 4000, retries: 120 });
}

const read = async (functionName, args) => JSON.parse(await client.readContract({ address: SUSPECT, functionName, args }));

// --- step: board
await send("open_board", ["API outage, 14:02 to 15:10"]);
const newest = (await read("get_board", [""])).boards[0].id;

// --- step: pin
await send("add_observation", [newest, "CPU stayed flat and traffic was normal."], parseEther("1"));

// --- step: propose
await send("propose", [newest, "A traffic spike from one region."], parseEther("3"));

// --- step: check
const board = await read("get_board", [String(newest)]);
const hypothesis = board.hypothesis_rows[0].id;
const observation = board.observation_rows[0].id;
await send("check", [hypothesis, observation], 0n, 3);

// --- step: read
const after = await read("get_hypothesis", [hypothesis]);
console.log(after.status, after.labels, after.killed_by_text);
