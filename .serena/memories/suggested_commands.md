# Suggested Commands

## Development Commands

### Start Development Server
```bash
pnpm dev
# Runs Next.js dev server on http://localhost:3000
# Supports hot reloading and Fast Refresh
```

### Build for Production
```bash
pnpm build
# Creates optimized production build in .next directory
```

### Start Production Server
```bash
pnpm start
# Starts production server (requires running pnpm build first)
```

### Run Linter
```bash
pnpm lint
# Runs ESLint on the codebase
```

## Package Management (pnpm)

### Install Dependencies
```bash
pnpm install
# Install all dependencies from package.json
```

### Add a Package
```bash
pnpm add <package-name>
# Add a runtime dependency
```

### Add a Dev Dependency
```bash
pnpm add -D <package-name>
# Add a development dependency
```

## System Utilities (Darwin/macOS)

### File Operations
```bash
ls -la          # List files with details (including hidden)
pwd             # Print working directory
cd <path>       # Change directory
find . -name "*.ts"  # Find TypeScript files recursively
```

### Search & Grep
```bash
grep -r "pattern" .  # Search for pattern in files recursively
rg "pattern"         # Faster alternative (ripgrep, if installed)
```

### Git Operations
```bash
git status      # Show working tree status
git add .       # Stage changes
git commit -m "message"  # Commit changes
git push        # Push to remote
git log --oneline  # Show commit history
```

## Next.js Specific

### Type Checking
```bash
pnpm next lint  # Run Next.js integrated linter
pnpm tsc --noEmit  # Type check without emitting files
```

### Clean Build
```bash
rm -rf .next    # Remove Next.js build cache
pnpm build      # Rebuild from scratch
```
