import subprocess
from typing import Dict, Optional, Tuple
from pathlib import Path
import load_ws

class ProcessManager:
    """現在この拡張機能を通して起動しているノードやlaunchを管理する"""
    
    def __init__(self):
        self.processes: Dict[str, subprocess.Popen] = {}
        self.next_id = 0
    
    def find_node_by_source(self, source_path: str) -> Optional[Tuple[str, str]]:
        """
        ソースファイルのパスからパッケージ名とノード名を特定
        Returns: (package_name, node_name) or None
        """
        source_path = Path(source_path).resolve()
        
        for pkg_name, pkg_info in load_ws.workspace_data["pkgs"].items():
            pkg_path = Path(pkg_info["path"])
            
            # ソースファイルがこのパッケージ内にあるか確認
            try:
                source_path.relative_to(pkg_path)
            except ValueError:
                continue
            
            # このパッケージ内のノードを検索
            for node_name, node_info in pkg_info["nodes"].items():
                for src in node_info["sources"]:
                    src_full_path = (pkg_path / src).resolve()#ノードのソースの保存情報はsrc/*のみ
                    if src_full_path == source_path:
                        return (pkg_name, node_name)
        
        return None
    
    def start_node_from_source(self, req: dict) -> dict:
        """
        ソースファイルのパスからノードを起動
        req: {"source_path": "/path/to/src/node.cpp"}
        """
        source_path = req.get("source_path")
        if not source_path:
            return {"success": False, "error": "source_path is required"}
        
        result = self.find_node_by_source(source_path)
        if not result:
            return {"success": False, "error": f"Could not find node for source: {source_path}"}
        
        package, node_name = result
        
        return self.start_node({
            "package": package,
            "executable": node_name
        })
    
    def start_node(self, req: dict) -> dict:
        """
        ROS2ノードを起動
        req: {"package": "pkg_name", "executable": "node_name"}
        """
        proc_id = f"node_{self.next_id}"
        self.next_id += 1
        
        package = req.get("package")
        executable = req.get("executable")
        
        if not package or not executable:
            return {"success": False, "error": "package and executable are required"}
        
        #別ウィンドウを開きノードを起動
        cmd = ["gnome-terminal","--","bash","-c",f"ros2 run {package} {executable}; exec bash"]

        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            self.processes[proc_id] = proc
            return {
                "success": True,
                "id": proc_id,
                "pid": proc.pid,
                "package": package,
                "executable": executable
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def start_launch(self, req: dict) -> dict:
        """
        Launchファイルを起動
        req: {"package": "pkg_name", "launch_file": "example.launch.py", "args": [...]}
        """
        proc_id = f"launch_{self.next_id}"
        self.next_id += 1
        
        package = req.get("package")
        launch_file = req.get("launch_file")
        args = req.get("args", [])
        
        if not package or not launch_file:
            return {"success": False, "error": "package and launch_file are required"}
        
        cmd = ["ros2", "launch", package, launch_file]
        if args:
            cmd.extend(args)
        
        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            self.processes[proc_id] = proc
            return {
                "success": True,
                "id": proc_id,
                "pid": proc.pid,
                "package": package,
                "launch_file": launch_file
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def stop_process(self, req: dict) -> dict:
        """プロセスを終了"""
        proc_id = req.get("id")
        
        if not proc_id or proc_id not in self.processes:
            return {"success": False, "error": "Process not found"}
        
        proc = self.processes[proc_id]
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()
        
        del self.processes[proc_id]
        return {"success": True, "id": proc_id}
    
    def list_processes(self, req: dict) -> dict:
        """実行中のプロセス一覧"""
        procs = []
        for proc_id, proc in self.processes.items():
            procs.append({
                "id": proc_id,
                "pid": proc.pid,
                "running": proc.poll() is None
            })
        return {"processes": procs}
    
    def cleanup(self):
        """全プロセスを終了"""
        for proc_id in list(self.processes.keys()):
            self.stop_process({"id": proc_id})

# グローバルインスタンス
process_manager = ProcessManager()