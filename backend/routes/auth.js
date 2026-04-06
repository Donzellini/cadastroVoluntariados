import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui';

// Cadastro
router.post('/register', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

  const hash = await bcrypt.hash(senha, 10);
  db.run('INSERT INTO usuarios (email, senha) VALUES (?, ?)', [email, hash], function (err) {
    if (err) return res.status(409).json({ error: 'Email já cadastrado.' });
    res.json({ message: 'Usuário criado com sucesso.' });
  });
});

// Login
router.post('/login', (req, res) => {
  const { email, senha } = req.body;
  db.get('SELECT * FROM usuarios WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  });
});

export default router;
