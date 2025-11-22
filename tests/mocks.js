import { jest } from '@jest/globals';

// Mock Foundry VTT globals
global.Hooks = {
    on: jest.fn(),
    once: jest.fn()
};

global.game = {
    settings: {
        register: jest.fn(),
        registerMenu: jest.fn(),
        get: jest.fn(),
        set: jest.fn()
    },
    i18n: {
        localize: jest.fn(key => key)
    },
    user: {
        isGM: true,
        id: 'gamemaster'
    },
    users: [
        { isGM: true, id: 'gamemaster' },
        { isGM: false, id: 'player' }
    ],
    system: {
        id: 'dnd5e'
    },
    modules: {
        get: jest.fn()
    }
};

global.renderTemplate = jest.fn((path, data) => Promise.resolve(`Rendered ${path}`));
global.ChatMessage = {
    create: jest.fn()
};

global.CONFIG = {
    DND5E: {
        spellLevels: { 1: '1st Level' },
        skills: { acr: { label: 'Acrobatics' } },
        proficiencyLevels: { 1: 'Proficient' },
        abilities: { str: { label: 'Strength' } }
    }
};

global.socketlib = {
    registerModule: jest.fn(() => ({
        register: jest.fn(),
        executeAsGM: jest.fn()
    }))
};

global.FormApplication = class {};
