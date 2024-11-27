// src/test-utils.ts
import * as vscode from 'vscode';

export interface CleanupOptions {
    timeout?: number;
    retryDelay?: number;
    maxRetries?: number;
}

const DEFAULT_CLEANUP_OPTIONS: CleanupOptions = {
    timeout: 1000,
    retryDelay: 100,
    maxRetries: 3
};

/**
 * Simple delay function for cleanup operations
 */
async function delay(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Thorough cleanup of VS Code resources
 */
export async function thoroughCleanup(options: CleanupOptions = {}): Promise<void> {
    const opts = { ...DEFAULT_CLEANUP_OPTIONS, ...options };
    const startTime = Date.now();

    // First attempt normal cleanup
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    await delay(opts.retryDelay ?? 0);

    for (let attempt = 0; attempt < opts.maxRetries!; attempt++) {
        if (Date.now() - startTime > opts.timeout!) {
            console.warn('Cleanup timeout reached');
            break;
        }

        // Force close any remaining editors
        if (vscode.window.visibleTextEditors.length > 0) {
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
            await delay(opts.retryDelay ?? 0);
        }

        // Break if everything is cleaned up
        if (vscode.window.visibleTextEditors.length === 0) {
            break;
        }

        await delay(opts.retryDelay ?? 0);
    }
}