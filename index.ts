import express from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
const db = require('./database');

const app = express();
app.use(express.json());
// Caminho para armazenar as sessões ativas
const sessionsPath = path.join(__dirname, 'sessions.json');

function getSessions() {
    if (fs.existsSync(sessionsPath)) {
        return JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
    }
    return {};
}

// Servir arquivos estáticos (exceto o index.html direto)
app.use(express.static(path.join(__dirname, 'public'), {
    index: false 
}));

// Rota raiz protegida pelo servidor
app.get('/', (req, res) => {
    // Como o navegador envia o userId via localStorage, vamos mudar a estratégia:
    // Vamos entregar o index.html, mas colocar um script injetado que valida a sessão,
    // ou simplesmente redirecionar se não passar pela rota de login.
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const flowPath = path.join(__dirname, 'flow.json');

// Rota para CARREGAR o fluxo
app.get('/flow', (req, res) => {
    try {
        if (fs.existsSync(flowPath)) {
            const data = fs.readFileSync(flowPath, 'utf8');
            res.status(200).json(JSON.parse(data));
        } else {
            res.status(200).json({ nodes: [], conexoes: [] });
        }
    } catch (error) {
        res.status(500).json({ error: "Erro ao carregar o fluxo" });
    }
});

// Rota para SALVAR o fluxo
app.post('/flow', (req, res) => {
    try {
        fs.writeFileSync(flowPath, JSON.stringify(req.body, null, 2), 'utf-8');
        res.status(200).json({ message: "Salvo com sucesso" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao salvar" });
    }
});

// Rota de Cadastro de Usuário
app.post('/api/register', (req: any, res: any) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Erro ao processar senha.' });

        db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [email, hash], function(this: any, err: any) {
            if (err) {
                return res.status(400).json({ error: 'E-mail já cadastrado.' });
            }
            res.json({ message: 'Usuário cadastrado com sucesso!', userId: this.lastID });
        });
    });
});

// Rota de Login de Usuário
app.post('/api/login', (req: any, res: any) => {
    const { email, password } = req.body;
    
    db.get(`SELECT * FROM users WHERE email = ?`, [email], (err: any, user: any) => {
        if (err) return res.status(500).json({ error: 'Erro no servidor.' });
        if (!user) return res.status(400).json({ error: 'Usuário ou senha inválidos.' });

        bcrypt.compare(password, user.password, (err, result) => {
            if (err || !result) {
                return res.status(400).json({ error: 'Usuário ou senha inválidos.' });
            }
            
            res.json({ message: 'Login bem-sucedido!', userId: user.id, email: user.email });
        });
    });
});

const port = 3000;
app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));