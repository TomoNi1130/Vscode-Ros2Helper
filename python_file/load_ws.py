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
        nodes = {}  # ノード名をキー、ソースファイルのリストを値とする辞書に変更
        cmake_file = pkg_dir / "CMakeLists.txt"
        if cmake_file.exists():
            try:
                cmake_content = cmake_file.read_text()
                
                # add_executable()からノード名とソースファイルを抽出
                # 例: add_executable(node_name src/node.cpp src/utils.cpp)
                executable_pattern = r'add_executable\s*\(\s*(\w+)\s+((?:[^\)]+))\)'
                for match in re.finditer(executable_pattern, cmake_content, re.MULTILINE | re.DOTALL):
                    node_name = match.group(1)
                    sources_str = match.group(2)
                    
                    # ソースファイルのパスを抽出（.cpp, .cc, .cxxファイル）
                    source_files = re.findall(r'[\w/.]+\.(?:cpp|cc|cxx)', sources_str)
                    
                    if source_files:
                        nodes[node_name] = {
                            "type": "executable",
                            "sources": source_files
                        }
                
                # rclcpp_components_register_node()からも抽出
                # この場合、対応するソースファイルはadd_library()から推測
                component_pattern = r'rclcpp_components_register_node\s*\(\s*(\w+)\s+PLUGIN\s+"[^"]*::(\w+)"'
                components = re.findall(component_pattern, cmake_content)
                
                # ライブラリ名とソースファイルのマッピングを作成
                library_sources = {}
                library_pattern = r'add_library\s*\(\s*(\w+)\s+((?:[^\)]+))\)'
                for match in re.finditer(library_pattern, cmake_content, re.MULTILINE | re.DOTALL):
                    lib_name = match.group(1)
                    sources_str = match.group(2)
                    source_files = re.findall(r'[\w/.]+\.(?:cpp|cc|cxx)', sources_str)
                    if source_files:
                        library_sources[lib_name] = source_files
                
                # コンポーネントノードをマッピング
                for lib_name, class_name in components:
                    if lib_name in library_sources:
                        nodes[class_name] = {
                            "type": "component",
                            "sources": library_sources[lib_name]
                        }
                    else:
                        nodes[class_name] = {
                            "type": "component",
                            "sources": []
                        }
                
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
            "nodes": nodes,  # 辞書形式に変更
            "launch_files": launch_files,
        }
    
    # TypeScript側にも返す
    return workspace_data