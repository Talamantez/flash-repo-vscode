// src/test/suite/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Flash Repo Extension Test Suite', () => {
    test('Extension Command Registration', async () => {
        const commands = await vscode.commands.getCommands();
        assert.ok(commands.includes('flash-repo.concatenate'), 'Command should be registered');
    });

    test('Configuration Loading', () => {
        const config = vscode.workspace.getConfiguration('flash-repo');
        assert.ok(config.has('excludedDirectories'), 'Should have excludedDirectories setting');
        assert.ok(config.has('excludedFiles'), 'Should have excludedFiles setting');
        assert.ok(config.has('includedExtensions'), 'Should have includedExtensions setting');

        // Check default values
        const excludedDirs = config.get<string[]>('excludedDirectories');
        assert.ok(excludedDirs?.includes('node_modules'), 'Should exclude node_modules by default');
        
        const extensions = config.get<string[]>('includedExtensions');
        assert.ok(extensions?.includes('.ts'), 'Should include .ts files by default');
    });
});