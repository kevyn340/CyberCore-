// ============================================================
// BUTTON: reopen_ticket - Reabre o ticket
// ============================================================
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { tickets, guildConfig } = require('../database/database');

module.exports = {
    customId: 'reopen_ticket',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const ticket = tickets.getByChannel(interaction.channelId);
        if (!ticket) return interaction.editReply({ content: 'Canal de ticket nao encontrado.' });
        if (ticket.status === 'open') return interaction.editReply({ content: 'Ticket ja esta aberto.' });

        const config  = guildConfig.get(interaction.guild.id);
        const isStaff = config?.staff_role_id
            ? interaction.member.roles.cache.has(config.staff_role_id) || interaction.member.permissions.has(PermissionFlagsBits.Administrator)
            : interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isStaff) return interaction.editReply({ content: 'Apenas staff pode reabrir tickets.' });

        tickets.updateStatus(interaction.channelId, 'open');

        const ticketUser = await interaction.guild.members.fetch(ticket.user_id).catch(() => null);
        if (ticketUser) {
            await interaction.channel.permissionOverwrites.edit(ticketUser, {
                ViewChannel: true, SendMessages: true, ReadMessageHistory: true
            }).catch(() => {});
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('Assumir').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('transcript_ticket').setLabel('Transcript').setStyle(ButtonStyle.Secondary),
        );

        await interaction.channel.send({
            embeds: [new EmbedBuilder()
                .setColor(0x00AA55)
                .setTitle('Ticket Reaberto')
                .setDescription(`Reaberto por ${interaction.user}.`)
                .setTimestamp()
            ],
            components: [row]
        });
        await interaction.editReply({ content: 'Ticket reaberto.' });
    }
};
