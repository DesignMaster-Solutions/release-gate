# Release Gate for Jira

A Rovo agent that answers one question for a team about to ship: **can this release go live?**

The agent never counts issues itself. The `check-release` action reads the version and its issues
from Jira and runs fixed rules; the model only explains the result and suggests the smallest next step.
Same issue keys in, same verdict out.

**On the Atlassian Marketplace** (free, approved November 13, 2026):
https://marketplace.atlassian.com/apps/2098465123/release-gate-for-jira

## First result in Jira

You need a Jira Cloud site with Rovo available, permission to read the project, and a version
with issues assigned through **Fix versions**. Installation requires an administrator.

1. Open the [Marketplace listing](https://marketplace.atlassian.com/apps/2098465123/release-gate-for-jira),
   choose **Get it now**, and select your Jira site. If already installed, continue in Jira.
2. Open the project, choose **Ask Rovo**, then open the agent selector next to **Rovo**.
   Search for **Release Gate** and select it. Asking the default Rovo agent is not the same step.
3. Send `Check release readiness for project SHOP, version 1.0. Show the verdict, failed checks and issue keys.`
   Replace `SHOP` and `1.0` with your project key and exact version name.
4. Read the verdict and the issue keys in each failed check. Open those issues, address the
   underlying work in Jira, then ask again. Release Gate reads data; it does not change issues,
   move release dates, or release a version for you.

No terminal, API token, seed script, or Forge registration is needed to use the installed app.
The development instructions further down are for people building the app.

## Worked example: why the same demo now says NO-GO

On **November 18, 2026**, we ran the prompt above in our QA Jira site with the installed
Release Gate agent. This is a real QA result, not a customer testimonial or a promise that
your project will return the same verdict.

| Input or result | Observed value |
|---|---|
| Project / version | `SHOP` / `1.0` |
| Verdict | **NO-GO** |
| Open / done | **2 / 2** |
| Release date | **November 12, 2026**, confirmed in Jira |
| No open bugs | Failed: `SHOP-3`, Shipping quote rounds cents wrong for PR |
| Open work has owner | Failed: `SHOP-4`, Write release notes for 1.0 |
| Not overdue | Failed: `SHOP-4`, `SHOP-3` |

The older video below shows **GO WITH RISKS** for 1.0. The release date has since passed
while those two issues remain open, so the overdue rule now makes it **NO-GO**. A changing
verdict is expected when dates or Jira data change; the video is a dated demonstration.

On November 19, we found why these values differed: the Forge source still rounded the remaining hours to the end of the release date, while the public guide repository had already switched to UTC calendar days. The deployable source now uses UTC date boundaries. For this same QA input, the action returns **-6** on November 18; a release due today is **0**, and becomes overdue on the next UTC date. Focused regression tests cover these boundaries. This corrects the deterministic action result; a post-deploy Rovo interaction remains unverified.

### Same issues on 20 November 2026

The live SHOP 1.0 issues were read again from Jira on 20 November 2026 and passed through `releaseFacts`, the function the deployed `check-release` action uses to decide the verdict. Nothing in the version had changed: release date 12 November 2026, SHOP-1 and SHOP-2 done, SHOP-3 an open bug, SHOP-4 an open task with no assignee.

| Input or result | Observed value |
|---|---|
| Project / version | `SHOP` / `1.0` |
| Verdict | **NO-GO** |
| Days left | **-8** |
| Open / done | **2 / 2** |
| No open bugs | Failed: `SHOP-3`, Shipping quote rounds cents wrong for PR |
| Open work has owner | Failed: `SHOP-4`, Write release notes for 1.0 |
| Not overdue | Failed: `SHOP-4`, `SHOP-3` |

18 November was -6 for this release date. 20 November is -8. The function counts UTC calendar dates, so two later dates are two days further overdue. A release due on the day of the check is still 0. This run called the function with that Jira payload. A new Rovo chat was not opened.

The useful next steps are to resolve the bug and assign the release-notes task. The team
also needs to finish the remaining work or agree on a realistic new release date in Jira.
Assigning the task alone does not clear the bug or the overdue check. Merely moving the
date does not complete the work. Ask again after the actual changes; this example does
not claim those fixes were performed.

[Install Release Gate free and check your own version](https://marketplace.atlassian.com/apps/2098465123/release-gate-for-jira).

### If your first check does not match

- **Agent missing:** confirm the app is installed on the same Jira site and that Rovo is available;
  ask the site administrator to check access. Do not register a new Forge app.
- **Project not found or no permission:** use the project key (for example `SHOP`, not `Storefront`)
  and confirm you can open that project's issues.
- **Version not found:** use its exact name. With no name, the app chooses the next unreleased,
  non-archived version by release date; name the version explicitly when comparing results.
- **Zero issues:** check the issues' **Fix versions** field. An empty version is **GO WITH RISKS**,
  not a verified green release.
- **An overview omits your version:** only the first ten eligible versions are checked.
  Ask for your version by name. When the action reports that only the first 1,000 issues were
  read, the counts and verdict may be incomplete; do not treat them as a complete release audit.

**GO** means the listed checks passed for the data read. It is not a deployment approval,
security review, or guarantee that all work is complete: owned, non-blocking open tasks can
still pass these checks.

| Check | Rule | Effect |
|---|---|---|
| `no_open_blockers` | No unfinished Highest/Blocker/Critical issue | NO-GO |
| `not_overdue` | Release date not passed while work is open | NO-GO |
| `no_open_bugs` | No unfinished Bug | risk |
| `open_work_has_owner` | Every unfinished issue has an assignee | risk |
| `done_has_resolution` | Done issues carry a resolution | risk |
| `has_issues` | The version has at least one issue | risk |
| `has_release_date` | The version has a release date | risk |

Runs on Atlassian: no external egress, no storage outside Jira, read-only scopes.

## Development only

```bash
npm install
npm test                 # rules, no Jira needed
forge register && forge deploy && forge install --product jira
```

Then open Rovo in Jira and ask "Can our next release go live?", or "Which of our upcoming releases are ready?"
for one table with every unreleased version (nearest release date first), its verdict and the failed checks
(`check-all-releases`, first 10 versions by date).

The verified user path above uses Rovo. The project-page source in this public repository is
not a guarantee that a sidebar page is available in your installed version.

Demo data (the seed script creates two versions; the video recorded one GO WITH RISKS and one NO-GO; current QA numbers are in the worked example above):

```bash
JIRA_SITE=https://<site>.atlassian.net JIRA_EMAIL=<you> JIRA_TOKEN=<api token> node scripts/seed-demo.mjs SCRUM
```

The video used a free Atlassian developer site (`dms-release-gate.atlassian.net`, project `SHOP`)
seeded with this script. Its recorded verdicts depend on the dates and data at recording time;
see the newer worked example above.


## Demo video

https://youtu.be/gc8xQk8Q1Jc (2:23): Rovo answers GO WITH RISKS for version 1.0 and NO-GO for 1.1 on the demo site,
with the real Jira data and the test run.

## For judges

1. Open the [installation link](https://developer.atlassian.com/console/install/4f921b30-1b0e-4951-b96c-4312c4d7e0d0?signature=AYABeOXYXqcMrUncna%2FLOFp41aMAAAADAAdhd3Mta21zAEthcm46YXdzOmttczp1cy13ZXN0LTI6NzA5NTg3ODM1MjQzOmtleS83MDVlZDY3MC1mNTdjLTQxYjUtOWY5Yi1lM2YyZGNjMTQ2ZTcAuAECAQB4CxqLTo9l4lqXuFjNim1xJM%2Bp%2F3TVP9xHS2BrU5DRRucBlRoW%2Fl5Oxo2XF4%2FDwJgwPAAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDGc4J62UDNdvDlsj9AIBEIA79KK3RbgNo5YQRUnbM%2FtLGZr8IkKaLNOk11Q8kDzAaAnspgmG7hqq%2FNvbQVJhXtYVFFfKjZ8BmLjSsx8AB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo3MDk1ODc4MzUyNDM6a2V5LzQ2MzBjZTZiLTAwYzMtNGRlMi04NzdiLTYyN2UyMDYwZTVjYwC4AQICAHi9bVMAkme4qVQX1fQHo6ePw3H40A7cGfz7yrmSfBWMXgF3UJgC%2BkDpGjvBI%2ByPnLLQAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQM3RrzgYVXCd1bTevFAgEQgDs304SnJtx1Jt%2FFEPJSr97FGyCLcX3IZu8xmjaaFrP%2F3v%2FI1NTkq2CE1pY95XRlEri5whiAFbAhTlWLogAHYXdzLWttcwBLYXJuOmF3czprbXM6dXMtZWFzdC0xOjcwOTU4NzgzNTI0MzprZXkvNmMxMjBiYTAtNGNkNS00OTg1LWI4MmUtNDBhMDQ5NTJjYzU3ALgBAgIAeDYASx0XCjkny4iLV6vz%2BKtEGSGT6kdt0QRpkn6D%2FlVEAVuhq9BnCrlF%2F5GpMzTeIVQAAAB%2BMHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAydyNH45KW6V8dT67sCARCAOxIFthHAfY4%2B%2F103tef6F%2B2tScj42nFQNZUY%2BWGC62fgGRRqDqMrVwkL1wKgL%2B7t6PX46iuIFa%2FufXv4AgAAAAAMAAAQAAAAAAAAAAAAAAAAAFTi2iacCr4WkiJ8dx%2FMs77%2F%2F%2F%2F%2FAAAAAQAAAAAAAAAAAAAAAQAAADJD4Dco6VKyq1xkH36esB8Ws%2BFVMs3%2BnwRlMas%2Bi5r5%2ByKeWgmZb8RktkFklhHKbH%2Bz62aHugcArZ1gdX5v%2BmFEcF4%3D&product=jira) and install Release Gate on a Jira Cloud site with Rovo enabled.
2. Seed demo data in any project (or use your own versions):
   `JIRA_SITE=https://<site>.atlassian.net JIRA_EMAIL=<you> JIRA_TOKEN=<api token> node scripts/seed-demo.mjs <PROJECT KEY>`
3. In Jira, open Ask Rovo, change the agent to **Release Gate** and ask "What is blocking version 1.0?" or
   "Can our next release go live?". On the QA project, compare the verdict and the issue keys with the
   worked example above. The video's GO WITH RISKS for 1.0 is the result from before that release date
   passed. "Which of our upcoming releases are ready?" lists the unreleased versions in one table with the totals.

No configuration, no external accounts: the app only reads Jira (`read:jira-work`).

Built by Design Master Solutions LLC for Codegeist 2026. MIT.
