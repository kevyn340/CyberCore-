// ============================================================
// DASHBOARD/APP.JS - Servidor Express para o painel web
// ============================================================
require('dotenv').config();
const express        = require('express');
const session        = require('express-session');
const passport       = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path           = require('path');
const axios          = require('axios');
const { db, guildConfig, stats, tickets } = require('../src/database/database');

const app = express();

// ============================================================
// CONFIGURAÇÃO DO PASSPORT (Discord OAuth2)
// Só ativa se as credenciais estiverem presentes
// ============================================================
const oauthConfigured = process.env.CLIENT_ID && process.env.CLIENT_SECRET;

if (oauthConfigured) {
    passport.use(new DiscordStrategy({
        clientID:     process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL:  process.env.CALLBACK_URL || 'http://localhost:5000/auth/discord/callback',
        scope:        ['identify', 'guilds'],
    }, (accessToken, refreshToken, profile, done) => {
        profile.accessToken = accessToken;
        return done(null, profile);
    }));
} else {
    console.warn('[DASHBOARD] ⚠️  CLIENT_ID ou CLIENT_SECRET não configurados. Login OAuth2 desativado.');
}

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// ============================================================
// MIDDLEWARES
// ============================================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'cybercore-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 24 * 1000 } // 24h
}));

app.use(passport.initialize());
app.use(passport.session());

// Middleware de autenticação
const isAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

// Passa o usuário para todas as views
app.use((req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// ============================================================
// ROTAS DE AUTENTICAÇÃO
// ============================================================
app.get('/login', (req, res) => res.render('login'));

app.get('/auth/discord', (req, res, next) => {
    if (!oauthConfigured) return res.render('error', { message: 'OAuth2 não configurado. Adicione CLIENT_ID, CLIENT_SECRET e CALLBACK_URL nas secrets.' });
    passport.authenticate('discord')(req, res, next);
});

app.get('/auth/discord/callback', (req, res, next) => {
    if (!oauthConfigured) return res.redirect('/login');
    passport.authenticate('discord', { failureRedirect: '/login' })(req, res, () => res.redirect('/dashboard'));
});

app.get('/logout', (req, res) => {
    req.logout(() => res.redirect('/'));
});

// ============================================================
// ROTA PRINCIPAL
// ============================================================
app.get('/', (req, res) => res.render('index'));

// ============================================================
// DASHBOARD - Lista de servidores
// ============================================================
app.get('/dashboard', isAuth, async (req, res) => {
    try {
        // Filtra servidores onde o usuário tem permissão de admin
        const guilds = req.user.guilds.filter(g =>
            (BigInt(g.permissions) & BigInt(0x8)) !== BigInt(0) // ADMINISTRATOR
        );
        res.render('dashboard', { guilds });
    } catch (err) {
        console.error('[DASH]', err);
        res.render('error', { message: 'Erro ao carregar servidores.' });
    }
});

// ============================================================
// DASHBOARD - Painel de um servidor específico
// ============================================================
app.get('/dashboard/:guildId', isAuth, async (req, res) => {
    const { guildId } = req.params;

    // Verifica se o usuário tem acesso
    const guild = req.user.guilds.find(g => g.id === guildId);
    if (!guild || !(BigInt(guild.permissions) & BigInt(0x8))) {
        return res.redirect('/dashboard');
    }

    const config     = guildConfig.get(guildId) || {};
    const guildStats = stats.get(guildId);
    const openTickets = tickets.listOpen(guildId);

    res.render('server', { guild, config, stats: guildStats, openTickets });
});

// ============================================================
// API - Atualiza configurações
// ============================================================
app.post('/api/:guildId/config', isAuth, (req, res) => {
    const { guildId } = req.params;
    const guild = req.user.guilds.find(g => g.id === guildId);
    if (!guild || !(BigInt(guild.permissions) & BigInt(0x8))) {
        return res.status(403).json({ error: 'Sem permissão' });
    }

    const { staff_role_id, log_channel_id, ticket_category_id } = req.body;
    guildConfig.upsert(guildId, { staff_role_id, log_channel_id, ticket_category_id });
    res.json({ success: true });
});

// ============================================================
// API - Estatísticas JSON
// ============================================================
app.get('/api/:guildId/stats', isAuth, (req, res) => {
    const { guildId } = req.params;
    const s = stats.get(guildId);
    const openTickets = tickets.listOpen(guildId).length;
    res.json({ ...s, open_tickets: openTickets });
});

// ============================================================
// STATUS DO BOT
// ============================================================
app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

module.exports = app;
