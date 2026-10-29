// Seeds a Jira Cloud project with two demo versions for the video:
// "1.0" (GO WITH RISKS) and "1.1" (NO-GO). Real issues, created through the REST API.
// Usage: JIRA_SITE=https://x.atlassian.net JIRA_EMAIL=... JIRA_TOKEN=... node scripts/seed-demo.mjs SCRUM

export const PLAN = [
  { version: '1.0', daysFromNow: 14, issues: [
    { summary: 'Checkout: save card for next purchase', type: 'Story', done: true },
    { summary: 'Order emails use the store logo', type: 'Story', done: true },
    { summary: 'Shipping quote rounds cents wrong for PR', type: 'Bug', assign: true },
    { summary: 'Write release notes for 1.0', type: 'Task', assign: false },
  ] },
  { version: '1.1', daysFromNow: -3, issues: [
    { summary: 'Payment webhook retried twice charges the customer twice', type: 'Bug', priority: 'Highest', assign: false },
    { summary: 'Refund button for store admins', type: 'Story', assign: true },
    { summary: 'Migrate coupons table', type: 'Task', done: true },
  ] },
];

const day = (n) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

async function main([projectKey]) {
  const { JIRA_SITE, JIRA_EMAIL, JIRA_TOKEN } = process.env;
  if (!projectKey || !JIRA_SITE || !JIRA_EMAIL || !JIRA_TOKEN) throw new Error('usage: JIRA_SITE JIRA_EMAIL JIRA_TOKEN node scripts/seed-demo.mjs <PROJECT>');
  const auth = 'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64');
  const jira = async (method, path, body) => {
    const r = await fetch(`${JIRA_SITE}/rest/api/3${path}`, {
      method, headers: { Authorization: auth, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body && JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${await r.text()}`);
    return r.status === 204 ? null : r.json();
  };
  const project = await jira('GET', `/project/${projectKey}`);
  const me = await jira('GET', '/myself');
  for (const v of PLAN) {
    const version = await jira('POST', '/version', { name: v.version, projectId: project.id, releaseDate: day(v.daysFromNow) });
    for (const i of v.issues) {
      const fields = { project: { id: project.id }, summary: i.summary, issuetype: { name: i.type }, fixVersions: [{ id: version.id }] };
      if (i.priority) fields.priority = { name: i.priority };
      if (i.assign || i.done) fields.assignee = { accountId: me.accountId };
      const created = await jira('POST', '/issue', { fields });
      if (i.done) {
        const { transitions } = await jira('GET', `/issue/${created.key}/transitions`);
        const t = transitions.find((x) => x.to?.statusCategory?.key === 'done');
        if (t) await jira('POST', `/issue/${created.key}/transitions`, { transition: { id: t.id } });
      }
      console.log(v.version, created.key, i.summary);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2)).catch((e) => { console.error(e.message); process.exit(1); });
