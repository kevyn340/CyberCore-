const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, MessageFlags } = require('discord.js');
const { guildConfig } = require('../../database/database');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('setcategory')
        .setDescription('Define a categoria onde os tickets serao criados')
        .addChannelOption(opt =>
            opt.setName('categoria').setDescription('Categoria de canais').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const category = interaction.options.getChannel('categoria');
        guildConfig.set(interaction.guild.id, 'ticket_category_id', category.id);

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor(0x0055FF)
                .setTitle('Categoria Configurada')
                .setDescription(`Os tickets serao criados na categoria **${category.name}**.`)
                .setTimestamp()
            ],
            flags: [MessageFlags.Ephemeral]
        });
    }
};
