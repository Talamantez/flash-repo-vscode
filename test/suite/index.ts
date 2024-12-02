// test/suite/index.ts
const pathModule = require('path');
const MochaLib = require('mocha');
const { glob } = require('glob');

async function run(): Promise<void> {
    const mocha = new MochaLib({
        ui: 'tdd',
        color: true,
        timeout: 60000
    });

    const testsRoot = pathModule.resolve(__dirname, '.');

    try {
        // Find all test files using glob's promise interface
        const files = await glob('**/**.test.js', { cwd: testsRoot });

        // Add files to the test suite
        files.forEach((f: string) => mocha.addFile(pathModule.resolve(testsRoot, f)));

        return new Promise<void>((resolve, reject) => {
            try {
                mocha.run((failures: number) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });
    } catch (err) {
        console.error(err);
        throw new Error(`Error loading test files: ${err}`);
    }
}

module.exports = { run };