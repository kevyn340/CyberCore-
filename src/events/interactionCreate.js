const { EmbedBuilder, MessageFlags } = require('discord.js');
const { cooldowns } = require('../database/database');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {

        // ---- COMANDOS SLASH ----
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            // Verifica cooldown
            const cooldownTime = command.cooldown || 3;
            const remaining = cooldowns.check(interaction.user.id, interaction.commandName);
            if (remaining > 0) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor(0xCC0000)
                        .setTitle('Aguarde')
                        .setDescription(`Espere **${remaining}s** antes de usar este comando novamente.`)
                    ],
                    flags: [MessageFlags.Ephemeral]
                });
            }

            cooldowns.set(interaction.user.id, interaction.commandName, cooldownTime);

            try {
                await command.execute(interaction, client);
            } catch (err) {
                console.error(`[CMD] Erro em /${interaction.commandName}:`, err);
                const errEmbed = new EmbedBuilder()
                    .setColor(0xCC0000)
                    .setTitle('Erro Interno')
                    .setDescription('Ocorreu um erro ao executar este comando.');

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errEmbed], flags: [MessageFlags.Ephemeral] }).catch(() => {});
                } else {
                    await interaction.reply({ embeds: [errEmbed], flags: [MessageFlags.Ephemeral] }).catch(() => {});
                }
            }
        }

        // ---- BOTÕES ----
        if (interaction.isButton()) {
            // customId pode ter dados extras: "open_ticket:suporte" → baseId = "open_ticket"
            const baseId = interaction.customId.split(':')[0];
            const button = client.buttons.get(baseId) || client.buttons.get(interaction.customId);
            if (!button) return;

            try {
                await button.execute(interaction, client);
            } catch (err) {
                console.error(`[BTN] Erro no botão ${interaction.customId}:`, err);
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({ content: 'Erro ao processar esta acao.', flags: [MessageFlags.Ephemeral] }).catch(() => {});
                }
            }
        }
    }
};
