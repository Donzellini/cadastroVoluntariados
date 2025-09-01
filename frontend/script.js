const API_URL = 'http://localhost:3001/oportunidades';

function fetchOportunidades(area = '') {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      const lista = document.getElementById('lista-oportunidades');
      lista.innerHTML = '';
      data.filter(o => !area || o.area === area).forEach(o => {
        const li = document.createElement('li');
        li.textContent = `${o.atividade} - ${o.descricao} (${o.local}, ${o.data}) [${o.area || 'Sem área'}]`;
        lista.appendChild(li);
      });
    });
}

document.getElementById('form-oportunidade').addEventListener('submit', function(e) {
  e.preventDefault();
  const form = e.target;
  const oportunidade = {
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
      fetchOportunidades(document.getElementById('filtro-area').value);
    });
});

document.getElementById('filtro-area').addEventListener('change', function(e) {
  fetchOportunidades(e.target.value);
});

// Inicializa lista
fetchOportunidades();
