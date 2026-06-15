const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { guildConfig } = require('../../database/database');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('setstaff')
        .setDescription('Define o cargo de Staff do servidor')
        .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo de staff').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const role = interaction.options.getRole('cargo');
        guildConfig.set(interaction.guild.id, 'staff_role_id', role.id);

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor(0x0055FF)
                .setTitle('Staff Configurado')
                .setDescription(`O cargo ${role} foi definido como Staff.`)
                .setTimestamp()
            ],
            flags: [MessageFlags.Ephemeral]
        });
    }
};
