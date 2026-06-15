const {
    EmbedBuilder, ActionRowBuilder, ButtonBuilder,
    ButtonStyle, PermissionFlagsBits, ChannelType, MessageFlags
} = require('discord.js');
const { tickets, guildConfig, stats, db } = require('../database/database');

const CATEGORIES = {
    parcerias: { label: 'Parcerias',       emoji: '🤝', color: 0x888899 },
    compras:   { label: 'Compras',         emoji: '💰', color: 0x00AA44 },
    projetos:  { label: 'Projetos Web',    emoji: '🌐', color: 0x0055FF },
    suporte:   { label: 'Suporte Técnico', emoji: '🛠️', color: 0x0077CC },
    bugs:      { label: 'Reportar Bug',    emoji: '🐞', color: 0xCC0000 },
    outros:    { label: 'Outros Assuntos', emoji: '📢', color: 0x555566 },
};

function gerarTicketId(guildId) {
    const row = db.prepare('SELECT COUNT(*) as total FROM tickets WHERE guild_id = ?').get(guildId);
    const num    = (row?.total || 0) + 1;
    const suffix = Date.now().toString(36).slice(-4).toUpperCase();
    return `ticket-${String(num).padStart(4, '0')}-${suffix}`;
}

module.exports = {
    customId: 'open_ticket',

    async execute(interaction, client) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const category = interaction.customId.split(':')[1] || 'suporte';
        const catInfo  = CATEGORIES[category] || CATEGORIES.suporte;
        const guild    = interaction.guild;
        const user     = interaction.user;

        const config = guildConfig.get(guild.id);
        if (!config?.ticket_category_id) {
            return interaction.editReply({ content: 'O sistema de tickets não está configurado. Use /setcategory.' });
        }

        // Anti-ticket duplicado
        const existing = tickets.getByUser(guild.id, user.id);
        if (existing) {
            const ch = guild.channels.cache.get(existing.channel_id);
            return interaction.editReply({
                content: ch ? `Você já tem um ticket aberto: ${ch}` : 'Você já tem um ticket aberto.',
            });
        }

        const ticketId = gerarTicketId(guild.id);

        const permOverwrites = [
            { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: user.id,  allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        ];

        if (config.staff_role_id) {
            permOverwrites.push({
                id: config.staff_role_id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageMessages],
            });
        }

        const channel = await guild.channels.create({
            name: ticketId,
            type: ChannelType.GuildText,
            parent: config.ticket_category_id,
            permissionOverwrites: permOverwrites,
            topic: `${catInfo.emoji} ${catInfo.label} — Aberto por ${user.tag}`,
        });

        tickets.create({
            ticket_id:  ticketId,
            guild_id:   guild.id,
            channel_id: channel.id,
            user_id:    user.id,
            category:   category,
            priority:   'low',
        });

        stats.increment(guild.id, 'tickets_opened');
        stats.increment(guild.id, 'users_served');

        const welcomeEmbed = new EmbedBuilder()
            .setColor(catInfo.color)
            .setTitle(`${catInfo.emoji} ${catInfo.label}`)
            .setDescription(
                `Olá, ${user}! Seu ticket foi aberto com sucesso.\n\n` +
                `Descreva sua solicitação com o máximo de detalhes possível e nossa equipe irá atendê-lo em breve.`
            )
            .addFields(
                { name: 'ID',         value: ticketId,     inline: true },
                { name: 'Categoria',  value: catInfo.label, inline: true },
                { name: 'Prioridade', value: 'Baixa',       inline: true },
            )
            .setFooter({ text: 'Equipe CyberCore Development' })
            .setTimestamp();

        const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('close_ticket').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('Assumir').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('transcript_ticket').setLabel('Transcript').setStyle(ButtonStyle.Secondary),
        );

        const ticketMsg = await channel.send({
            content: `${user}${config.staff_role_id ? ` <@&${config.staff_role_id}>` : ''}`,
            embeds: [welcomeEmbed],
            components: [actionRow],
        });
        await ticketMsg.pin().catch(() => {});

        if (config.log_channel_id) {
            const logCh = guild.channels.cache.get(config.log_channel_id);
            logCh?.send({
                embeds: [new EmbedBuilder()
                    .setColor(0x00AA55)
                    .setTitle('Ticket Aberto')
                    .addFields(
                        { name: 'ID',        value: ticketId,      inline: true },
                        { name: 'Usuário',   value: user.tag,      inline: true },
                        { name: 'Categoria', value: catInfo.label, inline: true },
                        { name: 'Canal',     value: `${channel}`,  inline: true },
                    )
                    .setTimestamp()
                ]
            }).catch(() => {});
        }

        await interaction.editReply({ content: `Ticket criado com sucesso: ${channel}` });
    }
};
