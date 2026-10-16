import { readFileSync } from 'node:fs';
import { validate } from './validator.js';

const [name, file, ...rest] = process.argv.slice(2);
if (!name || !file || rest.length) {
  console.error('Usage: npm run validate -- <user|payment> <data.json>');
  process.exitCode = 2;
} else {
  try {
    const result = validate(name, JSON.parse(readFileSync(file, 'utf8')));
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.valid ? 0 : 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
