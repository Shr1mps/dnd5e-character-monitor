import { BaseMonitor } from './base.js';
import { Settings } from '../settings.js';
import { Logger } from '../logger.js';
import * as Config from '../config.js';

const {MODULE_ID, MONITOR_TYPES} = Config;

export class ActorMonitor extends BaseMonitor {
    init() {
        Hooks.on('preUpdateActor', this.onPreUpdateActor.bind(this));
        Hooks.on('updateActor', this.onUpdateActor.bind(this));
    }

    async onPreUpdateActor(actor, diff, options, userID) {
        if (actor.type !== 'character') return;
        if (game.system.id === 'dnd5e' && 'isAdvancement' in options) return;
        if (!this.shouldMonitor(actor)) return;

        await this.checkSpellSlots(actor, diff);
        await this.checkCurrency(actor, diff);
        await this.checkProficiency(actor, diff);
        await this.checkXP(actor, diff);
        await this.checkLevel(actor, diff);
        await this.checkAbility(actor, diff);
        await this.checkAC(actor, diff);
    }

    async onUpdateActor(actor, diff, options, userID) {
        if (!Settings.get(`monitor${MONITOR_TYPES.HP}`)) return;
        if (!this.shouldMonitor(actor)) return;

        if (diff.system?.attributes?.hp) {
            await this.checkHP(actor, diff, options, userID);
        }
    }

    async checkSpellSlots(actor, diff) {
        if (!Settings.get(`monitor${MONITOR_TYPES.SPELL_SLOTS}`) || !('spells' in (diff.system || {}))) return;

        for (const [spellLevel, newSpellData] of Object.entries(diff.system.spells)) {
            const oldSpellData = actor.system.spells[spellLevel];
            const hasValue = ('value' in newSpellData);
            const hasMax = ('override' in newSpellData) || ('max' in newSpellData);
            if (!hasValue && !hasMax) continue;

            const newMax = newSpellData.override ?? newSpellData.max;
            const isValueUnchanged = (!hasValue || (!newSpellData.value && !oldSpellData.value));
            const isMaxUnchanged = (!hasMax || (!newMax && !oldSpellData.max));
            if (isValueUnchanged && isMaxUnchanged) continue;

            const levelNum = parseInt(spellLevel.slice(-1));
            const templateData = {
                characterName: this.getCharacterName(actor),
                spellSlot: {
                    label: CONFIG.DND5E.spellLevels[levelNum],
                    value: (hasValue ? newSpellData.value : oldSpellData.value) || 0,
                    max: (newMax ?? oldSpellData.max) || 0
                }
            };
            if (Settings.get('showPrevious')) templateData.spellSlot.old = oldSpellData.value;

            await Logger.log(MONITOR_TYPES.SPELL_SLOTS, 'spellSlots.hbs', templateData);
        }
    }

    async checkCurrency(actor, diff) {
        if (!Settings.get(`monitor${MONITOR_TYPES.CURRENCY}`) || !('currency' in (diff.system || {}))) return;

        for (const [currency, newValue] of Object.entries(diff.system.currency)) {
            const oldValue = actor.system.currency[currency];

            if (newValue === null || newValue == oldValue) continue;

            const templateData = {
                characterName: this.getCharacterName(actor),
                currency: {
                    label: game.i18n.localize(`DND5E.CurrencyAbbr${currency.toUpperCase()}`),
                    value: newValue
                }
            };
            if (Settings.get('showPrevious')) templateData.currency.old = oldValue;

            await Logger.log(MONITOR_TYPES.CURRENCY, 'currency.hbs', templateData);
        }
    }

    async checkProficiency(actor, diff) {
        const system = diff.system || {};
        // if (!Settings.get(`monitor${MONITOR_TYPES.PROFICIENCY}`) || !('skills' in system || 'abilities' in system || 'tools' in system)) return;
        if (!Settings.get(`monitor${MONITOR_TYPES.PROFICIENCY}`) || !('skills' in system || 'abilities' in system)) return;

        const allData = [];

        if ('skills' in system) {
            for (const [skl, changes] of Object.entries(diff.system.skills)) {
                if (!('value' in changes) || typeof changes.value !== 'number') continue;

                const oldValue = actor.system.skills[skl].value;
                if (oldValue === changes.value) continue;

                const templateData = {
                    characterName: this.getCharacterName(actor),
                    proficiency: {
                        label: CONFIG.DND5E.skills[skl].label,
                        value: CONFIG.DND5E.proficiencyLevels[changes.value],
                        old: CONFIG.DND5E.proficiencyLevels[oldValue]
                    }
                };

                allData.push(templateData);
            }
        }

        // Saving throws
        if ('abilities' in system) {
            for (const [abil, changes] of Object.entries(diff.system.abilities)) {
                if (!('proficient' in changes) || typeof changes.proficient !== 'number') continue;

                const oldProficient = actor.system.abilities[abil].proficient;
                const newProficient = changes.proficient;
                if (oldProficient === newProficient) continue;

                const templateData = {
                    characterName: this.getCharacterName(actor),
                    proficiency: {
                        label: CONFIG.DND5E.abilities[abil].label,
                        value: CONFIG.DND5E.proficiencyLevels[newProficient],
                        old: CONFIG.DND5E.proficiencyLevels[oldProficient],
                    },
                };

                allData.push(templateData);
            }
        }

        // if ('tools' in system) {
        //     for (const [tool, changes] of Object.entries(diff.system.tools)) {
        //         if (!('value' in changes) || typeof changes.value !== 'number') continue;
        //
        //         const oldValue = actor.system.tools[tool].value;
        //         const newValue = changes.value;
        //         if (oldValue === newValue) continue;
        //
        //         const templateData = {
        //             characterName: this.getCharacterName(actor),
        //             proficiency: {
        //                 label: fromUuidSync(CONFIG.DND5E.tools[tool].id).name,
        //                 value: CONFIG.DND5E.proficiencyLevels[newValue],
        //                 old: CONFIG.DND5E.proficiencyLevels[oldValue],
        //             },
        //         };
        //
        //         allData.push(templateData);
        //     }
        // }

        await this.runParallel(allData.map((d) => {
            return Logger.log(MONITOR_TYPES.PROFICIENCY, 'proficiency.hbs', d);
        }));
    }

    async checkHP(actor, diff, options, userID) {
        const previousData = options.dnd5e?.hp || options.previous?.system?.attributes?.hp; // V13 compatibility check: dnd5e might change how it stores previous data, but usually it's in options.dnd5e.hp or we can rely on preUpdate if we tracked it.
        // Actually, in v12/v13 options.dnd5e.hp is reliable for dnd5e system.

        if (!previousData) return;

        const data = {
            previous: Settings.get('showPrevious'),
            characterName: this.getCharacterName(actor)
        };

        for (const healthType of ['value', 'max', 'temp']) {
            const value = actor.system.attributes.hp[healthType];
            const previousValue = previousData[healthType];
            const delta = value - previousValue;

            if (!delta) continue;

            const direction = delta > 0 ? 'Plus' : 'Minus';
            data.type = game.i18n.localize(`characterMonitor.chatMessage.hp.${healthType}`, {[MODULE_ID]: {monitorType: `hp${direction}`}});
            data.direction = direction;
            data.value = value;
            data.previousValue = previousValue;

            // Only the user who triggered the update should send the message to avoid duplicates
            if (game.user.id === userID) {
                await Logger.log(`${MONITOR_TYPES.HP}${direction}`, 'hp.hbs', data);
            }
        }
    }

    async checkXP(actor, diff) {
        if (!Settings.get(`monitor${MONITOR_TYPES.XP}`) || !('xp' in (diff.system?.details || {}))) return;

        const newXP = diff.system.details.xp.value;
        const oldXP = actor.system.details.xp.value;
        if (newXP === oldXP) return;

        const templateData = {
            characterName: this.getCharacterName(actor),
            xp: {
                value: newXP,
                old: oldXP
            },
            showPrevious: Settings.get('showPrevious')
        };

        await Logger.log(MONITOR_TYPES.XP, 'xp.hbs', templateData);
    }

    async checkLevel(actor, diff) {
        if (!Settings.get(`monitor${MONITOR_TYPES.LEVEL}`) || !('level' in (diff.system?.details || {}))) return;

        const newLevel = diff.system.details.level;
        const oldLevel = actor.system.details.level;
        if (newLevel === oldLevel) return;

        const templateData = {
            characterName: this.getCharacterName(actor),
            level: {
                value: newLevel,
                old: oldLevel
            },
            showPrevious: Settings.get('showPrevious')
        };

        await Logger.log(MONITOR_TYPES.LEVEL, 'level.hbs', templateData);
    }

    async checkAbility(actor, diff) {
        if (!Settings.get(`monitor${MONITOR_TYPES.ABILITY}`) || !('abilities' in (diff.system || {}))) return;

        for (const [abil, changes] of Object.entries(diff.system.abilities)) {
            if (!('value' in changes)) continue;

            const oldValue = actor.system.abilities[abil].value;
            const newValue = changes.value;
            if (oldValue === newValue) continue;

            const templateData = {
                characterName: this.getCharacterName(actor),
                ability: {
                    label: CONFIG.DND5E.abilities[abil].label,
                    value: newValue,
                    old: oldValue
                },
            };

            await Logger.log(MONITOR_TYPES.ABILITY, 'ability.hbs', templateData);
        }
    }

    async checkAC(actor, diff) {
        if (!Settings.get(`monitor${MONITOR_TYPES.AC}`) || !('ac' in (diff.system?.attributes || {}))) return;

        const acChanges = diff.system.attributes.ac;
        if (!('flat' in acChanges)) return;

        const newValue = acChanges.flat;
        const oldValue = actor.system.attributes.ac.flat;

        if (newValue === oldValue) return;

        const templateData = {
            characterName: this.getCharacterName(actor),
            ac: {
                value: newValue,
                old: oldValue
            },
            showPrevious: Settings.get('showPrevious')
        };

        await Logger.log(MONITOR_TYPES.AC, 'ac.hbs', templateData);
    }
}
