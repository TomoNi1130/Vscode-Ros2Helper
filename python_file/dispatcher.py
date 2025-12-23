from readup_ws import readup_ws

#cmdからコマンドをせんたくする

COMMAND_TABLE = {
    "list_dirs": readup_ws,
}

def dispatch(req: dict):
    cmd = req.get("cmd")
    if cmd not in COMMAND_TABLE:
        raise ValueError(f"Unknown command: {cmd}")

    return COMMAND_TABLE[cmd](req)