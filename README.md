# IceWarp QA Automation

Playwright + TypeScript automation for two independent assignments:

1. **Dashboard file lifecycle** - sign in to IceWarp WebClient, create a
   file from the Dashboard, verify it, then delete it and verify it's gone.
2. **icewarp.com contact form** - fill and submit the public contact form,
   then connect directly to the `Customer` database to verify the
   submitted lead was stored correctly and read back its `cust_id`.

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
| `CONTACT_SITE_URL`  | Base URL of the marketing site (default `https://icewarp.com`) |
| `DB_HOST` / `DB_PORT` | Address of the `Customer` database             |
| `DB_USER` / `DB_PASSWORD` | Credentials for the `Customer` database    |
| `DB_NAME`           | Database name (default `Customer`)             |
| `DB_TABLE`          | Table name (default `PotentialCustomers`)      |

`.env` is git-ignored - never commit real credentials.

## Running the tests

```bash
pnpm pw:test      # headless run, both spec files
pnpm pw:ui        # Playwright's interactive UI mode, useful while developing
pnpm exec playwright test tests/contact-form.spec.ts   # just the contact-form scenario
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
  config.ts               # reads/validates the ICEWARP_* env vars (WebClient scenario)
  types.ts                # NewFileType union ("document" | "spreadsheet" | "presentation")
  pages/
    LoginPage.ts           # sign-in flow (username -> Continue -> password -> Sign In)
    DashboardPage.ts        # Dashboard nav, right-click "New" menu, file create/verify/delete
  contact/
    config.ts              # reads CONTACT_SITE_URL
    types.ts                # ContactFormData, CountryOption, RoleOption
    testDataFactory.ts      # ContactTestDataFactory - builds randomized, unique form data
    ContactPage.ts          # opens the right-side contact panel, fills/submits the form
  db/
    config.ts               # reads/validates the DB_* env vars
    types.ts                 # PotentialCustomerRecord (maps to the cust_* columns)
    PotentialCustomersRepository.ts   # connect/disconnect/findByEmail against MySQL
    verifyCustomerRecord.ts  # field-by-field assertions + cust_id lookup
tests/
  dashboard-file-lifecycle.spec.ts   # WebClient test, parametrized per file type
  contact-form.spec.ts               # contact-form test: UI part + "blind" DB part
playwright.config.ts        # reporters, retries, browser project
.gitlab-ci.yaml              # scheduled CI pipeline (see below)
```

The Page Object classes hold all Playwright locators and interactions;
the spec files only orchestrate them, so the "what" (test steps) stays
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
