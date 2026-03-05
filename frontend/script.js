const API_URL = 'https://cadastro-voluntariado-backend.fly.dev/oportunidades';
//const API_URL = 'http://localhost:3001/oportunidades';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

function verificarAutenticacao() {
  if (!getToken()) window.location.href = 'login.html';
}

function fazerLogout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

verificarAutenticacao();

let dt = null;
let cache = []; // manter dados para localizar registro na edição
let editId = null;

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d) ? value : d.toLocaleDateString();
}

function getAreaBadgeClass(area) {
  switch ((area || '').toLowerCase()) {
    case 'educação':
    case 'educacao':
      return 'bg-primary';
    case 'saúde':
    case 'saude':
      return 'bg-danger';
    case 'meio ambiente':
      return 'bg-success';
    case 'cultura':
      return 'bg-warning text-dark';
    default:
      return 'bg-secondary';
  }
}

function initDataTableIfAvailable() {
  const $ = window.jQuery;
  if (!$ || !$.fn || !$.fn.DataTable) return null;
  if (dt) return dt;
  dt = $('#tabela-oportunidades').DataTable({
    language: { search: '', searchPlaceholder: 'Pesquisa' },
    paging: false,
    info: false,
    ordering: true,
    scrollCollapse: true,
    scrollY: '50vh',
    columnDefs: [
      { orderable: false, targets: -1 }
    ]
  });
  return dt;
}

function actionButtons(id) {
  return `
    <div class="btn-group btn-group-sm" role="group">
      <button class="btn btn-outline-primary" data-action="edit" data-id="${id}" title="Editar">
        <i class="bi bi-pencil-square"></i>
      </button>
      <button class="btn btn-outline-danger" data-action="delete" data-id="${id}" title="Excluir">
        <i class="bi bi-trash"></i>
      </button>
    </div>`;
}

function renderFallbackDOM(data) {
  const tbody = document.getElementById('tabela-oportunidades-body');
  if (!tbody) return;
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
  if (!data || data.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 7;
    td.className = 'text-center text-muted py-4';
    td.textContent = 'Nenhuma oportunidade encontrada.';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  data.forEach(o => {
    const tr = document.createElement('tr');
    const c1 = document.createElement('td'); c1.className = 'fw-semibold'; c1.textContent = o.entidade || '—';
    const c2 = document.createElement('td'); c2.textContent = o.atividade || '—';
    const c3 = document.createElement('td'); c3.className = 'text-wrap'; c3.textContent = o.descricao || '—';
    const c4 = document.createElement('td'); c4.textContent = o.local || '—';
    const c5 = document.createElement('td'); c5.textContent = formatDate(o.data);
    const c6 = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge ${getAreaBadgeClass(o.area)}`;
    badge.textContent = o.area || 'Sem área';
    c6.appendChild(badge);
    const c7 = document.createElement('td');
    c7.innerHTML = actionButtons(o.id);
    tr.append(c1, c2, c3, c4, c5, c6, c7);
    tbody.appendChild(tr);
  });
}

function renderUsingDataTables(data) {
  const table = initDataTableIfAvailable();
  if (!table) {
    renderFallbackDOM(data);
    return;
  }
  table.clear();
  if (Array.isArray(data) && data.length > 0) {
    const rows = data.map(o => [
      o.entidade || '—',
      o.atividade || '—',
      o.descricao || '—',
      o.local || '—',
      formatDate(o.data),
      `<span class="badge ${getAreaBadgeClass(o.area)}">${o.area || 'Sem área'}</span>`,
      actionButtons(o.id)
    ]);
    table.rows.add(rows);
  }
  table.draw(false);
}

function fetchOportunidades() {
  fetch(API_URL, { headers: authHeaders() })
    .then(res => res.json())
    .then(data => {
      const arr = Array.isArray(data) ? data : [];
      cache = arr; // atualizar cache
      renderUsingDataTables(arr);
    })
    .catch(() => {
      cache = [];
      renderUsingDataTables([]);
    });
}

function resetFormState() {
  const form = document.getElementById('form-oportunidade');
  form.reset();
  editId = null;
  document.getElementById('id').value = '';
  document.getElementById('btn-submit-text').textContent = 'Cadastrar';
  document.getElementById('form-mode-label').textContent = 'Nova Oportunidade';
  document.getElementById('btn-cancelar-edicao').classList.add('d-none');
  document.getElementById('edit-indicator').classList.add('d-none');
  document.getElementById('btn-submit').classList.remove('btn-primary');
  document.getElementById('btn-submit').classList.add('btn-success');
}

//preenche o formulário da tela para edição da oportunidade que foi clicada
function fillFormForEdit(item) {
  if (!item) return;
  editId = item.id;
  document.getElementById('id').value = item.id;
  document.getElementById('entidade').value = item.entidade || '';
  document.getElementById('atividade').value = item.atividade || '';
  document.getElementById('descricao').value = item.descricao || '';
  document.getElementById('local').value = item.local || '';
  document.getElementById('data').value = item.data || '';
  document.getElementById('area').value = item.area || '';
  document.getElementById('btn-submit-text').textContent = 'Salvar Alterações';
  document.getElementById('form-mode-label').textContent = 'Editar Oportunidade';
  document.getElementById('btn-cancelar-edicao').classList.remove('d-none');
  document.getElementById('edit-indicator').classList.remove('d-none');
  document.getElementById('btn-submit').classList.remove('btn-success');
  document.getElementById('btn-submit').classList.add('btn-primary');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function submitCreate(data) {
  return fetch(API_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
}

function submitUpdate(id, data) {
  return fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
}

function submitDelete(id) {
  return fetch(`${API_URL}/${id}`, { method: 'DELETE' });
}

document.getElementById('form-oportunidade').addEventListener('submit', function(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    entidade: form.entidade.value,
    atividade: form.atividade.value,
    descricao: form.descricao.value,
    local: form.local.value,
    data: form.data.value,
    area: form.area.value
  };

  const op = editId ? submitUpdate(editId, payload) : submitCreate(payload);
  op.then(() => {
    resetFormState();
    fetchOportunidades();
  }).catch(() => fetchOportunidades());
});

// Cancelar edição
const btnCancelar = document.getElementById('btn-cancelar-edicao');
btnCancelar.addEventListener('click', () => resetFormState());

// Delegação de eventos para ações de tabela (funciona para DataTables e fallback se der errado)
const tabela = document.getElementById('tabela-oportunidades');
tabela.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const action = btn.getAttribute('data-action');
  if (!id) return;
  const item = cache.find(o => String(o.id) === String(id));
  if (action === 'edit') {
    fillFormForEdit(item);
  } else if (action === 'delete') {
    if (confirm('Confirma a exclusão desta oportunidade?')) {
      submitDelete(id).then(() => fetchOportunidades());
    }
  }
});

// Inicializa
window.addEventListener('load', () => {
  initDataTableIfAvailable();
  fetchOportunidades();
});

// ─── MAPA ────────────────────────────────────────────────────────────────────
// ─── LEAFLET + NOMINATIM ─────────────────────────────────────────────────────
let mapaObj = null;
let marcadores = [];
let mapaIniciado = false;

// Toggle do mapa
document.getElementById('btn-toggle-mapa').addEventListener('click', () => {
  const painel = document.getElementById('painel-mapa');
  const aberto = !painel.classList.contains('d-none');

  if (aberto) {
    painel.classList.add('d-none');
    document.getElementById('btn-toggle-mapa').innerHTML =
      '<i class="bi bi-map me-1"></i> Ver Mapa de Oportunidades';
    return;
  }

  painel.classList.remove('d-none');
  document.getElementById('btn-toggle-mapa').innerHTML =
    '<i class="bi bi-map-fill me-1"></i> Ocultar Mapa';

  if (!mapaIniciado) {
    iniciarMapa();
  } else {
    atualizarMarcadores();
  }
});

function iniciarMapa() {
  mapaObj = L.map('mapa').setView([-15.7801, -47.9292], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(mapaObj);

  mapaIniciado = true;
  atualizarMarcadores();
}

function limparMarcadores() {
  marcadores.forEach(m => mapaObj.removeLayer(m));
  marcadores = [];
}

async function geocodificarNominatim(endereco) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(endereco + ', Brasil')}&format=json&limit=1`;
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

async function atualizarMarcadores() {
  limparMarcadores();
  if (!cache || cache.length === 0) return;

  const bounds = [];

  for (const op of cache) {
    if (!op.local) continue;

    const coords = await geocodificarNominatim(op.local);
    if (!coords) continue;

    bounds.push([coords.lat, coords.lng]);

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
    await new Promise(r => setTimeout(r, 1000));
  }

  if (bounds.length > 0) mapaObj.fitBounds(bounds);
}

// ─── AUTOCOMPLETE DE ENDEREÇO ────────────────────────────────────────────────
let autocompleteTimer = null;
const inputLocal = document.getElementById('local');
const listaAutocomplete = document.getElementById('autocomplete-lista');

inputLocal.addEventListener('input', () => {
  clearTimeout(autocompleteTimer);
  const termo = inputLocal.value.trim();

  if (termo.length < 3) {
    listaAutocomplete.classList.add('d-none');
    listaAutocomplete.innerHTML = '';
    return;
  }

  // Aguarda 500ms após o usuário parar de digitar
  autocompleteTimer = setTimeout(() => buscarSugestoes(termo), 500);
});

async function buscarSugestoes(termo) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(termo + ', Brasil')}&format=json&limit=5&addressdetails=1`;
  try {
    const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
    const data = await res.json();

    listaAutocomplete.innerHTML = '';

    if (!data || data.length === 0) {
      listaAutocomplete.classList.add('d-none');
      return;
    }

    data.forEach(lugar => {
      const item = document.createElement('div');
      item.className = 'item';
      item.textContent = lugar.display_name;
      item.addEventListener('click', () => {
        inputLocal.value = lugar.display_name;
        listaAutocomplete.classList.add('d-none');
        listaAutocomplete.innerHTML = '';
      });
      listaAutocomplete.appendChild(item);
    });

    listaAutocomplete.classList.remove('d-none');
  } catch {
    listaAutocomplete.classList.add('d-none');
  }
}

// Fecha a lista ao clicar fora
document.addEventListener('click', (e) => {
  if (!e.target.closest('.autocomplete-wrapper')) {
    listaAutocomplete.classList.add('d-none');
  }
});
