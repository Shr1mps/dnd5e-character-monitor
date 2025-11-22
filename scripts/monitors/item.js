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
        const system = diff.system || {};

        if (Settings.get(`monitor${MONITOR_TYPES.EQUIP}`) && (item.type === 'equipment' || item.type === 'weapon') && 'equipped' in system) {
            await this.checkEquip(actor, item, diff);
        }

        if (Settings.get(`monitor${MONITOR_TYPES.QUANTITY}`) && 'quantity' in system) {
            await this.checkQuantity(actor, item, diff);
        }

        if (Settings.get(`monitor${MONITOR_TYPES.SPELL_PREP}`) && item.type === 'spell' && 'prepared' in (diff.system?.preparation || {})) {
            await this.checkSpellPrep(actor, item, diff);
        }

        if (Settings.get(`monitor${MONITOR_TYPES.FEATS}`) && item.type === 'feat') {
            await this.checkFeats(actor, item, diff);
        }

        if (Settings.get(`monitor${MONITOR_TYPES.ATTUNE}`) && (item.type === 'equipment' || item.type === 'weapon') && 'attuned' in system) {
            await this.checkAttune(actor, item, diff);
        }
    }

    async checkEquip(actor, item, diff) {
        const equipped = diff.system.equipped;
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
        const newQuantity = diff.system.quantity;
        
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

    async checkSpellPrep(actor, item, diff) {
        // Original code had a check: if (item.characterMonitor?.prepared === diff.system.preparation.prepared) return;
        // This relied on a wrapper that added `characterMonitor` to the item. 
        // We should see if we can avoid the wrapper or if we need to implement it.
        // The wrapper was: CONFIG.Item.documentClass.prototype.prepareData
        // Let's implement the wrapper in main.js or a patch file if needed, but for now let's assume we might not need it if we trust the diff.
        // Actually, the diff shows what CHANGED. So if it's in the diff, it changed.
        // The original code might have been trying to avoid some edge case or redundant updates.
        // Let's stick to the diff check.
        
        const prepared = diff.system.preparation.prepared;
        const templateData = {
            characterName: this.getCharacterName(actor),
            itemName: item.name,
            showPrevious: Settings.get('showPrevious'),
            prepared: prepared
        };

        const monitorType = prepared ? 'on' : 'off';
        await Logger.log(monitorType, 'spellPrepare.hbs', templateData);
    }

    async checkFeats(actor, item, diff) {
        const newUses = diff.system?.uses || {};
        const oldUses = item.system.uses;
        
        const hasValue = ("value" in newUses);
        const hasMax = ("max" in newUses);
        if (!hasValue && !hasMax) return;

        const isValueUnchanged = (!hasValue || (!newUses.value && !oldUses.value));
        const isMaxUnchanged = (!hasMax || (!newUses.max && !oldUses.max));
        if (isValueUnchanged && isMaxUnchanged) return;

        const templateData = {
            characterName: this.getCharacterName(actor),
            itemName: item.name,
            showPrevious: Settings.get('showPrevious'),
            uses: {
                value: (hasValue ? newUses.value : oldUses.value) || 0,
                max: (hasMax ? newUses.max : oldUses.max) || 0
            }
        };

        await Logger.log('feats', 'featUses.hbs', templateData);
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
