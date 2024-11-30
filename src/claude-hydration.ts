// src/claude-hydration.ts
import * as fs from 'fs';
import * as path from 'path';

interface FileEntry {
    path: string;
    content: string;
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

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for file path markers
        const filePathMatch = line.match(/^=== File: (.*?) ===$/);
        if (filePathMatch) {
            if (currentFile) {
                currentFile.content = contentLines.join('\n');
                files.push(currentFile);
            }
            currentFile = { path: filePathMatch[1], content: '' };
            contentLines = [];
            continue;
        }

        // Check for code block markers
        const codeBlockStart = line.match(/^```(\w*)$/);
        if (codeBlockStart) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                codeBlockLang = codeBlockStart[1];
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
                contentLines = [];
                continue;
            } else {
                inCodeBlock = false;
                if (currentFile) {
                    currentFile.content = contentLines.join('\n');
                    files.push(currentFile);
                    currentFile = null;
                }
                contentLines = [];
                continue;
            }
        }

        // Collect content if we're in a file or code block
        if (currentFile && (inCodeBlock || filePathMatch)) {
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
 * Maps common language identifiers to file extensions
 * @param lang The programming language identifier
 * @returns The file extension for the given language
 */
export function getExtensionForLanguage(lang: string): string {
    const langMap: Record<string, string> = {
        'typescript': '.ts',
        'javascript': '.js',
        'python': '.py',
        'java': '.java',
        'cpp': '.cpp',
        'c++': '.cpp',
        'c': '.c',
        'rust': '.rs',
        'go': '.go',
        'ruby': '.rb',
        'php': '.php',
        'html': '.html',
        'css': '.css',
        'json': '.json',
        'yaml': '.yml',
        'markdown': '.md',
        'shell': '.sh',
        'bash': '.sh',
        'sql': '.sql',
        'ts': '.ts',
        'js': '.js',
        'py': '.py',
        '': '.txt'  // Default extension for unspecified language
    };
    return langMap[lang.toLowerCase()] || '.txt';
}

/**
 * Creates files from Claude's response in the hydrated directory
 */
export async function hydrateClaudeResponse(
    content: string,
    workspacePath: string,
    baseDir: string = 'claude-hydrated'
): Promise<string> {
    const files = parseClaudeResponse(content);
    if (files.length === 0) {
        throw new Error('No code blocks or files found to hydrate');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const hydratedDir = path.join(workspacePath, baseDir, `response-${timestamp}`);

    // Create hydrated directory
    await fs.promises.mkdir(hydratedDir, { recursive: true });

    // Create each file
    for (const file of files) {
        // Remove any leading slashes to make path relative
        const relativePath = file.path.replace(/^[/\\]/, '');
        const fullPath = path.join(hydratedDir, relativePath);
        const dirPath = path.dirname(fullPath);

        // Create directory structure
        await fs.promises.mkdir(dirPath, { recursive: true });

        // Write file content
        await fs.promises.writeFile(fullPath, file.content.trim() + '\n');
    }

    return hydratedDir;
}