const API_URL = 'http://localhost:3001/oportunidades';
let dt = null;

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
    scrollY: '50vh'
  });
  return dt;
}

function renderFallbackDOM(data) {
  const tbody = document.getElementById('tabela-oportunidades-body');
  if (!tbody) return;
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
  if (!data || data.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
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
    tr.append(c1, c2, c3, c4, c5, c6);
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
      `<span class="badge ${getAreaBadgeClass(o.area)}">${o.area || 'Sem área'}</span>`
    ]);
    table.rows.add(rows);
  }
  table.draw(false);
}

function fetchOportunidades() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      const arr = Array.isArray(data) ? data : [];
      renderUsingDataTables(arr);
    })
    .catch(() => {
      renderUsingDataTables([]);
    });
}

document.getElementById('form-oportunidade').addEventListener('submit', function(e) {
  e.preventDefault();
  const form = e.target;
  const oportunidade = {
    entidade: form.entidade.value,
    atividade: form.atividade.value,
    descricao: form.descricao.value,
    local: form.local.value,
    data: form.data.value,
    area: form.area.value
  };
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(oportunidade)
  })
    .then(() => {
      form.reset();
      fetchOportunidades();
    })
    .catch(() => {
      fetchOportunidades();
    });
});

// Inicializa após carregar scripts
window.addEventListener('load', () => {
  initDataTableIfAvailable();
  fetchOportunidades();
});
