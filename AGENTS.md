# Agent Guidelines for VTT Blood Hunter

## Build & Test Commands
- **REQUIRED**: `npm run lint` must pass before every commit/push
- **REQUIRED**: Bump version in `module.json` before every PR (ask if major/minor/patch if unsure)
- `npm run lint` - Lint all JavaScript files in scripts/
- `npm run lint:fix` - Auto-fix linting issues (run this first if lint fails)
- `npm run validate` - Validate module.json structure
- `npm run build` - Production build (webpack)
- `npm run dev` - Development build with watch mode
- `npm run build:packs` - Compile compendiums from packData/
- `npm run build:all` - Build compendiums + code (run before testing changes)
- `npm run package` - Create distribution zip

## Code Style
- **Imports**: ES6 modules (`import`/`export`), relative paths for local modules
- **Formatting**: 2-space indent, single quotes, semicolons required, no trailing spaces
- **Naming**: camelCase for functions/variables, PascalCase for classes, UPPER_CASE for constants
- **Types**: No TypeScript - plain JavaScript with JSDoc comments for complex functions
- **Error Handling**: Use try/catch, log errors with `console.error()`, Foundry VTT uses `ui.notifications`
- **Foundry Globals**: Use globals from eslint.config.js (game, CONFIG, Hooks, Actor, Item, etc.)
- **Module Structure**: Class-based exports, register on Hooks.once('init'), activate on Hooks.once('ready')
- **Never edit**: Files in `packs/` (auto-generated) - only edit source JSON in `packData/`
