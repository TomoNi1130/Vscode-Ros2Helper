
from load_ws import load_ws
from ws_info import get_workspace
from launch_processes import process_manager

COMMAND_TABLE = {
    "load_ws": load_ws,
    "get_ws_info": get_workspace,
    "start_node": process_manager.start_node,
    "start_node_from_source": process_manager.start_node_from_source,
    "start_launch": process_manager.start_launch,
    "stop_process": process_manager.stop_process,
    "list_processes": process_manager.list_processes,
}

def dispatch(req: dict):
    cmd = req.get("cmd")
    if cmd not in COMMAND_TABLE:
        raise ValueError(f"Unknown command: {cmd}")

    return COMMAND_TABLE[cmd](req)