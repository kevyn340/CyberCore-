// ============================================================
// COMMAND HANDLER - Carrega todos os comandos slash
// ============================================================
const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const commandsPath = path.join(__dirname, '..', 'commands');

    // Percorre recursivamente todas as subpastas de comandos
    const loadCommands = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                loadCommands(filePath); // recursão para subpastas
            } else if (file.endsWith('.js')) {
                const command = require(filePath);
                if (command.data && command.execute) {
                    client.commands.set(command.data.name, command);
                    console.log(`[CMD] ✅ Carregado: /${command.data.name}`);
                } else {
                    console.warn(`[CMD] ⚠️  Arquivo sem data/execute: ${filePath}`);
                }
            }
        }
    };

    loadCommands(commandsPath);
    console.log(`[CMD] 📦 Total de comandos: ${client.commands.size}`);
};
