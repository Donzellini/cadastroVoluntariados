import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Inicializa o banco de dados SQLite
const db = new sqlite3.Database('../database/voluntariado.db', (err) => {
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
    }
});

// Rotas CRUD
app.get('/oportunidades', (req, res) => {
  db.all('SELECT * FROM oportunidades', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/oportunidades', (req, res) => {
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

app.put('/oportunidades/:id', (req, res) => {
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

app.delete('/oportunidades/:id', (req, res) => {
  db.run('DELETE FROM oportunidades WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
