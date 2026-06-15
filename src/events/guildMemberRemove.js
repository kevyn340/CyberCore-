// ============================================================
// EVENTO: guildMemberRemove - Log quando membro sai
// ============================================================
const { EmbedBuilder } = require('discord.js');
const { guildConfig, stats } = require('../database/database');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        stats.increment(member.guild.id, 'members_left');

        const config = guildConfig.get(member.guild.id);
        if (!config?.log_channel_id) return;

        const logChannel = member.guild.channels.cache.get(config.log_channel_id);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor(0xFF4444)
            .setTitle('📤 Membro Saiu')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Usuário', value: `${member.user.tag} (${member.user.id})`, inline: true },
                { name: 'Entrou em', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Desconhecido', inline: true },
                { name: 'Membros agora', value: `${member.guild.memberCount}`, inline: true }
            )
            .setFooter({ text: `ID: ${member.id}` })
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
