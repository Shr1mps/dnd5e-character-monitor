import { Settings } from '../settings.js';
import { MODULE_ID } from '../config.js';

export class BaseMonitor {
    constructor() {
        this.init();
    }

    init() {}

    getCharacterName(actor) {
        if (Settings.get('useTokenName')) {
            return actor.token?.name || actor.prototypeToken.name;
        }
        if (actor.type === 'npc' && Settings.get('hideNPCname')) {
            return Settings.get('replacementName') ?? '???';
        }
        return actor.name;
    }

    shouldMonitor(actor) {
        if (Settings.get('showToggle') && !Settings.get('cmToggle')) return false;
        // Add other common checks if needed
        return true;
    }
}
