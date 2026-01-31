import { BaseMonitor } from './base.js';
import { Settings } from '../settings.js';
import { Logger } from '../logger.js';
import { MONITOR_TYPES } from '../config.js';

export class ItemMonitor extends BaseMonitor {
    init() {
        Hooks.on('preUpdateItem', this.onPreUpdateItem.bind(this));
    }

    async onPreUpdateItem(item, diff, options, userID) {
        if (item.parent?.type !== 'character') return;
        if (!this.shouldMonitor(item.parent)) return;

        const actor = item.parent;
        // Helper to get property from diff, handling both nested and flattened keys
        const getProperty = (obj, key) => {
            if (key in obj) return obj[key];
            const parts = key.split('.');
            let current = obj;
            for (const part of parts) {
                if (current === undefined || current === null) return undefined;
                current = current[part];
            }
            return current;
        };

        // Helper to check if a key exists in diff (nested or flat)
        const hasProperty = (obj, key) => {
            if (key in obj) return true;
            // Check if any key in obj starts with key + '.' (for flat keys)
            if (Object.keys(obj).some(k => k.startsWith(key + '.'))) return true;
            
            // Check nested existence
            const parts = key.split('.');
            let current = obj;
            for (let i = 0; i < parts.length; i++) {
                if (current === undefined || current === null) return false;
                if (parts[i] in current) {
                    current = current[parts[i]];
                } else {
                    return false;
                }
            }
            return true;
        };
        
        // We need to check both 'system' object and flat keys starting with 'system.'
        const system = diff.system || {};
        
        // Check for flat keys if system is empty or incomplete
        const isFlat = Object.keys(diff).some(k => k.startsWith('system.'));

        const tasks = [];

        if (Settings.get(`monitor${MONITOR_TYPES.EQUIP}`) && (item.type === 'equipment' || item.type === 'weapon') && 'equipped' in system) {
            tasks.push(this.checkEquip(actor, item, diff));
        }

        if (Settings.get(`monitor${MONITOR_TYPES.QUANTITY}`) && 'quantity' in system) {
            tasks.push(this.checkQuantity(actor, item, diff));
        }

        if (Settings.get(`monitor${MONITOR_TYPES.SPELL_PREP}`) && item.type === 'spell' && 'prepared' in system) {
            tasks.push(this.checkSpellPrep(actor, item, diff));
        }

        if (Settings.get(`monitor${MONITOR_TYPES.FEATS}`) && item.type === 'feat') {
            tasks.push(this.checkFeats(actor, item, diff));
        }

        if (Settings.get(`monitor${MONITOR_TYPES.ITEM_CHARGES}`) && (item.type === 'equipment' || item.type === 'weapon')) {
            tasks.push(this.checkItemCharges(actor, item, diff));
        }

        if (Settings.get(`monitor${MONITOR_TYPES.ATTUNE}`) && (item.type === 'equipment' || item.type === 'weapon') && 'attuned' in system) {
            tasks.push(this.checkAttune(actor, item, diff));
        }

        await this.runParallel(tasks);
    }

     static _getUsesValues(item, diff) {
        const newUses = diff.system?.uses || {};
        const oldUses = item.system.uses;

        const hasSpent = ('spent' in newUses);
        const hasMax = ('max' in newUses);
        if (!hasSpent && !hasMax) return;

        const isSpentUnchanged = (!hasSpent || (!newUses.spent && !oldUses.spent));
        const isMaxUnchanged = (!hasMax || (!newUses.max && !oldUses.max));
        if (isSpentUnchanged && isMaxUnchanged) return;

        const max = hasMax ? newUses.max : oldUses.max;
        const oldMax = oldUses.max;
        const newValue = max - newUses.spent;
        const oldValue = oldMax - oldUses.spent;

        return { newValue, oldValue, max, oldMax };
    }

    async checkEquip(actor, item, diff) {
        // ... (existing implementation, but need to fetch value safely)
        // Since we passed the check in onPreUpdateItem, we know it exists.
        // But let's use a safe getter if we want to be consistent, or just rely on the fact that we checked it.
        // For minimal changes, I'll assume standard access if it was nested, but if it was flat, we need to extract it.
        
        let equipped;
        if (diff.system?.equipped !== undefined) equipped = diff.system.equipped;
        else equipped = diff['system.equipped'];

        const templateData = {
            characterName: this.getCharacterName(actor),
            itemName: item.name,
            showPrevious: Settings.get('showPrevious'),
            equipped: equipped
        };

        const monitorType = equipped ? 'on' : 'off';
        await Logger.log(monitorType, 'itemEquip.hbs', templateData);
    }

    async checkQuantity(actor, item, diff) {
        const oldQuantity = item.system.quantity;
        let newQuantity;
        if (diff.system?.quantity !== undefined) newQuantity = diff.system.quantity;
        else newQuantity = diff['system.quantity'];
        
        const templateData = {
            characterName: this.getCharacterName(actor),
            itemName: item.name,
            showPrevious: Settings.get('showPrevious'),
            quantity: {
                old: oldQuantity,
                value: newQuantity
            }
        };

        const monitorType = newQuantity > oldQuantity ? 'on' : 'off';
        await Logger.log(monitorType, 'itemQuantity.hbs', templateData);
    }

    async checkSpellPrep(actor, item, diff, preparedValue) {
        const templateData = {
            characterName: this.getCharacterName(actor),
            itemName: item.name,
            showPrevious: Settings.get('showPrevious'),
            prepared: preparedValue
        };

        const monitorType = preparedValue ? 'on' : 'off';
        await Logger.log(monitorType, 'spellPrepare.hbs', templateData);
    }

    async checkFeats(actor, item, diff) {
        // Check for uses in system.uses or system.activities
        
        // Helper to extract value from nested or flat diff
        const getVal = (path) => {
            if (diff[path] !== undefined) return diff[path];
            const parts = path.split('.');
            let current = diff;
            for (const part of parts) {
                if (current === undefined || current === null) return undefined;
                current = current[part];
            }
            return current;
        };

        // Check legacy uses
        const newUsesValue = getVal('system.uses.value');
        const newUsesMax = getVal('system.uses.max');
        
        if (newUsesValue !== undefined || newUsesMax !== undefined) {
             const oldUses = item.system.uses;
             const templateData = {
                characterName: this.getCharacterName(actor),
                itemName: item.name,
                showPrevious: Settings.get('showPrevious'),
                uses: {
                    value: (newUsesValue !== undefined ? newUsesValue : oldUses.value) || 0,
                    max: (newUsesMax !== undefined ? newUsesMax : oldUses.max) || 0
                }
            };
            await Logger.log('feats', 'featUses.hbs', templateData);
            return;
        }

        // Check Activities (dnd5e v3+)
        // Activities are stored in system.activities.ID.uses.value
        // Diff could be system: { activities: { ID: { uses: { value: X } } } }
        // or "system.activities.ID.uses.value": X
        
        let activitiesDiff = diff.system?.activities;
        if (!activitiesDiff) {
            // Check for flat keys starting with system.activities
            const flatKeys = Object.keys(diff).filter(k => k.startsWith('system.activities.'));
            if (flatKeys.length > 0) {
                // Construct a partial object or just parse the first one found?
                // If multiple activities update at once, we might spam chat.
                // Let's handle each changed activity.
                
                for (const key of flatKeys) {
                    if (key.endsWith('.uses.value')) {
                        // Extract ID: system.activities.ID.uses.value
                        const parts = key.split('.');
                        const id = parts[2];
                        const newValue = diff[key];
                        
                        // Get old value from item
                        const activity = item.system.activities?.[id];
                        if (!activity) continue;
                        
                        const oldValue = activity.uses?.value;
                        const max = activity.uses?.max; // Might be in item data
                        
                        const templateData = {
                            characterName: this.getCharacterName(actor),
                            itemName: item.name, // Or activity name? Usually item name is preferred for context.
                            showPrevious: Settings.get('showPrevious'),
                            uses: {
                                value: newValue,
                                max: max
                            }
                        };
                        await Logger.log('feats', 'featUses.hbs', templateData);
                    }
                }
            }
        } else {
            // Nested activities diff
            for (const [id, activityData] of Object.entries(activitiesDiff)) {
                if (activityData.uses?.value !== undefined) {
                     const activity = item.system.activities?.[id];
                     if (!activity) continue;
                     
                     const newValue = activityData.uses.value;
                     const max = activity.uses?.max;

                     const templateData = {
                        characterName: this.getCharacterName(actor),
                        itemName: item.name,
                        showPrevious: Settings.get('showPrevious'),
                        uses: {
                            value: newValue,
                            max: max
                        }
                    };
                    await Logger.log('feats', 'featUses.hbs', templateData);
                }
            }
        }
    }

    async checkAttune(actor, item, diff) {
        const attuned = diff.system.attuned;
        const templateData = {
            characterName: this.getCharacterName(actor),
            itemName: item.name,
            showPrevious: Settings.get('showPrevious'),
            attuned: attuned
        };

        const monitorType = attuned ? 'on' : 'off';
        await Logger.log(monitorType, 'itemAttune.hbs', templateData);
    }
}
