// ============================================================
// INDEX.JS - Arquivo principal do CyberCore Bot
// ============================================================
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { initDatabase } = require('./database/database');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');
const buttonHandler = require('./handlers/buttonHandler');

// ============================================================
// INICIALIZA O CLIENT DISCORD
// ============================================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember]
});

// Coleções para comandos e botões
client.commands = new Collection();
client.buttons  = new Collection();

// ============================================================
// INICIALIZA O BANCO DE DADOS
// ============================================================
initDatabase();

// ============================================================
// CARREGA HANDLERS
// ============================================================
commandHandler(client);
eventHandler(client);
buttonHandler(client);

// ============================================================
// LOGIN DO BOT
// ============================================================
client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('[BOT] ❌ Erro ao fazer login:', err.message);
    process.exit(1);
});

// ============================================================
// INICIA O DASHBOARD WEB (Express)
// ============================================================
const dashboard = require('../dashboard/app');
const PORT = process.env.DASHBOARD_PORT || 5000;
dashboard.listen(PORT, '0.0.0.0', () => {
    console.log(`[DASHBOARD] 🌐 Rodando em http://0.0.0.0:${PORT}`);
});

// Tratamento global de erros não capturados
process.on('unhandledRejection', (err) => {
    console.error('[BOT] ⚠️  UnhandledRejection:', err);
});
process.on('uncaughtException', (err) => {
    console.error('[BOT] ❌ UncaughtException:', err);
});
