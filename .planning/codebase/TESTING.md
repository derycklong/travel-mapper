# Testing Patterns

**Analysis Date:** 2026-05-29

## Test Framework

**Runner:**
- Not detected. No test framework (`jest`, `vitest`, `mocha`, `playwright`, `cypress`) is configured in `package.json` dependencies or `devDependencies`.

**Assertion Library:**
- Not detected.

**Config Files:**
- No `jest.config.*`, `vitest.config.*`, or `.nycrc` files exist at the project root.

**Run Commands:**
- No test scripts exist in `package.json`. The only scripts are:
  ```bash
  npm run dev    # next dev -p 1337
  npm run build  # next build
  npm run start  # next start
  npm run lint   # eslint
  ```

## Test File Organization

**Location:**
- No test files exist within the `src/` directory.
- No test directories (`__tests__`, `tests/`, `spec/`) exist outside `node_modules`.

**Naming:**
- No naming convention established — no test files found in the project source.

**Structure:**
- No test structure established.

## Test Structure

- Not applicable — no test suite found.

## Mocking

**Framework:**
- Not detected.

**Patterns:**
- Not applicable — no test files found in source.

## Fixtures and Factories

**Test Data:**
- Not detected. No fixture files, seed data files, or test factories found.

**Location:**
- No fixture directories exist.

## Coverage

**Requirements:**
- None enforced. No coverage tool configured.
- `/coverage` is listed in `.gitignore` (inherited from the default Next.js gitignore template), but this appears to be preemptive rather than intentional — no coverage tooling is installed.

**View Coverage:**
- No command available.

## Test Types

**Unit Tests:**
- Not implemented.
- No unit test files exist.
- No testing utilities (React Testing Library, etc.) are installed.

**Integration Tests:**
- Not implemented.
- No integration test files exist.

**E2E Tests:**
- Not implemented.
- Playwright, Cypress, and other E2E frameworks are not installed.

## Testing Infrastructure Gaps

The project has zero testing infrastructure:

1. **No test runner** — `jest`, `vitest`, or similar is not installed.
2. **No testing library** — `@testing-library/react`, `@testing-library/jest-dom`, and similar are not installed.
3. **No API test framework** — no supertest, node-fetch-native, or MSW for API route testing.
4. **No E2E tool** — no Playwright, Cypress, or Puppeteer.
5. **No snapshot testing** capability.

## Recommended Test Approach

Based on the project's tech stack (Next.js 16, React 19, TypeScript, Zustand, SQLite with better-sqlite3), the following additions would establish testing:

**Suggested dependencies:**
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
```

**For API routes** — vitest with route-level testing or a lightweight integration approach using the Next.js test utilities.

**For components** — React Testing Library with vitest for unit tests on components like `ItineraryCard`, `HeroSection`, `DayFilter`, and `Button`.

**For the store** — Direct unit testing of the Zustand store actions in `src/store/itinerary.ts`.

**Database mocking** — Consider using `better-sqlite3`'s `:memory:` database for test isolation instead of the production `itinerary.db`.

---

*Testing analysis: 2026-05-29*
