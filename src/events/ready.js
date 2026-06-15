// ============================================================
// EVENTO: ready - Disparado quando o bot fica online
// ============================================================
const { ActivityType } = require('discord.js');

module.exports = {
    name: 'ready',
    once: true, // roda apenas uma vez
    async execute(client) {
        console.log(`[BOT] ✅ Online como: ${client.user.tag}`);
        console.log(`[BOT] 🏠 Servidores: ${client.guilds.cache.size}`);

        // Define a atividade do bot
        client.user.setPresence({
            activities: [{
                name: '🎫 CyberCore Tickets',
                type: ActivityType.Watching
            }],
            status: 'online'
        });
    }
};
