import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui';

app.use(cors());
app.use(express.json());

const dbPath = process.env.DATABASE_URL || '../database/voluntariado.db';

// Inicializa o banco de dados SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err.message);
  } else {
    console.log('Banco de dados conectado.');

    // Cria a tabela j� com a coluna entidade
    db.run(`CREATE TABLE IF NOT EXISTS oportunidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entidade TEXT,
      atividade TEXT NOT NULL,
      descricao TEXT NOT NULL,
      local TEXT NOT NULL,
      data TEXT NOT NULL,
      area TEXT
    )`);

    // NOVA TABELA DE USUÁRIOS
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL
    )`);
  }
});

// ─── MIDDLEWARE DE AUTENTICAÇÃO ───────────────────────────────────────────────
function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.status(401).json({ error: 'Token não fornecido.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido.' });
    req.user = user;
    next();
  });
}

// ─── ROTAS DE AUTENTICAÇÃO ────────────────────────────────────────────────────

// Cadastro
app.post('/register', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

  const hash = await bcrypt.hash(senha, 10);
  db.run('INSERT INTO usuarios (email, senha) VALUES (?, ?)', [email, hash], function (err) {
    if (err) return res.status(409).json({ error: 'Email já cadastrado.' });
    res.json({ message: 'Usuário criado com sucesso.' });
  });
});

// Login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  });
});

// ─── ROTAS DE OPORTUNIDADES (PROTEGIDAS) ─────────────────────────────────────

app.get('/oportunidades', autenticar, (req, res) => {
  db.all('SELECT * FROM oportunidades', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/oportunidades', autenticar, (req, res) => {
  const { entidade, atividade, descricao, local, data, area } = req.body;
  db.run(
    'INSERT INTO oportunidades (entidade, atividade, descricao, local, data, area) VALUES (?, ?, ?, ?, ?, ?)',
    [entidade, atividade, descricao, local, data, area],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.put('/oportunidades/:id', autenticar, (req, res) => {
  const { entidade, atividade, descricao, local, data, area } = req.body;
  db.run(
    'UPDATE oportunidades SET entidade = ?, atividade = ?, descricao = ?, local = ?, data = ?, area = ? WHERE id = ?',
    [entidade, atividade, descricao, local, data, area, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ changes: this.changes });
    }
  );
});

app.delete('/oportunidades/:id', autenticar, (req, res) => {
  db.run('DELETE FROM oportunidades WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});