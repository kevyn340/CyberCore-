const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { punishments, stats, guildConfig } = require('../../database/database');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Silencia um membro com timeout')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))
        .addIntegerOption(opt => opt.setName('minutos').setDescription('Duracao em minutos (1-40320)').setMinValue(1).setMaxValue(40320).setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const target  = interaction.options.getMember('usuario');
        const minutes = interaction.options.getInteger('minutos');
        const reason  = interaction.options.getString('motivo') || 'Sem motivo informado';

        if (!target) return interaction.editReply({ content: 'Usuario nao encontrado.' });
        if (!target.moderatable) return interaction.editReply({ content: 'Nao consigo silenciar este usuario.' });

        await target.timeout(minutes * 60 * 1000, reason);

        punishments.add({ guild_id: interaction.guild.id, user_id: target.id, moderator_id: interaction.user.id, type: 'mute', reason, duration: minutes });
        stats.increment(interaction.guild.id, 'punishments_given');

        const embed = new EmbedBuilder()
            .setColor(0xFFAA00)
            .setTitle('Membro Silenciado')
            .addFields(
                { name: 'Usuario', value: `${target.user.tag}`, inline: true },
                { name: 'Duracao', value: `${minutes} minuto(s)`, inline: true },
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
