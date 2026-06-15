// ============================================================
// COMANDO: /transcript - Gera transcript HTML do ticket
// ============================================================
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { tickets, guildConfig } = require('../../database/database');

module.exports = {
    cooldown: 30,
    data: new SlashCommandBuilder()
        .setName('transcript')
        .setDescription('Gera um transcript HTML do ticket atual')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const ticket = tickets.getByChannel(interaction.channelId);
        if (!ticket) return interaction.editReply({ content: '❌ Use este comando em um canal de ticket.' });

        try {
            // Tenta usar discord-html-transcripts
            const { createTranscript } = require('discord-html-transcripts');
            const attachment = await createTranscript(interaction.channel, {
                returnType: 'attachment',
                filename: `transcript-${ticket.ticket_id}.html`,
                poweredBy: false,
            });

            const config = guildConfig.get(interaction.guild.id);
            const embed = new EmbedBuilder()
                .setColor(0x0055FF)
                .setTitle('📄 Transcript Gerado')
                .addFields(
                    { name: 'Ticket', value: ticket.ticket_id, inline: true },
                    { name: 'Categoria', value: ticket.category, inline: true },
                    { name: 'Aberto por', value: `<@${ticket.user_id}>`, inline: true }
                )
                .setTimestamp();

            // Envia para o log se configurado
            if (config?.log_channel_id) {
                const logCh = interaction.guild.channels.cache.get(config.log_channel_id);
                if (logCh) {
                    await logCh.send({ embeds: [embed], files: [attachment] });
                }
            }

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (err) {
            console.error('[TRANSCRIPT]', err);
            await interaction.editReply({ content: '❌ Erro ao gerar transcript. Verifique se discord-html-transcripts está instalado.' });
        }
    }
};
