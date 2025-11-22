import { MODULE_ID } from './config.js';
import { SocketHandler } from './socket.js';
import { Settings } from './settings.js';

export class Logger {
    static async log(monitorType, templateName, templateData, flags = {}) {
        const content = await renderTemplate(`modules/${MODULE_ID}/templates/${templateName}`, templateData);
        
        const messageFlags = {
            [MODULE_ID]: {
                monitorType: monitorType,
                ...flags
            }
        };

        const whisper = Settings.get('showGMonly')
            ? game.users.filter(u => u.isGM).map(u => u.id)
            : [];

        await SocketHandler.executeAsGM('createMessage', messageFlags, content, whisper);
    }
}
