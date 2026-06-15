// ============================================================
// BUTTON: close_ticket - Fecha o ticket
// ============================================================
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { tickets, guildConfig, stats } = require('../database/database');

module.exports = {
    customId: 'close_ticket',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const ticket = tickets.getByChannel(interaction.channelId);
        if (!ticket) return interaction.editReply({ content: 'Canal de ticket nao encontrado.' });
        if (ticket.status === 'closed') return interaction.editReply({ content: 'Este ticket ja esta fechado.' });

        const config  = guildConfig.get(interaction.guild.id);
        const isStaff = config?.staff_role_id
            ? interaction.member.roles.cache.has(config.staff_role_id) || interaction.member.permissions.has(PermissionFlagsBits.Administrator)
            : interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const isOwner = ticket.user_id === interaction.user.id;

        if (!isStaff && !isOwner) return interaction.editReply({ content: 'Sem permissao para fechar este ticket.' });

        tickets.updateStatus(interaction.channelId, 'closed');
        stats.increment(interaction.guild.id, 'tickets_closed');

        const ticketUser = await interaction.guild.members.fetch(ticket.user_id).catch(() => null);
        if (ticketUser) {
            await interaction.channel.permissionOverwrites.edit(ticketUser, { ViewChannel: false }).catch(() => {});
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('reopen_ticket').setLabel('Reabrir').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('delete_ticket').setLabel('Deletar').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('transcript_ticket').setLabel('Transcript').setStyle(ButtonStyle.Secondary),
        );

        await interaction.channel.send({
            embeds: [new EmbedBuilder()
                .setColor(0xCC3333)
                .setTitle('Ticket Fechado')
                .setDescription(`Fechado por ${interaction.user}.`)
                .setTimestamp()
            ],
            components: [row]
        });
        await interaction.editReply({ content: 'Ticket fechado.' });

        if (config?.log_channel_id) {
            const logCh = interaction.guild.channels.cache.get(config.log_channel_id);
            logCh?.send({ embeds: [new EmbedBuilder()
                .setColor(0xCC3333)
                .setTitle('Ticket Fechado')
                .addFields(
                    { name: 'ID', value: ticket.ticket_id, inline: true },
                    { name: 'Fechado por', value: interaction.user.tag, inline: true },
                    { name: 'Dono', value: `<@${ticket.user_id}>`, inline: true },
                )
                .setTimestamp()
            ]}).catch(() => {});
        }
    }
};
