# Cadastro de Oportunidades de Voluntariado

Plataforma web para cadastro, listagem, filtro e visualização em mapa de oportunidades de voluntariado para ONGs e projetos sociais. Projeto acadêmico que integra autenticação com JWT, banco de dados SQLite e geolocalização interativa via Leaflet.

## Índice

1. [Como rodar o projeto](#como-rodar-o-projeto)
2. [Funcionalidades de Autenticação (Login)](#funcionalidades-de-autenticação-login)
3. [Integração de Mapa](#integração-de-mapa)
4. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
5. [Estrutura de Dados](#estrutura-de-dados)
6. [Notas e Extensões](#notas-e-extensões)

---

## Como rodar o projeto

### Backend
1. Acesse a pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```
   O backend ficará disponível em `http://localhost:3001`.

### Frontend
1. Acesse a pasta `frontend`.
2. Abra o arquivo `index.html` no navegador.
   - Recomenda-se usar a extensão **Live Server** do VS Code para facilitar o desenvolvimento.
   - Antes de acessar, certifique-se de que o backend está rodando.

### Banco de Dados
- O banco de dados **SQLite** será criado automaticamente na pasta `database` ao rodar o backend.
- Arquivo: `database/voluntariado.db`

---

## Funcionalidades de Autenticação (Login)

### Visão Geral

O sistema implementa autenticação baseada em **JWT (JSON Web Token)** com criptografia de senhas usando **bcryptjs**. Todos os recursos do backend (CRUD de oportunidades) são protegidos por middleware de autenticação.

### Fluxo de Autenticação

#### 1. **Registro de Novo Usuário** (`POST /register`)

**Endpoint:** `http://localhost:3001/register`

**Requisição (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "senha": "senha_segura_123"
}
```

**Processo:**
- O backend recebe email e senha
- A senha é criptografada usando **bcryptjs** (10 rounds de salt)
- Usuário é armazenado no banco de dados (tabela `usuarios`)
- Email deve ser único (validação no banco)

**Resposta (sucesso 200):**
```json
{
  "message": "Usuário criado com sucesso."
}
```

**Resposta (erro 409 - email duplicado):**
```json
{
  "error": "Email já cadastrado."
}
```

#### 2. **Login** (`POST /login`)

**Endpoint:** `http://localhost:3001/login`

**Requisição (JSON):**
```json
{
  "email": "usuario@exemplo.com",
  "senha": "senha_segura_123"
}
```

**Processo:**
- Backend consulta usuário no banco por email
- Compara senha fornecida com hash armazenado usando **bcryptjs**
- Se válido, gera **JWT Token** (válido por 8 horas)
- Token é retornado ao cliente

**Resposta (sucesso 200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta (erro 401 - credenciais inválidas):**
```json
{
  "error": "Credenciais inválidas."
}
```

#### 3. **Autenticação em Requisições**

O token retornado deve ser armazenado no **localStorage** e enviado no header de todas as requisições subsequentes:

```
Authorization: Bearer <token>
```

**Exemplo (JavaScript):**
```javascript
const token = localStorage.getItem('token');
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};

fetch('http://localhost:3001/oportunidades', {
  method: 'GET',
  headers: headers
});
```

#### 4. **Middleware de Proteção** (`autenticar`)

Todas as rotas que manipulam oportunidades utilizam o middleware `autenticar`:

```javascript
// Exemplo de rota protegida
app.get('/oportunidades', autenticar, (req, res) => {
  // Código executado apenas se token for válido
});
```

**O middleware:**
- Extrai token do header `Authorization`
- Valida assinatura do token usando a chave secreta
- Se inválido, retorna erro 401 ou 403
- Se válido, passa para a rota (req.user contém dados do usuário)

### Tabela de Usuários

```sql
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL
)
```

### Variáveis de Ambiente

**Backend (recomendado definir):**
```bash
JWT_SECRET=sua_chave_secreta_bem_forte_aqui
DATABASE_URL=../database/voluntariado.db
```

Se não definir `JWT_SECRET`, o backend utiliza valor padrão (não recomendado para produção).

### Fluxo no Frontend

**login.html:**
1. Usuário preenche email e senha
2. Clica em "Entrar" ou "Criar conta"
3. Requisição é enviada para `/login` ou `/register`
4. Token é armazenado em `localStorage`
5. Redirecionamento para `index.html`

**script.js (index.html):**
- Função `verificarAutenticacao()` verifica se token existe
- Se não existir, redireciona para login
- Token é incluído automaticamente em todas as requests via `authHeaders()`
- Função `fazerLogout()` remove token e redireciona para login

---

## Integração de Mapa

### Visão Geral

O projeto integra visualização de oportunidades em mapa interativo usando:
- **Leaflet.js** - biblioteca de mapas open-source
- **OpenStreetMap** - tiles gratuitos dos mapas
- **Nominatim (OSM)** - serviço de geocodificação (convertendo endereço em coordenadas)

### Componentes

#### 1. **Inicialização do Mapa** (`iniciarMapa()`)

```javascript
function iniciarMapa() {
  // Cria mapa centrado no Brasil (coordenadas: -15.7801, -47.9292)
  mapaObj = L.map('mapa').setView([-15.7801, -47.9292], 5);

  // Carrega tiles do OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(mapaObj);

  mapaIniciado = true;
  atualizarMarcadores();
}
```

**Parâmetros:**
- `setView([latitude, longitude], zoom)` - define posição inicial
- `zoom: 5` - visão do Brasil inteiro (ajustável de 1 a 19)

#### 2. **Geocodificação com Nominatim** (`geocodificarNominatim()`)

Converte endereço em texto para coordenadas (latitude, longitude):

```javascript
async function geocodificarNominatim(endereco) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(endereco + ', Brasil')}&format=json&limit=1`;
  
  const res = await fetch(url, { 
    headers: { 'Accept-Language': 'pt-BR' } 
  });
  const data = await res.json();
  
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}
```

**Processo:**
- Adiciona ", Brasil" ao endereço (para melhor precisão)
- Requisita dados de geolocalizaçãoao Nominatim (API gratuita)
- Retorna latitude/longitude ou null se não encontrado
- **Nota:** Cada requisição tem delay de 1 segundo (respeito aos ToS do Nominatim)

#### 3. **Atualização de Marcadores** (`atualizarMarcadores()`)

Cria marcadores no mapa para cada oportunidade:

```javascript
async function atualizarMarcadores() {
  limparMarcadores(); // Remove marcadores anteriores
  
  for (const op of cache) {
    if (!op.local) continue;

    // Converte endereço em coordenadas
    const coords = await geocodificarNominatim(op.local);
    if (!coords) continue;

    // Cria marcador
    const marcador = L.marker([coords.lat, coords.lng])
      .addTo(mapaObj)
      .bindPopup(`
        <div style="min-width:180px">
          <strong>${op.atividade}</strong><br>
          <span style="color:#666">${op.entidade || ''}</span><br>
          📍 ${op.local}<br>
          📅 ${formatDate(op.data)}<br>
          🏷️ ${op.area || 'Sem área'}
        </div>
      `);

    marcadores.push(marcador);
    await new Promise(r => setTimeout(r, 1000)); // Respeita rate limit
  }

  // Ajusta zoom automático para mostrar todos os marcadores
  if (bounds.length > 0) mapaObj.fitBounds(bounds);
}
```

**Funcionalidades:**
- Cria popup com informações da oportunidade (clique no marcador para abrir)
- Delay de 1 segundo entre requisições (respeito ao Nominatim)
- Ajusta automaticamente o zoom para mostrar todos os pontos

#### 4. **Autocomplete de Endereços** (`buscarSugestoes()`)

Enquanto digita no campo "Local", sugere endereços:

```javascript
async function buscarSugestoes(termo) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(termo + ', Brasil')}&format=json&limit=5&addressdetails=1`;
  
  const res = await fetch(url);
  const data = await res.json();

  // Popula dropdown com sugestões
  data.forEach(lugar => {
    const item = document.createElement('div');
    item.textContent = lugar.display_name;
    // ... adiciona à UI
  });
}
```

**Comportamento:**
- Ativado ao digitar 3+ caracteres
- Aguarda 500ms após parar de digitar (debounce)
- Limita a 5 sugestões
- Clicar em sugestão preenche o campo automaticamente

#### 5. **Toggle do Mapa**

Botão "Ver Mapa de Oportunidades" mostra/oculta o painel:

```javascript
document.getElementById('btn-toggle-mapa').addEventListener('click', () => {
  const painel = document.getElementById('painel-mapa');
  
  if (painel.classList.contains('d-none')) {
    // Abre mapa e inicializa se necessário
    if (!mapaIniciado) iniciarMapa();
  } else {
    // Fecha mapa
    painel.classList.add('d-none');
  }
});
```

### Estrutura HTML do Mapa

```html
<!-- Botão para abrir/fechar -->
<button id="btn-toggle-mapa" class="btn btn-outline-success">
  <i class="bi bi-map me-1"></i> Ver Mapa de Oportunidades
</button>

<!-- Contêiner do mapa (oculto por padrão) -->
<div id="painel-mapa" class="card shadow-sm mb-4 d-none">
  <div class="card-header bg-success text-white">
    <h2 class="h5 mb-0">
      <i class="bi bi-geo-alt-fill me-2"></i>Mapa de Oportunidades
    </h2>
  </div>
  <div class="card-body p-0">
    <div id="mapa" style="height: 450px; width: 100%;"></div>
  </div>
</div>
```

### Dependências do Mapa

**CDN (carregados em index.html):**
```html
<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

### Geolocalização - Nominatim API

**Serviço:** https://nominatim.openstreetmap.org

**Limites (Termos de Serviço):**
- Máximo 1 requisição por segundo por usuário
- Não cache resultados por mais de 30 dias
- Incluir header `Accept-Language` para melhor localização
- Identificar aplicação com User-Agent (opcional)

**Exemplo de requisição:**
```bash
curl "https://nominatim.openstreetmap.org/search?q=Av%20Paulista%2C%20S%C3%A3o%20Paulo%2C%20Brasil&format=json"
```

---

## Arquitetura e Tecnologias

### Backend (Node.js + Express)

**Dependências:**
- **express** - framework web
- **sqlite3** - banco de dados
- **cors** - controle de origin para requisições
- **jsonwebtoken** - geração e validação de JWT
- **bcryptjs** - hash de senhas

**Rotas:**
- `POST /register` - criar novo usuário
- `POST /login` - autenticar e receber token
- `GET /oportunidades` - listar (requer autenticação)
- `POST /oportunidades` - criar (requer autenticação)
- `PUT /oportunidades/:id` - atualizar (requer autenticação)
- `DELETE /oportunidades/:id` - deletar (requer autenticação)

### Frontend (HTML + CSS + JavaScript)

**Bibliotecas:**
- **Bootstrap 5.3** - styling responsivo
- **DataTables** - tabela interativa com filtro e busca
- **Bootstrap Icons** - ícones
- **Leaflet 1.9** - mapas interativos
- **jQuery** - manipulação DOM (para DataTables)

### Banco de Dados (SQLite)

**Tabelas:**

```sql
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL
);

CREATE TABLE oportunidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entidade TEXT,
  atividade TEXT NOT NULL,
  descricao TEXT NOT NULL,
  local TEXT NOT NULL,
  data TEXT NOT NULL,
  area TEXT
);
```

---

## Estrutura de Dados

### Objeto Oportunidade (JSON)

```json
{
  "id": 1,
  "entidade": "ONG Ajudando Brasil",
  "atividade": "Aulas de reforço escolar",
  "descricao": "Voluntários para aulas de matemática e português",
  "local": "Rua das Flores, 123, São Paulo, SP",
  "data": "2024-04-15",
  "area": "Educação"
}
```

**Campos:**
- `id` - identificador único (auto-incrementado)
- `entidade` - nome da ONG/organização
- `atividade` - título da oportunidade
- `descricao` - descrição detalhada
- `local` - endereço (convertido em coordenadas para o mapa)
- `data` - data da oportunidade (ISO 8601)
- `area` - categoria (Educação, Saúde, Meio Ambiente, Cultura)

### Objeto Usuário (JSON)

```json
{
  "id": 1,
  "email": "voluntario@exemplo.com",
  "senha": "$2a$10$..." // bcrypt hash
}
```

### Token JWT (exemplo decodificado)

```json
{
  "id": 1,
  "email": "voluntario@exemplo.com",
  "iat": 1712098432,
  "exp": 1712126432
}
```

---

## Notas e Extensões

### Considerações de Segurança

- ✅ Senhas criptografadas com bcryptjs
- ✅ Tokens JWT com expiração (8 horas)
- ✅ Autenticação obrigatória em rotas sensíveis

### Deployement

O projeto inclui configuração para **Fly.io**:

```yaml
# fly.toml
app = "cadastro-voluntariado-backend"
primary_region = "gig"

[[services]]
internal_port = 3001
protocol = "tcp"
```

Para fazer deploy no Fly.io:
```bash
fly auth login
fly launch --name cadastro-voluntariado-backend
fly deploy
```

---

Projeto acadêmico simples, fácil de adaptar e expandir para fins educacionais e comunitários.
