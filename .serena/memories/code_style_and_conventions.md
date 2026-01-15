# Code Style and Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled (`strict: true`)
- **Target**: ES2017
- **Module System**: ESNext with bundler resolution
- **JSX**: react-jsx (new JSX transform)
- **Type Checking**: Incremental type checking enabled

## Code Style Patterns (from create-next-app defaults)

### Import Style
- Named imports preferred for React components
- Type imports use `import type` for type-only imports

### Component Structure
```typescript
// Function components with explicit return type annotation
export default function ComponentName() {
  return (
    <div className="...">
      {/* content */}
    </div>
  );
}
```

### Props Pattern
- Readonly props object with inline type definition
```typescript
interface ComponentProps {
  children: React.ReactNode;
}

function Component({
  children,
}: Readonly<ComponentProps>) {
  // ...
}
```

### Tailwind CSS Class Ordering
- Classes follow a logical order: layout → spacing → sizing → colors → typography → effects
- Dark mode variants specified after base classes: `dark:bg-black`

## Linting
- ESLint with `eslint-config-next` (TypeScript + Core Web Vitals presets)
- No custom lint rules defined beyond Next.js defaults

## Naming Conventions
- Components: PascalCase (`Home`, `RootLayout`)
- Files: kebab-case or camelCase for components (`page.tsx`, `layout.tsx`)
- Variables: camelCase
- Constants: UPPER_SNAKE_CASE (when applicable)
