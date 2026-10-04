import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

const braces = require('braces');
const forkRoot = path.dirname(require.resolve('braces'));

test('all vulnerable dependency paths resolve to the reviewed braces fork', () => {
  assert.equal(require('braces/package.json').name, '@serverlesscreed/braces');
  assert.equal(require('braces/package.json').version, '3.0.3-tables.1');
  for (const consumer of ['micromatch', 'chokidar']) {
    const resolved = require.resolve('braces', { paths: [path.dirname(require.resolve(consumer))] });
    assert.equal(fs.realpathSync(resolved), fs.realpathSync(require.resolve('braces')), consumer);
  }
  for (const file of ['index.js', 'LICENSE', 'SECURITY.md', ...fs.readdirSync(path.resolve('vendor/braces/lib')).map(name => `lib/${name}`)]) {
    assert.equal(fs.readFileSync(path.join(forkRoot, file), 'utf8'), fs.readFileSync(path.resolve('vendor/braces', file), 'utf8'), file);
  }
});

test('deep balanced, unbalanced and mixed patterns fail before stack exhaustion', () => {
  const patterns = [
    '{'.repeat(4_000) + 'a,b' + '}'.repeat(4_000),
    '{'.repeat(4_000) + 'a',
    '('.repeat(4_000) + 'a' + ')'.repeat(4_000),
    '({'.repeat(2_000) + 'a,b' + '})'.repeat(2_000),
  ];
  for (const method of ['parse', 'compile', 'expand', 'stringify']) {
    for (const pattern of patterns) {
      assert.throws(() => braces[method](pattern), { code: 'ERR_BRACES_DEPTH' });
    }
  }
});

test('direct AST inputs cannot bypass the depth guard in recursive walkers', () => {
  for (const method of ['compile', 'expand', 'stringify']) {
    const root = { type: 'root', nodes: [] };
    let node = root;
    for (let i = 0; i < 1000; i++) {
      const child = { type: 'paren', nodes: [], parent: node };
      node.nodes.push(child);
      node = child;
    }
    node.nodes.push({ type: 'text', value: 'a' });
    assert.throws(() => braces[method](root), { code: 'ERR_BRACES_DEPTH' });
  }
});

test('normal globs, ranges, nesting and escaped literal braces retain their output', () => {
  assert.deepEqual(braces.expand('src/{main,renderer}/file{1..3}.ts'), [
    'src/main/file1.ts', 'src/main/file2.ts', 'src/main/file3.ts',
    'src/renderer/file1.ts', 'src/renderer/file2.ts', 'src/renderer/file3.ts',
  ]);
  assert.equal(braces.compile('src/**/*.{ts,tsx}'), 'src/**/*.(ts|tsx)');
  assert.deepEqual(braces.expand('{a,{b,c}}'), ['a', 'b', 'c']);
  assert.doesNotThrow(() => braces.compile('\\{'.repeat(1000)));
  const match = require('micromatch');
  assert.deepEqual(match(['a.ts', 'b.tsx', 'c.js'], '*.{ts,tsx}'), ['a.ts', 'b.tsx']);
});
