# Task Completion Checklist

When completing a task in this project, ensure the following:

## Code Quality
- [ ] Run `pnpm lint` and fix any ESLint errors
- [ ] Ensure TypeScript compilation succeeds (no type errors)
- [ ] Check for console logs or debug code that should be removed

## Testing & Verification
- [ ] Test changes in development server (`pnpm dev`)
- [ ] Verify responsive design (mobile, tablet, desktop views)
- [ ] Check dark mode appearance if UI components are modified
- [ ] Test any user interactions (forms, buttons, links)

## Build Verification
- [ ] Run `pnpm build` to ensure production build succeeds
- [ ] Check for any build warnings or errors

## Before Committing
- [ ] Review git diff to ensure only intended changes are staged
- [ ] Write descriptive commit messages following the project's convention
- [ ] No sensitive data (API keys, tokens) included in changes

## Notes
- No test suite is currently configured in this project
- Consider adding tests (Jest, Vitest, or Playwright) for complex features
- Tailwind CSS 4 uses PostCSS - no separate build step for CSS needed
