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

Then open Rovo in Jira and ask "Can our next release go live?", or "Which of our upcoming releases are ready?"
for one table with every unreleased version (nearest release date first), its verdict and the failed checks
(`check-all-releases`, first 10 versions by date).

Demo data (two real versions, one GO WITH RISKS and one NO-GO):

```bash
JIRA_SITE=https://<site>.atlassian.net JIRA_EMAIL=<you> JIRA_TOKEN=<api token> node scripts/seed-demo.mjs SCRUM
```

The demo in the video runs on a free Atlassian developer site (`dms-release-gate.atlassian.net`, project `SHOP`) seeded with this script: version 1.0 comes out GO WITH RISKS, 1.1 comes out NO-GO.


## Demo video

https://youtu.be/gc8xQk8Q1Jc (2:23): Rovo answers GO WITH RISKS for version 1.0 and NO-GO for 1.1 on the demo site,
with the real Jira data and the test run.

## For judges

1. Open the [installation link](https://developer.atlassian.com/console/install/4f921b30-1b0e-4951-b96c-4312c4d7e0d0?signature=AYABeOXYXqcMrUncna%2FLOFp41aMAAAADAAdhd3Mta21zAEthcm46YXdzOmttczp1cy13ZXN0LTI6NzA5NTg3ODM1MjQzOmtleS83MDVlZDY3MC1mNTdjLTQxYjUtOWY5Yi1lM2YyZGNjMTQ2ZTcAuAECAQB4CxqLTo9l4lqXuFjNim1xJM%2Bp%2F3TVP9xHS2BrU5DRRucBlRoW%2Fl5Oxo2XF4%2FDwJgwPAAAAH4wfAYJKoZIhvcNAQcGoG8wbQIBADBoBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDGc4J62UDNdvDlsj9AIBEIA79KK3RbgNo5YQRUnbM%2FtLGZr8IkKaLNOk11Q8kDzAaAnspgmG7hqq%2FNvbQVJhXtYVFFfKjZ8BmLjSsx8AB2F3cy1rbXMAS2Fybjphd3M6a21zOmV1LXdlc3QtMTo3MDk1ODc4MzUyNDM6a2V5LzQ2MzBjZTZiLTAwYzMtNGRlMi04NzdiLTYyN2UyMDYwZTVjYwC4AQICAHi9bVMAkme4qVQX1fQHo6ePw3H40A7cGfz7yrmSfBWMXgF3UJgC%2BkDpGjvBI%2ByPnLLQAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQM3RrzgYVXCd1bTevFAgEQgDs304SnJtx1Jt%2FFEPJSr97FGyCLcX3IZu8xmjaaFrP%2F3v%2FI1NTkq2CE1pY95XRlEri5whiAFbAhTlWLogAHYXdzLWttcwBLYXJuOmF3czprbXM6dXMtZWFzdC0xOjcwOTU4NzgzNTI0MzprZXkvNmMxMjBiYTAtNGNkNS00OTg1LWI4MmUtNDBhMDQ5NTJjYzU3ALgBAgIAeDYASx0XCjkny4iLV6vz%2BKtEGSGT6kdt0QRpkn6D%2FlVEAVuhq9BnCrlF%2F5GpMzTeIVQAAAB%2BMHwGCSqGSIb3DQEHBqBvMG0CAQAwaAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAydyNH45KW6V8dT67sCARCAOxIFthHAfY4%2B%2F103tef6F%2B2tScj42nFQNZUY%2BWGC62fgGRRqDqMrVwkL1wKgL%2B7t6PX46iuIFa%2FufXv4AgAAAAAMAAAQAAAAAAAAAAAAAAAAAFTi2iacCr4WkiJ8dx%2FMs77%2F%2F%2F%2F%2FAAAAAQAAAAAAAAAAAAAAAQAAADJD4Dco6VKyq1xkH36esB8Ws%2BFVMs3%2BnwRlMas%2Bi5r5%2ByKeWgmZb8RktkFklhHKbH%2Bz62aHugcArZ1gdX5v%2BmFEcF4%3D&product=jira) and install Release Gate on a Jira Cloud site with Rovo enabled.
2. Seed demo data in any project (or use your own versions):
   `JIRA_SITE=https://<site>.atlassian.net JIRA_EMAIL=<you> JIRA_TOKEN=<api token> node scripts/seed-demo.mjs <PROJECT KEY>`
3. In Jira, open Ask Rovo, change the agent to **Release Gate** and ask "What is blocking version 1.0?" or
   "Can our next release go live?". Version 1.0 comes out GO WITH RISKS, 1.1 NO-GO. "Which of our upcoming
   releases are ready?" lists both in one table with the totals.

No configuration, no external accounts: the app only reads Jira (`read:jira-work`).

Built by Design Master Solutions LLC for Codegeist 2026. MIT.
