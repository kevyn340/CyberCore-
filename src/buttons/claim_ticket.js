// ============================================================
// BUTTON: claim_ticket - Staff assume o ticket
// ============================================================
const { EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { tickets, guildConfig } = require('../database/database');

module.exports = {
    customId: 'claim_ticket',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const ticket = tickets.getByChannel(interaction.channelId);
        if (!ticket) return interaction.editReply({ content: 'Canal de ticket nao encontrado.' });

        const config  = guildConfig.get(interaction.guild.id);
        const isStaff = config?.staff_role_id
            ? interaction.member.roles.cache.has(config.staff_role_id) || interaction.member.permissions.has(PermissionFlagsBits.Administrator)
            : interaction.member.permissions.has(PermissionFlagsBits.Administrator);

        if (!isStaff) return interaction.editReply({ content: 'Apenas staff pode assumir tickets.' });
        if (ticket.claimed_by) return interaction.editReply({ content: `Este ticket ja foi assumido por <@${ticket.claimed_by}>.` });

        tickets.claim(interaction.channelId, interaction.user.id);

        await interaction.channel.send({
            embeds: [new EmbedBuilder()
                .setColor(0x0055FF)
                .setTitle('Ticket Assumido')
                .setDescription(`${interaction.user} esta atendendo este ticket.`)
                .setTimestamp()
            ]
        });

        await interaction.editReply({ content: 'Voce assumiu este ticket.' });
    }
};
