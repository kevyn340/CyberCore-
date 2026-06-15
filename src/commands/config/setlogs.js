const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, MessageFlags } = require('discord.js');
const { guildConfig } = require('../../database/database');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('setlogs')
        .setDescription('Define o canal de logs do servidor')
        .addChannelOption(opt =>
            opt.setName('canal').setDescription('Canal de texto para logs').addChannelTypes(ChannelType.GuildText).setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const channel = interaction.options.getChannel('canal');
        guildConfig.set(interaction.guild.id, 'log_channel_id', channel.id);

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor(0x0055FF)
                .setTitle('Canal de Logs Configurado')
                .setDescription(`Os logs serao enviados em ${channel}.`)
                .setTimestamp()
            ],
            flags: [MessageFlags.Ephemeral]
        });
    }
};
