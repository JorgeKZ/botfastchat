import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

const port = 3000;
app.listen(port, () => console.log(`Servidor rodando em http://localhost:${port}`));