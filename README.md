# Visez Le Maître

A web app for managing palet vendéen contests. Built with SvelteKit, Tailwind CSS, and Drizzle ORM.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Code Rules

### Language

- **Code** (variables, functions, files, comments): English
- **UI** (labels, buttons, messages shown to users): French

### Formatting

- Indentation: 4 spaces (no tabs)
- Use `lang="ts"` in all `<script>` blocks

### Naming Conventions

- **Files and folders**: `kebab-case` (e.g. `context-menu.svelte`, `seed-groups.ts`)
- **Components**: `PascalCase` when imported (e.g. `import ContextMenu from '...'`), but the file is still `kebab-case`
- **Variables and functions**: `camelCase` (e.g. `isAdmin`, `startPools`)
- **Constants**: `UPPER_SNAKE_CASE` only for true global constants (e.g. `DEFAULT_SCORE_TARGET`)
- **Types and interfaces**: `PascalCase` (e.g. `Contest`, `TeamMember`)
- **Database tables**: `snake_case` plural (e.g. `contests`, `team_members`, `seed_groups`)
- **Database columns**: `snake_case` (e.g. `score_target`, `created_at`)

### Project Structure

```
src/
  routes/          — Pages and API endpoints (file-based routing)
  lib/
    components/    — Reusable Svelte components
    server/        — Server-only code (DB, business logic)
    assets/        — Static assets (images, icons)
```

### Git

- Never commit directly to `main` — use feature branches
- Branch naming: `feature/short-description` or `fix/short-description`
- Commit messages: short, imperative tense, in English (e.g. "add contest creation form")

## Tech Stack

- **Framework**: SvelteKit (Svelte 5)
- **Styling**: Tailwind CSS
- **Database**: SQLite (local) / PostgreSQL (Vercel)
- **ORM**: Drizzle ORM
