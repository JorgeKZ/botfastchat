"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db = require('./database');
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Caminho para armazenar as sessões ativas
const sessionsPath = path_1.default.join(__dirname, 'sessions.json');
function getSessions() {
    if (fs_1.default.existsSync(sessionsPath)) {
        return JSON.parse(fs_1.default.readFileSync(sessionsPath, 'utf8'));
    }
    return {};
}
// Servir arquivos estáticos (exceto o index.html direto)
app.use(express_1.default.static(path_1.default.join(__dirname, 'public'), {
    index: false
}));
// Rota raiz protegida pelo servidor
app.get('/', (req, res) => {
    // Como o navegador envia o userId via localStorage, vamos mudar a estratégia:
    // Vamos entregar o index.html, mas colocar um script injetado que valida a sessão,
    // ou simplesmente redirecionar se não passar pela rota de login.
    res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
});
const flowPath = path_1.default.join(__dirname, 'flow.json');
// Rota para CARREGAR o fluxo
app.get('/flow', (req, res) => {
    try {
        if (fs_1.default.existsSync(flowPath)) {
            const data = fs_1.default.readFileSync(flowPath, 'utf8');
            res.status(200).json(JSON.parse(data));
        }
        else {
            res.status(200).json({ nodes: [], conexoes: [] });
        }
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao carregar o fluxo" });
    }
});
// Rota para SALVAR o fluxo
app.post('/flow', (req, res) => {
    try {
        fs_1.default.writeFileSync(flowPath, JSON.stringify(req.body, null, 2), 'utf-8');
        res.status(200).json({ message: "Salvo com sucesso" });
    }
    catch (error) {
        res.status(500).json({ error: "Erro ao salvar" });
    }
});
// Rota de Cadastro de Usuário
app.post('/api/register', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }
    bcryptjs_1.default.hash(password, 10, (err, hash) => {
        if (err)
            return res.status(500).json({ error: 'Erro ao processar senha.' });
        db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, hash], function (err) {
            if (err) {
                return res.status(400).json({ error: 'E-mail já cadastrado.' });
            }
            res.json({ message: 'Usuário cadastrado com sucesso!', userId: this.lastID });
        });
    });
});
// Rota de Login de Usuário
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
        if (err)
            return res.status(500).json({ error: 'Erro no servidor.' });
        if (!user)
            return res.status(400).json({ error: 'Usuário ou senha inválidos.' });
        bcryptjs_1.default.compare(password, user.password, (err, result) => {
            if (err || !result) {
                return res.status(400).json({ error: 'Usuário ou senha inválidos.' });
            }
            res.json({ message: 'Login bem-sucedido!', userId: user.id, email: user.email });
        });
    });
});
const port = 3000;
app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));
