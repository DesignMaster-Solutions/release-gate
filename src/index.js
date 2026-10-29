import api, { route } from '@forge/api';
import { releaseFacts } from './facts.js';

const FIELDS = ['summary', 'status', 'priority', 'issuetype', 'assignee', 'resolution'];

async function jira(path, init) {
  const res = await api.asUser().requestJira(path, init);
  if (!res.ok) throw new Error(`Jira ${res.status}: ${await res.text()}`);
  return res.json();
}

async function findVersion(projectKey, versionName) {
  const versions = await jira(route`/rest/api/3/project/${projectKey}/versions`);
  if (versionName) {
    const v = versions.find((x) => x.name.toLowerCase() === versionName.toLowerCase());
    if (!v) throw new Error(`Version "${versionName}" not found in ${projectKey}. Known: ${versions.map((x) => x.name).join(', ')}`);
    return v;
  }
  // No name given: the next unreleased version by release date.
  const next = versions.filter((x) => !x.released && !x.archived)
    .sort((a, b) => (a.releaseDate ?? '9999').localeCompare(b.releaseDate ?? '9999'))[0];
  if (!next) throw new Error(`${projectKey} has no unreleased version.`);
  return next;
}

async function versionIssues(versionId) {
  const issues = [];
  let nextPageToken;
  do {
    const page = await jira(route`/rest/api/3/search/jql`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ jql: `fixVersion = ${versionId}`, fields: FIELDS, maxResults: 100, nextPageToken }),
    });
    issues.push(...page.issues);
    nextPageToken = page.nextPageToken;
  } while (nextPageToken && issues.length < 1000); // shortcut: caps at 1000 issues, page further if a real release is bigger
  return issues;
}

export async function checkRelease(payload) {
  const projectKey = (payload.projectKey ?? payload.context?.jira?.projectKey ?? '').toUpperCase();
  if (!projectKey) return { error: 'Ask the user for the Jira project key.' };
  try {
    const version = await findVersion(projectKey, payload.versionName);
    const facts = releaseFacts(version, await versionIssues(version.id));
    return { project: projectKey, ...facts };
  } catch (e) {
    return { error: e.message };
  }
}
