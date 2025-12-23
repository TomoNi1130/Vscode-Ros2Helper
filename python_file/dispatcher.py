from readup_ws import readup_ws

COMMAND_TABLE = {
    "list_dirs": readup_ws,
    # "read_file": handle_read_file,
}

def dispatch(req: dict):
    cmd = req.get("cmd")
    if cmd not in COMMAND_TABLE:
        raise ValueError(f"Unknown command: {cmd}")

    return COMMAND_TABLE[cmd](req)