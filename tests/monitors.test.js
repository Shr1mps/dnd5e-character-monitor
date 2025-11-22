import { jest } from '@jest/globals';
import './mocks.js';

// Mock dependencies using unstable_mockModule for ESM
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

jest.unstable_mockModule('../scripts/socket.js', () => ({
    SocketHandler: {
        init: jest.fn(),
        executeAsGM: jest.fn()
    }
}));

// Dynamic imports after mocking
const { ActorMonitor } = await import('../scripts/monitors/actor.js');
const { ItemMonitor } = await import('../scripts/monitors/item.js');
const { EffectMonitor } = await import('../scripts/monitors/effect.js');
const { Settings } = await import('../scripts/settings.js');
const { Logger } = await import('../scripts/logger.js');

describe('ActorMonitor', () => {
    let monitor;
    let actor;

    beforeEach(() => {
        monitor = new ActorMonitor();
        actor = {
            type: 'character',
            name: 'Test Actor',
            prototypeToken: { name: 'Test Token' }, // Fix for getCharacterName
            system: {
                attributes: {
                    hp: { value: 10, max: 20, temp: 0 }
                },
                spells: {
                    spell1: { value: 1, max: 2 }
                },
                currency: { gp: 10 },
                skills: { acr: { value: 0 } }
            }
        };
        Settings.get.mockReturnValue(true);
        Settings.get.mockImplementation((key) => {
            if (key === 'useTokenName') return false;
            if (key === 'showPrevious') return false;
            return true;
        });
    });

    test('should detect HP change', async () => {
        const diff = { system: { attributes: { hp: { value: 5 } } } };
        const options = { dnd5e: { hp: { value: 10, max: 20, temp: 0 } } };
        
        actor.system.attributes.hp.value = 5;

        await monitor.onUpdateActor(actor, diff, options, 'gamemaster');

        expect(Logger.log).toHaveBeenCalledWith(
            'hpMinus',
            'hp.hbs',
            expect.objectContaining({
                value: 5,
                previousValue: 10,
                direction: 'Minus'
            })
        );
    });
});

describe('ItemMonitor', () => {
    let monitor;
    let actor;
    let item;

    beforeEach(() => {
        monitor = new ItemMonitor();
        actor = {
            type: 'character',
            name: 'Test Actor',
            prototypeToken: { name: 'Test Token' },
            testUserPermission: () => true
        };
        item = {
            parent: actor,
            type: 'equipment',
            name: 'Sword',
            system: {
                quantity: 1,
                equipped: false
            }
        };
        Settings.get.mockReturnValue(true);
    });

    test('should detect item equip', async () => {
        const diff = { system: { equipped: true } };
        
        await monitor.onPreUpdateItem(item, diff, {}, 'gamemaster');

        expect(Logger.log).toHaveBeenCalledWith(
            'on',
            'itemEquip.hbs',
            expect.objectContaining({
                itemName: 'Sword',
                equipped: true
            })
        );
    });
});

describe('EffectMonitor', () => {
    let monitor;
    let actor;
    let effect;

    beforeEach(() => {
        monitor = new EffectMonitor();
        actor = {
            type: 'character',
            name: 'Test Actor',
            prototypeToken: { name: 'Test Token' }
        };
        effect = {
            parent: actor,
            name: 'Bless'
        };
        Settings.get.mockReturnValue(true);
    });

    test('should detect effect creation', async () => {
        await monitor.onCreateActiveEffect(effect, {}, 'gamemaster');

        expect(Logger.log).toHaveBeenCalledWith(
            'Effects',
            'effectEnabled.hbs',
            expect.objectContaining({
                effectName: 'Bless',
                action: 'Enabled'
            })
        );
    });
});
