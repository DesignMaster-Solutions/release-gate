// Deterministic release-readiness facts. The Rovo model explains these; it never invents them.

const DAY = 86_400_000;

function category(issue) {
  return issue.fields?.status?.statusCategory?.key ?? 'undefined'; // new | indeterminate | done
}

function key(issue) {
  return issue.key;
}

/**
 * @param {{name: string, releaseDate?: string, released?: boolean}} version
 * @param {Array<object>} issues Jira issues with fields: status, priority, issuetype, assignee, resolution, labels
 * @param {Date} now
 */
export function releaseFacts(version, issues, now = new Date()) {
  const open = issues.filter((i) => category(i) !== 'done');
  const isBug = (i) => (i.fields?.issuetype?.name ?? '').toLowerCase() === 'bug';
  const isBlocker = (i) => ['highest', 'blocker', 'critical'].includes((i.fields?.priority?.name ?? '').toLowerCase());
  const releaseDate = version.releaseDate ? new Date(`${version.releaseDate}T23:59:59Z`) : null;
  const daysLeft = releaseDate ? Math.ceil((releaseDate - now) / DAY) : null;

  const checks = [
    {
      id: 'no_open_blockers',
      ok: !open.some(isBlocker),
      evidence: open.filter(isBlocker).map(key),
      rule: 'No unfinished issue with priority Highest/Blocker/Critical.',
    },
    {
      id: 'no_open_bugs',
      ok: !open.some(isBug),
      evidence: open.filter(isBug).map(key),
      rule: 'No unfinished Bug in the release.',
    },
    {
      id: 'open_work_has_owner',
      ok: open.every((i) => i.fields?.assignee),
      evidence: open.filter((i) => !i.fields?.assignee).map(key),
      rule: 'Every unfinished issue has an assignee.',
    },
    {
      id: 'done_has_resolution',
      ok: issues.filter((i) => category(i) === 'done').every((i) => i.fields?.resolution),
      evidence: issues.filter((i) => category(i) === 'done' && !i.fields?.resolution).map(key),
      rule: 'Issues in a Done status carry a resolution (otherwise reports count them as open).',
    },
    {
      id: 'has_release_date',
      ok: Boolean(releaseDate),
      evidence: [],
      rule: 'The version has a release date.',
    },
    {
      id: 'not_overdue',
      ok: daysLeft === null || daysLeft >= 0 || open.length === 0,
      evidence: daysLeft !== null && daysLeft < 0 ? open.map(key) : [],
      rule: 'The release date has not passed while work is still open.',
    },
  ];

  const failed = checks.filter((c) => !c.ok);
  const hardFail = failed.some((c) => ['no_open_blockers', 'not_overdue'].includes(c.id));
  return {
    version: version.name,
    released: Boolean(version.released),
    release_date: version.releaseDate ?? null,
    days_left: daysLeft,
    total: issues.length,
    open: open.length,
    done: issues.length - open.length,
    verdict: failed.length === 0 ? 'GO' : hardFail ? 'NO-GO' : 'GO WITH RISKS',
    checks,
  };
}
