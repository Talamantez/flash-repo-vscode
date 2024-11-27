// test/suite/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getConfiguration, DEFAULT_CONFIG, formatSize } from '../../src/utils';
import type { FlashRepoConfig, FileStats } from '../../src/types';

suite('Flash Repo Extension Test Suite', () => {
    let testDir: string;
    let extension: any;

    suiteSetup(() => {
        // Load the compiled extension
        extension = require('../../../dist/extension');
    });

    setup(() => {
        // Create a fresh test directory for each test
        testDir = path.join(__dirname, 'test-files');
        fs.mkdirSync(testDir, { recursive: true });
    });

    teardown(() => {
        // Clean up after each test
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true, force: true });
        }
    });

    suite('Configuration Tests', () => {
        test('loads default configuration correctly', () => {
            const config = getConfiguration();
            assert.deepStrictEqual(config.excludedDirs, DEFAULT_CONFIG.excludedDirs);
            assert.deepStrictEqual(config.excludedFiles, DEFAULT_CONFIG.excludedFiles);
            assert.deepStrictEqual(config.includedExtensions, DEFAULT_CONFIG.includedExtensions);
        });

        test('formatSize handles different sizes correctly', () => {
            assert.strictEqual(formatSize(500), '500 B');
            assert.strictEqual(formatSize(1024), '1.0 KB');
            assert.strictEqual(formatSize(1024 * 1024), '1.0 MB');
        });
    });

    suite('File Finding Tests', () => {
        test('finds basic files correctly', async () => {
            // Create basic test files
            fs.writeFileSync(path.join(testDir, 'test.ts'), 'console.log("test");');
            fs.writeFileSync(path.join(testDir, 'test.js'), 'const x = 1;');
            fs.writeFileSync(path.join(testDir, 'package-lock.json'), '{}');

            const files = await extension.findFiles(testDir, DEFAULT_CONFIG);

            assert.strictEqual(files.length, 2, 'Should find two files');
            assert.ok(files.some((f: { path: string }) => f.path.endsWith('test.ts')), 'Should include .ts file');
            assert.ok(files.some((f: { path: string }) => f.path.endsWith('test.js')), 'Should include .js file');
        });

        test('handles nested directories correctly', async () => {
            // Create nested directory structure
            const nestedDir = path.join(testDir, 'src', 'components');
            fs.mkdirSync(nestedDir, { recursive: true });

            fs.writeFileSync(path.join(nestedDir, 'Component.tsx'), 'export const Component = () => {};');
            fs.writeFileSync(path.join(testDir, 'index.ts'), 'export * from "./src/components";');

            const files = await extension.findFiles(testDir, DEFAULT_CONFIG);

            assert.strictEqual(files.length, 2, 'Should find both files');
            assert.ok(files.some((f: { path: string }) => f.path.includes('Component.tsx')), 'Should find nested TSX file');
            assert.ok(files.some((f: { path: string }) => f.path.endsWith('index.ts')), 'Should find root TS file');
        });

        test('respects excluded directories', async () => {
            // Create files in excluded and included directories
            fs.mkdirSync(path.join(testDir, 'node_modules'), { recursive: true });
            fs.mkdirSync(path.join(testDir, 'src'), { recursive: true });

            fs.writeFileSync(path.join(testDir, 'node_modules', 'test.js'), 'console.log("ignore me");');
            fs.writeFileSync(path.join(testDir, 'src', 'test.js'), 'console.log("find me");');

            const files = await extension.findFiles(testDir, DEFAULT_CONFIG);

            assert.strictEqual(files.length, 1, 'Should find only one file');
            assert.ok(files[0].path.includes('src'), 'Should only include file from src directory');
        });

        test('handles empty directories gracefully', async () => {
            const files = await extension.findFiles(testDir, DEFAULT_CONFIG);
            assert.strictEqual(files.length, 0, 'Should return empty array for empty directory');
        });

        test('processes large files correctly', async () => {
            // Create a larger file
            const largeContent = 'x'.repeat(100000);
            fs.writeFileSync(path.join(testDir, 'large.js'), largeContent);

            const files = await extension.findFiles(testDir, DEFAULT_CONFIG);

            assert.strictEqual(files.length, 1, 'Should find the large file');
            assert.strictEqual(files[0].characters, 100000, 'Should count characters correctly');
        });
    });

    suite('Summary Generation Tests', () => {
        test('generates correct summary for multiple files', async () => {
            const testFiles: FileStats[] = [
                { path: '/test/file1.ts', size: 100, characters: 100, extension: '.ts' },
                { path: '/test/file2.js', size: 200, characters: 200, extension: '.js' }
            ];

            const summary = extension.generateSummary(testFiles);

            assert.ok(summary.includes('Total Files: 2'), 'Should show correct file count');
            assert.ok(summary.includes('300'), 'Should show correct total characters');
            assert.ok(summary.includes('file1.ts'), 'Should list first file');
            assert.ok(summary.includes('file2.js'), 'Should list second file');
            assert.ok(summary.includes('=== Flash Repo Summary ==='), 'Should include header');
        });

        test('handles empty file list', () => {
            const summary = extension.generateSummary([]);
            assert.ok(summary.includes('Total Files: 0'), 'Should show zero files');
            assert.ok(summary.includes('0K'), 'Should show zero characters');
        });

        test('formats large numbers correctly', () => {
            const testFiles: FileStats[] = [{
                path: '/test/large.js',
                size: 1000000,
                characters: 1000000,
                extension: '.js'
            }];

            const summary = extension.generateSummary(testFiles);
            assert.ok(summary.includes('1,000,000'), 'Should format large numbers with commas');
            assert.ok(summary.includes('1000K'), 'Should show correct K size');
        });
    });

    suite('Error Handling Tests', () => {
        test('handles non-existent directory gracefully', async () => {
            const nonExistentDir = path.join(testDir, 'does-not-exist');
            await assert.rejects(
                () => extension.findFiles(nonExistentDir, DEFAULT_CONFIG),
                /ENOENT/,
                'Should throw ENOENT error for non-existent directory'
            );
        });

        test('handles permission errors gracefully', async function () {
            if (process.platform === 'win32') {
                this.skip(); // Skip on Windows as permission testing works differently
            }

            const restrictedDir = path.join(testDir, 'restricted');
            fs.mkdirSync(restrictedDir);
            fs.chmodSync(restrictedDir, 0o000);

            try {
                await extension.findFiles(restrictedDir, DEFAULT_CONFIG);
            } catch (error: any) {
                assert.ok(error.code === 'EACCES' || error.code === 'EPERM',
                    'Should throw permission error');
            } finally {
                fs.chmodSync(restrictedDir, 0o777);
            }
        });
    });
});