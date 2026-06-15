// ============================================================
// EVENTO: messageUpdate - Log quando mensagem é editada
// ============================================================
const { EmbedBuilder } = require('discord.js');
const { guildConfig } = require('../database/database');

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage, client) {
        if (!oldMessage.guild || oldMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return; // sem mudança real

        const config = guildConfig.get(oldMessage.guild.id);
        if (!config?.log_channel_id) return;

        const logChannel = oldMessage.guild.channels.cache.get(config.log_channel_id);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor(0xFFAA00)
            .setTitle('✏️ Mensagem Editada')
            .setURL(newMessage.url)
            .addFields(
                { name: 'Autor', value: `${oldMessage.author.tag} (${oldMessage.author.id})`, inline: true },
                { name: 'Canal', value: `<#${oldMessage.channelId}>`, inline: true },
                { name: 'Antes', value: oldMessage.content?.slice(0, 1024) || '*Vazio*' },
                { name: 'Depois', value: newMessage.content?.slice(0, 1024) || '*Vazio*' }
            )
            .setFooter({ text: `ID: ${oldMessage.id}` })
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
