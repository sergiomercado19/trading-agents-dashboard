# Frontend Audit & Improvement Plan

## Executive Summary

The TradingAgents Dashboard frontend is a React + TypeScript + Vite SPA with a well-structured design system (OKLCH tokens, utility classes) and a terminal-inspired dark aesthetic. The codebase is functional but has several areas that need hardening for production reliability, testability, and maintainability.

---

## Current Architecture

| Layer | Files | Status |
|-------|-------|--------|
| **Entry** | `main.tsx`, `App.tsx` | ✅ Clean |
| **Design System** | `index.css`, `ThemeProvider.tsx` | ✅ Well-structured OKLCH tokens |
| **API Layer** | `api/client.ts` | ⚠️ Minimal, no retry/typing |
| **Hooks** | 15 custom hooks in `hooks/` | ⚠️ Mixed patterns, no testing |
| **Components** | 25+ in `components/` | ⚠️ Inline styles, inconsistent props |
| **Pages** | 9 pages in `pages/` | ⚠️ Large components, logic mixed with UI |

---

## Critical Issues (P0)

### 1. No Test Infrastructure
- **Zero tests** — no Vitest, React Testing Library, or Playwright config
- No CI pipeline for typecheck/lint/test
- Cannot refactor safely

### 2. API Client is Untyped & Fragile
```typescript
// api/client.ts - issues:
- No request/response type safety (uses `any` effectively)
- No retry logic, no timeout handling
- No request cancellation (AbortController)
- Errors are thrown as generic `Error` with no status code access
```

### 3. SSE Hook (`useRunStream`) Has Race Conditions
- Multiple `addEventListener` without cleanup guards
- `raw.data ?? raw` is a hack for nested payload
- No reconnection logic on transient failure
- `closedRef` / `serverErrorRef` pattern is brittle

### 4. Inline Styles Everywhere
- 20+ files use `style={{ ... }}` objects
- Breaks design system consistency
- Hard to maintain, no theme overrides
- Prevents CSS-in-JS optimizations

### 5. Large Page Components Mix Logic & UI
- `SettingsPage.tsx`: 800+ lines, 3 sections, all data fetching in one component
- `ReportsPage.tsx`: 430+ lines, complex state machine
- `AnalyzePage.tsx`: 200+ lines, many props passed to `ControlPanel`

### 6. No Error Boundaries Per Feature
- Single `ErrorBoundary` at root only
- Failed API calls crash entire page sections

### 7. Magic Strings for API Paths
- `/api/chat/sessions/${id}` scattered across hooks
- No centralized route constants

### 8. No Loading/Skeleton States Standard
- Some use `if (loading) return <div>Loading...</div>`
- Others use inline conditionals
- No consistent `Skeleton` component

---

## High Priority (P1)

### 9. TypeScript Config Could Be Stricter
```json
// tsconfig.json missing:
"strictNullChecks": true,
"noUncheckedIndexedAccess": true,
"noImplicitReturns": true,
"noFallthroughCasesInSwitch": true,
"forceConsistentCasingInFileNames": true
```

### 10. Hook Return Types Not Exported for Reuse
- `useRunStream` exports interfaces but not the hook return type
- Consumers must duplicate type definitions

### 11. No Request Deduplication
- `useChatSessions` + `useChatSession` both fetch `/chat/sessions/${id}`
- `useRuns` polls every 5s while `useRunStream` also fetches runs

### 12. Component Prop Drilling
- `ControlPanel` receives 25+ props from `AnalyzePage`
- No context or compound component pattern

### 13. No Accessibility Audit
- Custom buttons/inputs may lack proper ARIA
- Focus management missing in modals/drawers
- Color contrast in "Modern" theme unverified

---

## Medium Priority (P2)

### 14. Bundle Size Unmonitored
- No `vite-bundle-analyzer` or `rollup-plugin-visualizer`
- Icons, charts, or heavy libs could bloat unnoticed

### 15. Icons Duplicated as TSX Wrappers
- 7 icon files: each `.svg` + `.tsx` wrapper = 14 files
- Could use Vite `?react` import or single sprite

### 16. No Storybook / Visual Regression
- Design system components undocumented
- No component playground for theme variants

### 17. Inconsistent Date/Number Formatting
- `formatDate` in `ReportsPage`, `toLocaleString` elsewhere
- No shared `formatters.ts`

### 18. No Internationalization Ready
- Hardcoded English strings everywhere
- Date/number formatting not locale-aware

### 19. DevTools Not Configured
- No React DevTools integration hint
- No component naming convention (`displayName`)

---

## Suggested Implementation Order

### Phase 1: Foundation (Week 1)
1. **Add test infrastructure**: Vitest + React Testing Library + Playwright
2. **Strict TS config**: Enable all strict flags
3. **Centralize API routes**: `api/routes.ts` with typed endpoints
4. **Rewrite `api/client.ts`**: Add AbortController, retry, typed responses

### Phase 2: Hooks & State (Week 2)
5. **Extract `useRunStream` into proper service** with reconnection
6. **Create `useApi` hook** for standard CRUD (loading/error/data pattern)
7. **Add request deduplication** (SWReact or custom)
8. **Standardize error handling**: `ApiError` class with status/code

### Phase 3: Components & Styles (Week 3)
9. **Migrate inline styles → CSS Modules**: restructure each component as `Component/Component.tsx` + `Component/Component.css`; import design tokens from `index.css`
10. **Create primitive components**: `Button`, `Input`, `Select`, `Card`, `Badge`, `Spinner`, `Skeleton` — each as directory with TSX + CSS
11. **Compound components** for complex UI (e.g., `Select` with `Option`, `Dialog` with `Trigger`/`Content`)
12. **Accessibility pass**: ARIA, focus traps, keyboard nav

### Phase 4: Pages Refactor (Week 4)
13. **Split `SettingsPage`** into 3 page-level components + shared state
14. **Extract `ReportReader` logic** into custom hook
15. **Introduce React Context** for cross-cutting state (theme, auth, notifications)

### Phase 5: Quality Gates (Week 5)
16. **CI pipeline**: typecheck → lint → test → build
17. **Bundle analyzer** in CI
18. **Visual regression** with Playwright/Chromatic
19. **Document design system** in Storybook

---

## Files to Create/Modify

| Priority | Action | Files |
|----------|--------|-------|
| P0 | Test setup | `vitest.config.ts`, `setupTests.ts`, `package.json` |
| P0 | API layer | `src/api/routes.ts`, `src/api/client.ts`, `src/api/types.ts` |
| P0 | Error types | `src/lib/errors.ts` |
| P1 | TS config | `tsconfig.json` |
| P1 | Hooks | `src/hooks/useApi.ts`, `src/hooks/useRunStream.ts` (refactor) |
| P2 | Primitives | `src/components/ui/Button/` (Button.tsx, Button.css), `Input/`, `Card/`, `Badge/`, `Spinner/`, `Skeleton/` |
| P2 | CSS Modules | Convert inline styles in top 10 files to `Component/Component.css` |
| P3 | Page splits | `src/pages/settings/General.tsx`, `ApiKeys.tsx`, `System.tsx` |
| P3 | Context | `src/context/NotificationContext.tsx` |
| P5 | CI | `.github/workflows/ci.yml` |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Refactoring breaks SSE | High | High | Phase 2 adds integration tests first |
| CSS migration visual regressions | Medium | Medium | Visual regression tests in Phase 3 |
| Hook API changes break pages | Medium | High | Codemods + TypeScript catches most |
| Bundle size increases | Low | Medium | Bundle analyzer in CI |
