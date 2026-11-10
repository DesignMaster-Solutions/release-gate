import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releasesOverview } from '../src/facts.js';
import { pageRows } from '../src/view.js';

const issue = (k, cat, extra = {}) => ({
  key: k,
  fields: {
    status: { statusCategory: { key: cat } },
    priority: { name: extra.priority ?? 'Medium' },
    issuetype: { name: extra.type ?? 'Story' },
    assignee: extra.assignee === undefined ? { displayName: 'Ana' } : extra.assignee,
    resolution: cat === 'done' ? { name: 'Done' } : null,
  },
});
const now = new Date('2026-11-10T12:00:00Z');

test('project page rows: one per version, nearest first, failed checks with their evidence keys', () => {
  const overview = releasesOverview([
    { version: { name: '1.1', releaseDate: '2026-11-30' }, issues: [issue('S-9', 'new', { priority: 'Highest', assignee: null })] },
    { version: { name: '1.0', releaseDate: '2026-11-20' }, issues: [issue('S-1', 'done'), issue('S-2', 'indeterminate', { type: 'Bug' })] },
  ], now);
  const rows = pageRows(overview);
  assert.deepEqual(rows.map((r) => [r.version, r.verdict, r.appearance]), [
    ['1.0', 'GO WITH RISKS', 'warning'],
    ['1.1', 'NO-GO', 'danger'],
  ]);
  assert.deepEqual(rows[0].failed, ['Open bugs: S-2']);
  assert.deepEqual(rows[1].failed, ['Open blockers: S-9', 'Unowned work: S-9']);
  assert.equal(rows[0].open, '1 of 2 open');
  assert.equal(rows[0].when, '2026-11-20 (10 days left)');
});

test('an undated version with all work done fails only the release-date check', () => {
  const rows = pageRows(releasesOverview([{ version: { name: '2.0' }, issues: [issue('S-5', 'done')] }], now));
  assert.equal(rows[0].verdict, 'GO WITH RISKS');
  assert.deepEqual(rows[0].failed, ['No release date']);
  assert.equal(rows[0].when, 'no release date');
});
