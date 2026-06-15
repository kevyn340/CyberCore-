const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { warnings, stats, guildConfig } = require('../../database/database');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Avisa um membro e registra o aviso')
        .addUserOption(opt => opt.setName('usuario').setDescription('Usuario').setRequired(true))
        .addStringOption(opt => opt.setName('motivo').setDescription('Motivo do aviso').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const target = interaction.options.getMember('usuario');
        const reason = interaction.options.getString('motivo');

        if (!target) return interaction.editReply({ content: 'Usuario nao encontrado.' });
        if (target.user.bot) return interaction.editReply({ content: 'Nao e possivel avisar um bot.' });

        warnings.add(interaction.guild.id, target.id, interaction.user.id, reason);
        const total = warnings.count(interaction.guild.id, target.id);
        stats.increment(interaction.guild.id, 'punishments_given');

        const dmEmbed = new EmbedBuilder()
            .setColor(0xFFAA00)
            .setTitle(`Aviso recebido em ${interaction.guild.name}`)
            .addFields(
                { name: 'Motivo', value: reason },
                { name: 'Total de avisos', value: `${total}` }
            )
            .setTimestamp();
        await target.send({ embeds: [dmEmbed] }).catch(() => {});

        const embed = new EmbedBuilder()
            .setColor(0xFFAA00)
            .setTitle('Aviso Registrado')
            .addFields(
                { name: 'Usuario', value: `${target.user.tag}`, inline: true },
                { name: 'Total de avisos', value: `${total}`, inline: true },
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
