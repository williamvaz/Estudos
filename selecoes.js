// selecoes.js — View "Lista de Seleções"
// - Esconde a Home quando aberto
// - Tabela com 3 colunas: Flag | Seleção | Score
// - Carrega Selecoes.json (com fallback via file picker quando rodando em file://)

(() => {
  // ----- utils -----
  const $ = sel => document.querySelector(sel);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const LKEY_STATE  = 'team_state_v2';
  const LKEY_MEDALS = 'team_medals_v1';

  // persitência de estado (score/atributos)
  const getAllState = () => JSON.parse(localStorage.getItem(LKEY_STATE)  || '{}');
  const setAllState = (m) => localStorage.setItem(LKEY_STATE, JSON.stringify(m));
  const getMedals   = () => JSON.parse(localStorage.getItem(LKEY_MEDALS) || '{}');
  const setMedals   = (m) => localStorage.setItem(LKEY_MEDALS, JSON.stringify(m));

  function ensureTeamState(map, team) {
    if (!map[team.code]) {
      map[team.code] = {
        score: 250,
        attributes: { ataque:50, defesa:50, meio:50, velocidade:50, entrosamento:50 }
      };
    }
    const a = map[team.code].attributes;
    const soma = a.ataque + a.defesa + a.meio + a.velocidade + a.entrosamento;
    if (map[team.code].score !== soma) map[team.code].score = clamp(soma, 1, 500);
  }

  function ensureMedalSlots(medals, team, tourLabel){
    medals[team.code] ||= {};
    const keyCont = tourLabel || (team.tournament || 'Continental');
    const ensure = k => (medals[team.code][k] ||= { ouro:0, prata:0, bronze:0 });
    ensure(keyCont); ensure('Confederações'); ensure('Mundial');
  }

  // ----- montagem da view -----
  function hideHome() {
    $('.hero')?.classList.add('is-hidden');
    $('.menu-grid')?.classList.add('is-hidden');
  }
  function showHome() {
    $('.hero')?.classList.remove('is-hidden');
    $('.menu-grid')?.classList.remove('is-hidden');
  }

  function ensureSelecoesView() {
    let view = $('#view-selecoes');
    if (view) return view;

    view = document.createElement('section');
    view.id = 'view-selecoes';
    view.className = 'selecoes-view';

    view.innerHTML = `
      <header class="block">
        <h2 class="title">Lista de Seleções</h2>
        <p class="muted">Bandeiras e score</p>
      </header>

      <div id="sel-error" class="callout warn" style="display:none"></div>

      <div class="table-wrap">
        <table id="sel-table" class="table compact">
          <thead>
            <tr>
              <th>Flag</th>
              <th data-sort="name" class="sortable">Seleção</th>
              <th data-sort="score" class="right sortable">Score</th>
            </tr>
          </thead>
          <tbody id="sel-tbody"></tbody>
        </table>
      </div>

      <div id="picker" class="picker" style="display:none">
        <p class="muted small" style="margin: 12px 0">
          O navegador bloqueou a leitura direta do arquivo (abrindo via <code>file://</code>).<br>
          Clique abaixo e escolha <strong>Selecoes.json</strong> para carregar.
        </p>
        <button type="button" class="btn" id="btn-choose">Escolher Selecoes.json</button>
        <input type="file" id="file-input" accept=".json,application/json" style="display:none" />
      </div>
    `;
    // injeta logo depois da Home
    const main = $('#home') || document.body;
    main.parentNode.insertBefore(view, main.nextSibling);
    return view;
  }

  // ----- carregamento de dados -----
  async function loadSelecoesViaFetch() {
    // tenta fetch normal (funciona quando rodando em http:// ou https://)
    const res = await fetch('Selecoes.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const raw = await res.json();
    return normalizeSelecoes(raw);
  }

  function normalizeSelecoes(raw) {
    return (raw || []).map(s => ({
      code: s.code || s.sigla || s.id || s.codigo,
      name: s.name || s.nome,
      flag: s.flag || s.flagPath || s.img || s.bandeira || `Flags/${(s.nome||s.name)}.jpg`,
      confed: s.confed || s.conf || s.continente || s.federacao,
      tournament: s.Tournament || s.tournament || s.confed || 'Continental'
    })).filter(s => s.code && s.name);
  }

  function enableManualPicker(onLoaded) {
    const picker = $('#picker');
    const btn = $('#btn-choose');
    const input = $('#file-input');
    picker.style.display = '';
    btn.onclick = () => input.click();
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      try {
        const text = await f.text();
        const json = JSON.parse(text);
        onLoaded(normalizeSelecoes(json));
        picker.style.display = 'none';
      } catch (e) {
        showError('Arquivo inválido. Escolha um Selecoes.json válido.');
      }
    };
  }

  function showError(msg) {
    const c = $('#sel-error');
    c.textContent = msg;
    c.style.display = '';
  }

  async function loadSelecoes() {
    try {
      return await loadSelecoesViaFetch();
    } catch (e) {
      // falhou (provável file://). Oferece seletor manual.
      enableManualPicker(selecoes => mountSelecoesInternal(selecoes));
      throw e;
    }
  }

  // ----- renderização -----
  let data = [];
  let sortKey = 'name';
  let sortDir = 1; // 1 asc, -1 desc

  function composeRow(s) {
    return `
      <tr data-code="${s.code}">
        <td><img class="flag" src="${s.flag}" alt="${s.name}" /></td>
        <td>${s.name}</td>
        <td class="right">${s.state.score}</td>
      </tr>
    `;
  }

  function renderTable() {
    const tbody = $('#sel-tbody');
    const k = sortKey, d = sortDir;
    const get = s => (k === 'name'
      ? s.name.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()
      : s.state.score);
    const rows = [...data].sort((a,b)=>{
      const A = get(a), B = get(b);
      if (A < B) return -1*d;
      if (A > B) return  1*d;
      return 0;
    }).map(composeRow).join('');
    tbody.innerHTML = rows;
  }

  function bindSort() {
    document.querySelectorAll('#sel-table thead th.sortable').forEach(th=>{
      th.addEventListener('click', ()=>{
        const key = th.getAttribute('data-sort');
        if (!key) return;
        if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; }
        document.querySelectorAll('#sel-table thead th.sortable').forEach(x=>x.classList.remove('asc','desc'));
        th.classList.add(sortDir === 1 ? 'asc' : 'desc');
        renderTable();
      });
    });
  }

  // ----- bootstrap -----
  async function mountSelecoesInternal(selecoes){
    hideHome();
    ensureSelecoesView();

    // prepara estados e medalhas
    const stateMap = getAllState();
    const medalMap = getMedals();
    selecoes.forEach(s => {
      ensureTeamState(stateMap, s);
      ensureMedalSlots(medalMap, s, s.tournament);
    });
    setAllState(stateMap);
    setMedals(medalMap);

    // dados mesclados
    data = selecoes.map(s => ({ ...s, state: stateMap[s.code] }));
    bindSort();
    renderTable();
  }

  async function initSelecoes(){
    hideHome();
    ensureSelecoesView();
    try {
      const selecoes = await loadSelecoes();
      await mountSelecoesInternal(selecoes);
    } catch (e) {
      // já mostramos o picker; também exibimos um aviso discreto no console
      console.warn('Falha ao carregar Selecoes.json via fetch. Use o seletor manual.', e);
      showError('Não consegui ler Selecoes.json automaticamente. Use o botão acima para carregar o arquivo.');
    }
  }

  // Entradas:
  // 1) Clique no card "Lista de Seleções"
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest?.('button[data-target="selecoes"]');
    if (!btn) return;
    ev.preventDefault();
    initSelecoes();
  });

  // 2) Se já existe um título "Lista de Seleções" na página (ex. navegação direta),
  //    inicializa automaticamente.
  window.addEventListener('DOMContentLoaded', () => {
    // se quiser iniciar automaticamente ao abrir a página, descomente a linha:
    // initSelecoes();
  });

})();
