// ============================================================
// BUTTON HANDLER - Carrega todos os handlers de botões
// ============================================================
const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const buttonsPath = path.join(__dirname, '..', 'buttons');
    const files = fs.readdirSync(buttonsPath).filter(f => f.endsWith('.js'));

    for (const file of files) {
        const button = require(path.join(buttonsPath, file));
        if (button.customId && button.execute) {
            client.buttons.set(button.customId, button);
            console.log(`[BTN] ✅ Botão registrado: ${button.customId}`);
        }
    }
};
