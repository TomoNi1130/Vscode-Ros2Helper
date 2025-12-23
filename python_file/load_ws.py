from pathlib import Path
import xml.etree.ElementTree as ET
import re

# グローバル変数でワークスペース情報を保持
workspace_data = {
    "path": "",
    "pkgs": {}
}

def load_ws(req: dict):
    global workspace_data
    workspace = Path(req["path"])
    
    workspace_data = {
        "path": req["path"],
        "pkgs": {}
    }
    
    # srcディレクトリ内のパッケージを探索
    src_dir = workspace / "src"
    if not src_dir.exists():
        return workspace_data
    
    # 各パッケージディレクトリを走査
    for pkg_dir in src_dir.iterdir():
        if not pkg_dir.is_dir():
            continue
        
        # package.xmlを探す
        package_xml = pkg_dir / "package.xml"
        if not package_xml.exists():
            continue
        
        # package.xmlからパッケージ名を取得
        try:
            tree = ET.parse(package_xml)
            root = tree.getroot()
            pkg_name = root.find("name").text
        except:
            pkg_name = pkg_dir.name
        
        # CMakeLists.txtからノード情報を取得
        nodes = []
        cmake_file = pkg_dir / "CMakeLists.txt"
        if cmake_file.exists():
            try:
                cmake_content = cmake_file.read_text()
                
                # add_executable()からノード名を抽出
                executable_pattern = r'add_executable\s*\(\s*(\w+)'
                executables = re.findall(executable_pattern, cmake_content)
                nodes.extend(executables)
                
                # rclcpp_components_register_node()からも抽出
                component_pattern = r'rclcpp_components_register_node\s*\(\s*\w+\s+PLUGIN\s+"[^"]*::(\w+)"'
                components = re.findall(component_pattern, cmake_content)
                nodes.extend(components)
                
            except Exception as e:
                print(f"Error reading CMakeLists.txt in {pkg_dir}: {e}")
        
        # launchファイルを探す
        launch_files = []
        launch_dir = pkg_dir / "launch"
        if launch_dir.exists():
            for launch_file in launch_dir.glob("*.launch.*"):
                launch_files.append(launch_file.name)
        
        # パッケージ情報を保存（Python側）
        workspace_data["pkgs"][pkg_name] = {
            "path": str(pkg_dir),
            "nodes": nodes,
            "launch_files": launch_files,
        }
    
    # TypeScript側にも返す
    return workspace_data

def get_workspace(req: dict):
    """Python側に保存されたワークスペース情報を取得"""
    return workspace_data

def get_package(req: dict):
    """特定のパッケージ情報を取得"""
    pkg_name = req.get("pkg_name")
    if pkg_name in workspace_data["pkgs"]:
        return workspace_data["pkgs"][pkg_name]
    return {"error": "Package not found"}

def list_packages(req: dict):
    """パッケージ名のリストを取得"""
    return {"packages": list(workspace_data["pkgs"].keys())}