import { jest } from '@jest/globals';
import './mocks.js';

// Mock dependencies
jest.unstable_mockModule('../scripts/settings.js', () => ({
    Settings: {
        get: jest.fn(),
        init: jest.fn()
    }
}));

jest.unstable_mockModule('../scripts/logger.js', () => ({
    Logger: {
        log: jest.fn()
    }
}));

const { ItemMonitor } = await import('../scripts/monitors/item.js');
const { Settings } = await import('../scripts/settings.js');
const { Logger } = await import('../scripts/logger.js');

describe('ItemMonitor Reproduction', () => {
    let monitor;
    let actor;
    let spell;
    let feat;

    beforeEach(() => {
        monitor = new ItemMonitor();
        actor = {
            type: 'character',
            name: 'Test Actor',
            prototypeToken: { name: 'Test Token' },
            testUserPermission: () => true
        };
        spell = {
            parent: actor,
            type: 'spell',
            name: 'Fireball',
            system: {
                preparation: {
                    prepared: false,
                    mode: 'prepared'
                }
            }
        };
        feat = {
            parent: actor,
            type: 'feat',
            name: 'Action Surge',
            system: {
                uses: {
                    value: 1,
                    max: 1
                }
            }
        };
        Settings.get.mockReturnValue(true);
    });

    test('should detect spell preparation change', async () => {
        const diff = { system: { preparation: { prepared: true } } };
        
        await monitor.onPreUpdateItem(spell, diff, {}, 'gamemaster');

        expect(Logger.log).toHaveBeenCalledWith(
            'on',
            'spellPrepare.hbs',
            expect.objectContaining({
                itemName: 'Fireball',
                prepared: true
            })
        );
    });

    test('should detect feat usage change', async () => {
        const diff = { system: { uses: { value: 0 } } };
        
        await monitor.onPreUpdateItem(feat, diff, {}, 'gamemaster');

        expect(Logger.log).toHaveBeenCalledWith(
            'feats',
            'featUses.hbs',
            expect.objectContaining({
                itemName: 'Action Surge',
                uses: { value: 0, max: 1 }
            })
        );
    });

    test('should detect spell preparation change (flattened)', async () => {
        const diff = { "system.preparation.prepared": true };
        
        await monitor.onPreUpdateItem(spell, diff, {}, 'gamemaster');

        expect(Logger.log).toHaveBeenCalledWith(
            'on',
            'spellPrepare.hbs',
            expect.objectContaining({
                itemName: 'Fireball',
                prepared: true
            })
        );
    });

    test('should detect activity usage change', async () => {
        // Mock an item with activities
        const itemWithActivity = {
            parent: actor,
            type: 'feat',
            name: 'Activity Feat',
            system: {
                activities: {
                    "act1": { uses: { value: 1, max: 1 } }
                }
            }
        };
        
        const diff = { system: { activities: { "act1": { uses: { value: 0 } } } } };
        
        await monitor.onPreUpdateItem(itemWithActivity, diff, {}, 'gamemaster');

        expect(Logger.log).toHaveBeenCalledWith(
            'feats',
            'featUses.hbs',
            expect.objectContaining({
                itemName: 'Activity Feat',
                uses: { value: 0, max: 1 }
            })
        );
    });
});
