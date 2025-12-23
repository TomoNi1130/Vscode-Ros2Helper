import load_ws

#ワークスペース情報関係の関数

def get_workspace(req: dict):
    """Python側に保存されたワークスペース情報を取得"""
    return load_ws.workspace_data

def get_package(req: dict):
    """特定のパッケージ情報を取得"""
    pkg_name = req.get("pkg_name")
    if pkg_name in load_ws.workspace_data["pkgs"]:
        return load_ws.workspace_data["pkgs"][pkg_name]
    return {"error": "Package not found"}

def list_packages(req: dict):
    """パッケージ名のリストを取得"""
    return {"packages": list(load_ws.workspace_data["pkgs"].keys())}