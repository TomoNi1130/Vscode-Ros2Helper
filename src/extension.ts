// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from "path";
import { spawn } from "child_process";
import { logInfo, logWarn, logError, showLogChannel } from './logger';
import { WorkspaceResponse } from "./ws_info";

//JSON-RPCっていうらしい
//サブプロセスとしてpythonを起動

type ResponseHandler = (res: any) => void;
const pending = new Map<number, ResponseHandler>();
let LatestID = 0;

function handleMessage(msg: any) {
	switch (msg.type) {
		case "response":
			const response_handler = pending.get(msg.id);
			if (response_handler) {
				response_handler(msg.data);
				pending.delete(msg.id);
			}
			break;
		case "event":
			logInfo("event", "python callback");
			break;
		case "error":
			logError(`${msg.data}`, "python callback");
			break;
		default:
			logError("Unknown message", "python callback");
	}
}

export function activate(context: vscode.ExtensionContext) {//主要なエントリポイント
	//すべての拡張機能のセットアップ、コマンド登録、イベントリスナーの購読はここでの実行。

	const pyPath = path.join(//pythonのエントリー
		context.extensionPath,
		"python_file",
		"main.py"
	);

	const distro = process.env.ROS_DISTRO ?? "jazzy";

	const ws = vscode.workspace.workspaceFolders?.[0];
	if (!ws) {
		logError("No workspace open", "extension");
		return;
	}

	const installSetup = path.join(ws.uri.fsPath, "install", "setup.bash");

	const command =
		`source /opt/ros/${distro}/setup.bash && ` +
		`source "${installSetup}" && ` +
		`python3 "${pyPath}"`;
	// const command = `source /opt/ros/${distro}/setup.bash &&source ~/ros2_ws/install/setup.bash &&python3 "${pyPath}"`;

	const py = spawn("bash", ["-c", command], { stdio: ["pipe", "pipe", "pipe"], });

	let buffer: string = "";
	if (py.stdout && py.stderr) {
		py.stdout.on("data", (data) => {
			buffer += data.toString();
			const lines = buffer.split("\n");
			buffer = lines.pop()!;
			for (const line of lines) {
				if (!line.trim()) continue;
				const msg = JSON.parse(line);
				handleMessage(msg);
			}
		});
		py.stderr.on("data", (data) => {
			console.error("[PYTHON]", data.toString());
		});
	} else {
		logError('Failed to start Python process: stdout is null', 'extension');
	}
	py.on('error', (err) => {
		logError(`Python process error: ${err.message}`, 'extension');
	});

	showLogChannel();

	logInfo('ros2helper が 有効化されました。', 'extension');

	function send(cmd: any, onResponse: ResponseHandler, timeoutMs = 3000): void {
		if (py.stdin) {
			const id = LatestID++;
			cmd.id = id;

			pending.set(id, onResponse);
			py.stdin.write(JSON.stringify(cmd) + "\n");
			setTimeout(() => {	//3秒のタイムアウト
				if (pending.has(id)) {
					pending.delete(id);
					logWarn(`Response timeout: id=${id}`);
				}
			}, timeoutMs);
		} else {
			logError("Python process stdin is not available", 'test command');
		}
	}

	const test_command = vscode.commands.registerCommand('ros2helper.testCommand', () => {
		logInfo('Hello World コマンドが実行されました.', 'command');
		vscode.window.showInformationMessage('Hello World from ros2-helper!');//右下から出てくる.
		const ws = vscode.workspace.workspaceFolders?.[0];
		if (!ws) {
			logError("No workspace open", 'test command');
			return;
		}
		//pythonへの処理要求 例としてlist_dirsコマンド
		send({ cmd: "list_dirs", path: ws.uri.fsPath },
			(res) => { logInfo("Folders: " + res.dirs.join(", "), "python callback"); }
		);
	});

	const load_ws = vscode.commands.registerCommand('ros2helper.loadWorkspace', () => {//ワークスペースの読み込みをするコマンド
		logInfo('Load WS コマンドが実行されました', 'command');
		const ws = vscode.workspace.workspaceFolders?.[0];
		if (!ws) {
			logError("No workspace open", 'load_ws command');
			return;
		}

		send({ cmd: "load_ws", path: ws.uri.fsPath },
			(res: WorkspaceResponse) => {
				logInfo("reload成功", "python callback");
			}
		);
	});

	const show_ws_info = vscode.commands.registerCommand('ros2helper.showWSinfo', () => {//現在のワークスペス情報を表示するコマンド
		logInfo('showWorkSpaceInfo コマンドが実行されました', 'command');
		send({ cmd: 'get_ws_info' },
			(res: WorkspaceResponse) => {
				const pkgCount = Object.keys(res.pkgs).length;
				logInfo(`Loaded ${pkgCount} packages`, "python callback");

				// 各パッケージの詳細情報をログ出力
				for (const [pkgName, pkgInfo] of Object.entries(res.pkgs)) {
					logInfo(`Package: ${pkgName}`, "python callback");
					logInfo(`  Path: ${pkgInfo.path}`, "python callback");

					if (Object.keys(pkgInfo.nodes).length > 0) {
						logInfo(`  Nodes:`, "python callback");
						Object.entries(pkgInfo.nodes).forEach(([nodeName, nodeInfo]) => {
							const sourceList = nodeInfo.sources.length > 0
								? nodeInfo.sources.join(", ")
								: "no sources";
							logInfo(`    - ${nodeName} (${nodeInfo.type}): ${sourceList}`, "python callback");
						});
					}
					if (pkgInfo.launch_files.length > 0) {
						logInfo(`  Launch files: ${pkgInfo.launch_files.join(", ")}`, "python callback");
					}
				}
			}
		)
	});

	const reflesh_env = vscode.commands.registerCommand('ros2helper.refleshEnv', () => {
		logInfo('refleshコマンドを実行されました', 'command');
		send({ cmd: "refresh_environment" },
			(res) => {
				logInfo('refleshコマンドを完了', 'python callback');
			}
		)
	});

	const runNode = vscode.commands.registerCommand('ros2helper.runNode', (uri: vscode.Uri) => {
		const filePath = uri.fsPath;
		logInfo(`Starting node from: ${filePath}`, 'command');

		send({ cmd: "start_node_from_source", source_path: filePath },
			(res) => {
				if (res.success) {
					logInfo(`Started ${res.executable} from ${res.package} (PID: ${res.pid})`, "python callback");
				} else {
					logError(`Failed to start node: ${res.error}`, "python callback");
				}
			},
		);
	});

	context.subscriptions.push(test_command);
	context.subscriptions.push(load_ws);
	context.subscriptions.push(show_ws_info);
	context.subscriptions.push(reflesh_env);
	context.subscriptions.push(runNode);

	vscode.commands.executeCommand('ros2helper.loadWorkspace');
	vscode.commands.executeCommand('ros2helper.showWSinfo');
}

export function deactivate() {
	logInfo('ros2helper は 無効化されました。', 'extension');
}