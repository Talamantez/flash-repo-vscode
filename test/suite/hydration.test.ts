// test/suite/hydration.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { parseFlashRepoOutput, hydrateFiles } from '../../src/hydration';

suite('Hydration Feature Tests', () => {
    let testDir: string;
    let hydratedDir: string;

    setup(async () => {
        // Create fresh test directories
        testDir = path.join(__dirname, 'test-files');
        hydratedDir = path.join(testDir, 'hydrated');
        await fs.promises.mkdir(testDir, { recursive: true });
    });

    teardown(async () => {
        // Clean up test directories
        if (fs.existsSync(testDir)) {
            await fs.promises.rm(testDir, { recursive: true, force: true });
        }
    });

    suite('Parser Tests', () => {
        test('parses valid Flash Repo output correctly', () => {
            const input = `=== Flash Repo Summary ===
Total Files: 2
Total Characters: 50

Files included:
- /src/test.ts (25 chars)
- /src/main.ts (25 chars)

=== Begin Concatenated Content ===
=== File: /src/test.ts ===
console.log('test file');

=== File: /src/main.ts ===
console.log('main file');
`;

            const files = parseFlashRepoOutput(input);
            assert.strictEqual(files.length, 2, 'Should find two files');
            assert.strictEqual(files[0].path, '/src/test.ts');
            assert.strictEqual(files[0].content.trim(), "console.log('test file');");
            assert.strictEqual(files[1].path, '/src/main.ts');
            assert.strictEqual(files[1].content.trim(), "console.log('main file');");
        });

        test('handles empty input gracefully', () => {
            const files = parseFlashRepoOutput('');
            assert.strictEqual(files.length, 0);
        });

        test('ignores non-file content', () => {
            const input = `Some random text
that should be ignored
=== File: /src/test.ts ===
actual content`;

            const files = parseFlashRepoOutput(input);
            assert.strictEqual(files.length, 1);
            assert.strictEqual(files[0].path, '/src/test.ts');
            assert.strictEqual(files[0].content.trim(), 'actual content');
        });
    });

    suite('Hydration Tests', () => {
        test('creates files with correct content and structure', async () => {
            const testFiles = [
                {
                    path: '/src/test.ts',
                    content: 'console.log("test");'
                },
                {
                    path: '/src/utils/helper.ts',
                    content: 'export const help = () => {};'
                }
            ];

            const hydratedPath = await hydrateFiles(testFiles, testDir);

            // Check directory was created
            assert.ok(fs.existsSync(hydratedPath), 'Hydrated directory should exist');

            // Check files were created with correct content
            const testFilePath = path.join(hydratedPath, 'src', 'test.ts');
            const helperFilePath = path.join(hydratedPath, 'src', 'utils', 'helper.ts');

            assert.ok(fs.existsSync(testFilePath), 'Test file should exist');
            assert.ok(fs.existsSync(helperFilePath), 'Helper file should exist');

            const testContent = await fs.promises.readFile(testFilePath, 'utf8');
            const helperContent = await fs.promises.readFile(helperFilePath, 'utf8');

            assert.strictEqual(testContent, testFiles[0].content);
            assert.strictEqual(helperContent, testFiles[1].content);
        });

        test('handles special characters in paths', async () => {
            const testFiles = [
                {
                    path: '/src/test file.ts',
                    content: 'test content'
                },
                {
                    path: '/src/@special/helper.ts',
                    content: 'helper content'
                }
            ];

            const hydratedPath = await hydrateFiles(testFiles, testDir);

            const testFilePath = path.join(hydratedPath, 'src', 'test file.ts');
            const helperFilePath = path.join(hydratedPath, 'src', '@special', 'helper.ts');

            assert.ok(fs.existsSync(testFilePath), 'File with space should exist');
            assert.ok(fs.existsSync(helperFilePath), 'File with special chars should exist');
        });

        test('handles empty file list gracefully', async () => {
            const hydratedPath = await hydrateFiles([], testDir);
            assert.ok(fs.existsSync(hydratedPath), 'Should create hydrated directory even with no files');
            const files = await fs.promises.readdir(hydratedPath);
            assert.strictEqual(files.length, 0, 'Directory should be empty');
        });
    });

    suite('Integration Tests', () => {
        test('full hydration workflow', async () => {
            // Create a test snapshot
            const snapshot = `=== Flash Repo Summary ===
Total Files: 2
Total Characters: 50

Files included:
- /src/index.ts (25 chars)
- /src/lib/util.ts (25 chars)

=== Begin Concatenated Content ===
=== File: /src/index.ts ===
console.log('main');

=== File: /src/lib/util.ts ===
export const util = () => {};
`;

            // Parse and hydrate
            const files = parseFlashRepoOutput(snapshot);
            const hydratedPath = await hydrateFiles(files, testDir);

            // Verify results
            const indexPath = path.join(hydratedPath, 'src', 'index.ts');
            const utilPath = path.join(hydratedPath, 'src', 'lib', 'util.ts');

            assert.ok(fs.existsSync(indexPath), 'Index file should exist');
            assert.ok(fs.existsSync(utilPath), 'Util file should exist');

            const indexContent = await fs.promises.readFile(indexPath, 'utf8');
            const utilContent = await fs.promises.readFile(utilPath, 'utf8');

            assert.strictEqual(indexContent.trim(), "console.log('main');");
            assert.strictEqual(utilContent.trim(), "export const util = () => {};");
        });
    });
});