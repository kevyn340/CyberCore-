const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'guildCreate',

    async execute(guild, client) {
        console.log(`[BOT] Adicionado ao servidor: ${guild.name} (${guild.id})`);

        const owner = await guild.fetchOwner().catch(() => null);
        if (!owner) return;

        const botoesRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Suporte')
                .setStyle(ButtonStyle.Link)
                .setURL('https://discord.gg/cybercore'),
            new ButtonBuilder()
                .setLabel('Dashboard')
                .setStyle(ButtonStyle.Link)
                .setURL('https://cybercore.replit.app'),
        );

        const embed = new EmbedBuilder()
            .setColor(0x0055FF)
            .setTitle('Obrigado por adicionar o CyberCore Bot! 🚀')
            .setDescription(
                `Olá, **${owner.user.username}**! O **CyberCore Bot** foi adicionado com sucesso ao servidor **${guild.name}**.\n\n` +
                `Aqui está um resumo completo de tudo que o bot pode fazer:`
            )
            .addFields(
                {
                    name: '🎫 Sistema de Tickets',
                    value:
                        '`/ticket-panel` — Envia o painel de atendimento\n' +
                        '`/ticket fechar` — Fecha o ticket atual\n' +
                        '`/ticket reabrir` — Reabre um ticket fechado\n' +
                        '`/ticket deletar` — Deleta o canal do ticket\n' +
                        '`/ticket assumir` — Staff assume o atendimento\n' +
                        '`/ticket renomear` — Renomeia o canal\n' +
                        '`/ticket prioridade` — Define Baixa / Média / Alta\n' +
                        '`/ticket adicionar` — Adiciona um usuário ao ticket\n' +
                        '`/ticket remover` — Remove um usuário do ticket\n' +
                        '`/transcript` — Gera HTML com o histórico do ticket',
                },
                {
                    name: '🔨 Moderação',
                    value:
                        '`/ban` — Bane um usuário (envia DM com motivo)\n' +
                        '`/kick` — Expulsa um usuário\n' +
                        '`/mute` — Silencia via timeout (1 min a 28 dias)\n' +
                        '`/unmute` — Remove o silêncio\n' +
                        '`/warn` — Registra um aviso no banco de dados\n' +
                        '`/clear` — Apaga até 100 mensagens de uma vez',
                },
                {
                    name: '⚙️ Configuração',
                    value:
                        '`/setstaff` — Define o cargo de Staff\n' +
                        '`/setcategory` — Define a categoria dos tickets\n' +
                        '`/setlogs` — Define o canal de logs',
                },
                {
                    name: '📊 Estatísticas',
                    value:
                        '`/stats` — Exibe tickets abertos/fechados, punições,\n' +
                        'entradas, saídas e mensagens deletadas',
                },
                {
                    name: '🖥️ Dashboard Web',
                    value:
                        'Acesse o painel de controle pelo navegador para visualizar\n' +
                        'tickets, estatísticas e logs do servidor em tempo real.',
                },
                {
                    name: '🛡️ Logs Automáticos',
                    value:
                        '• Mensagens editadas e deletadas\n' +
                        '• Entradas e saídas de membros\n' +
                        '• Abertura e fechamento de tickets\n' +
                        '• Todas as punições aplicadas',
                },
                {
                    name: '🚀 Primeiros Passos',
                    value:
                        '**1.** `/setcategory` → escolha onde ficam os canais de ticket\n' +
                        '**2.** `/setstaff` → defina o cargo da equipe de suporte\n' +
                        '**3.** `/setlogs` → escolha o canal de logs *(opcional)*\n' +
                        '**4.** `/ticket-panel` → envie o painel num canal público',
                },
            )
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'CyberCore Development • Dúvidas? Abra um ticket no nosso servidor.' })
            .setTimestamp();

        await owner.send({ embeds: [embed], components: [botoesRow] }).catch(err => {
            console.warn(`[guildCreate] Não foi possível enviar DM para ${owner.user.tag}: ${err.message}`);
        });
    }
};
