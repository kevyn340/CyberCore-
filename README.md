# ⚡ CyberCore Bot

Bot Discord completo com sistema de tickets profissional, moderação, logs, estatísticas e dashboard web com tema futurista.

## 🚀 Tecnologias

- **Node.js** + **discord.js v14**
- **SQLite** (better-sqlite3)
- **Express.js** + **EJS** (dashboard)
- **Passport Discord OAuth2**

---

## 📁 Estrutura do Projeto

```
CyberCore/
├── src/
│   ├── commands/
│   │   ├── tickets/        # /ticket, /transcript
│   │   ├── moderation/     # /ban, /kick, /mute, /unmute, /warn, /clear
│   │   ├── config/         # /setstaff, /setcategory, /setlogs, /ticket-panel
│   │   └── stats/          # /stats
│   ├── events/             # ready, interactionCreate, member, messages
│   ├── buttons/            # open, close, reopen, delete, claim, transcript
│   ├── database/           # database.js (SQLite)
│   ├── handlers/           # commandHandler, eventHandler, buttonHandler
│   └── index.js            # Ponto de entrada do bot
├── dashboard/
│   └── app.js              # Servidor Express
├── views/                  # Templates EJS
├── public/                 # CSS e JS do dashboard
├── data/                   # Banco SQLite (gerado automaticamente)
├── deploy-commands.js      # Registra slash commands
└── package.json
```

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente (Secrets no Replit)

Adicione as seguintes secrets no painel do Replit:

| Variável | Descrição |
|----------|-----------|
| `DISCORD_TOKEN` | Token do bot (Discord Developer Portal) |
| `CLIENT_ID` | ID do aplicativo Discord |
| `CLIENT_SECRET` | Secret do aplicativo (para OAuth2) |
| `GUILD_ID` | ID do seu servidor (para deploy rápido de comandos) |
| `SESSION_SECRET` | Chave aleatória para sessões (ex: string longa aleatória) |
| `CALLBACK_URL` | URL de callback OAuth2 (ex: `https://seudominio.replit.app/auth/discord/callback`) |

### 2. Configurar no Discord Developer Portal

1. Acesse [discord.com/developers](https://discord.com/developers/applications)
2. Crie um novo aplicativo → **Bot** → copie o token
3. Em **OAuth2 → Redirects**, adicione: `https://SUAURL.replit.app/auth/discord/callback`
4. Gere o link de convite com permissões de **Administrador**

### 3. Instalar dependências

```bash
npm install
```

### 4. Registrar Slash Commands

```bash
npm run deploy
```

### 5. Iniciar o bot

```bash
npm start
```

---

## 🎫 Sistema de Tickets

### Como funciona
1. Use `/ticket-panel` para enviar o painel em um canal
2. Usuários clicam no botão da categoria desejada
3. Um canal privado é criado automaticamente
4. Staff pode fechar, assumir, transcrever e deletar tickets

### Comandos do ticket
| Comando | Descrição |
|---------|-----------|
| `/ticket fechar` | Fecha o ticket |
| `/ticket reabrir` | Reabre um ticket fechado |
| `/ticket deletar` | Deleta o canal do ticket |
| `/ticket assumir` | Staff assume o atendimento |
| `/ticket renomear [nome]` | Renomeia o canal |
| `/ticket prioridade [nivel]` | Define baixa/média/alta |
| `/ticket adicionar [user]` | Adiciona usuário ao ticket |
| `/ticket remover [user]` | Remove usuário do ticket |
| `/transcript` | Gera HTML do histórico |

---

## ⚖️ Moderação

| Comando | Permissão |
|---------|-----------|
| `/ban [user] [motivo] [dias]` | BanMembers |
| `/kick [user] [motivo]` | KickMembers |
| `/mute [user] [minutos] [motivo]` | ModerateMembers |
| `/unmute [user]` | ModerateMembers |
| `/warn [user] [motivo]` | ModerateMembers |
| `/clear [quantidade] [user]` | ManageMessages |

---

## 📊 Estatísticas

- `/stats` — Exibe tickets abertos/fechados, usuários atendidos, punições e mais

---

## ⚙️ Configuração (Admin Only)

| Comando | Descrição |
|---------|-----------|
| `/setstaff [cargo]` | Define o cargo de staff |
| `/setcategory [categoria]` | Define categoria dos tickets |
| `/setlogs [canal]` | Define canal de logs |
| `/ticket-panel` | Envia o painel de tickets |

---

## 🌐 Dashboard Web

Acesse `http://localhost:3000` (ou sua URL do Replit):

- Login com Discord OAuth2
- Lista de servidores gerenciados
- Configurar staff, logs e categoria de tickets
- Ver estatísticas em tempo real
- Ver tickets abertos

---

## 🔒 Segurança

- **Anti-spam**: Cooldown em todos os comandos
- **Anti-ticket duplicado**: Bloqueia múltiplos tickets do mesmo usuário
- **Verificação de hierarquia**: Bot verifica se pode executar a ação
- **Tratamento de erros**: Erros são capturados e logados sem derrubar o bot
- **Permissões por cargo**: Staff é verificado via cargo ou permissão de admin

---

## 📝 Logs Automáticos

- ✅ Tickets abertos/fechados
- 🗑️ Mensagens deletadas
- ✏️ Mensagens editadas
- 📥 Membros que entraram
- 📤 Membros que saíram
- ⚖️ Punições aplicadas
