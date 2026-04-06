import sqlite3 from 'sqlite3';

const dbPath = process.env.DATABASE_URL || '../database/voluntariado.db';

// Inicializa o banco de dados SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err.message);
  } else {
    console.log('Banco de dados conectado.');

    // Cria a tabela j com a coluna entidade
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

export default db;
