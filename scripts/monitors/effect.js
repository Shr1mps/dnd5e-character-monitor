import { BaseMonitor } from './base.js';
import { Settings } from '../settings.js';
import { Logger } from '../logger.js';
import { MONITOR_TYPES } from '../config.js';

export class EffectMonitor extends BaseMonitor {
    init() {
        Hooks.on('createActiveEffect', this.onCreateActiveEffect.bind(this));
        Hooks.on('deleteActiveEffect', this.onDeleteActiveEffect.bind(this));
        Hooks.on('updateActiveEffect', this.onUpdateActiveEffect.bind(this));
    }

    async onCreateActiveEffect(effect, options, userID) {
        if (!this.isValidEffect(effect)) return;
        
        const actor = effect.parent;
        const templateData = {
            characterName: this.getCharacterName(actor),
            effectName: effect.name,
            action: 'Enabled' // You might want to localize this or use a specific template
        };
        
        // We can reuse effectEnabled.hbs or create a generic one. 
        // The original code had effectEnabled.hbs, effectDuration.hbs, effectEffects.hbs templates but no logic using them.
        // Let's use effectEnabled.hbs for creation/toggling on.
        
        await Logger.log(MONITOR_TYPES.EFFECTS, 'effectEnabled.hbs', templateData);
    }

    async onDeleteActiveEffect(effect, options, userID) {
        if (!this.isValidEffect(effect)) return;

        const actor = effect.parent;
        const templateData = {
            characterName: this.getCharacterName(actor),
            effectName: effect.name,
            action: 'Disabled'
        };

        // Reuse effectEnabled.hbs but maybe with a flag or different text?
        // Or we can just log it. The original templates might need inspection to see what they expect.
        // Let's assume effectEnabled.hbs takes { characterName, effectName } and we might need to indicate on/off.
        // Since I don't have the template content, I'll assume it's simple.
        // I'll use 'off' color for delete.
        
        // Actually, let's look at the original code's templates list:
        // effectEnabled.hbs, effectDuration.hbs, effectEffects.hbs
        
        await Logger.log(MONITOR_TYPES.EFFECTS, 'effectEnabled.hbs', { ...templateData, disabled: true });
    }

    async onUpdateActiveEffect(effect, diff, options, userID) {
        if (!this.isValidEffect(effect)) return;
        if (!('disabled' in diff)) return; // Only care if enabled/disabled status changes

        const actor = effect.parent;
        const enabled = !diff.disabled; // If disabled is false, it's enabled.

        const templateData = {
            characterName: this.getCharacterName(actor),
            effectName: effect.name,
            action: enabled ? 'Enabled' : 'Disabled'
        };

        await Logger.log(MONITOR_TYPES.EFFECTS, 'effectEnabled.hbs', { ...templateData, disabled: !enabled });
    }

    isValidEffect(effect) {
        if (!Settings.get(`monitor${MONITOR_TYPES.EFFECTS}`)) return false;
        if (!effect.parent || effect.parent.type !== 'character') return false;
        if (!this.shouldMonitor(effect.parent)) return false;
        return true;
    }
}
