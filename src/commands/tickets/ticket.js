const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const { tickets, guildConfig } = require('../../database/database');

module.exports = {
    cooldown: 5,
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Gerencia o ticket atual')
        .addSubcommand(sub => sub.setName('fechar').setDescription('Fecha o ticket atual'))
        .addSubcommand(sub => sub.setName('reabrir').setDescription('Reabre o ticket atual'))
        .addSubcommand(sub => sub.setName('deletar').setDescription('Deleta o ticket atual'))
        .addSubcommand(sub => sub.setName('assumir').setDescription('Assume o atendimento deste ticket'))
        .addSubcommand(sub =>
            sub.setName('renomear')
                .setDescription('Renomeia o ticket')
                .addStringOption(opt => opt.setName('nome').setDescription('Novo nome').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('prioridade')
                .setDescription('Define a prioridade')
                .addStringOption(opt =>
                    opt.setName('nivel').setDescription('Nivel').setRequired(true)
                        .addChoices(
                            { name: 'Baixa',  value: 'low'    },
                            { name: 'Media',  value: 'medium' },
                            { name: 'Alta',   value: 'high'   }
                        )))
        .addSubcommand(sub =>
            sub.setName('adicionar')
                .setDescription('Adiciona um usuário ao ticket')
                .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('remover')
                .setDescription('Remove um usuário do ticket')
                .addUserOption(opt => opt.setName('usuario').setDescription('Usuário').setRequired(true))),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const sub    = interaction.options.getSubcommand();
        const ticket = tickets.getByChannel(interaction.channelId);

        if (!ticket) return interaction.editReply({ content: 'Este comando só pode ser usado em um canal de ticket.' });

        const config  = guildConfig.get(interaction.guild.id);
        const isStaff = config?.staff_role_id
            ? interaction.member.roles.cache.has(config.staff_role_id) || interaction.member.permissions.has(PermissionFlagsBits.Administrator)
            : interaction.member.permissions.has(PermissionFlagsBits.Administrator);
        const isOwner = ticket.user_id === interaction.user.id;

        const LABELS = { low: 'Baixa', medium: 'Média', high: 'Alta' };
        const CORES  = { low: 0x00AA55, medium: 0xFFAA00, high: 0xCC0000 };

        switch (sub) {
            case 'fechar': {
                if (!isStaff && !isOwner) return interaction.editReply({ content: 'Sem permissão.' });
                if (ticket.status === 'closed') return interaction.editReply({ content: 'Ticket já está fechado.' });
                tickets.updateStatus(interaction.channelId, 'closed');
                await interaction.channel.send({
                    embeds: [new EmbedBuilder().setColor(0xCC3333).setTitle('Ticket Fechado').setDescription(`Fechado por ${interaction.user}.`).setTimestamp()]
                });
                const tu1 = await interaction.guild.members.fetch(ticket.user_id).catch(() => null);
                if (tu1) await interaction.channel.permissionOverwrites.edit(tu1, { ViewChannel: false }).catch(() => {});
                await interaction.editReply({ content: 'Ticket fechado.' });
                break;
            }
            case 'reabrir': {
                if (!isStaff) return interaction.editReply({ content: 'Apenas staff pode reabrir tickets.' });
                if (ticket.status === 'open') return interaction.editReply({ content: 'Ticket já está aberto.' });
                tickets.updateStatus(interaction.channelId, 'open');
                const tu2 = await interaction.guild.members.fetch(ticket.user_id).catch(() => null);
                if (tu2) await interaction.channel.permissionOverwrites.edit(tu2, { ViewChannel: true, SendMessages: true }).catch(() => {});
                await interaction.channel.send({
                    embeds: [new EmbedBuilder().setColor(0x00AA55).setTitle('Ticket Reaberto').setDescription(`Reaberto por ${interaction.user}.`).setTimestamp()]
                });
                await interaction.editReply({ content: 'Ticket reaberto.' });
                break;
            }
            case 'deletar': {
                if (!isStaff) return interaction.editReply({ content: 'Apenas staff pode deletar tickets.' });
                tickets.delete(interaction.channelId);
                await interaction.editReply({ content: 'Deletando em 5 segundos...' });
                setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
                break;
            }
            case 'assumir': {
                if (!isStaff) return interaction.editReply({ content: 'Apenas staff pode assumir tickets.' });
                tickets.claim(interaction.channelId, interaction.user.id);
                await interaction.channel.send({
                    embeds: [new EmbedBuilder().setColor(0x0055FF).setTitle('Ticket Assumido').setDescription(`${interaction.user} está atendendo este ticket.`).setTimestamp()]
                });
                await interaction.editReply({ content: 'Você assumiu este ticket.' });
                break;
            }
            case 'renomear': {
                if (!isStaff) return interaction.editReply({ content: 'Apenas staff pode renomear tickets.' });
                const nome = interaction.options.getString('nome').toLowerCase().replace(/\s+/g, '-').slice(0, 50);
                await interaction.channel.setName(`ticket-${nome}`);
                await interaction.editReply({ content: `Canal renomeado para ticket-${nome}.` });
                break;
            }
            case 'prioridade': {
                if (!isStaff) return interaction.editReply({ content: 'Apenas staff pode definir prioridade.' });
                const nivel = interaction.options.getString('nivel');
                tickets.updatePriority(interaction.channelId, nivel);
                await interaction.channel.send({
                    embeds: [new EmbedBuilder().setColor(CORES[nivel]).setTitle('Prioridade Atualizada').setDescription(`Definida como **${LABELS[nivel]}** por ${interaction.user}.`).setTimestamp()]
                });
                await interaction.editReply({ content: `Prioridade: ${LABELS[nivel]}` });
                break;
            }
            case 'adicionar': {
                if (!isStaff) return interaction.editReply({ content: 'Apenas staff pode adicionar usuários.' });
                const user = interaction.options.getMember('usuario');
                await interaction.channel.permissionOverwrites.edit(user, { ViewChannel: true, SendMessages: true });
                await interaction.editReply({ content: `${user} adicionado ao ticket.` });
                break;
            }
            case 'remover': {
                if (!isStaff) return interaction.editReply({ content: 'Apenas staff pode remover usuários.' });
                const user = interaction.options.getMember('usuario');
                if (user.id === ticket.user_id) return interaction.editReply({ content: 'Não é possível remover o dono do ticket.' });
                await interaction.channel.permissionOverwrites.delete(user);
                await interaction.editReply({ content: `${user} removido do ticket.` });
                break;
            }
        }
    }
};
