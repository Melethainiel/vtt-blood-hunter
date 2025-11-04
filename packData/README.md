# Compendium Source Data

This directory contains the source JSON files for the module's compendiums. These files are compiled into Foundry VTT's LevelDB format during the build process.

## Structure

- `blood-hunter-features/` - Blood Hunter class features and abilities
- `blood-hunter-items/` - Blood Hunter items and equipment

## Adding New Entries

1. Create a new JSON file in the appropriate directory
2. Use a descriptive filename (e.g., `crimson-rite.json`)
3. Follow the Foundry VTT item schema
4. Run `npm run build:packs` to compile

## JSON Format

Each JSON file should contain a single item following the Foundry VTT v11+ schema:

```json
{
  "_id": "uniqueid0001",
  "name": "Item Name",
  "type": "feat",
  "img": "icons/path/to/icon.webp",
  "system": {
    // System-specific data
  },
  "effects": [],
  "flags": {},
  "folder": null,
  "sort": 0,
  "ownership": {
    "default": 0
  }
}
```

## Important Notes

- **Never edit files in `packs/` directly** - they are auto-generated
- Each item must have a unique `_id`
- The `_id` should be descriptive and consistent
- Always rebuild packs after making changes: `npm run build:packs`
- Source files in this directory are version controlled
- Compiled packs are ignored by git (see `.gitignore`)

## Build Process

The build process uses `@foundryvtt/foundryvtt-cli` to compile:

```bash
npm run build:packs        # Compile compendiums only
npm run build:all          # Compile compendiums + code
npm run package            # Full build + create distribution zip
```
