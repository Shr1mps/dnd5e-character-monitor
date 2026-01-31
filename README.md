# D&D5e Character Monitor

![GitHub issues](https://img.shields.io/github/issues-raw/Shr1mps/dnd5e-character-monitor?style=for-the-badge)
![Latest Release Download Count](https://img.shields.io/github/downloads/Shr1mps/dnd5e-character-monitor/latest/module.zip?color=2b82fc&label=DOWNLOADS&style=for-the-badge)
![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FShr1mps%2Fdnd5e-character-monitor%2Fmaster%2Fmodule.json&label=Foundry%20Version&query=$.compatibility.verified&colorB=orange&style=for-the-badge)
![Latest Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FShr1mps%2Fdnd5e-character-monitor%2Fmaster%2Fmodule.json&label=Latest%20Release&prefix=v&query=$.version&colorB=red&style=for-the-badge)
![GitHub all releases](https://img.shields.io/github/downloads/Shr1mps/dnd5e-character-monitor/total?style=for-the-badge)

Log an alert in chat when certain changes to an actor are made.

# --- DEPRECATED ---

This module is no longer being maintained, Please use [Simrakí's Character Monitor](https://foundryvtt.com/packages/simraki-character-monitor) module instead.
Thanks to Simraki for taking over this module.

## Installation

It's always easiest to install modules from the in game add-on browser.

To install this module manually:
1.  Inside the Foundry "Configuration and Setup" screen, click "Add-on Modules"
2.  Click "Install Module"
3.  In the "Manifest URL" field, paste the following url:
`https://github.com/Shr1mps/dnd5e-character-monitor/releases/latest/download/module.json`
4.  Click 'Install' and wait for installation to complete
5.  Don't forget to enable the module in game using the "Manage Module" button

## Feature Overview

When one of the following changes is made via the **character sheet**, a log will be made in chat.

*   **Equip/Unequip** an item
*   **Change item quantity**
*   **Attune/Break attunement** to a magical item
*   **Prepare/Unprepare** a spell
*   **Change number of spell slots**
*   **Change number of feature usages**
*   **Change resource values**
*   **Active effects changes** (Created, Deleted, Toggled)
*   **Experience Points (XP)** (Added/Removed)
*   **Character Level** (Level Up/Down)
*   **Ability Scores** (Strength, Dexterity, etc.)
*   **Armor Class (AC)** (Manual changes)

<img src="/img/character-monitor.png">

### Settings Menu

You can customize the colors for each type of notification in the module settings. You can also toggle specific monitors on or off if you only want to track certain changes (e.g., only Currency and XP).

## Issues

Any issues, bugs, or feature requests are always welcome to be reported directly to the [Issue Tracker](https://github.com/Shr1mps/dnd5e-character-monitor/issues).

## License

This package is under an [MIT](LICENSE) license and the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/).

## Acknowledgements

-   Original module by **enso** (`enso#0361`).
-   Previously maintained by **jessev14**.
-   Currently maintained by **Shr1mps**.
