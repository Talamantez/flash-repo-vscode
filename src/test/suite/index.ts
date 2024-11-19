// src/test/suite/index.ts
import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 60000
    });

    const testsRoot = path.resolve(__dirname, '.');

    try {
        // Find all test files
        const files = await new Promise<string[]>((resolve, reject) => {
            glob('**/**.test.js', { cwd: testsRoot }, (err, matches) => {
                if (err) {
                    reject(err);
                }
                resolve(matches);
            });
        });
        
        // Add files to the test suite
        files.forEach(f => {
            mocha.addFile(path.resolve(testsRoot, f));
        });

        // Run the mocha test
        return new Promise<void>((resolve, reject) => {
            try {
                mocha.run(failures => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                reject(new Error(`Error running tests: ${String(err)}`));
            }
        });
    } catch (err) {
        throw new Error(`Error loading test files: ${String(err)}`);
    }
}