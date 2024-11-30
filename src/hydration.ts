// src/hydration.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getExtensionForLanguage, hydrateClaudeResponse } from './claude-hydration';
interface FileEntry {
    path: string;
    content: string;
}

/**
 * Parses output from Flash Repo concatenation
 */
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
            continue;
        }

        // Start of content marker
        if (line === '=== Begin Concatenated Content ===') {
            isInFile = false;
            continue;
        }

        // Collect content if we're in a file section
        if (currentFile && isInFile) {
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

/**
 * Parses code blocks and file contents from Claude's response
 */
export function parseClaudeResponse(content: string): FileEntry[] {
    const files: FileEntry[] = [];
    const lines = content.split('\n');

    let currentFile: FileEntry | null = null;
    let inCodeBlock = false;
    let codeBlockLang = '';
    let contentLines: string[] = [];
    let inResponse = false;
    let inArtifact = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Mark when we enter the response section
        if (line.trim() === '## Response') {
            inResponse = true;
            continue;
        }
        // Only process content once we're in the response section
        if (!inResponse) {
            continue;
        }

        // Look for code blocks
        if (line.trim().startsWith('```')) {
            if (!inCodeBlock) {
                // Start of code block
                inCodeBlock = true;
                codeBlockLang = line.trim().slice(3) || '';
                // Look ahead for filename comment
                const nextLine = lines[i + 1] || '';
                const filenameComment = nextLine.match(/\/\/ ([^\s]+)$/);
                if (filenameComment) {
                    currentFile = { path: filenameComment[1], content: '' };
                    i++; // Skip filename line
                } else {
                    // Generate filename based on language
                    const ext = getExtensionForLanguage(codeBlockLang);
                    currentFile = {
                        path: `generated/code-block-${files.length + 1}${ext}`,
                        content: ''
                    };
                }
                continue;
            } else {
                // End of code block
                inCodeBlock = false;
                if (currentFile && contentLines.length > 0) {
                    currentFile.content = contentLines.join('\n');
                    files.push(currentFile);
                    currentFile = null;
                    contentLines = [];
                }
                continue;
            }
        }

        // Look for artifact blocks
        if (line.includes('<function_calls>')) {
            inArtifact = true;
            currentFile = {
                path: `generated/artifact-${files.length + 1}.ts`,
                content: ''
            };
            continue;
        }

        if (line.includes('<parameter name="content">')) {
            if (inArtifact) {
                const artifactId = files.length + 1;
                currentFile = {
                    path: `generated/artifact-${artifactId}.ts`,
                    content: ''
                };
                continue;
            }
        }

        // Collect content if we're in a code block or artifact
        if (currentFile && (inCodeBlock || inArtifact)) {
            contentLines.push(line);
        }
    }

    // Add final file if exists
    if (currentFile && contentLines.length > 0) {
        currentFile.content = contentLines.join('\n');
        files.push(currentFile);
    }

    return files;
}

/**
 * Creates hydrated files from the parsed content
 */
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

/**
 * Performs hydration of Flash Repo output
 */
async function performHydration(): Promise<void> {
    try {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            throw new Error('No active text editor');
        }

        const text = editor.document.getText();
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

/**
 * Register both Flash Repo and Claude hydration commands
 */
export function registerHydrationCommands(context: vscode.ExtensionContext): void {
    // Register hydration command for Flash Repo output
    const hydrationCommand = vscode.commands.registerCommand('flash-repo.hydrate', async () => {
        await performHydration();
    });

    // Register hydration command for Claude responses
    const claudeHydrationCommand = vscode.commands.registerCommand('flash-repo.hydrateClaudeResponse', async () => {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                throw new Error('No active text editor');
            }

            const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
            if (!workspacePath) {
                throw new Error('No workspace folder open');
            }

            const text = editor.document.getText();

            // Show progress indicator
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Hydrating Claude response...",
                cancellable: false
            }, async () => {
                const hydratedPath = await hydrateClaudeResponse(text, workspacePath);
                const relativePath = path.relative(workspacePath, hydratedPath);

                void vscode.window.showInformationMessage(
                    `Claude response hydrated successfully to folder: ${relativePath}`
                );
            });
        } catch (error) {
            console.error('Claude hydration error:', error);
            const message = error instanceof Error ? error.message : 'Unknown error';
            void vscode.window.showErrorMessage(`Claude hydration failed: ${message}`);
        }
    });

    // Register context menu command
    const contextMenuCommand = vscode.commands.registerCommand('flash-repo.hydrateContextMenu', async () => {
        await vscode.commands.executeCommand('flash-repo.hydrate');
    });

    context.subscriptions.push(hydrationCommand, claudeHydrationCommand, contextMenuCommand);
}