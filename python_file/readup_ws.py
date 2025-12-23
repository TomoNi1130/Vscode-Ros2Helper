from pathlib import Path

#与えられたフォルダの直下にあるフォルダを調べて一覧を返す

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