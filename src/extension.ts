// src/extension.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { FlashRepoConfig, FileStats } from './types';
import { getConfiguration } from './utils';
import { LicenseService } from './services/license-service';
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
        '=== Flash Repo Summary ===',
        `Total Files: ${totalFiles}`,
        `Total Characters: ${totalChars.toLocaleString()} (${Math.round(totalChars / 1000)}K)`,
        '',
        'Files included:',
        ...files.map(f => `- ${f.path} (${f.characters.toLocaleString()} chars)`),
        '',
        '=== Begin Concatenated Content ==='
    ];

    return summary.join('\n');
}

export function activate(context: vscode.ExtensionContext): void {
    // Initialize license service
    const licenseService = new LicenseService(context);
    void licenseService.initializeLicense();
    void licenseService.showLicenseStatus();

    // Create status bar for license status
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.command = 'flash-repo.showLicense';
    context.subscriptions.push(statusBar);

    // Update license status bar
    async function updateLicenseStatus(): Promise<void> {
        const license = await licenseService.getLicenseInfo();
        if (!license) {
            statusBar.hide();
            return;
        }

        if (license.isTrial && license.trialEndsAt) {
            const daysLeft = Math.max(0, Math.ceil((license.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            if (daysLeft > 0) {
                statusBar.text = `$(clock) Flash Repo: ${daysLeft}d trial left`;
                statusBar.tooltip = 'Click to purchase Flash Repo Snapshot Pro';
                statusBar.show();
            } else {
                statusBar.text = '$(alert) Flash Repo: Trial expired';
                statusBar.tooltip = 'Click to purchase Flash Repo Snapshot Pro';
                statusBar.show();
            }
        } else if (!license.isTrial && license.isValid) {
            statusBar.text = '$(verified) Flash Repo Snapshot Pro';
            statusBar.tooltip = 'Licensed version';
            statusBar.show();
        }
    }

    // Register license status command
    const licenseStatusCommand = vscode.commands.registerCommand('flash-repo.showLicense', async () => {
        await licenseService.showLicenseStatus();
    });
    context.subscriptions.push(licenseStatusCommand);

    // Register purchase command
    const purchaseCommand = vscode.commands.registerCommand('flash-repo.purchase', () => {
        void vscode.env.openExternal(
            vscode.Uri.parse('https://marketplace.visualstudio.com/items?itemName=conscious-robot.flash-repo-vscode')
        );
    });
    context.subscriptions.push(purchaseCommand);

    // Main command registration
    const mainCommand = vscode.commands.registerCommand('flash-repo.concatenate', async () => {
        try {
            // Check license status before executing command
            const isValid = await licenseService.validateLicense();
            if (!isValid) {
                const license = await licenseService.getLicenseInfo();
                if (license?.isTrial) {
                    await licenseService.showLicenseStatus();
                } else {
                    void vscode.window.showErrorMessage(
                        'Flash Repo Snapshot Pro license required. Purchase now for just $9.99!',
                        'Purchase Now'
                    ).then(selection => {
                        if (selection === 'Purchase Now') {
                            void vscode.commands.executeCommand('flash-repo.purchase');
                        }
                    });
                }
                return;
            }

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
                const content = [
                    summary,
                    ...(await Promise.all(files.map(async file => {
                        const content = await fs.promises.readFile(file.path, 'utf8');
                        return `=== File: ${file.path} ===\n\n${content}\n`;
                    })))
                ].join('\n');

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

    // Initial status update
    void updateLicenseStatus();

    // Update status every hour
    setInterval(() => {
        void updateLicenseStatus();
    }, 60 * 60 * 1000);

    context.subscriptions.push(mainCommand);

    // Register hydration command
    registerHydrationCommand(context);
}

export function deactivate(): void {
    // Cleanup if needed
}