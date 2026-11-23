/**
 * Read a board with no wallet: the clues, the suspects, their statuses and the matrix of labels.
 *
 *   node examples/read-board.mjs 1
 */
import { createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";

const SUSPECT = "0xCAB6b984814166181b0eA7eeB451F635C945C7de";
const chain = { ...studioDevnet, id: 61997, rpcUrls: { default: { http: ["https://studio-next.genlayer.com/api"] } } };
const client = createClient({ chain });

const id = process.argv[2] ?? "1";
const board = JSON.parse(await client.readContract({ address: SUSPECT, functionName: "get_board", args: [id] }));
if (!board.found) throw new Error(`no board ${id}`);
console.log(`${board.title} (${board.state}), ${board.pairs_tested} of ${board.pairs_total} pairs tested`);
for (const h of board.hypothesis_rows) {
  console.log(`H${h.idx} ${h.status.padEnd(10)} ${h.labels.map((l) => l || "-").join(" ")}  ${h.text}`);
}
