"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// src/extension.ts
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const DEFAULT_CONFIG = {
    excludedDirs: ['.git', 'node_modules', 'dist', 'build'],
    excludedFiles: ['package-lock.json', 'yarn.lock'],
    includedExtensions: ['.ts', '.js', '.py', '.java', '.cpp', '.h', '.jsx', '.tsx']
};
function getConfiguration() {
    const config = vscode.workspace.getConfiguration('flash-repo');
    return {
        excludedDirs: config.get('excludedDirectories') || DEFAULT_CONFIG.excludedDirs,
        excludedFiles: config.get('excludedFiles') || DEFAULT_CONFIG.excludedFiles,
        includedExtensions: config.get('includedExtensions') || DEFAULT_CONFIG.includedExtensions
    };
}
async function findFiles(rootPath, config) {
    const files = [];
    async function walk(dir) {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const shouldExclude = config.excludedDirs.some(excludedDir => entry.name === excludedDir);
                if (!shouldExclude) {
                    await walk(fullPath);
                }
            }
            else if (entry.isFile()) {
                const isExcluded = config.excludedFiles.some(excludedFile => entry.name === excludedFile);
                const hasIncludedExtension = config.includedExtensions.some(ext => entry.name.endsWith(ext));
                if (!isExcluded && hasIncludedExtension) {
                    files.push(fullPath);
                }
            }
        }
    }
    await walk(rootPath);
    return files;
}
async function concatenateFiles(files) {
    const chunks = [];
    for (const file of files) {
        const content = await fs.promises.readFile(file, 'utf8');
        chunks.push('=== File: ' + file + ' ===\n\n' +
            content + '\n\n');
    }
    return chunks.join('');
}
async function createOutputDocument(content) {
    const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'plaintext'
    });
    await vscode.window.showTextDocument(doc, {
        preview: false,
        viewColumn: vscode.ViewColumn.Beside
    });
}
async function activate(context) {
    const disposable = vscode.commands.registerCommand('flash-repo.concatenate', async () => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('No workspace folder open');
            }
            const config = getConfiguration();
            const rootPath = workspaceFolders[0].uri.fsPath;
            const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
            statusBar.text = "$(sync~spin) Flash Repo: Processing...";
            statusBar.show();
            try {
                const files = await findFiles(rootPath, config);
                const content = await concatenateFiles(files);
                await createOutputDocument(content);
            }
            finally {
                statusBar.dispose();
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Flash Repo Error: ${message}`);
        }
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map