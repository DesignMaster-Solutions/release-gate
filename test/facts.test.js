import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as facts from '../src/facts.js';
const { releaseFacts } = facts;

const issue = (k, cat, extra = {}) => ({
  key: k,
  fields: {
    status: { statusCategory: { key: cat } },
    priority: { name: extra.priority ?? 'Medium' },
    issuetype: { name: extra.type ?? 'Story' },
    assignee: extra.assignee === undefined ? { displayName: 'Ana' } : extra.assignee,
    resolution: cat === 'done' ? (extra.resolution === undefined ? { name: 'Done' } : extra.resolution) : null,
  },
});
const now = new Date('2026-11-10T12:00:00Z');

test('clean release is GO', () => {
  const f = releaseFacts({ name: '1.0', releaseDate: '2026-11-20' }, [issue('A-1', 'done'), issue('A-2', 'indeterminate')], now);
  assert.equal(f.verdict, 'GO');
  assert.equal(f.open, 1);
  assert.equal(f.days_left, 11);
});

test('open blocker is NO-GO with the issue as evidence', () => {
  const f = releaseFacts({ name: '1.0', releaseDate: '2026-11-20' }, [issue('A-3', 'new', { priority: 'Highest' })], now);
  assert.equal(f.verdict, 'NO-GO');
  assert.deepEqual(f.checks.find((c) => c.id === 'no_open_blockers').evidence, ['A-3']);
});

test('overdue with open work is NO-GO, overdue but finished is not', () => {
  const v = { name: '1.0', releaseDate: '2026-11-01' };
  assert.equal(releaseFacts(v, [issue('A-4', 'new')], now).verdict, 'NO-GO');
  assert.equal(releaseFacts(v, [issue('A-5', 'done')], now).verdict, 'GO');
});

test('soft problems are GO WITH RISKS', () => {
  const f = releaseFacts({ name: '1.0' }, [
    issue('A-6', 'new', { type: 'Bug' }),
    issue('A-7', 'new', { assignee: null }),
    issue('A-8', 'done', { resolution: null }),
  ], now);
  assert.equal(f.verdict, 'GO WITH RISKS');
  const ev = Object.fromEntries(f.checks.map((c) => [c.id, c.evidence]));
  assert.deepEqual(ev.no_open_bugs, ['A-6']);
  assert.deepEqual(ev.open_work_has_owner, ['A-7']);
  assert.deepEqual(ev.done_has_resolution, ['A-8']);
  assert.equal(f.checks.find((c) => c.id === 'has_release_date').ok, false);
});

test('overview orders unreleased versions by release date and counts verdicts', () => {
  const { releasesOverview } = facts;
  const o = releasesOverview([
    { version: { name: '2.0', releaseDate: '2026-12-01' }, issues: [issue('A-1', 'new', { priority: 'Highest' })] },
    { version: { name: '1.1' }, issues: [issue('A-2', 'done')] },
    { version: { name: '1.0', releaseDate: '2026-11-15' }, issues: [issue('A-3', 'new', { type: 'Bug' })] },
  ], now);
  // 1.1 has no release date: sorted last and a risk, not a GO
  assert.deepEqual(o.releases.map((r) => [r.version, r.verdict]), [['1.0', 'GO WITH RISKS'], ['2.0', 'NO-GO'], ['1.1', 'GO WITH RISKS']]);
  assert.deepEqual(o.summary, { go: 0, go_with_risks: 2, no_go: 1 });
});
