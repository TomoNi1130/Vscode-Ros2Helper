import sys
import json
from pathlib import Path

# for line in sys.stdin:
#     req = json.loads(line)

#     if req["cmd"] == "list_dirs":
def readup_ws(req: dict):
    workspace = Path(req["path"])
    # 直下の「フォルダのみ」を取得
    dirs = [
        p.name
        for p in workspace.iterdir()
        if p.is_dir()
    ]
    res = {"dirs": dirs}
    return res
    # print(json.dumps(res), flush=True)
    # print(json.dumps({"type": "response","id": req["id"],"data": {"dirs": dirs}}),flush=True)