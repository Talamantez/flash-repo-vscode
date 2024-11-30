// src/hydration.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { LicenseService } from './services/license-service';

interface FileEntry {
    path: string;
    content: string;
}

export function parseFlashRepoOutput(content: string): FileEntry[] {
    const files: FileEntry[] = [];
    const lines = content.split('\n');

    let currentFile: FileEntry | null = null;
    let contentLines: string[] = [];
    let isInFile = false;

    for (const line of lines) {
        // Start of a new file
        if (line.startsWith('=== File: ')) {
            // Save previous file if exists
            if (currentFile) {
                currentFile.content = contentLines.join('\n');
                files.push(currentFile);
                contentLines = [];
            }

            // Start new file
            const filePath = line.replace('=== File: ', '').replace(' ===', '').trim();
            currentFile = { path: filePath, content: '' };
            isInFile = true;
        }
        // Start of content marker
        else if (line.startsWith('=== Begin Concatenated Content ===')) {
            isInFile = false;
        }
        // File content - only add if we're in a file section
        else if (currentFile && isInFile) {
            contentLines.push(line);
        }
    }

    // Save last file if exists
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

        // Write file
        await fs.promises.writeFile(fullPath, file.content);
    }

    return hydratedDir;
}

async function performHydration(): Promise<void> {
    try {
        console.log('Starting hydration...');
        void vscode.window.showInformationMessage('Starting hydration process...');
        const editor = vscode.window.activeTextEditor;
        console.log('Active editor:', editor ? 'found' : 'not found');
        if (!editor) {
            throw new Error('No active text editor');
        }

        const text = editor.document.getText();
        console.log('Document content length:', text.length);
        console.log('Is Flash Repo snapshot:', text.includes('=== Flash Repo Summary ==='));
        if (!text.includes('=== Flash Repo Summary ===')) {
            throw new Error('Not a Flash Repo snapshot');
        }

        const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        if (!workspacePath) {
            throw new Error('No workspace folder open');
        }

        // Show progress indicator
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Hydrating files...",
            cancellable: false
        }, async () => {
            // Parse and hydrate files
            const files = parseFlashRepoOutput(text);
            console.log('Parsed files count:', files.length);
            if (files.length === 0) {
                throw new Error('No files found to hydrate');
            }

            const hydratedPath = await hydrateFiles(files, workspacePath);

            // Show success message with folder path
            const relativePath = path.relative(workspacePath, hydratedPath);
            void vscode.window.showInformationMessage(
                'Files were hydrated successfully to folder: ' + relativePath
            );
        });
    } catch (error) {
        console.error('Hydration error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        void vscode.window.showErrorMessage(`Hydration failed: ${message}`);
    }
}

export function registerHydrationCommand(context: vscode.ExtensionContext): void {
    // Register main hydration command
    const hydrationCommand = vscode.commands.registerCommand('flash-repo.hydrate', async () => {
        await performHydration();
    });

    // Register context menu command - simplified to use main command
    const contextMenuCommand = vscode.commands.registerCommand('flash-repo.hydrateContextMenu', async () => {
        // Just execute the main hydrate command
        await vscode.commands.executeCommand('flash-repo.hydrate');
    });

    context.subscriptions.push(hydrationCommand, contextMenuCommand);
}