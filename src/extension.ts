// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import { execFile, spawn } from "child_process";
import { logInfo, logWarn, logError, showLogChannel } from './logger';

//JSON-RPCっていうらしい
//サブプロセスとしてpythonを起動

interface PythonResponse {
	status: string;
	logs: Array<{ level: string; message: string; source: string }>;
	result: { [key: string]: any };
}

export function activate(context: vscode.ExtensionContext) {//主要なエントリポイント
	//すべての拡張機能のセットアップ、コマンド登録、イベントリスナーの購読はここでの実行。
	showLogChannel();
	logInfo('ros2helper が 有効化されました。', 'extension');
	const test_command = vscode.commands.registerCommand('ros2helper.testCommand', () => {
		logInfo('Hello World コマンドが実行されました.', 'command');
		vscode.window.showInformationMessage('Hello World from ros2-helper!');//右下から出てくる.
	});

	context.subscriptions.push(test_command);
}

export function deactivate() {
	logInfo('ros2helper は 無効化されました。', 'extension');
}