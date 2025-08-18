// selecoes.js — Lista de Seleções (tabela, ordenação, radar, medalhas)
(() => {
  // Só roda quando a view estiver presente
  const view = document.querySelector('#view-selecoes');
  if (!view) return;

  // ----- utilidades -----
  const $ = sel => document.querySelector(sel);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const LKEY_STATE = 'team_state_v2';
  const LKEY_MEDALS = 'team_medals_v1';

  function showError(msg) {
    let box = document.getElementById('selecoes-error');
    if (!box) {
      box = document.createElement('div');
      box.id = 'selecoes-error';
      box.style.cssText = `
        margin:12px 16px; padding:12px 14px; border-radius:12px;
        background:#391a1a; color:#ffdede; border:1px solid #7a3a3a;
        font-size:.95rem; line-height:1.35;
      `;
      const container = document.getElementById('selecoes');
      (container || document.body).prepend(box);
    }
    box.textContent = msg;
  }

  // carrega/normaliza Selecoes.json (com fallback embutido)
  async function loadSelecoes() {
    // 1) Caminho feliz: rodando via http(s) ou em ambientes que permitem fetch
    if (location.protocol === 'http:' || location.protocol === 'https:') {
      const r = await fetch('Selecoes.json', { cache: 'no-store' });
      if (!r.ok) throw new Error(`Falha ao baixar Selecoes.json (${r.status})`);
      const raw = await r.json();
      return normalizeSelecoes(raw);
    }

    // 2) Fallback: se está em file:// tenta script embutido
    const inline = document.getElementById('selecoes-json');
    if (inline && inline.textContent.trim()) {
      try {
        const raw = JSON.parse(inline.textContent);
        return normalizeSelecoes(raw);
      } catch (e) {
        throw new Error('JSON embutido inválido em #selecoes-json');
      }
    }

    // 3) Se chegou aqui, explique claramente o que fazer
    throw new Error(
      'Não foi possível carregar Selecoes.json porque a página está aberta via file://.\n' +
      'Rode o projeto em um servidor local (ex.: VSCode Live Server, ou "python -m http.server").'
    );
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

  // estado das seleções: atributos + score (persistente)
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
        attributes: {
          ataque: 50, defesa: 50, meio: 50, velocidade: 50, entrosamento: 50
        }
      };
    }
    const a = map[team.code].attributes;
    const soma = a.ataque + a.defesa + a.meio + a.velocidade + a.entrosamento;
    if (map[team.code].score !== soma) map[team.code].score = clamp(soma, 1, 500);
  }

  // medalhas no localStorage
  function getMedals() { return JSON.parse(localStorage.getItem(LKEY_MEDALS) || '{}'); }
  function setMedals(m) { localStorage.setItem(LKEY_MEDALS, JSON.stringify(m)); }
  function ensureMedalSlots(medals, team, tourLabel){
    medals[team.code] ||= {};
    const keyCont = tourLabel || (team.tournament || 'Continental');
    const ensure = k => (medals[team.code][k] ||= { ouro:0, prata:0, bronze:0 });
    ensure(keyCont); ensure('Confederações'); ensure('Mundial');
  }

  // ----- renderização da tabela -----
  let data = [];         // selecoes + estado mesclado
  let sortKey = 'name';  // chave atual
  let sortDir = 1;       // 1 asc, -1 desc
  let current = null;    // seleção focada no painel

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
    if (!data.length) {
      tbody.innerHTML = '';
      return;
    }
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

    // liga clique
    tbody.querySelectorAll('tr').forEach(tr=>{
      tr.addEventListener('click', ()=>{
        const code = tr.getAttribute('data-code');
        const s = data.find(x=>x.code===code);
        if (s) { current = s; renderDetail(); }
      });
    });
  }

  // cabeçalhos sort
  function bindSort() {
    document.querySelectorAll('#sel-table thead th[data-sort]').forEach(th=>{
      th.addEventListener('click', ()=>{
        const key = th.getAttribute('data-sort');
        if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; }
        document.querySelectorAll('#sel-table thead th[data-sort]').forEach(x=>x.classList.remove('asc','desc'));
        th.classList.add(sortDir === 1 ? 'asc' : 'desc');
        renderTable();
      });
    });
  }

  // ----- painel inferior -----
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

  function drawRadar(canvas, values, max=500){
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0,0,W,H);

    const cx = W*0.58, cy = H*0.54, r = Math.min(W,H)*0.42;
    const labels = ['Ataque','Meio','Defesa','Veloc.','Entros.'];
    const pts = 5;

    // grade + eixos
    ctx.strokeStyle = 'rgba(255,255,255,.25)';
    ctx.fillStyle   = 'rgba(255,255,255,.06)';
    ctx.lineWidth = 1;

    for (let i=1;i<=5;i++){
      ctx.beginPath();
      ctx.arc(cx,cy,(r*i/5),0,Math.PI*2);
      ctx.stroke();
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

  // ----- bootstrap -----
  (async function init(){
    try {
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

      // seleciona a primeira por padrão
      if (data[0]) { current = data[0]; renderDetail(); }
    } catch (err) {
      console.error(err);
      showError(String(err.message || err));
      // garante que a tabela não apareça “vazia”
      const tbody = $('#sel-tbody');
      if (tbody) tbody.innerHTML = '';
    }
  })();

})();
