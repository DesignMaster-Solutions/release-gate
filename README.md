# Release Gate for Jira

A Rovo agent that answers one question for a team about to ship: **can this release go live?**

The agent never counts issues itself. The `check-release` action reads the version and its issues
from Jira and runs fixed rules; the model only explains the result and suggests the smallest next step.
Same issue keys in, same verdict out.

| Check | Rule | Effect |
|---|---|---|
| `no_open_blockers` | No unfinished Highest/Blocker/Critical issue | NO-GO |
| `not_overdue` | Release date not passed while work is open | NO-GO |
| `no_open_bugs` | No unfinished Bug | risk |
| `open_work_has_owner` | Every unfinished issue has an assignee | risk |
| `done_has_resolution` | Done issues carry a resolution | risk |
| `has_release_date` | The version has a release date | risk |

Runs on Atlassian: no external egress, no storage outside Jira, read-only scopes.

## Run

```bash
npm install
npm test                 # rules, no Jira needed
forge register && forge deploy && forge install --product jira
```

Then open Rovo in Jira and ask "Can our next release go live?".

Demo data (two real versions, one GO WITH RISKS and one NO-GO):

```bash
JIRA_SITE=https://<site>.atlassian.net JIRA_EMAIL=<you> JIRA_TOKEN=<api token> node scripts/seed-demo.mjs SCRUM
```

Built by Design Master Solutions LLC for Codegeist 2026. MIT.
