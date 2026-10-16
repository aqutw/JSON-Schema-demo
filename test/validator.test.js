import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { validate } from '../src/validator.js';

const fixture = (file) => JSON.parse(readFileSync(new URL(`../examples/${file}`, import.meta.url), 'utf8'));
const user = () => fixture('user.valid.json');
const checkCli = (...args) => spawnSync(process.execPath, ['src/cli.js', ...args], {
  cwd: new URL('..', import.meta.url), encoding: 'utf8',
});

for (const name of ['user', 'payment']) {
  for (const outcome of ['valid', 'invalid']) {
    test(`${name} ${outcome} fixture`, () => {
      assert.equal(validate(name, fixture(`${name}.${outcome}.json`)).valid, outcome === 'valid');
    });
  }
}
test('does not mutate data or insert schema defaults', () => {
  const data = user(); const original = structuredClone(data);
  assert.equal(validate('user', data).valid, true);
  assert.deepEqual(data, original);
  assert.equal(Object.hasOwn(data, 'tags'), false);
});
for (const [label, change, keyword] of [
  ['required', (data) => delete data.email, 'required'],
  ['email format', (data) => { data.email = 'oops'; }, 'format'],
  ['no coercion', (data) => { data.id = '1'; }, 'type'],
  ['minimum age', (data) => { data.age = 17; }, 'minimum'],
  ['no unknown fields', (data) => { data.extra = true; }, 'additionalProperties'],
  ['nested address', (data) => { data.address.postalCode = 'ABC'; }, 'pattern'],
  ['unique tags', (data) => { data.tags = ['dev', 'dev']; }, 'uniqueItems'],
  ['admin permissions', (data) => { data.role = 'admin'; }, 'required'],
]) {
  test(label, () => {
    const data = user(); change(data);
    const result = validate('user', data);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((error) => error.keyword === keyword));
  });
}
test('age boundaries, nullable nickname, and admin permissions', () => {
  for (const age of [18, 120]) {
    assert.equal(validate('user', { ...user(), age, nickname: null, role: 'admin', permissions: ['manage'] }).valid, true);
  }
  assert.equal(validate('user', { ...user(), age: 121 }).valid, false);
});
test('payment alternatives and mixed payload rejection', () => {
  assert.equal(validate('payment', { kind: 'transfer', bankCode: '004' }).valid, true);
  assert.equal(validate('payment', { kind: 'card', last4: '4242', bankCode: '004' }).valid, false);
});
test('error snapshots survive a subsequent successful validation', () => {
  const result = validate('user', {});
  const errors = structuredClone(result.errors);
  validate('user', user());
  assert.deepEqual(result.errors, errors);
  assert.ok(result.errors.length > 0);
});
test('unknown schemas fail with a useful error', () => {
  for (const name of ['missing', 'toString', '__proto__']) assert.throws(() => validate(name, {}), /Unknown schema/);
});
test('CLI exit codes distinguish valid, invalid and usage/read/parse errors', () => {
  assert.equal(checkCli('user', 'examples/user.valid.json').status, 0);
  const invalid = checkCli('user', 'examples/user.invalid.json');
  assert.equal(invalid.status, 1);
  assert.equal(JSON.parse(invalid.stdout).valid, false);
  for (const args of [[], ['missing', 'examples/user.valid.json'], ['user', 'missing.json'], ['user', 'README.md']]) {
    assert.equal(checkCli(...args).status, 2);
  }
});
