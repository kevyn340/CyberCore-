// ============================================================
// EVENTO: messageDelete - Log quando mensagem é deletada
// ============================================================
const { EmbedBuilder } = require('discord.js');
const { guildConfig, stats } = require('../database/database');

module.exports = {
    name: 'messageDelete',
    async execute(message, client) {
        // Ignora bots e mensagens sem guild
        if (!message.guild || message.author?.bot) return;

        stats.increment(message.guild.id, 'messages_deleted');

        const config = guildConfig.get(message.guild.id);
        if (!config?.log_channel_id) return;

        const logChannel = message.guild.channels.cache.get(config.log_channel_id);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor(0xFF6600)
            .setTitle('🗑️ Mensagem Deletada')
            .addFields(
                { name: 'Autor', value: message.author ? `${message.author.tag} (${message.author.id})` : 'Desconhecido', inline: true },
                { name: 'Canal', value: `<#${message.channelId}>`, inline: true },
                { name: 'Conteúdo', value: message.content?.slice(0, 1024) || '*Sem conteúdo de texto*' }
            )
            .setFooter({ text: `ID da mensagem: ${message.id}` })
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
