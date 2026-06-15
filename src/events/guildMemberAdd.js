// ============================================================
// EVENTO: guildMemberAdd - Log quando membro entra
// ============================================================
const { EmbedBuilder } = require('discord.js');
const { guildConfig, stats } = require('../database/database');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        stats.increment(member.guild.id, 'members_joined');

        const config = guildConfig.get(member.guild.id);
        if (!config?.log_channel_id) return;

        const logChannel = member.guild.channels.cache.get(config.log_channel_id);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor(0x00FF88)
            .setTitle('📥 Novo Membro')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Usuário', value: `${member.user.tag} (${member.user.id})`, inline: true },
                { name: 'Conta criada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'Membros agora', value: `${member.guild.memberCount}`, inline: true }
            )
            .setFooter({ text: `ID: ${member.id}` })
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
