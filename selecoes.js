// selecoes.js — View "Lista de Seleções" (tabela mínima + navegação da Home)
(() => {
  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const LKEY_STATE  = 'team_state_v2';
  const LKEY_MEDALS = 'team_medals_v1';

  // Monta/garante estado persistido
  function getAllState() {
    try { return JSON.parse(localStorage.getItem(LKEY_STATE) || '{}'); }
    catch { return {}; }
  }
  function setAllState(m) {
    localStorage.setItem(LKEY_STATE, JSON.stringify(m));
  }
  function ensureTeamState(map, team) {
    if (!map[team.code]) {
      map[team.code] = {
        score: 250,
        attributes: { ataque: 50, defesa: 50, meio: 50, velocidade: 50, entrosamento: 50 }
      };
    }
    const a = map[team.code].attributes;
    const soma = a.ataque + a.defesa + a.meio + a.velocidade + a.entrosamento;
    map[team.code].score = clamp(soma, 1, 500);
  }

  // Medalhas (mantido para compatibilidade, embora não usadas nesta tabela)
  function getMedals() { try { return JSON.parse(localStorage.getItem(LKEY_MEDALS) || '{}'); } catch { return {}; } }
  function setMedals(m) { localStorage.setItem(LKEY_MEDALS, JSON.stringify(m)); }
  function ensureMedalSlots(medals, team, tourLabel){
    medals[team.code] ||= {};
    const keyCont = tourLabel || (team.tournament || 'Continental');
    const ensure = k => (medals[team.code][k] ||= { ouro:0, prata:0, bronze:0 });
    ensure(keyCont); ensure('Confederações'); ensure('Mundial');
  }

  // Carrega e normaliza Selecoes.json
  async function loadSelecoes() {
    // Observação: abrir via file:// pode bloquear fetch. Ideal é servir com um servidor local (ex: Live Server).
    const resp = await fetch('Selecoes.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const raw = await resp.json();

    return raw.map(s => ({
      code: s.code || s.sigla || s.id || s.codigo,
      name: s.name || s.nome,
      flag: s.flag || s.flagPath || s.img || s.bandeira || `Flags/${(s.nome||s.name)}.jpg`,
      confed: s.confed || s.conf || s.continente || s.federacao,
      tournament: s.Tournament || s.tournament || s.confed || 'Continental'
    })).filter(s => s.code && s.name);
  }

  // ---------- view / UI ----------
  // Template da view com apenas 3 colunas
  function viewTemplate() {
    return `
      <section id="view-selecoes" class="selecoes">
        <header class="section-head">
          <h2>Lista de Seleções</h2>
          <p class="muted small">Bandeiras, score e atributos</p>
        </header>

        <div class="card">
          <div class="table-wrap">
            <table id="sel-table">
              <thead>
                <tr>
                  <th class="left col-flag">Flag</th>
                  <th class="left" data-sort="name" title="Ordenar por Seleção">Seleção</th>
                  <th class="right" data-sort="score" title="Ordenar por Score">Score</th>
                </tr>
              </thead>
              <tbody id="sel-tbody"></tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  // Estado da view
  let DATA = [];
  let sortKey = 'name';
  let sortDir = 1; // 1 asc, -1 desc

  function composeRow(s) {
    const safeFlag = s.flag || '';
    return `
      <tr data-code="${s.code}">
        <td class="col-flag">
          <img class="flag" src="${safeFlag}" alt="${s.name}" onerror="this.style.visibility='hidden'">
        </td>
        <td>${s.name}</td>
        <td class="right">${s.state.score}</td>
      </tr>
    `;
  }

  function renderTable() {
    const tbody = $('#sel-tbody');
    const k = sortKey;
    const d = sortDir;

    const getVal = (s) => {
      if (k === 'name') {
        return s.name.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
      }
      // k === 'score'
      return s.state.score;
    };

    const rows = [...DATA].sort((a,b)=>{
      const A = getVal(a), B = getVal(b);
      if (A < B) return -1*d;
      if (A > B) return  1*d;
      return 0;
    }).map(composeRow).join('');

    tbody.innerHTML = rows;
  }

  function bindSort() {
    document.querySelectorAll('#sel-table thead th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort');
        if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; }

        document.querySelectorAll('#sel-table thead th[data-sort]')
          .forEach(x => x.classList.remove('asc','desc'));
        th.classList.add(sortDir === 1 ? 'asc' : 'desc');

        renderTable();
      });
    });
  }

  // ---------- navegação ----------
  function hideHome() {
    // Esconde hero, grid e rodapé enquanto a view está ativa
    $('.hero')?.classList.add('hidden');
    $('.menu-grid')?.classList.add('hidden');
    $('.foot')?.classList.add('hidden');
  }
  function showHome() {
    $('.hero')?.classList.remove('hidden');
    $('.menu-grid')?.classList.remove('hidden');
    $('.foot')?.classList.remove('hidden');
  }

  function mountSelecoesInternal(mainEl) {
    // Evita montar duas vezes
    if ($('#view-selecoes')) return;

    // Esconde Home e injeta a view
    hideHome();
    mainEl.insertAdjacentHTML('beforeend', viewTemplate());

    // Sobe título da topbar (opcional)
    const brand = $('.brand-title');
    if (brand) brand.textContent = 'Estudos Futebol';

    // Carrega dados + renderiza
    initSelecoes().catch(err => {
      console.error(err);
      // Em caso de erro, ainda assim não mostramos a Home
      $('#sel-tbody')?.insertAdjacentHTML('beforebegin',
        `<p class="muted small">Não foi possível carregar as seleções.</p>`);
    });
  }

  async function initSelecoes() {
    const selecoes = await loadSelecoes();

    // Preparar estados/medalhas
    const stateMap = getAllState();
    const medalMap = getMedals();
    selecoes.forEach(s => {
      ensureTeamState(stateMap, s);
      ensureMedalSlots(medalMap, s, s.tournament);
    });
    setAllState(stateMap);
    setMedals(medalMap);

    // Junta dados para a view
    DATA = selecoes.map(s => ({ ...s, state: stateMap[s.code] }));

    bindSort();
    renderTable();
  }

  // ---------- boot ----------
  document.addEventListener('DOMContentLoaded', () => {
    // Botão do card "Lista de Seleções"
    const btnSelecoes = document.querySelector('[data-target="selecoes"]');
    const main = $('main');

    if (btnSelecoes && main) {
      btnSelecoes.addEventListener('click', () => mountSelecoesInternal(main));
    }

    // Se quiser abrir direto pela âncora #selecoes (ex.: home.html#selecoes)
    if (location.hash === '#selecoes' && main) {
      mountSelecoesInternal(main);
    }
  });

})();
