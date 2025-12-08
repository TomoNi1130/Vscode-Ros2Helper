import * as vscode from 'vscode';

const channel = vscode.window.createOutputChannel('ROS2 Helper');

//export は 他のモジュールからも使えるようにする型
export function logInfo(message: string , elementName: string = '') {
    const timestamp = new Date().toISOString();
    console.log(`[Ros2Helper] ${timestamp} [INFO] [${elementName}] ${message}`);
}

export function logWarn(message: string , elementName: string = '') {
    const timestamp = new Date().toISOString();
    console.warn(`[Ros2Helper] ${timestamp} [WARN] [${elementName}] ${message}`);
}

export function logError(message: string , elementName: string = '') {
    const timestamp = new Date().toISOString();
    console.error(`[Ros2Helper] ${timestamp} [ERROR] [${elementName}] ${message}`);
}

export function showLogChannel() {
    channel.show(true);//フォーカスを奪わずに表示する
}