import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import oportunidadesRoutes from './routes/oportunidades.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ─── ROTAS ────────────────────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/oportunidades', oportunidadesRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});