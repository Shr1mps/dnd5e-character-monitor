import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import './mocks.js';

// Mock dependencies
jest.unstable_mockModule('../scripts/settings.js', () => ({
    Settings: {
        get: jest.fn()
    }
}));

jest.unstable_mockModule('../scripts/socket.js', () => ({
    SocketHandler: {
        executeAsGM: jest.fn()
    }
}));

const { MODULE_ID } = await import('../scripts/config.js');
const { Logger } = await import('../scripts/logger.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const moduleJsonPath = path.join(__dirname, '../module.json');

describe('Module Integrity', () => {
    test('MODULE_ID in config.js should match id in module.json', () => {
        const moduleJson = JSON.parse(fs.readFileSync(moduleJsonPath, 'utf8'));
        expect(MODULE_ID).toBe(moduleJson.id);
    });

    test('Logger should use correct template path prefix', async () => {
        const templateName = 'test.hbs';
        const templateData = { foo: 'bar' };
        
        await Logger.log('test', templateName, templateData);

        expect(global.renderTemplate).toHaveBeenCalledWith(
            `modules/${MODULE_ID}/templates/${templateName}`,
            templateData
        );
    });
});
