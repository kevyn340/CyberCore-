const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { punishments, stats, guildConfig } = require('../../database/database');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Bane um usuario do servidor')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario a banir').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do ban').setRequired(false))
        .addIntegerOption(opt => opt.setName('dias').setDescription('Dias de mensagens a deletar (0-7)').setMinValue(0).setMaxValue(7).setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const target = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('motivo') || 'Sem motivo informado';
        const days   = interaction.options.getInteger('dias') || 0;

        if (!target) return interaction.editReply({ content: 'Usuario nao encontrado.' });
        if (target.id === interaction.user.id) return interaction.editReply({ content: 'Voce nao pode se banir.' });
        if (!target.bannable) return interaction.editReply({ content: 'Nao consigo banir este usuario (verifique a hierarquia de cargos).' });

        const dmEmbed = new EmbedBuilder()
            .setColor(0xCC0000)
            .setTitle(`Voce foi banido de ${interaction.guild.name}`)
            .addFields({ name: 'Motivo', value: reason }, { name: 'Moderador', value: interaction.user.tag })
            .setTimestamp();
        await target.send({ embeds: [dmEmbed] }).catch(() => {});

        await target.ban({ reason, deleteMessageDays: days });

        punishments.add({ guild_id: interaction.guild.id, user_id: target.id, moderator_id: interaction.user.id, type: 'ban', reason });
        stats.increment(interaction.guild.id, 'punishments_given');

        const embed = new EmbedBuilder()
            .setColor(0xCC0000)
            .setTitle('Usuario Banido')
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
