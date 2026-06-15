const {
    SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags
} = require('discord.js');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('ticket-panel')
        .setDescription('Envia o painel de tickets no canal atual')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

        const panelEmbed = new EmbedBuilder()
            .setColor(0x0055FF)
            .setTitle('🚀 Bem-vindo(a) à CyberCore')
            .setDescription(
                'Somos uma equipe especializada em desenvolvimento e soluções digitais. ' +
                'Trabalhamos com projetos personalizados para empresas, comunidades e clientes individuais.\n\n' +
                '💻 Desenvolvimento Web\n' +
                '🤖 Bots para Discord\n' +
                '📱 Aplicativos Mobile\n' +
                '🎮 Desenvolvimento de Jogos\n' +
                '🛒 Sites para Lojas e Negócios\n' +
                '⚙️ Sistemas Personalizados\n' +
                '🔒 Automação e Integrações\n\n' +
                'Nossa missão é entregar projetos modernos, seguros e de alta qualidade, sempre buscando inovação e a melhor experiência para nossos clientes.\n\n' +
                '**Escolha uma categoria abaixo para abrir um ticket:**\n\n' +
                '🤝 **Parcerias** — Propostas de parceria, patrocínio ou colaboração.\n' +
                '💰 **Compras** — Solicitações de orçamento, contratação de serviços ou compras.\n' +
                '🌐 **Projetos Web** — Sites, landing pages, sistemas web e lojas virtuais.\n' +
                '🛠️ **Suporte Técnico** — Dúvidas, suporte e assistência geral.\n' +
                '🐞 **Reportar Bug** — Reporte erros encontrados em bots, sites, sistemas ou aplicações da CyberCore.\n' +
                '📢 **Outros Assuntos** — Qualquer assunto que não se encaixe nas categorias acima.'
            )
            .setFooter({ text: 'Equipe CyberCore Development', iconURL: interaction.guild.iconURL() })
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_ticket:parcerias').setLabel('Parcerias').setEmoji('🤝').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('open_ticket:compras').setLabel('Compras').setEmoji('💰').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('open_ticket:projetos').setLabel('Projetos Web').setEmoji('🌐').setStyle(ButtonStyle.Primary),
        );
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('open_ticket:suporte').setLabel('Suporte Técnico').setEmoji('🛠️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('open_ticket:bugs').setLabel('Reportar Bug').setEmoji('🐞').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('open_ticket:outros').setLabel('Outros Assuntos').setEmoji('📢').setStyle(ButtonStyle.Secondary),
        );

        await interaction.channel.send({ embeds: [panelEmbed], components: [row1, row2] });
        await interaction.editReply({ content: 'Painel enviado.' });
    }
};
