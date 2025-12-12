import { MODULE_ID, DEFAULT_COLORS, MONITOR_TYPES } from './config.js';

export class Settings {
    static init() {
        this.registerSettings();
    }

    static registerSettings() {
        game.settings.registerMenu(MODULE_ID, 'cmColorsMenu', {
            name: game.i18n.localize('characterMonitor.settings.cmColorsMenu.name'),
            label: game.i18n.localize('characterMonitor.settings.cmColorsMenu.label'),
            icon: 'fas fa-palette',
            type: CharacterMonitorColorMenu,
            restricted: true
        });

        game.settings.register(MODULE_ID, 'cmColors', {
            name: 'Character Monitor Colors',
            hint: '',
            scope: 'world',
            type: Object,
            default: DEFAULT_COLORS,
            config: false,
            onChange: () => this.setCssVariables()
        });

        for (const monitorType of Object.values(MONITOR_TYPES)) {
            // Skip internal types if any, but currently all in MONITOR_TYPES are settings keys except maybe derived ones
            // The original code had a list: HP, Equip, Quantity, Attune, SpellPrep, SpellSlots, Feats, Currency, Proficiency, SheetMode
            // My MONITOR_TYPES has keys like SPELL_PREP: 'SpellPrep'.
            // I should probably iterate the values.
            
            // However, the original code had a specific list. Let's replicate that list logic or use the values.
            // Original list: 'HP', 'Equip', 'Quantity', 'Attune', 'SpellPrep', 'SpellSlots', 'Feats', 'Currency', 'Proficiency', 'SheetMode'
            // My MONITOR_TYPES values match these exactly, plus 'Effects'.
            
            game.settings.register(MODULE_ID, `monitor${monitorType}`, {
                name: game.i18n.localize(`characterMonitor.settings.monitor${monitorType}.name`),
                hint: game.i18n.localize(`characterMonitor.settings.monitor${monitorType}.hint`),
                scope: 'world',
                type: Boolean,
                default: true,
                config: true
            });
        }

        game.settings.register(MODULE_ID, 'showGMOnly', {
            name: game.i18n.localize('characterMonitor.settings.showGMOnly.name'),
            hint: game.i18n.localize('characterMonitor.settings.showGMOnly.hint'),
            scope: 'world',
            type: Boolean,
            default: false,
            config: true
        });

        game.settings.register(MODULE_ID, 'showToggle', {
            name: game.i18n.localize('characterMonitor.settings.showToggle.name'),
            hint: game.i18n.localize('characterMonitor.settings.showToggle.hint'),
            scope: 'world',
            type: Boolean,
            default: false,
            config: true,
            onChange: async () => {
                if (!game.user.isGM) return;
                await game.settings.set(MODULE_ID, 'cmToggle', true);
                setTimeout(() => window.location.reload(), 500);
            }
        });

        game.settings.register(MODULE_ID, 'showPrevious', {
            name: game.i18n.localize('characterMonitor.settings.showPrevious.name'),
            hint: '',
            scope: 'world',
            type: Boolean,
            default: false,
            config: true
        });

        game.settings.register(MODULE_ID, 'cmToggle', {
            name: game.i18n.localize('characterMonitor.settings.cmToggle.name'),
            hint: '',
            scope: 'world',
            type: Boolean,
            default: true,
            config: false
        });

        game.settings.register(MODULE_ID, 'useTokenName', {
            name: game.i18n.localize('characterMonitor.settings.useTokenName.name'),
            hint: game.i18n.localize('characterMonitor.settings.useTokenName.hint'),
            scope: 'world',
            type: Boolean,
            default: false,
            config: true
        });

        game.settings.register(MODULE_ID, 'hideNPCs', {
            name: game.i18n.localize('characterMonitor.settings.hideNPCs.name'),
            hint: game.i18n.localize('characterMonitor.settings.hideNPCs.hint'),
            scope: 'world',
            type: Boolean,
            default: false,
            config: true
        });

        game.settings.register(MODULE_ID, 'hideNPCname', {
            name: game.i18n.localize('characterMonitor.settings.hideNPCname.name'),
            hint: game.i18n.localize('characterMonitor.settings.hideNPCname.hint'),
            scope: 'world',
            type: Boolean,
            default: false,
            config: true
        });

        game.settings.register(MODULE_ID, 'replacementName', {
            name: game.i18n.localize('characterMonitor.settings.replacementName.name'),
            hint: game.i18n.localize('characterMonitor.settings.replacementName.hint'),
            scope: 'world',
            type: String,
            default: '???',
            config: true
        });
    }

    static get(key) {
        return game.settings.get(MODULE_ID, key);
    }

    static setCssVariables() {
        const root = document.querySelector(':root');
        const colors = this.get('cmColors');
        for (const [monitorType, color] of Object.entries(colors)) {
            root.style.setProperty(`--dnd5e-cm-${monitorType}`, color);
        }
    }
}

class CharacterMonitorColorMenu extends FormApplication {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            title: 'Customize Character Monitor Colors',
            template: `/modules/${MODULE_ID}/templates/colorMenu.hbs`,
            width: 700
        }
    }

    getData() {
        const settingsData = Settings.get('cmColors');
        const data = {
            hpPlus: { color: settingsData.hpPlus, label: game.i18n.localize('characterMonitor.colorMenu.hpPlus') },
            hpMinus: { color: settingsData.hpMinus, label: game.i18n.localize('characterMonitor.colorMenu.hpMinus') },
            on: { color: settingsData.on, label: game.i18n.localize('characterMonitor.colorMenu.on') },
            off: { color: settingsData.off, label: game.i18n.localize('characterMonitor.colorMenu.off') },
            slots: { color: settingsData.slots, label: game.i18n.localize('characterMonitor.chatMessage.SpellSlots') },
            feats: { color: settingsData.feats, label: game.i18n.localize('DND5E.Features') },
            currency: { color: settingsData.currency, label: game.i18n.localize('DND5E.Currency') },
            proficiency: { color: settingsData.proficiency, label: game.i18n.localize('DND5E.Proficiency') },
            sheetMode: { color: settingsData.sheetMode, label: game.i18n.localize('characterMonitor.chatMessage.sheetMode') },
            effects: { color: settingsData.effects, label: 'Active Effects' },
            xp: { color: settingsData.xp, label: game.i18n.localize('DND5E.ExperiencePoints.Label') },
            level: { color: settingsData.level, label: game.i18n.localize('DND5E.Level') },
            ability: { color: settingsData.ability, label: game.i18n.localize('DND5E.Ability') },
            ac: { color: settingsData.ac, label: game.i18n.localize('DND5E.ArmorClass') },
            itemCharges: { color: settingsData.itemCharges, label: 'Item Charges' }
        };
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.on('click', `button[name='reset']`, () => {
             // Reset logic using DEFAULT_COLORS
             for (const [key, value] of Object.entries(DEFAULT_COLORS)) {
                 html.find(`input[name='${key}']`).val(value);
                 html.find(`input[data-edit='${key}']`).val(value);
             }
        });
    }

    async _updateObject(event, formData) {
        await game.settings.set(MODULE_ID, 'cmColors', formData);
    }
}
