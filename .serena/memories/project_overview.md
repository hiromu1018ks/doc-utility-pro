# doc-utility-pro Project Overview

## Project Purpose
This is a Next.js project bootstrapped with `create-next-app`. The project name "doc-utility-pro" suggests it may be intended as a document utility application, but currently it contains only the default Next.js starter template.

## Tech Stack
- **Framework**: Next.js 16.1.2 (App Router)
- **UI Library**: React 19.2.3
- **Language**: TypeScript 5 (strict mode enabled)
- **Styling**: Tailwind CSS 4
- **Package Manager**: pnpm
- **Fonts**: Geist Sans, Geist Mono (via next/font/google)

## Codebase Structure
```
doc-utility-pro/
├── app/              # Next.js App Router directory
│   ├── layout.tsx    # Root layout with font configuration
│   ├── page.tsx      # Home page component
│   ├── globals.css   # Global styles
│   └── favicon.ico   # Site icon
├── public/           # Static assets
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── next.config.ts    # Next.js configuration
└── eslint.config.mjs # ESLint configuration
```

## Path Aliases
- `@/*` maps to the project root (`./`)

## Current Status
The project is in initial state with default create-next-app template. No custom functionality has been implemented yet.
