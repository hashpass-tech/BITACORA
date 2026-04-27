# Bitacora Web App

A modern web application built with Next.js 15, TypeScript, and Tailwind CSS.

## Getting Started

### Development

```bash
# From workspace root
pnpm -C apps/web dev

# From app directory
cd apps/web
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

### Building

```bash
pnpm -C apps/web build
```

### Production

```bash
pnpm -C apps/web start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/         # React components
└── lib/               # Utilities and helpers
```

## Features

- ⚡ **Next.js 15** - Latest React framework
- 🎨 **Tailwind CSS** - Utility-first styling
- 📘 **TypeScript** - Type-safe development
- 🔗 **Workspace Integration** - Uses `@bitacora/shared`
- 📱 **Responsive** - Mobile-friendly by default
- ♿ **Accessibility** - Built with a11y in mind

## Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Type checking
```

## Using Shared Packages

Import from `@bitacora/shared`:

```typescript
import { store } from '@bitacora/shared/store';
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
