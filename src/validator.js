import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

// Compile once. Do not coerce, insert defaults, or remove unknown fields.
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validators = Object.fromEntries(['user', 'payment'].map((name) => {
  const schema = JSON.parse(readFileSync(new URL(`../schemas/${name}.schema.json`, import.meta.url), 'utf8'));
  return [name, ajv.compile(schema)];
}));

export function validate(name, data) {
  if (!Object.hasOwn(validators, name)) throw new Error(`Unknown schema: ${name}. Choose user or payment.`);
  const check = validators[name];
  const valid = check(data);
  // Ajv replaces .errors on each call, so return a snapshot.
  return { valid, errors: structuredClone(check.errors ?? []) };
}
