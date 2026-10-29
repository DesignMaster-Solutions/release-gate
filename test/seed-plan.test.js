import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseFacts } from '../src/facts.js';
import { PLAN } from '../scripts/seed-demo.mjs';

// The demo data must show both verdicts on camera; this fails if someone edits PLAN and loses one.
const asIssues = (v) => v.issues.map((i, n) => ({
  key: `D-${n}`,
  fields: {
    status: { statusCategory: { key: i.done ? 'done' : 'new' } },
    priority: { name: i.priority ?? 'Medium' },
    issuetype: { name: i.type },
    assignee: i.assign || i.done ? { displayName: 'Alan' } : null,
    resolution: i.done ? { name: 'Done' } : null,
  },
}));
const day = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

test('seed plan yields GO WITH RISKS for 1.0 and NO-GO for 1.1', () => {
  const verdicts = PLAN.map((v) => releaseFacts({ name: v.version, releaseDate: day(v.daysFromNow) }, asIssues(v)).verdict);
  assert.deepEqual(verdicts, ['GO WITH RISKS', 'NO-GO']);
});
