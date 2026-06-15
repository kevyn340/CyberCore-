// ============================================================
// DATABASE.JS - Configuração e inicialização do banco SQLite
// ============================================================
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Garante que a pasta data existe
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Cria/abre o banco de dados
const db = new Database(path.join(dataDir, 'cybercore.db'));

// Habilita WAL para melhor performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================================
// CRIAÇÃO DAS TABELAS
// ============================================================
function initDatabase() {
    // Tabela de configurações do servidor
    db.exec(`
        CREATE TABLE IF NOT EXISTS guild_config (
            guild_id      TEXT PRIMARY KEY,
            staff_role_id TEXT,
            log_channel_id TEXT,
            ticket_category_id TEXT,
            ticket_panel_channel_id TEXT,
            created_at    INTEGER DEFAULT (strftime('%s','now'))
        )
    `);

    // Tabela de tickets
    db.exec(`
        CREATE TABLE IF NOT EXISTS tickets (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id     TEXT UNIQUE NOT NULL,
            guild_id      TEXT NOT NULL,
            channel_id    TEXT NOT NULL,
            user_id       TEXT NOT NULL,
            category      TEXT NOT NULL,
            status        TEXT DEFAULT 'open',
            priority      TEXT DEFAULT 'low',
            claimed_by    TEXT,
            created_at    INTEGER DEFAULT (strftime('%s','now')),
            closed_at     INTEGER,
            deleted_at    INTEGER
        )
    `);

    // Tabela de avisos (warns)
    db.exec(`
        CREATE TABLE IF NOT EXISTS warnings (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id      TEXT NOT NULL,
            user_id       TEXT NOT NULL,
            moderator_id  TEXT NOT NULL,
            reason        TEXT NOT NULL,
            created_at    INTEGER DEFAULT (strftime('%s','now'))
        )
    `);

    // Tabela de punições (ban/kick/mute)
    db.exec(`
        CREATE TABLE IF NOT EXISTS punishments (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id      TEXT NOT NULL,
            user_id       TEXT NOT NULL,
            moderator_id  TEXT NOT NULL,
            type          TEXT NOT NULL,
            reason        TEXT,
            duration      INTEGER,
            created_at    INTEGER DEFAULT (strftime('%s','now'))
        )
    `);

    // Tabela de estatísticas
    db.exec(`
        CREATE TABLE IF NOT EXISTS stats (
            guild_id          TEXT PRIMARY KEY,
            tickets_opened    INTEGER DEFAULT 0,
            tickets_closed    INTEGER DEFAULT 0,
            users_served      INTEGER DEFAULT 0,
            messages_deleted  INTEGER DEFAULT 0,
            members_joined    INTEGER DEFAULT 0,
            members_left      INTEGER DEFAULT 0,
            punishments_given INTEGER DEFAULT 0
        )
    `);

    // Tabela de cooldowns anti-spam
    db.exec(`
        CREATE TABLE IF NOT EXISTS cooldowns (
            user_id     TEXT NOT NULL,
            command     TEXT NOT NULL,
            expires_at  INTEGER NOT NULL,
            PRIMARY KEY (user_id, command)
        )
    `);

    console.log('[DATABASE] ✅ Tabelas inicializadas com sucesso.');
}

// ============================================================
// FUNÇÕES AUXILIARES - GUILD CONFIG
// ============================================================
const guildConfig = {
    get(guildId) {
        return db.prepare('SELECT * FROM guild_config WHERE guild_id = ?').get(guildId);
    },
    set(guildId, key, value) {
        const existing = this.get(guildId);
        if (existing) {
            db.prepare(`UPDATE guild_config SET ${key} = ? WHERE guild_id = ?`).run(value, guildId);
        } else {
            db.prepare(`INSERT INTO guild_config (guild_id, ${key}) VALUES (?, ?)`).run(guildId, value);
        }
    },
    upsert(guildId, data) {
        const keys = Object.keys(data);
        const existing = this.get(guildId);
        if (existing) {
            const sets = keys.map(k => `${k} = ?`).join(', ');
            db.prepare(`UPDATE guild_config SET ${sets} WHERE guild_id = ?`).run(...Object.values(data), guildId);
        } else {
            const cols = ['guild_id', ...keys].join(', ');
            const vals = ['?', ...keys.map(() => '?')].join(', ');
            db.prepare(`INSERT INTO guild_config (${cols}) VALUES (${vals})`).run(guildId, ...Object.values(data));
        }
    }
};

// ============================================================
// FUNÇÕES AUXILIARES - TICKETS
// ============================================================
const tickets = {
    create(data) {
        return db.prepare(`
            INSERT INTO tickets (ticket_id, guild_id, channel_id, user_id, category, priority)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(data.ticket_id, data.guild_id, data.channel_id, data.user_id, data.category, data.priority || 'low');
    },
    getByChannel(channelId) {
        return db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(channelId);
    },
    getByUser(guildId, userId) {
        return db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? AND status = 'open'").get(guildId, userId);
    },
    getById(ticketId) {
        return db.prepare('SELECT * FROM tickets WHERE ticket_id = ?').get(ticketId);
    },
    updateStatus(channelId, status) {
        const closedAt = status === 'closed' ? Math.floor(Date.now() / 1000) : null;
        db.prepare('UPDATE tickets SET status = ?, closed_at = ? WHERE channel_id = ?').run(status, closedAt, channelId);
    },
    updatePriority(channelId, priority) {
        db.prepare('UPDATE tickets SET priority = ? WHERE channel_id = ?').run(priority, channelId);
    },
    claim(channelId, userId) {
        db.prepare('UPDATE tickets SET claimed_by = ? WHERE channel_id = ?').run(userId, channelId);
    },
    delete(channelId) {
        db.prepare('UPDATE tickets SET deleted_at = ? WHERE channel_id = ?').run(Math.floor(Date.now() / 1000), channelId);
    },
    listOpen(guildId) {
        return db.prepare("SELECT * FROM tickets WHERE guild_id = ? AND status = 'open' AND deleted_at IS NULL").all(guildId);
    }
};

// ============================================================
// FUNÇÕES AUXILIARES - AVISOS
// ============================================================
const warnings = {
    add(guildId, userId, moderatorId, reason) {
        return db.prepare('INSERT INTO warnings (guild_id, user_id, moderator_id, reason) VALUES (?, ?, ?, ?)').run(guildId, userId, moderatorId, reason);
    },
    getAll(guildId, userId) {
        return db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
    },
    count(guildId, userId) {
        return db.prepare('SELECT COUNT(*) as count FROM warnings WHERE guild_id = ? AND user_id = ?').get(guildId, userId).count;
    }
};

// ============================================================
// FUNÇÕES AUXILIARES - PUNIÇÕES
// ============================================================
const punishments = {
    add(data) {
        return db.prepare('INSERT INTO punishments (guild_id, user_id, moderator_id, type, reason, duration) VALUES (?, ?, ?, ?, ?, ?)').run(data.guild_id, data.user_id, data.moderator_id, data.type, data.reason, data.duration);
    },
    getAll(guildId, userId) {
        return db.prepare('SELECT * FROM punishments WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC').all(guildId, userId);
    }
};

// ============================================================
// FUNÇÕES AUXILIARES - ESTATÍSTICAS
// ============================================================
const stats = {
    get(guildId) {
        const row = db.prepare('SELECT * FROM stats WHERE guild_id = ?').get(guildId);
        if (!row) {
            db.prepare('INSERT INTO stats (guild_id) VALUES (?)').run(guildId);
            return db.prepare('SELECT * FROM stats WHERE guild_id = ?').get(guildId);
        }
        return row;
    },
    increment(guildId, field, amount = 1) {
        this.get(guildId); // garante que a linha existe
        db.prepare(`UPDATE stats SET ${field} = ${field} + ? WHERE guild_id = ?`).run(amount, guildId);
    }
};

// ============================================================
// FUNÇÕES AUXILIARES - COOLDOWNS
// ============================================================
const cooldowns = {
    check(userId, command) {
        const row = db.prepare('SELECT expires_at FROM cooldowns WHERE user_id = ? AND command = ?').get(userId, command);
        if (!row) return 0;
        const remaining = row.expires_at - Math.floor(Date.now() / 1000);
        return remaining > 0 ? remaining : 0;
    },
    set(userId, command, seconds) {
        const expiresAt = Math.floor(Date.now() / 1000) + seconds;
        db.prepare('INSERT OR REPLACE INTO cooldowns (user_id, command, expires_at) VALUES (?, ?, ?)').run(userId, command, expiresAt);
    },
    clear(userId, command) {
        db.prepare('DELETE FROM cooldowns WHERE user_id = ? AND command = ?').run(userId, command);
    }
};

// Exporta tudo
module.exports = { db, initDatabase, guildConfig, tickets, warnings, punishments, stats, cooldowns };
