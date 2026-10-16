import { readFileSync } from 'node:fs';
import { validate } from './validator.js';

for (const name of ['user', 'payment']) {
  for (const outcome of ['valid', 'invalid']) {
    const file = `${name}.${outcome}.json`;
    const data = JSON.parse(readFileSync(new URL(`../examples/${file}`, import.meta.url), 'utf8'));
    const result = validate(name, data);
    console.log(`\n${file}: ${result.valid ? 'VALID' : 'INVALID (expected)'}`);
    if (!result.valid) console.log(JSON.stringify(result.errors, null, 2));
    if (result.valid !== (outcome === 'valid')) throw new Error(`Unexpected result: ${file}`);
  }
}
console.log('\nAll four demo cases behaved as expected.');
