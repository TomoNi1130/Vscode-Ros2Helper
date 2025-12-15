// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import { execFile } from "child_process";
import { logInfo, logWarn, logError, showLogChannel } from './logger';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {//主要なエントリポイント
	//すべての拡張機能のセットアップ、コマンド登録、イベントリスナーの購読はここでの実行。

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	showLogChannel();
	logInfo('ros2helper が 有効化されました。', 'extension');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const test_disposable = vscode.commands.registerCommand('ros2helper.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		logInfo('Hello World コマンドが実行されました.', 'command');
		vscode.window.showInformationMessage('Hello World from ros2-helper!');//右下から出てくる.
	});

	const colcon_disposable = vscode.commands.registerCommand('ros2helper.colconBuild', () => {//ワークスペース全体のcolconビルド
		logInfo('ワークスペース全体に対する Colcon Build コマンドが実行されました.', 'command');
		// ワークスペースのルートディレクトリを取得
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			logWarn("ワークスペースが開かれていません", "command");
			vscode.window.showErrorMessage('ワークスペースが開かれていません。');
			return;
		}
		// 新しいターミナルを作成
		const terminal = vscode.window.createTerminal('ROS2 Build');
		terminal.show();
		// ワークスペースに移動して colcon build を実行しターミナルを閉じる.
		terminal.sendText(`cd "${workspaceFolder.uri.fsPath}" && colcon build; exit`);
	});

	const specific_colocn_disposable = vscode.commands.registerCommand('ros2helper.specificColonBuild', (uri: vscode.Uri) => {
		logInfo(`パス:${uri}に対して Colon Build コマンドが実行されました`, 'command');
		const packageName: string = path.basename(uri.fsPath);
		//camke,package.xmlがあるかどうか調べる
		let targetPath = uri.fsPath;
		const cmakePath = path.join(targetPath, "CMakeLists.txt");
		const packageXmlPath = path.join(targetPath, "package.xml");
		if (fs.existsSync(cmakePath) && fs.existsSync(packageXmlPath)) {
			// ワークスペースのルートディレクトリを取得
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) {
				logWarn("ワークスペースが開かれていません", "command");
				vscode.window.showErrorMessage('ワークスペースが開かれていません。');
				return;
			}
			const terminal = vscode.window.createTerminal('Specific colcon build');
			terminal.show();
			terminal.sendText(`cd "${workspaceFolder.uri.fsPath}" && colcon build --packages-select ${packageName}; exit`);
		} else {
			logWarn(`CMake,package.xmlが見つかりませんでした`, 'command');
			vscode.window.showWarningMessage('パッケージを選択してください');
		}
	});

	const launch_disposable = vscode.commands.registerCommand('ros2helper.launch', (uri: vscode.Uri) => {
		//特定ファイルのlaunchコマンド //uriは選択されたファイルのパス
		// const LaunchFineName: string = path.basename(uri.fsPath);
		logInfo(`パス:${uri}に対して Launch コマンドが実行されました','command`);
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			logWarn("ワークスペースが開かれていません", "command");
			vscode.window.showErrorMessage('ワークスペースが開かれていません。');
			return;
		}
		//選択されたファイルをlaunchで起動
		const path = uri.fsPath;
		vscode.window.showInformationMessage(path);
	});

	const python_test = vscode.commands.registerCommand('ros2helper.pythonTest', () => {//pythonの起動
		const test_msg = { msg: "パンナコッタ" };
		const pythonPath: string = path.join(__dirname, '..', 'python_file', 'log_maker.py');
		execFile("python3", [pythonPath, JSON.stringify(test_msg)], (err, stdout, stderr) => {
			if (err) {
				logError(`python error ${err}`, 'python');
			} else if (stdout || stderr) {
				logInfo('正常に終了', 'python');
			}
		});
	});

	context.subscriptions.push(test_disposable);
	context.subscriptions.push(colcon_disposable);
	context.subscriptions.push(specific_colocn_disposable);
	context.subscriptions.push(launch_disposable);
	context.subscriptions.push(python_test);
	//↑拡張機能が無効化されたときに自動で解除するために管理リストへ登録
}

// This method is called when your extension is deactivated
export function deactivate() {
	logInfo('ros2helper は 無効化されました。', 'extension');
}
