const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { stats, tickets } = require('../../database/database');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Exibe estatisticas do servidor'),

    async execute(interaction) {
        await interaction.deferReply();

        const s = stats.get(interaction.guild.id);
        const openTickets = tickets.listOpen(interaction.guild.id).length;

        const embed = new EmbedBuilder()
            .setColor(0x0055FF)
            .setTitle('Estatisticas — ' + interaction.guild.name)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Tickets Abertos',   value: `${openTickets}`,          inline: true },
                { name: 'Tickets Fechados',  value: `${s.tickets_closed}`,      inline: true },
                { name: 'Usuarios Atendidos',value: `${s.users_served}`,        inline: true },
                { name: 'Msgs Deletadas',    value: `${s.messages_deleted}`,    inline: true },
                { name: 'Entradas',          value: `${s.members_joined}`,      inline: true },
                { name: 'Saidas',            value: `${s.members_left}`,        inline: true },
                { name: 'Punicoes',          value: `${s.punishments_given}`,   inline: true },
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
