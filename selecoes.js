// selecoes.js — Lista de Seleções (tabela, ordenação, radar, medalhas)
// Versão sem "export", compatível com <script src="selecoes.js" defer> (home.html).
// Auto-mount com hash "#selecoes" e click do card data-target="selecoes".

(function () {
  // ===== Helpers genéricos =====
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const LKEY_STATE  = 'team_state_v2';
  const LKEY_MEDALS = 'team_medals_v1';

  // Carrega/normaliza Selecoes.json
  async function loadSelecoes() {
    const r = await fetch('Selecoes.json');
    const raw = await r.json();
    return raw.map(s => ({
      code: s.code || s.sigla || s.id || s.codigo,
      name: s.name || s.nome,
      // tenta usar caminho do JSON; se vier caminho Windows absoluto, converte para pasta Flags/
      flag: toRelFlag(s.flag || s.flagPath || s.img || s.bandeira, s.nome || s.name),
      confed: s.confed || s.conf || s.continente || s.federacao,
      tournament: s.Tournament || s.tournament || s.confed || 'Continental'
    })).filter(s => s.code && s.name);
  }

  function toRelFlag(path, fallbackName) {
    if (typeof path === 'string' && path) {
      // C:\...\Flags\Brasil.jpg -> Flags/Brasil.jpg
      const m = path.match(/\\Flags\\(.+?\.(png|jpg|jpeg|webp|gif))$/i);
      if (m) return `Flags/${m[1]}`;
      // Flags/Brasil.jpg (já ok) ou URL relativa/absoluta
      return path;
    }
    // fallback por nome
    return `Flags/${(fallbackName||'Flag')}.jpg`;
  }

  // Estado persistente no localStorage
  function getAllState() {
    return JSON.parse(localStorage.getItem(LKEY_STATE) || '{}');
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
    if (map[team.code].score !== soma) map[team.code].score = clamp(soma, 1, 500);
  }

  // Medalhas persistentes
  function getMedals()  { return JSON.parse(localStorage.getItem(LKEY_MEDALS) || '{}'); }
  function setMedals(m) { localStorage.setItem(LKEY_MEDALS, JSON.stringify(m)); }
  function ensureMedalSlots(medals, team, tourLabel){
    medals[team.code] ||= {};
    const keyCont = tourLabel || (team.tournament || 'Continental');
    const ensure = k => (medals[team.code][k] ||= { ouro:0, prata:0, bronze:0 });
    ensure(keyCont); ensure('Confederações'); ensure('Mundial');
  }

  // ===== UI: template e montagem =====
  function createTemplate(container) {
    container.innerHTML = `
    <section class="selecoes-wrap">
      <header class="block-title">
        <h2>Lista de Seleções</h2>
        <p class="muted">Bandeiras, score e atributos</p>
      </header>

      <div class="table-card">
        <div class="table-wrap">
          <table id="sel-table" class="sel-table">
            <thead>
              <tr>
                <th style="width:54px;">Flag</th>
                <th data-sort="name" class="is-sort">Seleção</th>
                <th data-sort="score" class="is-sort right">Score</th>
                <th data-sort="ataque" class="is-sort right">Ata</th>
                <th data-sort="defesa" class="is-sort right">Def</th>
                <th data-sort="meio" class="is-sort right">Meio</th>
                <th data-sort="velocidade" class="is-sort right">Vel</th>
                <th data-sort="entrosamento" class="is-sort right">Ent</th>
              </tr>
            </thead>
            <tbody id="sel-tbody"></tbody>
          </table>
        </div>
      </div>

      <div class="detail-grid bottom-grid">
        <div class="detail-left card">
          <div class="sel-hero">
            <div class="hero-left">
              <img id="sel-flag" class="flag" alt="">
              <div>
                <h3 id="sel-name" class="team-name">—</h3>
                <div id="sel-meta" class="team-meta muted">—</div>
              </div>
            </div>
          </div>

          <div id="medals-box" class="medals-box medals"></div>
        </div>

        <div class="detail-right card">
          <canvas id="radar" width="360" height="280" class="radar"></canvas>
        </div>
      </div>
    </section>
    `;
  }

  // Desenho do radar (Canvas)
  function drawRadar(canvas, values, max=500){
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    // garante DPI ok em mobile
    const ratio = window.devicePixelRatio || 1;
    canvas.width  = Math.round(rect.width  * ratio) || canvas.width;
    canvas.height = Math.round(rect.height * ratio) || canvas.height;

    const W = canvas.width, H = canvas.height;
    ctx.scale(ratio, ratio);
    ctx.clearRect(0,0,W,H);

    const cx = (W/ratio)*0.58, cy = (H/ratio)*0.54, r = Math.min(W/ratio,H/ratio)*0.42;
    const labels = ['Ataque','Meio','Defesa','Veloc.','Entros.'];
    const pts = 5;

    // grade + eixos
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.fillStyle   = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1;

    for (let i=1;i<=5;i++){
      ctx.beginPath(); ctx.arc(cx,cy,(r*i/5),0,Math.PI*2); ctx.stroke();
    }
    ctx.fillStyle='#9fb3cc';
    for (let i=0;i<pts;i++){
      const ang = (-Math.PI/2) + i*(2*Math.PI/pts);
      const x = cx + r*Math.cos(ang), y = cy + r*Math.sin(ang);
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke();
      const lx = cx + (r+12)*Math.cos(ang), ly = cy + (r+12)*Math.sin(ang);
      ctx.fillText(labels[i], lx-14, ly+4);
    }

    // área dos valores
    ctx.beginPath();
    values.forEach((v,i)=>{
      const ang = (-Math.PI/2) + i*(2*Math.PI/pts);
      const rr = r * clamp(v,0,max) / max;
      const x = cx + rr*Math.cos(ang), y = cy + rr*Math.sin(ang);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(34,197,94,.25)';
    ctx.strokeStyle = 'rgba(34,197,94,.9)';
    ctx.lineWidth = 2;
    ctx.fill(); ctx.stroke();
  }

  // ===== Montagem escopada por container =====
  async function mountSelecoesInternal(container) {
    if (!container) throw new Error('mountSelecoes: container inválido');

    // injeta CSS do módulo (se existir)
    ensureModuleCSS('selecoes.css').catch(()=>{ /* ok se não existir */ });

    // cria template base
    createTemplate(container);

    // query escopado
    const $  = sel => container.querySelector(sel);
    const $$ = sel => Array.from(container.querySelectorAll(sel));

    // estado
    let data = [];
    let sortKey = 'name';
    let sortDir = 1;
    let current = null;

    function composeRow(s) {
      return `
        <tr data-code="${s.code}">
          <td><img class="flag" src="${s.flag}" alt="${s.name}"></td>
          <td>${s.name}</td>
          <td class="right">${s.state.score}</td>
          <td class="right">${s.state.attributes.ataque}</td>
          <td class="right">${s.state.attributes.defesa}</td>
          <td class="right">${s.state.attributes.meio}</td>
          <td class="right">${s.state.attributes.velocidade}</td>
          <td class="right">${s.state.attributes.entrosamento}</td>
        </tr>
      `;
    }

    function renderTable() {
      const tbody = $('#sel-tbody');
      const k = sortKey;
      const d = sortDir;
      const get = s => (k === 'name'
        ? s.name.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()
        : (k === 'score' ? s.state.score : s.state.attributes[k]));
      const rows = [...data].sort((a,b)=>{
        const A = get(a), B = get(b);
        if (A < B) return -1*d;
        if (A > B) return  1*d;
        return 0;
      }).map(composeRow).join('');
      tbody.innerHTML = rows;

      // clique nas linhas
      $$('tbody tr').forEach(tr=>{
        tr.addEventListener('click', ()=>{
          const code = tr.getAttribute('data-code');
          const s = data.find(x=>x.code===code);
          if (s) { current = s; renderDetail(); }
        });
      });
    }

    function bindSort() {
      $$('#sel-table thead th[data-sort]').forEach(th=>{
        th.addEventListener('click', ()=>{
          const key = th.getAttribute('data-sort');
          if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; }
          $$('#sel-table thead th[data-sort]').forEach(x=>x.classList.remove('asc','desc'));
          th.classList.add(sortDir === 1 ? 'asc' : 'desc');
          renderTable();
        });
      });
    }

    function renderDetail(){
      if (!current) return;
      $('#sel-flag').src = current.flag;
      $('#sel-flag').alt = current.name;
      $('#sel-name').textContent = current.name;
      $('#sel-meta').textContent = `Score ${current.state.score}`;

      // medals
      const medals = getMedals()[current.code] || {};
      const mk = (title, key) => {
        const {ouro=0, prata=0, bronze=0} = medals[key] || {};
        return `<div class="medals-row">
          <div class="title">${title}</div>
          <div class="badges">
            <span class="badge">🥇 <small>${ouro}</small></span>
            <span class="badge">🥈 <small>${prata}</small></span>
            <span class="badge">🥉 <small>${bronze}</small></span>
          </div>
        </div>`;
      };
      const contKey = current.tournament || 'Continental';
      $('#medals-box').innerHTML = mk(contKey, contKey) + mk('Confederações','Confederações') + mk('Mundial','Mundial');

      // radar
      drawRadar($('#radar'), [
        current.state.attributes.ataque,
        current.state.attributes.meio,
        current.state.attributes.defesa,
        current.state.attributes.velocidade,
        current.state.attributes.entrosamento
      ]);
    }

    // bootstrap
    const selecoes = await loadSelecoes();

    // prepara estados e medalhas
    const stateMap = getAllState();
    const medalMap = getMedals();
    selecoes.forEach(s => {
      ensureTeamState(stateMap, s);
      ensureMedalSlots(medalMap, s, s.tournament);
    });
    setAllState(stateMap);
    setMedals(medalMap);

    // junta dados
    data = selecoes.map(s => ({ ...s, state: stateMap[s.code] }));

    bindSort();
    renderTable();
    if (data[0]) { current = data[0]; renderDetail(); }
  }

  // Injeta CSS do módulo (opcional)
  function ensureModuleCSS(href) {
    return new Promise((resolve, reject) => {
      if (!href) return resolve();
      let link = document.getElementById('selecoes-css');
      if (link && link.getAttribute('href') === href) return resolve();
      if (link) link.remove();
      link = document.createElement('link');
      link.id = 'selecoes-css';
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`CSS não encontrado: ${href}`));
      document.head.appendChild(link);
    });
  }

  // ===== API global e auto-mount =====
  window.initSelecoes = async function initSelecoes(selectorOrEl) {
    const container = (typeof selectorOrEl === 'string')
      ? document.querySelector(selectorOrEl)
      : selectorOrEl;
    if (!container) throw new Error('initSelecoes: container não encontrado');
    await mountSelecoesInternal(container);
  };

  // Liga o card do menu e monta quando hash for #selecoes
  window.addEventListener('DOMContentLoaded', () => {
    // 1) click do card
    document.querySelectorAll('.menu-card[data-target="selecoes"]').forEach(btn=>{
      btn.addEventListener('click', () => {
        location.hash = '#selecoes';
        // mount imediato
        ensureMounted();
      });
    });

    // 2) se já abriu com #selecoes, monta
    ensureMounted();
  });

  window.addEventListener('hashchange', () => {
    if (location.hash === '#selecoes') ensureMounted();
  });

  function ensureMounted() {
    if (location.hash !== '#selecoes') return;
    const main = document.querySelector('main') || document.body;
    let host = document.getElementById('selecoes-root');
    if (!host) {
      host = document.createElement('div');
      host.id = 'selecoes-root';
      host.className = 'container';
      main.appendChild(host);
    }
    // Evita remontar se já tem conteúdo
    if (!host.__mounted) {
      host.__mounted = true;
      initSelecoes(host).catch(err => {
        console.error(err);
        host.__mounted = false;
      });
    }
  }
})();
