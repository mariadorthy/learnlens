# LearnLens — Setup and Installation

## 1. Overview

This document explains how to set up and run the **LearnLens** project in a local development environment.

The setup process may vary depending on the technologies used in the final implementation. The commands and environment variables in this document should be kept synchronized with the actual project configuration.

---

## 2. Prerequisites

Before setting up LearnLens, make sure the following are installed:

* **Git**
* **Node.js**
* **npm** or the package manager used by the project
* A supported web browser
* Access to any required database
* Access to any required AI service/API

Verify the basic installations:

```bash
git --version
node --version
npm --version
```

> Use the Node.js version specified by the project's `package.json`, `.nvmrc`, or deployment configuration if one is provided.

---

## 3. Clone the Repository

Clone the LearnLens repository:

```bash
git clone <repository-url>
```

Move into the project directory:

```bash
cd LearnLens
```

Replace `<repository-url>` with the actual repository URL.

---

## 4. Install Dependencies

Install the project dependencies:

```bash
npm install
```

If the project uses a different package manager, use the corresponding lock file and command.

Examples:

```bash
yarn install
```

or:

```bash
pnpm install
```

The package manager should match the one used by the project's dependency lock file.

---

## 5. Environment Configuration

LearnLens may require environment variables for services such as the database, AI analysis, code execution, or authentication.

Create a local environment file from the project's example file if available:

```bash
cp .env.example .env
```

Then configure the required values.

Example structure:

```env
DATABASE_URL=
AI_API_KEY=
CODE_EXECUTION_URL=
```

The exact variables must match the environment configuration used by the implementation.

### Important

Do not commit secrets or API keys to the repository.

The `.env` file should normally be included in `.gitignore`.

---

## 6. Database Setup

If LearnLens uses a database, configure the database connection using the required environment variable.

After configuring the database, run the project's database setup or migration commands.

For example:

```bash
npm run db:migrate
```

If seed data is required:

```bash
npm run db:seed
```

Use the actual database commands defined in the project rather than these examples if they differ.

The database should contain the information required for:

* Learners
* Learning concepts
* Roadmap progression
* Assessment attempts
* Code execution results
* Mistake patterns
* Knowledge Fingerprints
* Proof-of-Learn status

For the database structure, see [`database.md`](./database.md).

---

## 7. Start the Development Server

Start the LearnLens development server:

```bash
npm run dev
```

The terminal should display the local development address.

Open that address in a supported web browser.

---

## 8. Verify the Installation

After starting the application, verify the main LearnLens flow.

### Basic verification

* [ ] Application loads successfully.
* [ ] Dashboard is accessible.
* [ ] Learning roadmap is displayed.
* [ ] A concept can be selected.
* [ ] Theory assessment can be attempted.
* [ ] Coding assessment can be attempted.
* [ ] Code execution produces an appropriate result.
* [ ] Attempts and mistakes are recorded.
* [ ] Knowledge Fingerprint information is updated.
* [ ] Proof-of-Learn can evaluate the learner's evidence.
* [ ] An Adaptive Challenge can be provided when a weakness is identified.

---

## 9. Production Build

To create a production build:

```bash
npm run build
```

After a successful build, use the project's production start command:

```bash
npm start
```

The exact commands depend on the framework and deployment configuration used by the final implementation.

---

## 10. Troubleshooting

### Dependencies fail to install

Try removing the installed dependencies and lockfile only if appropriate for the project, then reinstall:

```bash
rm -rf node_modules
npm install
```

Do not remove the lockfile unnecessarily, as it helps maintain reproducible dependency versions.

---

### Environment variables are missing

Check that:

* `.env` exists.
* Required variables are configured.
* Variable names exactly match those expected by the application.
* API keys and credentials are valid.

---

### Database connection fails

Check:

* Database service is running.
* `DATABASE_URL` or equivalent variable is correct.
* Database credentials are valid.
* Required migrations have been applied.

---

### Code execution is unavailable

Check that the configured code execution service or execution environment is available and that its connection settings are correctly configured.

---

## 11. Development Workflow

A typical local development workflow is:

```text
Clone Repository
      ↓
Install Dependencies
      ↓
Configure Environment
      ↓
Configure Database
      ↓
Run Migrations / Seed Data
      ↓
Start Development Server
      ↓
Test LearnLens Learning Flow
```

---

## 12. Security Notes

For local and production environments:

* Never commit API keys.
* Never expose secret credentials in frontend code.
* Keep environment files out of version control.
* Validate learner-submitted code before execution.
* Restrict code execution resources appropriately.
* Keep database credentials private.

---

## 13. Related Documentation

* [`architecture.md`](./architecture.md) — System architecture and component flow
* [`database.md`](./database.md) — Database structure
* [`api-documentation.md`](./api-documentation.md) — API reference
* [`testing.md`](./testing.md) — Testing and validation
* [`user-guide.md`](./user-guide.md) — Learner usage guide

---

## 14. Important Note

This document is intended to describe the setup of the **actual LearnLens implementation**.

As the project evolves, installation commands, environment variables, database commands, and service configuration should be updated to match the final codebase.
