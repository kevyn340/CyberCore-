// ============================================================
// BUTTON: delete_ticket - Deleta o canal do ticket
// ============================================================
const { EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { tickets, guildConfig } = require('../database/database');

module.exports = {
    customId: 'delete_ticket',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const ticket = tickets.getByChannel(interaction.channelId);
        if (!ticket) return interaction.editReply({ content: 'Canal de ticket nao encontrado.' });

        const config  = guildConfig.get(interaction.guild.id);
        const isStaff = config?.staff_role_id
            ? interaction.member.roles.cache.has(config.staff_role_id) || interaction.member.permissions.has(PermissionFlagsBits.Administrator)
            : interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isStaff) return interaction.editReply({ content: 'Apenas staff pode deletar tickets.' });

        if (config?.log_channel_id) {
            const logCh = interaction.guild.channels.cache.get(config.log_channel_id);
            logCh?.send({
                embeds: [new EmbedBuilder()
                    .setColor(0xCC0000)
                    .setTitle('Ticket Deletado')
                    .addFields(
                        { name: 'ID', value: ticket.ticket_id, inline: true },
                        { name: 'Deletado por', value: interaction.user.tag, inline: true },
                        { name: 'Dono', value: `<@${ticket.user_id}>`, inline: true },
                    )
                    .setTimestamp()
                ]
            }).catch(() => {});
        }

        tickets.delete(interaction.channelId);
        await interaction.editReply({ content: 'Deletando em 5 segundos...' });
        setTimeout(() => {
            interaction.channel.delete(`Deletado por ${interaction.user.tag}`).catch(() => {});
        }, 5000);
    }
};
