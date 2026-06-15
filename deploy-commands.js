// ============================================================
// DEPLOY-COMMANDS.JS - Registra os comandos slash no Discord
// ============================================================
require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const commands = [];

// Carrega todos os comandos recursivamente
const loadCommands = (dir) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            const cmd = require(filePath);
            if (cmd.data) commands.push(cmd.data.toJSON());
        }
    }
};

loadCommands(path.join(__dirname, 'src', 'commands'));

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`[DEPLOY] 🚀 Registrando ${commands.length} comandos...`);

        // Deploy apenas no servidor específico (instantâneo) ou global
        const route = process.env.GUILD_ID
            ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
            : Routes.applicationCommands(process.env.CLIENT_ID);

        const data = await rest.put(route, { body: commands });
        console.log(`[DEPLOY] ✅ ${data.length} comandos registrados com sucesso!`);
        data.forEach(cmd => console.log(`  → /${cmd.name}`));
    } catch (err) {
        console.error('[DEPLOY] ❌ Erro:', err);
    }
})();
