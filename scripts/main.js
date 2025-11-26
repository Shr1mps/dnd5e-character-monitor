import { Settings } from './settings.js';
import { SocketHandler } from './socket.js';
import { ActorMonitor } from './monitors/actor.js';
import { ItemMonitor } from './monitors/item.js';
import { EffectMonitor } from './monitors/effect.js';
import { MODULE_ID, MONITOR_TYPES } from './config.js'
import { Logger } from './logger.js';

Hooks.once('init', async () => {
    Settings.init();
    
    // Register wrappers
    if (game.modules.get('lib-wrapper')?.active) {
        libWrapper.register(MODULE_ID, 'game.dnd5e.applications.actor.ActorSheet5eCharacter2.prototype._onChangeSheetMode', toggleSheetMode, 'WRAPPER');
        // We might not need the prepareItem wrapper if we rely on diffs, but let's keep it if we need to store state.
        // The original code stored 'prepared' state. My ItemMonitor implementation uses diffs, so I might skip it.
        // But let's keep it for safety if the original author had a specific reason (e.g. derived data not in diff).
        // Actually, diffs are reliable for preparation changes. I'll skip the prepareItem wrapper for now to keep it clean.
    }
});

Hooks.once('setup', async () => {
    // Setup toggle button
    if (game.settings.get(MODULE_ID, 'showToggle')) {
        Hooks.on('getSceneControlButtons', controls => {
            const bar = controls.find(c => c.name === 'token');
            bar.tools.push({
                name: 'Character Monitor',
                title: game.i18n.localize('characterMonitor.control.title'),
                icon: 'fas fa-exchange-alt',
                visible: game.user.isGM,
                toggle: true,
                active: game.settings.get(MODULE_ID, 'cmToggle'),
                onClick: async toggled => await game.settings.set(MODULE_ID, 'cmToggle', toggled)
            });
        });
    }

    Settings.setCssVariables();
});

Hooks.once('ready', () => {
    new ActorMonitor();
    new ItemMonitor();
    new EffectMonitor();
});

SocketHandler.init();

Hooks.on('renderChatMessage', (app, [html], appData) => {
    if (!appData.message.flags[MODULE_ID] || !html) return;

    const monitorType = appData.message.flags[MODULE_ID].monitorType;
    if (monitorType) {
        html.classList.add('dnd5e-cm', `dnd5e-cm-${monitorType}`);
        const header = html.querySelector('header');
        if (header) header.style.display = 'none';
    }
});

async function toggleSheetMode(wrapped, event) {
    await wrapped(event);
    if (!Settings.get('monitorSheetMode')) return;

    const actor = this.actor;
    const templateData = {
        characterName: Settings.get('useTokenName') ? (actor.token?.name || actor.prototypeToken.name) : actor.name,
        sheetMode: this._mode === 1 ? game.i18n.localize('DND5E.SheetModePlay') : game.i18n.localize('DND5E.SheetModeEdit')
    };
    
    await Logger.log(MONITOR_TYPES.EFFECTS, 'toggleSheetMode.hbs', templateData);
}
