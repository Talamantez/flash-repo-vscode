import Mocha from 'mocha'; // Change to default import
import * as path from 'path';
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
        const files = await glob('**/**.test.js', { cwd: testsRoot });

        // Add files to the test suite
        files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

        return new Promise<void>((resolve, reject) => {
            try {
                // Run the mocha test
                mocha.run((failures: number) => { // Add type for failures parameter
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