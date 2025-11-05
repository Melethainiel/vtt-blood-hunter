# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
