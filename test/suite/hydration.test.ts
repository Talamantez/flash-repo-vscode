// test/suite/hydration.test.ts
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { parseFlashRepoOutput, hydrateFiles } from '../../src/hydration';

suite('Hydration Feature Tests', () => {
    let testDir: string;
    let hydratedDir: string;

    setup(async () => {
        testDir = path.join(__dirname, 'test-files');
        hydratedDir = path.join(testDir, 'hydrated');
        await fs.promises.mkdir(testDir, { recursive: true });
    });

    teardown(async () => {
        if (fs.existsSync(testDir)) {
            await fs.promises.rm(testDir, { recursive: true, force: true });
        }
    });

    suite('Parser Tests', () => {
        test('parses compressed format correctly', () => {
            const input = `Total Files:2
Total Characters:50 (1K)
$/src/test.ts|25
$/src/main.ts|25
#/src/test.ts
console.log('test file');
#/src/main.ts
console.log('main file');`;

            const files = parseFlashRepoOutput(input);
            assert.strictEqual(files.length, 2, 'Should find two files');
            assert.strictEqual(files[0].path, '/src/test.ts');
            assert.strictEqual(files[0].content.trim(), "console.log('test file');");
            assert.strictEqual(files[1].path, '/src/main.ts');
            assert.strictEqual(files[1].content.trim(), "console.log('main file');");
        });

        test('handles markdown content correctly', () => {
            const input = `Total Files:1
        Total Characters:50 (1K)
        $/src/README.md|50
        #/src/README.md
        # Header 1
        ## Header 2
        ### Header 3
        Normal text
        # Another Header`;

            const files = parseFlashRepoOutput(input);

            assert.strictEqual(files.length, 1, 'Should treat markdown as single file');
            assert.strictEqual(files[0].path, '/src/README.md', 'Should have correct path');

            // Create the expected content with exact formatting
            const content = files[0].content;

            // Test each line individually for better error reporting
            const lines = content.split('\n');
            assert.strictEqual(lines[0].trim(), '# Header 1', 'First line should be Header 1');
            assert.strictEqual(lines[1].trim(), '## Header 2', 'Second line should be Header 2');
            assert.strictEqual(lines[2].trim(), '### Header 3', 'Third line should be Header 3');
            assert.strictEqual(lines[3].trim(), 'Normal text', 'Fourth line should be normal text');
            assert.strictEqual(lines[4].trim(), '# Another Header', 'Fifth line should be Another Header');
        });

        test('handles empty input gracefully', () => {
            const files = parseFlashRepoOutput('');
            assert.strictEqual(files.length, 0);
        });

        test('handles single-file input correctly', () => {
            const input = `Total Files:1
Total Characters:25 (1K)
$/src/test.ts|25
#/src/test.ts
actual content`;

            const files = parseFlashRepoOutput(input);
            assert.strictEqual(files.length, 1);
            assert.strictEqual(files[0].path, '/src/test.ts');
            assert.strictEqual(files[0].content.trim(), 'actual content');
        });

        test('preserves newlines in file content', () => {
            const input = `Total Files:1
Total Characters:35 (1K)
$/src/test.ts|35
#/src/test.ts
line1
line2
line3`;

            const files = parseFlashRepoOutput(input);
            assert.strictEqual(files.length, 1);
            assert.strictEqual(files[0].content.split('\n').length, 3);
        });
    });

    suite('Integration Tests', () => {
        test('full hydration workflow with compressed format', async () => {
            const snapshot = `Total Files:2
Total Characters:50 (1K)
$/src/index.ts|25
$/src/lib/util.ts|25
#/src/index.ts
console.log('main');
#/src/lib/util.ts
export const util = () => {};`;

            const files = parseFlashRepoOutput(snapshot);
            const hydratedPath = await hydrateFiles(files, testDir);

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