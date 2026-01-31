# Changelog

## [1.0.2] - 2026-01-31

### Fixed
- Fixed compatibility with dnd5e system v5.2+ by adding defensive checking for deprecated `ActorSheet5eCharacter2` class
- Module now gracefully handles both legacy and new character sheets
- Sheet mode monitoring feature automatically disabled on new character sheets (no longer causes module initialization errors)


## [1.0.1] - 2025-11-23

### Fixed
- Fixed `ENOENT` error when loading templates by correcting the internal module ID to match the manifest ID (`shr1mps-character-monitor`).

## [1.0.0] - 2025-11-23

### Added
- Initial release of the module under new maintenance.
- Localization support for multiple languages.
- Monitors for HP, XP, Level, Ability Scores, AC, Currency, and more.
