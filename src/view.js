// Pure view model for the project page: the same facts the Rovo agent explains, as table rows.

const LABEL = {
  no_open_blockers: 'Open blockers',
  no_open_bugs: 'Open bugs',
  open_work_has_owner: 'Unowned work',
  done_has_resolution: 'Done without resolution',
  has_release_date: 'No release date',
  not_overdue: 'Overdue',
};

const APPEARANCE = { GO: 'success', 'GO WITH RISKS': 'warning', 'NO-GO': 'danger' };

function when(r) {
  if (!r.release_date) return 'no release date';
  const d = r.days_left;
  if (d === 0) return `${r.release_date} (due today)`;
  if (d < 0) return `${r.release_date} (${-d} day${d === -1 ? '' : 's'} overdue)`;
  return `${r.release_date} (${d} day${d === 1 ? '' : 's'} left)`;
}

/** @param {{releases: Array<object>}} overview result of releasesOverview / checkAllReleases */
export function pageRows(overview) {
  return overview.releases.map((r) => ({
    version: r.version,
    verdict: r.verdict,
    appearance: APPEARANCE[r.verdict],
    when: when(r),
    open: `${r.open} of ${r.total} open`,
    failed: r.checks.filter((c) => !c.ok)
      .map((c) => (c.evidence.length ? `${LABEL[c.id]}: ${c.evidence.join(', ')}` : LABEL[c.id])),
  }));
}
