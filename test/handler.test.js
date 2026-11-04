import { test } from 'node:test';
import assert from 'node:assert/strict';

// The project page resolver must build under ESM: @forge/resolver is CJS (exports.default).
test('index.js loads and exports the UI resolver handler', async () => {
  const mod = await import('../src/index.js');
  assert.equal(typeof mod.handler, 'function');
  assert.equal(typeof mod.checkAllReleases, 'function');
});
