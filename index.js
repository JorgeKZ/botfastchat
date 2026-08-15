"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db = require('./database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const SECRET_KEY = 'sua-chave-secreta-aqui';
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(cors());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
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

// === ROTAS DE CADASTRO E LOGIN ===
app.post('/register', async (req, res) => {
    const { nome, email, senha } = req.body;
    const hashSenha = await bcrypt.hash(senha, 10);
    
    db.run(`INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)`, [nome, email, hashSenha], (err) => {
        if (err) return res.status(400).json({ error: "Email já cadastrado" });
        res.json({ message: "Usuário criado com sucesso!" });
    });
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: "Usuário não encontrado" });
        
        const senhaCorreta = await bcrypt.compare(senha, user.senha);
        if (!senhaCorreta) return res.status(400).json({ error: "Senha incorreta" });
        
        const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, nome: user.nome });
    });
});
const port = 3000;
app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));
