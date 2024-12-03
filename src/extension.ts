// src/extension.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FlashRepoConfig, FileStats } from './types';
import { getConfiguration } from './utils';
import { registerHydrationCommand } from './hydration';

export async function findFiles(rootPath: string, config: FlashRepoConfig): Promise<FileStats[]> {
    const files: FileStats[] = [];

    async function walk(dir: string): Promise<void> {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                const shouldExclude = config.excludedDirs.some(
                    excludedDir => entry.name === excludedDir
                );
                if (!shouldExclude) {
                    await walk(fullPath);
                }
            } else if (entry.isFile()) {
                const isExcluded = config.excludedFiles.some(
                    excludedFile => entry.name === excludedFile
                );
                const hasIncludedExtension = config.includedExtensions.some(
                    ext => entry.name.endsWith(ext)
                );

                if (!isExcluded && hasIncludedExtension) {
                    const content = await fs.promises.readFile(fullPath, 'utf8');
                    files.push({
                        path: fullPath,
                        size: content.length,
                        characters: content.length,
                        extension: path.extname(fullPath)
                    });
                }
            }
        }
    }

    await walk(rootPath);
    return files.sort((a, b) => a.path.localeCompare(b.path));
}

export function generateSummary(files: FileStats[]): string {
    const totalChars = files.reduce((sum, file) => sum + file.characters, 0);
    const totalFiles = files.length;

    const summary = [
        `Total Files:${totalFiles}`,
        `Total Characters:${totalChars.toLocaleString()} (${Math.round(totalChars / 1000)}K)`,
        ...files.map(f => `$${f.path}|${f.characters}`)
    ];

    return summary.join('\n');
}

export async function generateContent(summary: string, files: FileStats[]): Promise<string> {
    const fileContents = await Promise.all(files.map(async file => {
        const content = await fs.promises.readFile(file.path, 'utf8');
        return `#${file.path}\n${content.trim()}`;
    }));

    return [summary, ...fileContents].join('\n');
}

export function activate(context: vscode.ExtensionContext): void {
    // Register the main command
    const mainCommand = vscode.commands.registerCommand('flash-repo.concatenate', async () => {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                throw new Error('No workspace folder open');
            }

            const config = getConfiguration();
            const rootPath = workspaceFolders[0].uri.fsPath;
            const processingStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
            processingStatus.text = "$(sync~spin) Flash Repo: Processing...";
            processingStatus.show();

            try {
                const files = await findFiles(rootPath, config);
                const totalChars = files.reduce((sum, file) => sum + file.characters, 0);

                if (totalChars > 100000) {
                    const proceed = await vscode.window.showWarningMessage(
                        `Large codebase (${Math.round(totalChars / 1000)}K chars) may exceed context limits. Continue?`,
                        'Yes', 'No'
                    );
                    if (proceed !== 'Yes') {
                        return;
                    }
                }

                const summary = generateSummary(files);
                const content = await generateContent(summary, files);

                const doc = await vscode.workspace.openTextDocument({
                    content,
                    language: 'plaintext'
                });
                await vscode.window.showTextDocument(doc, {
                    preview: false,
                    viewColumn: vscode.ViewColumn.Beside
                });

                void vscode.window.showInformationMessage(
                    `Concatenated ${files.length} files (${Math.round(totalChars / 1000)}K chars)`
                );
            } finally {
                processingStatus.dispose();
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            void vscode.window.showErrorMessage(`Flash Repo Error: ${message}`);
        }
    });

    context.subscriptions.push(mainCommand);

    // Register hydration command
    registerHydrationCommand(context);
}

export function deactivate(): void {
    // Cleanup if needed
}