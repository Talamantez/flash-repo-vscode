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
        test('parses flash repo format correctly', () => {
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
            assert.ok(files[0].content.includes('# Header 1'), 'Should preserve headers');
            assert.ok(files[0].content.includes('Normal text'), 'Should preserve normal text');
        });

        test('handles empty input', () => {
            const files = parseFlashRepoOutput('');
            assert.strictEqual(files.length, 0, 'Should return empty array for empty input');
        });

        test('preserves file content formatting', () => {
            const input = `Total Files:1
Total Characters:35 (1K)
$/src/test.ts|35
#/src/test.ts
line1
line2
line3`;

            const files = parseFlashRepoOutput(input);
            assert.strictEqual(files.length, 1, 'Should find one file');
            assert.strictEqual(files[0].content.split('\n').length, 3, 'Should preserve line breaks');
            assert.ok(files[0].content.includes('line1\nline2\nline3'), 'Should preserve content order');
        });
    });

    suite('Hydration Integration Tests', () => {
        test('performs full hydration successfully', async () => {
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

            assert.ok(fs.existsSync(indexPath), 'Should create index.ts');
            assert.ok(fs.existsSync(utilPath), 'Should create nested util.ts');

            const indexContent = await fs.promises.readFile(indexPath, 'utf8');
            const utilContent = await fs.promises.readFile(utilPath, 'utf8');

            assert.strictEqual(indexContent.trim(), "console.log('main');");
            assert.strictEqual(utilContent.trim(), "export const util = () => {};");
        });

        test('handles empty directories', async () => {
            const snapshot = `Total Files:1
Total Characters:25 (1K)
$/empty/src/test.ts|25
#/empty/src/test.ts
test content`;

            const files = parseFlashRepoOutput(snapshot);
            const hydratedPath = await hydrateFiles(files, testDir);

            const testPath = path.join(hydratedPath, 'empty', 'src', 'test.ts');
            assert.ok(fs.existsSync(testPath), 'Should create nested directories');
        });

        test('preserves file content integrity', async () => {
            const snapshot = `Total Files:1
Total Characters:50 (1K)
$/test.ts|50
#/test.ts
// This is a test
function test() {
    return true;
}`;

            const files = parseFlashRepoOutput(snapshot);
            const hydratedPath = await hydrateFiles(files, testDir);

            const testPath = path.join(hydratedPath, 'test.ts');
            const content = await fs.promises.readFile(testPath, 'utf8');

            assert.ok(content.includes('// This is a test'), 'Should preserve comments');
            assert.ok(content.includes('function test()'), 'Should preserve function declarations');
            assert.ok(content.includes('return true;'), 'Should preserve function content');
        });
    });
});