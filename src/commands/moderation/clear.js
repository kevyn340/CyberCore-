const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Apaga mensagens em massa do canal')
        .addIntegerOption(opt =>
            opt.setName('quantidade').setDescription('Quantidade (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
        .addUserOption(opt =>
            opt.setName('usuario').setDescription('Filtrar por usuario (opcional)').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const amount = interaction.options.getInteger('quantidade');
        const filter = interaction.options.getUser('usuario');

        let messages = await interaction.channel.messages.fetch({ limit: 100 });

        if (filter) messages = messages.filter(m => m.author.id === filter.id);

        const twoWeeks = Date.now() - 14 * 24 * 60 * 60 * 1000;
        messages = messages.filter(m => m.createdTimestamp > twoWeeks).first(amount);

        if (!messages.length) {
            return interaction.editReply({ content: 'Nenhuma mensagem valida encontrada para deletar.' });
        }

        const deleted = await interaction.channel.bulkDelete(messages, true);

        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor(0x0055FF)
                .setTitle('Mensagens Apagadas')
                .setDescription(`**${deleted.size}** mensagem(ns) deletada(s).`)
                .setTimestamp()
            ]
        });
    }
};
