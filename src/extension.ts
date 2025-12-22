// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import { execFile, spawn } from "child_process";
import { logInfo, logWarn, logError, showLogChannel } from './logger';

//JSON-RPCっていうらしい
//サブプロセスとしてpythonを起動

type Resolver = (data: any) => void;
const pending = new Map<number, Resolver>();
let LatestID = 0;

function handleMessage(msg: any) {
	switch (msg.type) {
		case "response":
			const resolve = pending.get(msg.id);
			if (resolve) {
				resolve(msg.data);
				pending.delete(msg.id);
			}
			break;
		case "event":
			logInfo("event", "python callback");
			break;
		case "error":
			logError("error", "python callback");
			break;
		default:
			logError("Unknown message", "python callback");
	}
}

export function activate(context: vscode.ExtensionContext) {//主要なエントリポイント
	//すべての拡張機能のセットアップ、コマンド登録、イベントリスナーの購読はここでの実行。

	const pyPath = path.join(//pythonファイルの場所を指定する
		context.extensionPath,
		"python_file",
		"readup_ws.py"
	);

	const py = spawn("python3", [pyPath]);
	let buffer: string = "";
	if (py.stdout) {
		py.stdout.on("data", (data) => {
			buffer += data.toString();
			const lines = buffer.split("\n");
			buffer = lines.pop()!;
			for (const line of lines) {
				if (!line.trim()) continue;
				const msg = JSON.parse(line);
				logInfo("Folders: " + msg.dirs.join(", "), "python callback");
			}
		});
	} else {
		logError('Failed to start Python process: stdout is null', 'extension');
	}
	py.on('error', (err) => {
		logError(`Python process error: ${err.message}`, 'extension');
	});

	showLogChannel();

	logInfo('ros2helper が 有効化されました。', 'extension');

	function send(cmd: any): Promise<any> {
		const id = LatestID++;
		cmd.id = id;

		return new Promise((resolve) => {
			pending.set(id, resolve);
			py.stdin.write(JSON.stringify(cmd) + "\n");
		});
	}

	const test_command = vscode.commands.registerCommand('ros2helper.testCommand', () => {
		logInfo('Hello World コマンドが実行されました.', 'command');
		vscode.window.showInformationMessage('Hello World from ros2-helper!');//右下から出てくる.
		const ws = vscode.workspace.workspaceFolders?.[0];
		if (!ws) {
			logError("No workspace open", 'test command');
			return;
		}
		if (py.stdin) {
			logInfo('pythonファイルを起動', 'test command');
			py.stdin.write(JSON.stringify({ cmd: "list_dirs", path: ws.uri.fsPath }) + "\n");
		} else {
			logError("Python process stdin is not available", 'test command');
		}
	});

	context.subscriptions.push(test_command);
}

export function deactivate() {
	logInfo('ros2helper は 無効化されました。', 'extension');
}