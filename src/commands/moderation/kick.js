const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { punishments, stats, guildConfig } = require('../../database/database');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Expulsa um usuario do servidor')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const target = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('motivo') || 'Sem motivo informado';

        if (!target) return interaction.editReply({ content: 'Usuario nao encontrado.' });
        if (target.id === interaction.user.id) return interaction.editReply({ content: 'Voce nao pode se expulsar.' });
        if (!target.kickable) return interaction.editReply({ content: 'Nao consigo expulsar este usuario.' });

        const dmEmbed = new EmbedBuilder()
            .setColor(0xFF6600)
            .setTitle(`Voce foi expulso de ${interaction.guild.name}`)
            .addFields({ name: 'Motivo', value: reason }, { name: 'Moderador', value: interaction.user.tag })
            .setTimestamp();
        await target.send({ embeds: [dmEmbed] }).catch(() => {});

        await target.kick(reason);
        punishments.add({ guild_id: interaction.guild.id, user_id: target.id, moderator_id: interaction.user.id, type: 'kick', reason });
        stats.increment(interaction.guild.id, 'punishments_given');

        const embed = new EmbedBuilder()
            .setColor(0xFF6600)
            .setTitle('Usuario Expulso')
            .addFields(
                { name: 'Usuario', value: `${target.user.tag} (${target.id})`, inline: true },
                { name: 'Moderador', value: interaction.user.tag, inline: true },
                { name: 'Motivo', value: reason }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        const config = guildConfig.get(interaction.guild.id);
        if (config?.log_channel_id) {
            interaction.guild.channels.cache.get(config.log_channel_id)?.send({ embeds: [embed] }).catch(() => {});
        }
    }
};
