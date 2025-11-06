# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.10] - 2025-11-06

### Added
- **Individual Crimson Rite compendium items** - Added 6 new background-type features for each Crimson Rite type (Issue #33)
  - Rite of the Flame (level 1, fire damage)
  - Rite of the Frozen (level 1, cold damage)
  - Rite of the Storm (level 1, lightning damage)
  - Rite of the Dead (level 14, necrotic damage)
  - Rite of the Oracle (level 14, psychic damage)
  - Rite of the Roar (level 14, thunder damage)
  - These items are marked as `type: "background"` instead of `type: "class"`
  - Allows UI filtering to display only the main Crimson Rite activation feature in bonus actions
  - Each rite includes appropriate module flags (`crimsonRite: true`, `riteType: "<key>"`) for automatic detection
  - Main Crimson Rite feature retains activation dialog functionality

### Technical Details
- New compendium items in `packData/blood-hunter-features/`:
  - `rite-of-flame.json`, `rite-of-frozen.json`, `rite-of-storm.json`
  - `rite-of-dead.json`, `rite-of-oracle.json`, `rite-of-roar.json`
- All items use `system.type.value: "background"` to enable filtering
- Detection logic in `scripts/crimson-rite.js` unchanged (flag-based priority detection works automatically)

## [1.2.9] - 2025-11-05

### Fixed
- **Feature sync filter** - Removed overly restrictive `bloodHunter` subtype filter that prevented syncing of valid Blood Hunter features from D&D Beyond imports (scripts/feature-sync.js:106-109)
  - Now filters by `item.type === 'feat' && item.system?.identifier` only
  - Allows all features with identifiers to be candidates for syncing
  - Improves D&D Beyond import compatibility
- **Feature deletion bug** - Fixed incorrect embedded document deletion method (scripts/feature-sync.js:77)
  - Changed from `actorFeature.delete()` (doesn't work for embedded documents) 
  - To `actor.deleteEmbeddedDocuments('Item', [actorFeature.id])` (correct API)

### Added
- **Enhanced sync preview dialog** - Feature sync now shows a dry-run preview before making changes
  - Pre-matches all features with compendium entries before showing confirmation
  - Displays matched features (green checkmark) that will be synced
  - Displays unmatched features (gray circle) that will be skipped
  - Categorized sections with counts for better UX
  - New localization keys: `WillSync`, `WillSkip`, `NoMatched`, `NoUnmatched`
  - Users can see exactly what will happen before proceeding

### Changed
- **Sync workflow optimization** - Eliminated redundant compendium lookups
  - New `_prepareSyncPlan()` method performs dry-run analysis once
  - Sync operation uses pre-matched features from plan
  - Reduces compendium queries from 2x to 1x per feature

### Technical Details
- New method: `_prepareSyncPlan(actor, pack)` returns `{ matched, unmatched, total }`
- Updated `_confirmSync(actor, syncPlan)` to display categorized preview with HTML formatting
- Updated `syncFeatures()` to use sync plan results instead of re-querying compendium
- Filter changed from `item.system?.type?.subtype === 'bloodHunter'` to `item.type === 'feat' && item.system?.identifier`
- Proper embedded document API: `actor.deleteEmbeddedDocuments('Item', [id])`

## [1.2.3] - 2025-11-05

### Added
- **Reusable actor sheet button system** - New `ActorSheetButton` utility class for adding custom buttons to actor sheets
  - Compatible with both dnd5e v2 and v3 sheet structures
  - Supports localization, custom icons, and click handlers
  - Three Blood Hunter buttons implemented: Update Features, Crimson Rite, Lycan Transformation
  - Provides consistent UI/UX across different sheet types (scripts/actor-sheet-button.js)

### Fixed
- **DAE integration runtime error** - Fixed missing `getRiteIcon()` method that caused crashes when DAE module was active (scripts/integrations.js:169)
  - Moved `getRiteIcon()` from `CrimsonRite` class to `BloodHunterUtils` as static method for shared access
  - Now properly supports only the 6 official Crimson Rites (flame, frozen, storm, dead, oracle, roar)

### Changed
- **Removed unofficial rites** - `getRiteIcon()` no longer includes non-official rites (corrosion, toxin, dawn)
- **Code consolidation** - Removed duplicate `getRiteIcon()` implementation from `CrimsonRite` class (21 lines removed)
- **Improved architecture** - Order of the Lycan now uses centralized button system instead of custom implementation

### Technical Details
- New utility class: `ActorSheetButton` in scripts/actor-sheet-button.js with methods:
  - `addButton(html, config)` - Adds button to actor sheet with localization support
  - `findTargetElement(html)` - Auto-detects dnd5e v2/v3 sheet structure
- `BloodHunterUtils.getRiteIcon(riteType)` now centralized in scripts/utils.js:103-116
- Button styling added to styles/blood-hunter.css with hover effects
- Localization keys: `UpdateFeaturesButton`, `CrimsonRiteButton`, `HybridTransformationButton`

## [1.2.2] - 2025-11-05

### Fixed
- **Crimson Rite effect duration** - DAE special duration flags now properly applied when DAE module is active, enabling automatic removal of Crimson Rite effects after short/long rest

### Changed
- **Code cleanup** - Removed ~130 lines of dead code:
  - Removed unused utility functions: `calculateRiteDamage()`, `createChatMessage()`, `isValidRiteWeapon()`, `formatDuration()`, `rollHemocraft()`
  - Removed unused macro helpers: `createItemMacro()`, `createCrimsonRiteMacro()`, `createBloodCurseMacro()`, `enhanceItemForMidiQOL()`
  - Removed duplicate `getRiteIcon()` function from integrations.js
  - Removed unused `setupDAEDurations()` function

### Technical Details
- Effect data now includes `flags.dae.specialDuration: ['shortRest', 'longRest']` when DAE is active (scripts/integrations.js:198-201)
- Fallback to manual removal via `dnd5e.restCompleted` hook when DAE is not active (scripts/blood-hunter.js:68-86)

## [1.2.1] - 2025-11-05

### Added
- **Automatic Crimson Rite removal on rest** - Active Crimson Rites are now automatically removed after short or long rest (when DAE is not active)
- **D&D Beyond integration** - Hemocraft die now reads from DDB Importer scale values if available
- **Improved dialog compatibility** - Crimson Rite dialog now works properly with PopOut! module

### Changed
- **Crimson Rite HP cost** - Now uses `actor.applyDamage()` API instead of direct HP updates, enabling midi-qol damage interception and rollback capabilities
- **Dialog improvements** - Fixed text cropping in select elements, improved layout with flex positioning

### Technical Details
- Added `dnd5e.restCompleted` hook for automatic rite removal (only when DAE is not active)
- New helper method: `CrimsonRite.removeAllActiveRites(actor)` for batch removal
- Hemocraft die prioritizes DDB scale values: `actor.system.scale['blood-hunter'][scalePath]`
- Added localization strings: `ShortRest`, `LongRest`, `RitesEndedOnRest`

## [1.0.0] - 2025

### Added

#### Core Features
- **Crimson Rites** - Complete automation system
  - 9 rite types with level-based availability
  - Automatic HP cost calculation (scales with level)
  - Damage bonus scaling: 1d4 → 1d6 → 1d8 → 1d10
  - Activation/deactivation dialog with weapon selection
  - Active Effect tracking on weapons
  - Visual indicators on weapon sheets

#### Blood Curses
- Complete Blood Curse framework
- 3 fully implemented curses:
  - Blood Curse of the Marked (bonus hemocraft damage)
  - Blood Curse of Binding (movement reduction/restrain)
  - Blood Curse of the Anxious (disadvantage on checks)
- Amplification system with automatic HP cost
- Once-per-turn usage tracking
- Combat turn reset automation

#### Integration Features
- **DAE (Dynamic Active Effects) Integration**
  - Automatic damage formula updates on weapons
  - Effect transfer support for equipped items
  - Seamless integration with DAE's active effect system

- **midi-qol Integration**
  - Complete combat workflow automation
  - Real-time reaction prompts for Blood Curses
  - Automatic damage calculation in combat workflow
  - 6 midi-qol hooks integrated
  - 10-second reaction timeout with auto-close

#### Module Detection
- Automatic detection of DAE, midi-qol, and Advanced Macros
- Conditional feature activation based on available modules
- Graceful fallback to dnd5e hooks when modules not present
- Console logging for integration status

#### UI/UX
- Custom Blood Hunter themed interface (red for Rites, purple for Curses)
- Activation buttons on character sheets
- Active effect indicators with animations
- Amplification badges for curses
- Bilingual support (English/French)
- Responsive design for various screen sizes

#### Documentation
- Comprehensive README.md with feature list
- INTEGRATION.md guide for DAE and midi-qol
- Troubleshooting section
- Configuration recommendations
- API documentation for developers

#### Utilities
- Blood Hunter detection system
- Level-based hemocraft die calculation
- Order detection (Ghostslayer, Lycan, Mutant, Profane Soul)
- Utility functions for common operations

### Technical Details

#### Compatibility
- Foundry VTT: v11 - v13 (verified on v13)
- D&D 5e System: v3.0.0+
- Optional: DAE, midi-qol, Advanced Macros

#### File Structure
```
vtt-blood-hunter/
├── scripts/
│   ├── blood-hunter.js      # Main module
│   ├── crimson-rite.js      # Crimson Rite system
│   ├── blood-curse.js       # Blood Curse system
│   ├── integrations.js      # DAE/midi-qol integration
│   └── utils.js             # Utility functions
├── styles/
│   └── blood-hunter.css     # Custom styling
├── lang/
│   ├── en.json              # English translations
│   └── fr.json              # French translations
└── docs/
    ├── README.md
    ├── INTEGRATION.md
    └── CHANGELOG.md
```

#### Hooks Implemented
- `init` - Module initialization
- `ready` - Post-initialization setup
- `dnd5e.preRollDamage` - Crimson Rite damage (fallback)
- `renderItemSheet5e` - Item sheet buttons
- `renderActorSheet5e` - Character sheet UI
- `combatTurn` - Blood Curse reset
- `midi-qol.DamageRollComplete` - Crimson Rite damage
- `midi-qol.AttackRollComplete` - Blood Curse reactions
- `midi-qol.RollComplete` - Blood Curse effects
- `midi-qol.preAttackRoll` - Pre-attack curses
- `midi-qol.preCheckHits` - Pre-hit curses
- `midi-qol.preDamageRoll` - Pre-damage curses

#### Settings
- **Auto-calculate HP cost** (default: true) - Automatically deduct HP when activating Crimson Rites or amplifying Blood Curses
- **Show Rite buttons** (default: true) - Display activation buttons on weapon item sheets

### Future Roadmap

#### Blood Curses (Planned)
- Blood Curse of the Eyeless (Level 6)
- Blood Curse of the Fallen Puppet (Level 6)
- Blood Curse of Bloated Agony (Level 10)
- Blood Curse of Corrosion (Level 14)
- Blood Curse of the Exorcism (Level 18)

#### Orders (Planned)
- Order of the Ghostslayer - Rite damage bonus vs undead, ethereal sight
- Order of the Lycan - Hybrid transformation, predatory strikes, resilience
- Order of the Mutant - Mutagens, side effects, advanced mutagen formulas
- Order of the Profane Soul - Pact magic, Rite Focus, expanded spell lists

#### Additional Features (Planned)
- Compendium packs with pre-configured items
- Brand of Castigation automation
- Blood Maledict uses tracking
- Dark Augmentation automation
- Crimson Tide calculation helpers
- Sanguine Mastery automation

### Known Issues
- None reported yet

### Credits
- Blood Hunter class created by Matthew Mercer (Critical Role)
- Module developed for the Foundry VTT community
- Special thanks to the DAE and midi-qol developers for their excellent modules

### License
MIT License - See LICENSE file for details

---

## Version History

### [1.1.11] - 2025-11-05
#### Added
- **D&D Beyond Integration**: Automatic hemocraft die detection from DDB scale values
  - Now reads native `actor.system.scale["blood-hunter"]["crimson-rite"]` variable (DDB format: `{ number, faces, modifiers }`)
  - Supports configurable scale path parameter for different features
  - Crimson Rite specifically uses 'crimson-rite' scale path
  - Eliminates manual level checking for imported characters
  - Falls back to level-based calculation when scale path is null or DDB value unavailable
  - Validation ensures only valid die formats are used (e.g., "1d6", "1d8")

#### Changed
- `BloodHunterUtils.getHemocraftDie()` now accepts optional `scalePath` parameter (default: `null`)
  - When `null`: Uses level-based calculation directly (no DDB lookup)
  - When provided (e.g., 'crimson-rite'): Tries DDB value first, then falls back to level-based
- Crimson Rite functions updated to use 'crimson-rite' scale path
- Improved DDB object format handling: `{ number: 1, faces: 6 }` → `"1d6"`
- Enhanced logging to show which method and scale path was used

#### Documentation
- Updated README.md with correct DDB scale path references
- Updated DDB-CONFIGURATION.md with object format explanation and troubleshooting
- Added detailed troubleshooting guide for hemocraft die detection

### [1.0.0] - 2025-01-XX
- Initial release with Crimson Rites and Blood Curse framework
- Full DAE and midi-qol integration
- Bilingual support (EN/FR)
