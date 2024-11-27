// src/utils.ts
import * as vscode from 'vscode';
import { FlashRepoConfig } from './types';

export const DEFAULT_CONFIG: FlashRepoConfig = {
    excludedDirs: ['.git', 'node_modules', 'dist', 'build', 'hydrated'],
    excludedFiles: ['package-lock.json', 'yarn.lock'],
    includedExtensions: ['.md', '.ts', '.js', '.py', '.java', '.cpp', '.h', '.jsx', '.tsx']
};

/**
 * Gets configuration from VS Code settings
 */
export function getConfiguration(): FlashRepoConfig {
    const config = vscode.workspace.getConfiguration('flash-repo');
    return {
        excludedDirs: config.get<string[]>('excludedDirectories') || DEFAULT_CONFIG.excludedDirs,
        excludedFiles: config.get<string[]>('excludedFiles') || DEFAULT_CONFIG.excludedFiles,
        includedExtensions: config.get<string[]>('includedExtensions') || DEFAULT_CONFIG.includedExtensions
    };
}

/**
 * Formats file size for display
 */
export function formatSize(size: number): string {
    if (size < 1024) {
        return `${size} B`;
    }
    const kb = size / 1024;
    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
}