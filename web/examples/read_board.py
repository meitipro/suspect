"""
Read a board with no wallet, from Python: the clues, the suspects, their statuses and the matrix of labels.

    pip install genlayer-py==0.19.0rc2
    python examples/read_board.py 1
"""
import json
import sys

from genlayer_py import create_account, create_client
from genlayer_py.chains import studio_devnet

SUSPECT = "0xCAB6b984814166181b0eA7eeB451F635C945C7de"
studio_devnet.rpc_urls = {"default": {"http": ["https://studio-next.genlayer.com/api"]}}
# genlayer-py reads need an account; a throwaway one is enough, it signs nothing.
client = create_client(chain=studio_devnet, account=create_account())

board_id = sys.argv[1] if len(sys.argv) > 1 else "1"
board = json.loads(client.read_contract(address=SUSPECT, function_name="get_board", args=[board_id]))
if not board["found"]:
    raise SystemExit(f"no board {board_id}")
print(f"{board['title']} ({board['state']}), {board['pairs_tested']} of {board['pairs_total']} pairs tested")
for h in board["hypothesis_rows"]:
    print(f"H{h['idx']} {h['status']:<10} {' '.join(l or '-' for l in h['labels'])}  {h['text']}")
