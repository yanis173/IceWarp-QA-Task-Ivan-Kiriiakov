# IceWarp WebClient - Dashboard File Lifecycle Automation

Playwright + TypeScript automation of the assignment's test case: sign in
to IceWarp WebClient, create a file from the Dashboard, verify it, then
delete it and verify it's gone.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 9.x (`corepack enable` will pick up the version
  pinned in `package.json`)

## Setup

```bash
pnpm install
cp .env.example .env   # then fill in the real values
```

`.env` variables:

| Variable            | Description                                   |
| ------------------- | ---------------------------------------------- |
| `ICEWARP_HOSTNAME`  | Base URL of the IceWarp instance under test    |
| `ICEWARP_USERNAME`  | Login (full email) for that instance           |
| `ICEWARP_PASSWORD`  | Password for that instance                     |

`.env` is git-ignored - never commit real credentials.

## Running the tests

```bash
pnpm pw:test      # headless run
pnpm pw:ui        # Playwright's interactive UI mode, useful while developing
```

Every run produces:

- An HTML report in `playwright-report/` - open it with
  `pnpm exec playwright show-report`.
- A JUnit XML report at `test-results/junit.xml` (consumed by GitLab CI's
  native Tests view - see below).
- On failure only: screenshot, video and trace, viewable with
  `pnpm exec playwright show-trace test-results/.../trace.zip`.

## Project structure

```
src/
  config.ts               # reads/validates the ICEWARP_* env vars
  types.ts                # NewFileType union ("document" | "spreadsheet" | "presentation")
  pages/
    LoginPage.ts           # sign-in flow (username -> Continue -> password -> Sign In)
    DashboardPage.ts        # Dashboard nav, right-click "New" menu, file create/verify/delete
tests/
  dashboard-file-lifecycle.spec.ts   # the test itself, parametrized per file type
playwright.config.ts        # reporters, retries, browser project
.gitlab-ci.yaml              # scheduled CI pipeline (see below)
```

The Page Object classes hold all Playwright locators and interactions;
the spec file only orchestrates them, so the "what" (test steps) stays
readable and separate from the "how" (selectors, waits, workarounds).


## CI/CD (GitLab)

`.gitlab-ci.yaml` runs the suite in the official
`mcr.microsoft.com/playwright` Docker image (browsers preinstalled, pinned
to match the `@playwright/test` version in `package.json`).

**Scheduling:** the pipeline itself doesn't define a cron - create a
Pipeline Schedule under the project's *Settings > CI/CD > Schedules* and
point it at this file. The job's `rules` fire for that schedule
(`CI_PIPELINE_SOURCE == "schedule"`), plus allow a manual run from the
GitLab UI for debugging.

**Required CI/CD variables** (set under *Settings > CI/CD > Variables*,
or attached to a specific Pipeline Schedule):

| Variable            | Purpose                                                        |
| -------------------- | --------------------------------------------------------------- |
| `ICEWARP_URL`        | URL of the instance to test (also has a default in the YAML)   |
| `ICEWARP_USERNAME`    | Login - mark **Masked**                                          |
| `ICEWARP_PASSWORD`    | Password - mark **Masked** and **Protected**                     |
| `SELENIUM_GRID_URL`   | Address of a remote browser grid (optional - see note below)   |
