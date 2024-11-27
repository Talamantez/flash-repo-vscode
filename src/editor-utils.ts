// src/editor-utils.ts
import * as vscode from 'vscode';

export interface EditorRetryOptions {
    maxAttempts?: number;
    delayMs?: number;
    timeout?: number;
}

const DEFAULT_OPTIONS: EditorRetryOptions = {
    maxAttempts: 3,
    delayMs: 100,
    timeout: 5000
};

export class EditorTimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EditorTimeoutError';
    }
}

/**
 * Creates and shows an output document
 */
export async function createOutputDocument(
    content: string,
    options: EditorRetryOptions = {}
): Promise<vscode.TextEditor> {
    const doc = await vscode.workspace.openTextDocument({
        content,
        language: 'plaintext'
    });

    return await vscode.window.showTextDocument(doc, {
        preview: false,
        viewColumn: vscode.ViewColumn.Beside
    });
}

/**
 * Ensures all editor windows are properly closed
 */
export async function ensureAllEditorsClosed(
    options: EditorRetryOptions = {}
): Promise<void> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();

    while (Date.now() - startTime < opts.timeout!) {
        if (vscode.window.visibleTextEditors.length === 0) {
            return;
        }
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await new Promise(resolve => setTimeout(resolve, opts.delayMs));
    }

    throw new EditorTimeoutError('Failed to close all editors');
}