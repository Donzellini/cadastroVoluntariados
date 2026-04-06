import express from 'express';
import db from '../database.js';
import autenticar from '../middleware/autenticar.js';

const router = express.Router();

router.get('/', autenticar, (req, res) => {
  db.all('SELECT * FROM oportunidades', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', autenticar, (req, res) => {
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

router.put('/:id', autenticar, (req, res) => {
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

router.delete('/:id', autenticar, (req, res) => {
  db.run('DELETE FROM oportunidades WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ changes: this.changes });
  });
});

export default router;