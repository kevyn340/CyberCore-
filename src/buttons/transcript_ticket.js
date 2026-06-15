// ============================================================
// BUTTON: transcript_ticket - Gera transcript HTML
// ============================================================
const { EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { tickets, guildConfig } = require('../database/database');

module.exports = {
    customId: 'transcript_ticket',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const ticket = tickets.getByChannel(interaction.channelId);
        if (!ticket) return interaction.editReply({ content: 'Canal de ticket nao encontrado.' });

        const config  = guildConfig.get(interaction.guild.id);
        const isStaff = config?.staff_role_id
            ? interaction.member.roles.cache.has(config.staff_role_id) || interaction.member.permissions.has(PermissionFlagsBits.Administrator)
            : interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isStaff) return interaction.editReply({ content: 'Apenas staff pode gerar transcripts.' });

        try {
            const { createTranscript } = require('discord-html-transcripts');
            const attachment = await createTranscript(interaction.channel, {
                returnType: 'attachment',
                filename: `transcript-${ticket.ticket_id}.html`,
                poweredBy: false,
            });

            const embed = new EmbedBuilder()
                .setColor(0x0055FF)
                .setTitle('Transcript')
                .addFields(
                    { name: 'Ticket', value: ticket.ticket_id, inline: true },
                    { name: 'Categoria', value: ticket.category, inline: true },
                    { name: 'Dono', value: `<@${ticket.user_id}>`, inline: true }
                )
                .setTimestamp();

            if (config?.log_channel_id) {
                const logCh = interaction.guild.channels.cache.get(config.log_channel_id);
                await logCh?.send({ embeds: [embed], files: [attachment] }).catch(() => {});
            }

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (err) {
            console.error('[TRANSCRIPT BTN]', err);
            await interaction.editReply({ content: 'Erro ao gerar transcript.' });
        }
    }
};
