const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { guildConfig } = require('../../database/database');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Remove o silencio de um membro')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const target = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('motivo') || 'Sem motivo informado';

        if (!target) return interaction.editReply({ content: 'Usuario nao encontrado.' });
        if (!target.isCommunicationDisabled()) return interaction.editReply({ content: 'Este usuario nao esta silenciado.' });

        await target.timeout(null, reason);

        const embed = new EmbedBuilder()
            .setColor(0x00AA55)
            .setTitle('Silencio Removido')
            .addFields(
                { name: 'Usuario', value: `${target.user.tag}`, inline: true },
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
