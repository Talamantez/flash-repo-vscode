// src/hydration.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface FileEntry {
    path: string;
    content: string;
}

export function parseFlashRepoOutput(content: string): FileEntry[] {
    const files: FileEntry[] = [];
    const lines = content.split('\n');
    let currentFile: FileEntry | null = null;
    let contentLines: string[] = [];

    for (const line of lines) {
        // Keep the original line for content
        if (!line.trim()) {
            if (currentFile) {
                contentLines.push(line); // Preserve empty lines in content
            }
            continue;
        }

        const trimmedLine = line.trim();

        // Skip summary lines and file listings
        if (trimmedLine.startsWith('Total ') || trimmedLine.startsWith('$')) {
            continue;
        }

        // Start of a new file (must start with # exactly)
        if (trimmedLine.startsWith('#/')) {
            // Save previous file if exists
            if (currentFile && contentLines.length > 0) {
                currentFile.content = contentLines.join('\n');
                files.push(currentFile);
                contentLines = [];
            }

            // Start new file - extract path after the # prefix
            const filePath = trimmedLine.substring(1); // Remove the # but keep the /
            currentFile = {
                path: filePath,
                content: ''
            };
        }
        // Add content lines to current file, preserving original indentation
        else if (currentFile) {
            contentLines.push(line);
        }
    }

    // Save the last file if exists
    if (currentFile && contentLines.length > 0) {
        currentFile.content = contentLines.join('\n');
        files.push(currentFile);
    }

    return files;
}

export async function hydrateFiles(files: FileEntry[], workspacePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hydratedDir = path.join(workspacePath, 'hydrated', `snapshot-${timestamp}`);

    // Create hydrated directory
    await fs.promises.mkdir(hydratedDir, { recursive: true });

    // Create each file
    for (const file of files) {
        const fullPath = path.join(hydratedDir, file.path.replace(/^\/workspaces\/[^/]+\//, ''));
        const dirPath = path.dirname(fullPath);

        // Create directory structure
        await fs.promises.mkdir(dirPath, { recursive: true });

        // Write file content, ensuring proper line endings
        await fs.promises.writeFile(fullPath, file.content.trim() + '\n');
    }

    return hydratedDir;
}

async function performHydration(): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active text editor');
        }

        const text = editor.document.getText();
        // Updated check for new format
        if (!text.includes('Total Files:')) {
            throw new Error('Not a Flash Repo snapshot');
        }

        const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspacePath) {
            throw new Error('No workspace folder open');
        }

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Hydrating files...",
            cancellable: false
        }, async () => {
            const files = parseFlashRepoOutput(text);
            if (files.length === 0) {
                throw new Error('No files found to hydrate');
            }

            const hydratedPath = await hydrateFiles(files, workspacePath);
            const relativePath = path.relative(workspacePath, hydratedPath);

            void vscode.window.showInformationMessage(
                `Files hydrated successfully to: ${relativePath}`
            );
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        void vscode.window.showErrorMessage(`Hydration failed: ${message}`);
    }
}

export function registerHydrationCommand(context: vscode.ExtensionContext): void {
    const hydrationCommand = vscode.commands.registerCommand('flash-repo.hydrate', async () => {
        await performHydration();
    });

    const contextMenuCommand = vscode.commands.registerCommand('flash-repo.hydrateContextMenu', async () => {
        await vscode.commands.executeCommand('flash-repo.hydrate');
    });

    context.subscriptions.push(hydrationCommand, contextMenuCommand);
}