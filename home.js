// home.js – Simulador completo (menu, jogar, times, palavras + SRS + torneios)
(function(){
  // ---------- VIEWS ----------
  const VIEWS = ['menu','play','teams','words'];
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  function show(view){
    VIEWS.forEach(v => $('#view-'+v).classList.toggle('active', v===view));
  }
  $$('.menu-btn, .hero .primary').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const v = e.currentTarget.getAttribute('data-view');
      if(v) show(v);
      if(v==='teams') renderCountries();
      if(v==='menu') updateMenuKPIs();
      if(v==='words') renderWords();
      if(v==='play') renderPlayPanel();
    });
  });

  // ---------- DATA LOAD ----------
  let Selecoes = [];
  let Campeonatos = {};
  let Words = [];

  async function loadSelecoes(){
    try{
      const r = await fetch('Selecoes.json');
      const arr = await r.json();
      // normaliza alguns aliases esperados
      return arr.map(s => ({
        code: s.code || s.sigla || s.id || s.codigo,
        name: s.name || s.nome,
        flag: s.flag || s.flagPath || s.img || s.bandeira,
        confed: s.confed || s.conf || s.continente || s.federacao
      })).filter(s=>s.code && s.name);
    }catch(e){ console.error('Selecoes.json não encontrado', e); return []; }
  }
  async function loadCampeonatos(){
    try{
      const r = await fetch('campeonatos.json');
      const arr = await r.json();
      const map = {}; arr.forEach(c => map[c.Nome] = c);
      return map;
    }catch(e){ console.error('campeonatos.json não encontrado', e); return {}; }
  }

  // ---------- TEAM STATE / ATTRS ----------
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function scoreToStars(score){
    const s = clamp(score, 1, 500);
    if (s <= 50)  return 0.5;
    if (s <= 100) return 1.0;
    if (s <= 150) return 1.5;
    if (s <= 200) return 2.0;
    if (s <= 250) return 2.5;
    if (s <= 300) return 3.0;
    if (s <= 350) return 3.5;
    if (s <= 400) return 4.0;
    if (s <= 450) return 4.5;
    return 5.0;
  }
  function renderStars(stars){
    const full = Math.floor(stars);
    const half = stars - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '⯪' : '') + '☆'.repeat(empty);
  }
  function hashCode(str){ let h=0; for(let i=0;i<str.length;i++){ h=((h<<5)-h)+str.charCodeAt(i); h|=0; } return Math.abs(h); }
  function seededRandom(seed){ let state = seed % 2147483647; if (state<=0) state += 2147483646; return () => (state = state*48271 % 2147483647) / 2147483647; }
  function splitScoreIntoAttributes(score, selectionCode){
    const rnd = seededRandom(hashCode(selectionCode));
    const weights = Array.from({length:5}, ()=> rnd()+0.2);
    const sumW = weights.reduce((a,b)=>a+b,0);
    let raw = weights.map(w => Math.floor((w/sumW)*score));
    let diff = score - raw.reduce((a,b)=>a+b,0);
    for(let i=0; diff>0; i=(i+1)%5){ raw[i]++; diff--; }
    return { ataque:raw[0], meio:raw[1], defesa:raw[2], velocidade:raw[3], entrosamento:raw[4] };
  }
  function applyDeltaToAttributes(attrs, delta, selectionCode){
    if (delta===0) return attrs;
    const order = ['ataque','meio','defesa','velocidade','entrosamento'];
    const rnd = seededRandom(hashCode(selectionCode));
    const seq = order.map(k=>({k, r:rnd()})).sort((a,b)=>a.r-b.r).map(x=>x.k);
    let i=0, step = delta>0?1:-1, left=Math.abs(delta);
    while(left-- > 0){ const k = seq[i%seq.length]; attrs[k] = clamp(attrs[k]+step, 0, 500); i++; }
    return attrs;
  }
  function getTeamState(code, fallbackScore=250){
    const k = `team:${code}`;
    const saved = JSON.parse(localStorage.getItem(k) || 'null');
    if (saved && typeof saved.score==='number' && saved.attributes) return saved;
    const attrs = splitScoreIntoAttributes(fallbackScore, code);
    const s = { score:fallbackScore, attributes:attrs };
    localStorage.setItem(k, JSON.stringify(s));
    return s;
  }
  function setTeamState(code, state){
    localStorage.setItem(`team:${code}`, JSON.stringify(state));
  }

  // ---------- WORDS + SRS ----------
  const WORDS_KEY = 'estudos_words_bank_v1';
  function today(){ return new Date().toISOString().slice(0,10); }
  function ensureSRS(w){
    if(!w.ease) w.ease=2.5;
    if(!w.interval) w.interval=0;
    if(!w.streak) w.streak=0;
    if(!w.nextDue) w.nextDue=null; 
    return w;
  }
  function isDue(w){ return !w.nextDue || w.nextDue <= today(); }
  function applySRS(w, grade){
    w.new=false;
    if(grade<3){ w.streak=0; w.ease=Math.max(1.3, w.ease-0.2); w.interval=0.5; }
    else{ w.streak++; w.ease=Math.min(3.0, w.ease+(grade===4?0.15:0.05)); w.interval=w.interval<1?1:Math.round(w.interval*w.ease); }
    const next=new Date(); next.setDate(next.getDate()+Math.max(1,Math.round(w.interval))); w.nextDue=next.toISOString().slice(0,10);
    saveWords(Words);
  }
  function loadWords(){ try{ const raw = localStorage.getItem(WORDS_KEY); if(raw) return JSON.parse(raw).map(ensureSRS); }catch{} return []; }
  function saveWords(arr){ localStorage.setItem(WORDS_KEY, JSON.stringify(arr)); }
  async function loadWordsFromFile(){
    try{
      const resp = await fetch('words.json');
      const arr = await resp.json();
      return arr.map(x => ensureSRS({
        id: id(),
        term: x.term || x.word || x.termo || '',
        level: (x.level || x.cefr || 'NI').toUpperCase(),
        def: x.def || x.descricao || x.description || '',
        pos: x.pos || '',
        url: x.definition_url || '',
        audio: x.voice_url || '',
        new: true 
      }));
    }catch(e){ console.error("Erro ao carregar words.json", e); return []; }
  }
  $('#w-add')?.addEventListener('click', ()=>{
    const term = $('#w-term').value.trim();
    const level = $('#w-level').value;
    const def = $('#w-def').value.trim();
    if(!term || !def){ alert('Informe termo e descrição.'); return; }
    Words.push(ensureSRS({id:id(), term, level, def, new:true}));
    saveWords(Words);
    $('#w-term').value=''; $('#w-def').value='';
    renderWords(); updateMenuKPIs();
  });
  $('#w-export')?.addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(Words,null,2)], {type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='words_export.json';
    a.click(); URL.revokeObjectURL(a.href);
  });
  $('#w-import')?.addEventListener('change', async (e)=>{
    const f = e.target.files[0]; if(!f) return;
    try{
      const txt = await f.text();
      const arr = JSON.parse(txt);
      if(!Array.isArray(arr)) throw 0;
      const mapped = arr.map(x=>ensureSRS({
        id:id(),
        term: x.term || x.word || x.termo || '',
        level: (x.level || x.cefr || 'NI').toUpperCase(),
        def: x.def || x.descricao || x.description || '',
        pos: x.pos || '',
        url: x.definition_url || '',
        audio: x.voice_url || '',
        new: true
      })).filter(x=>x.term && x.def);
      Words = Words.concat(mapped);
      saveWords(Words);
      renderWords(); updateMenuKPIs();
      alert(`Importados ${mapped.length} itens.`);
    }catch{ alert('JSON inválido.'); }
    e.target.value='';
  });
  $('#w-filter-level')?.addEventListener('input', renderWords);
  $('#w-search')?.addEventListener('input', renderWords);
  function renderWords(){
    const lvl = $('#w-filter-level').value;
    const q = ($('#w-search').value || '').toLowerCase().trim();
    const tbody = $('#w-tbody'); if(!tbody) return; tbody.innerHTML = '';
    Words
      .filter(w => (lvl? w.level===lvl : true) && (!q || w.term.toLowerCase().includes(q) || w.def.toLowerCase().includes(q)))
      .forEach(w=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><b>${esc(w.term)}</b></td>
          <td><span class="pill">${w.level}</span></td>
          <td>${esc(w.def)}</td>
          <td class="right">
            <button class="ghost" data-act="edit" data-id="${w.id}">Editar</button>
            <button class="ghost" data-act="del" data-id="${w.id}" style="border-color:#ef4444;color:#ef9999">Excluir</button>
          </td>`;
        tbody.appendChild(tr);
      });
    tbody.querySelectorAll('button').forEach(b=> b.addEventListener('click', onWordAction));
  }
  function onWordAction(e){
    const id = e.currentTarget.getAttribute('data-id');
    const act = e.currentTarget.getAttribute('data-act');
    const ix = Words.findIndex(w=>w.id===id); if(ix<0) return;
    if(act==='del'){
      if(confirm('Excluir palavra?')){ Words.splice(ix,1); saveWords(Words); renderWords(); updateMenuKPIs(); }
    }else if(act==='edit'){
      const w = Words[ix];
      const term = prompt('Termo', w.term); if(term==null) return;
      const level = (prompt('Nível (A1–C2/NI)', w.level)||w.level).toUpperCase();
      const def = prompt('Descrição/definição', w.def)||w.def;
      Words[ix] = ensureSRS({...w, term, level, def, new:false});
      saveWords(Words); renderWords();
    }
  }

  // ---------- MENU KPIs ----------
  function updateMenuKPIs(){
    // palavras nível >= 1
    const countL1 = Words.filter(w=>{
      // usamos 'streak' ou 'new' como proxy: se já chegou a due alguma vez, consideramos >=1.
      // Para simplificação, considera "nível" como (streak>0 || !w.new)
      return (w.streak||0) > 0 || !w.new;
    }).length;
    $('#kpi-words-l1').textContent = String(countL1);

    if(Selecoes.length===0){
      $('#kpi-top-team').textContent = '—';
      $('#kpi-bottom-team').textContent = '—';
      return;
    }
    const scored = Selecoes.map(s => {
      const st = getTeamState(s.code);
      return { ...s, score: st.score };
    }).sort((a,b)=>b.score-a.score);

    const top = scored[0], bot = scored[scored.length-1];
    $('#kpi-top-team').innerHTML =
      `${flagImg(top)} <b>${top.name}</b> — ${top.score} pts <span class="stars">${renderStars(scoreToStars(top.score))}</span>`;
    $('#kpi-bottom-team').innerHTML =
      `${flagImg(bot)} <b>${bot.name}</b> — ${bot.score} pts <span class="stars">${renderStars(scoreToStars(bot.score))}</span>`;
  }

  // ---------- TEAMS VIEW ----------
  let currentTeam = null;
  function flagImg(s){ return s.flag ? `<img class="flag" src="${s.flag}" alt="${s.name}">` : ''; }
  function renderCountries(){
    const list = $('#country-list'); if(!list) return;
    list.innerHTML = '';
    Selecoes.forEach(s=>{
      const item = document.createElement('div');
      item.className = 'country-item';
      item.innerHTML = `${flagImg(s)}<span>${s.name}</span>`;
      item.addEventListener('click', ()=>{
        currentTeam = s;
        $$('.country-item').forEach(x=>x.classList.remove('active'));
        item.classList.add('active');
        renderTeamPanel();
      });
      list.appendChild(item);
    });
    if(!currentTeam && Selecoes[0]){
      currentTeam = Selecoes[0];
      setTimeout(()=> list.firstChild?.classList.add('active'), 0);
      renderTeamPanel();
    }
  }
  function renderTeamPanel(){
    if(!currentTeam) return;
    const heroFlag = $('#hero-flag'); if(heroFlag) heroFlag.src = currentTeam.flag || '';
    $('#hero-name').textContent = currentTeam.name;
    $('#hero-code').textContent = currentTeam.code;
    const st = getTeamState(currentTeam.code);
    $('#hero-score').textContent = st.score;
    $('#hero-stars').textContent = renderStars(scoreToStars(st.score));
    $('#hero-score-fill').style.width = `${(st.score/500)*100}%`;

    // medalhas por campeonato (a partir do histórico)
    const medals = computeMedalsForTeam(currentTeam.code);
    const tw = $('#trophies-wrap'); tw.innerHTML = '';
    Object.keys(medals).forEach(c=>{
      const {ouro=0, prata=0, bronze=0} = medals[c] || {};
      const chip = document.createElement('div');
      chip.className = 'trophy-chip';
      chip.innerHTML = `<strong>${c}</strong> <small>🥇 ${ouro}</small> <small>🥈 ${prata}</small> <small>🥉 ${bronze}</small>`;
      tw.appendChild(chip);
    });

    // atributos (soma = score)
    let attrs = st.attributes;
    const soma = Object.values(attrs).reduce((a,b)=>a+b,0);
    if (soma !== st.score){
      applyDeltaToAttributes(attrs, st.score - soma, currentTeam.code);
      setTeamState(currentTeam.code, {score:st.score, attributes:attrs});
    }
    const list = $('#attr-list'); list.innerHTML = '';
    const rows = [
      ['Ataque','ataque'],
      ['Meio Campo','meio'],
      ['Defesa','defesa'],
      ['Velocidade','velocidade'],
      ['Entrosamento','entrosamento'],
    ];
    rows.forEach(([label,key])=>{
      const v = clamp(attrs[key], 0, 500);
      const el = document.createElement('div');
      el.className = 'attr';
      el.innerHTML = `
        <div class="attr-head">
          <strong>${label}</strong>
          <span>${v} / 500</span>
        </div>
        <div class="attr-bar"><div class="attr-fill" style="width:${(v/500)*100}%"></div></div>
      `;
      list.appendChild(el);
    });
  }
  function computeMedalsForTeam(code){
    const hist = JSON.parse(localStorage.getItem('tournaments_history') || '[]');
    const out = {};
    hist.forEach(h=>{
      out[h.type] = out[h.type] || {ouro:0, prata:0, bronze:0};
      if (h.result?.champion === code) out[h.type].ouro++;
      else if (h.result?.runnerUp === code) out[h.type].prata++;
      else if (h.result?.third === code) out[h.type].bronze++;
    });
    // garante todas as chaves comuns
    ['CONCACAF','CONMEBOL','OFC','AFC','CAF','UEFA','Copa das Confederações','Copa do Mundo']
      .forEach(k => { out[k] = out[k] || {ouro:0, prata:0, bronze:0}; });
    return out;
  }

  // ---------- PLAY VIEW / TOURNAMENTS ----------
  const typesConfeds = ['CONCACAF','CONMEBOL','OFC','AFC','CAF','UEFA'];
  $('#btn-history')?.addEventListener('click', ()=> renderHistory(true));

  function renderPlayPanel(){
    // preencher combo de "Seu time"
    const sel = $('#cmp-userteam');
    if(sel && sel.options.length === 0){
      Selecoes.forEach(s=>{
        const o=document.createElement('option'); o.value=s.code; o.textContent=s.name; sel.appendChild(o);
      });
    }
    renderTournamentUI();
  }

  $('#btn-start-tournament')?.addEventListener('click', startTournament);
  $('#btn-start-match')?.addEventListener('click', startMatchFlow);
  $('#btn-finish-review')?.addEventListener('click', finishReviewAndSim);
  $('#btn-next')?.addEventListener('click', advanceAfterMatch);

  function startTournament(){
    const type = $('#cmp-type').value;
    const edition = +$('#cmp-edition').value || 1;
    const userTeam = $('#cmp-userteam').value || (Selecoes[0]?.code || '');

    // participantes
    const hist = JSON.parse(localStorage.getItem('tournaments_history') || '[]');
    let participants = [];
    let host = null;

    const byConf = (conf) => Selecoes.filter(s => (s.confed===conf)).map(s=>s.code);

    if (typesConfeds.includes(type)){
      participants = shuffle(byConf(type));
    } else if (type === 'Copa das Confederações'){
      const lastWC = [...hist].reverse().find(h=>h.type==='Copa do Mundo');
      const champ = lastWC ? lastWC.result?.champion : rndPick(Selecoes).code;
      do { host = rndPick(Selecoes).code; } while (host === champ);
      const confs = ['CONCACAF','CONMEBOL','OFC','AFC','CAF','UEFA'];
      const reps = confs.map(c=>{
        const pool = Selecoes.filter(s => s.confed===c && s.code!==host && s.code!==champ);
        if (pool.length === 0) return null;
        const best = pool.map(s=>({s, st:getTeamState(s.code)})).sort((a,b)=>b.st.score-a.st.score)[0];
        return best?.s.code ?? null;
      }).filter(Boolean);
      participants = shuffle([...new Set([host, champ, ...reps])]).slice(0,8);
    } else if (type === 'Copa do Mundo'){
      // host = o mesmo da Confederações desta edição (se existir)
      const confed = hist.find(h => h.type==='Copa das Confederações' && h.edition===edition);
      host = confed?.host ?? rndPick(Selecoes).code;
      const scored = Selecoes
        .map(s => ({ code:s.code, score:getTeamState(s.code).score }))
        .sort((a,b)=>b.score-a.score)
        .map(x=>x.code)
        .filter(code => code !== host);
      participants = [host, ...scored.slice(0,31)];
    }

    if (participants.length < 4){
      $('#cmp-feedback').textContent = 'Participantes insuficientes para este tipo/edição.';
      return;
    }

    // grupos
    let groupsCount = 4;
    if (participants.length <= 8) groupsCount = 2;
    if (participants.length >= 32) groupsCount = 8;
    const groups = makeGroups(participants, groupsCount);

    // calendário da fase de grupos
    const schedule = makeGroupSchedule(groups);

    const tor = {
      id: `${type}-${edition}`,
      type, edition, host,
      userTeam: userTeam,
      teams: participants,
      groups,
      schedule,
      stage: 'groups',
      playedIndex: 0,
      knockout: null,
      results: {}
    };
    localStorage.setItem('tournament_current', JSON.stringify(tor));
    $('#cmp-feedback').textContent = `Campeonato iniciado: ${type} (Edição ${edition})`;
    renderTournamentUI();
  }

  function renderTournamentUI(){
    const holder = $('#groups-wrap'); if(!holder) return;
    const tor = getCurrentTournament();
    if(!tor){ holder.innerHTML = '<span class="muted small">Nenhum campeonato em andamento.</span>'; $('#btn-start-match').disabled = true; $('#next-match').textContent=''; return; }

    // grupos
    holder.innerHTML = '';
    Object.keys(tor.groups).forEach(g=>{
      const el = document.createElement('div');
      el.className = 'group';
      el.innerHTML = `<h4>Grupo ${g}</h4>`;
      const ul = document.createElement('ul');
      tor.groups[g].forEach(code => {
        const s = Selecoes.find(x=>x.code===code); if(!s) return;
        const li = document.createElement('li'); li.innerHTML = `${flagImg(s)} ${s.name}`;
        ul.appendChild(li);
      });
      el.appendChild(ul);
      holder.appendChild(el);
    });

    // próxima partida
    const next = tor.schedule.find(m => !m.played);
    if (!next){
      // se terminou grupos, monta mata-mata ou finaliza
      if (tor.stage === 'groups'){
        buildKnockoutFromGroups(tor);
        localStorage.setItem('tournament_current', JSON.stringify(tor));
        return renderTournamentUI();
      } else if (tor.stage !== 'done'){
        const nx = tor.knockout.find(m=>!m.played);
        if (!nx){
          finalizeTournament(tor);
          renderHistory(true);
          return;
        }
        showNextMatch(nx, tor);
      }
      return;
    }
    showNextMatch(next, tor);
  }

  function showNextMatch(match, tor){
    const a = Selecoes.find(s=>s.code===match.home);
    const b = Selecoes.find(s=>s.code===match.away);
    $('#next-match').innerHTML =
      `<div class="versus">${flagImg(a)} <b>${a.name}</b> &nbsp;vs&nbsp; ${flagImg(b)} <b>${b.name}</b></div>`;
    $('#btn-start-match').disabled = false;
  }

  function startMatchFlow(){
    const tor = getCurrentTournament(); if(!tor) return;
    const match = currentMatchRef(tor);
    const userTeam = tor.userTeam;
    // lista de palavras
    const attrsUser = getTeamState(userTeam).attributes;
    const n = Math.max(1, Math.round(attrsUser.velocidade / 10));
    const pool = filterWordsByDifficulty(Words, attrsUser.entrosamento);
    const eligible = pool.filter(w => (w.streak||0)>0 || !w.new);
    const list = (eligible.length>=n ? eligible : Words).slice(0,n);
    // monta UI
    const wrap = $('#review-list'); wrap.innerHTML='';
    list.forEach(w=>{
      const div = document.createElement('div');
      div.className='review-item';
      div.innerHTML = `
        <div class="term">${esc(w.term)}</div>
        <div class="muted">${esc(w.def)}</div>
        <div style="margin-left:auto">
          <label><input type="radio" name="rv-${w.id}" value="ok"> Lembrei</label>
          &nbsp;&nbsp;
          <label><input type="radio" name="rv-${w.id}" value="no"> Não</label>
        </div>`;
      wrap.appendChild(div);
    });
    $('#panel-review').style.display='block';
    $('#panel-sim').style.display='none';
    $('#sim-log').textContent='';
  }

  function finishReviewAndSim(){
    const tor = getCurrentTournament(); if(!tor) return;
    const match = currentMatchRef(tor);
    // conta acertos
    let acertos = 0;
    $('#review-list').querySelectorAll('input[value="ok"]:checked').forEach(()=>acertos++);
    // aplica SRS: ok (grade 4), no (grade 2)
    $('#review-list').querySelectorAll('input[type="radio"]').forEach(inp=>{
      const [_, id] = inp.name.split('rv-');
      if(!id) return;
      const w = Words.find(x=>x.id===id); if(!w) return;
      const ok = document.querySelector(`input[name="${inp.name}"][value="ok"]`)?.checked;
      const no = document.querySelector(`input[name="${inp.name}"][value="no"]`)?.checked;
      if (ok) applySRS(w,4); else if(no) applySRS(w,2);
    });
    saveWords(Words);

    // simula
    const sim = simulateMatch(match.home, match.away, acertos, tor.userTeam);
    match.played = true;
    match.result = { gh: sim.gh, ga: sim.ga, timeline: sim.timeline };
    localStorage.setItem('tournament_current', JSON.stringify(tor));

    // UI sim
    const a = Selecoes.find(s=>s.code===match.home);
    const b = Selecoes.find(s=>s.code===match.away);
    const lines = [];
    lines.push(`Partida: ${a.name} ${sim.gh} x ${sim.ga} ${b.name}`);
    sim.timeline.forEach(ev=> lines.push(`${String(ev.min).padStart(2,'0')}': Gol de ${Selecoes.find(s=>s.code===ev.team)?.name}`));
    $('#sim-log').textContent = lines.join('\n');
    $('#panel-review').style.display='none';
    $('#panel-sim').style.display='block';
  }

  function advanceAfterMatch(){
    const tor = getCurrentTournament(); if(!tor) return;
    // avança índice atual (grupos ou mata-mata)
    if (tor.stage === 'groups'){
      renderTournamentUI();
    }else{
      // após cada jogo de mata-mata, se acabou a rodada, avança montagem da próxima
      const nx = tor.knockout.find(m=>!m.played);
      if(!nx){
        progressKnockout(tor);
        localStorage.setItem('tournament_current', JSON.stringify(tor));
      }
      renderTournamentUI();
    }
    $('#panel-sim').style.display='none';
  }

  function getCurrentTournament(){
    return JSON.parse(localStorage.getItem('tournament_current') || 'null');
  }
  function currentMatchRef(tor){
    if (tor.stage === 'groups'){
      return tor.schedule.find(m => !m.played);
    }else{
      return tor.knockout.find(m => !m.played);
    }
  }

  // grupos → mata-mata
  function buildKnockoutFromGroups(tor){
    // classifica grupos (3 pts vitória, 1 empate)
    const table = {};
    Object.keys(tor.groups).forEach(g=>{
      table[g] = tor.groups[g].map(code => ({ code, pts:0, gd:0, gf:0, ga:0 }));
    });
    tor.schedule.forEach(m=>{
      const tH = table[m.group].find(t=>t.code===m.home);
      const tA = table[m.group].find(t=>t.code===m.away);
      const {gh, ga} = m.result || {gh:0, ga:0};
      tH.gf+=gh; tH.ga+=ga; tH.gd += (gh-ga);
      tA.gf+=ga; tA.ga+=gh; tA.gd += (ga-gh);
      if (gh>ga){ tH.pts+=3; } else if (ga>gh){ tA.pts+=3; } else { tH.pts++; tA.pts++; }
    });
    Object.keys(table).forEach(g=>{
      table[g].sort((a,b)=> b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || (Math.random()-.5));
    });

    // define classificados (top 2 de cada grupo)
    const qualifiers = Object.keys(table).flatMap(g => table[g].slice(0,2).map(t=>({...t, group:g})));

    // pairing padrão A1xB2, B1xA2, C1xD2, D1xC2, ...
    const letters = Object.keys(tor.groups);
    const pairs = [];
    for(let i=0;i<letters.length;i+=2){
      const g1 = letters[i], g2 = letters[i+1];
      const A1 = qualifiers.find(q=>q.group===g1 && table[g1][0].code===q.code).code;
      const A2 = qualifiers.find(q=>q.group===g1 && table[g1][1].code===q.code).code;
      const B1 = qualifiers.find(q=>q.group===g2 && table[g2][0].code===q.code).code;
      const B2 = qualifiers.find(q=>q.group===g2 && table[g2][1].code===q.code).code;
      pairs.push({home:A1, away:B2, played:false, round:'oitavas'});
      pairs.push({home:B1, away:A2, played:false, round:'oitavas'});
    }

    tor.stage = pairs.length>=8 ? 'oitavas' : (pairs.length>=4 ? 'quartas' : 'semi');
    pairs.forEach(p=> p.round = tor.stage);
    tor.knockout = pairs;
    tor.results.table = table;
  }

  function progressKnockout(tor){
    const lastRound = tor.knockout[0]?.round || 'final';
    const winners = tor.knockout.filter(m=>m.round===lastRound).map(m=>{
      const {gh,ga} = m.result;
      if (gh>ga) return m.home;
      if (ga>gh) return m.away;
      // empate: pênaltis aleatório
      return Math.random() < 0.5 ? m.home : m.away;
    });

    if (lastRound==='final'){
      tor.stage = 'done';
      tor.results.champion = winners[0];
      return;
    }

    // monta próxima fase
    const next = [];
    for (let i=0;i<winners.length;i+=2){
      next.push({home:winners[i], away:winners[i+1], played:false, round: nextRound(lastRound) });
    }
    // 3º lugar se estiver indo para final
    if (next[0].round==='final'){
      const losers = tor.knockout.filter(m=>m.round===lastRound).map(m=>{
        const {gh,ga} = m.result;
        if (gh>ga) return m.away;
        if (ga>gh) return m.home;
        return Math.random() < 0.5 ? m.away : m.home;
      });
      tor.knockout = next.concat([{home:losers[0], away:losers[1], played:false, round:'terceiro'}]);
    }else{
      tor.knockout = next;
    }
    tor.stage = next[0].round;
  }
  function nextRound(r){ return r==='oitavas'?'quartas':(r==='quartas'?'semi':'final'); }

  function finalizeTournament(tor){
    // garante resultados finais
    const final = tor.knockout.find(m=>m.round==='final');
    const t3 = tor.knockout.find(m=>m.round==='terceiro');
    if (final && final.result){
      const {gh,ga} = final.result;
      tor.results.champion = gh>ga ? final.home : (ga>gh ? final.away : (Math.random()<0.5?final.home:final.away));
      tor.results.runnerUp = tor.results.champion === final.home ? final.away : final.home;
    }
    if (t3 && t3.result){
      const {gh,ga} = t3.result;
      tor.results.third = gh>ga ? t3.home : (ga>gh ? t3.away : (Math.random()<0.5?t3.home:t3.away));
      tor.results.fourth = tor.results.third === t3.home ? t3.away : t3.home;
    }

    // aplica prêmios de campeonatos.json
    applyPrizes(tor);

    // salva histórico
    const hist = JSON.parse(localStorage.getItem('tournaments_history') || '[]');
    hist.push({
      id: tor.id, type: tor.type, edition: tor.edition, host: tor.host, createdAt: new Date().toISOString(),
      result: { champion: tor.results.champion, runnerUp: tor.results.runnerUp, third: tor.results.third, fourth: tor.results.fourth }
    });
    localStorage.setItem('tournaments_history', JSON.stringify(hist));
    localStorage.removeItem('tournament_current');
    $('#cmp-feedback').textContent = `Torneio finalizado: ${tor.type} — Edição ${tor.edition}`;
    updateMenuKPIs(); renderTeamPanel();
  }

  function applyPrizes(tor){
    const rules = Campeonatos[tor.type] || {};
    const award = (code, key) => {
      const delta = Number(rules[key] || 0);
      const st = getTeamState(code);
      const old = st.score; const next = clamp(old + delta, 1, 500);
      applyDeltaToAttributes(st.attributes, next-old, code);
      st.score = next; setTeamState(code, st);
    };

    const everyone = new Set(tor.teams);
    const advanced = new Set();

    // winners podium
    if (tor.results.champion) { award(tor.results.champion, 'Premio 1'); advanced.add(tor.results.champion); }
    if (tor.results.runnerUp) { award(tor.results.runnerUp, 'Premio 2'); advanced.add(tor.results.runnerUp); }
    if (tor.results.third)    { award(tor.results.third, 'Premio 3'); advanced.add(tor.results.third); }
    if (tor.results.fourth)   { award(tor.results.fourth, 'Premio 4'); advanced.add(tor.results.fourth); }

    // losers by last round they reached
    const addLosers = (round, key) => {
      tor.knockout.filter(m=>m.round===round).forEach(m=>{
        const {gh,ga} = m.result || {gh:0,ga:0};
        const loser = gh>ga ? m.away : (ga>gh ? m.home : (Math.random()<0.5?m.away:m.home));
        if (!advanced.has(loser)) { award(loser, key); advanced.add(loser); }
      });
    };
    addLosers('quartas', 'Premio quartas');
    addLosers('oitavas', 'Premio oitavas');

    // who stayed in group stage
    tor.teams.forEach(code=>{
      if (!advanced.has(code)) award(code, 'Premio fase de grupos');
    });
  }

  function renderHistory(openPanel=false){
    const hist = JSON.parse(localStorage.getItem('tournaments_history') || '[]').sort((a,b)=> a.type.localeCompare(b.type) || a.edition - b.edition);
    const box = $('#history-list'); if(!box) return;
    if (hist.length===0){ box.innerHTML = '<span class="muted">Nenhum histórico salvo.</span>'; }
    else{
      box.innerHTML = hist.map(h=>{
        const host = h.host ? Selecoes.find(s=>s.code===h.host)?.name || h.host : '—';
        const p1 = Selecoes.find(s=>s.code===h.result?.champion)?.name || h.result?.champion || '—';
        const p2 = Selecoes.find(s=>s.code===h.result?.runnerUp)?.name || h.result?.runnerUp || '—';
        const p3 = Selecoes.find(s=>s.code===h.result?.third)?.name || h.result?.third || '—';
        const p4 = Selecoes.find(s=>s.code===h.result?.fourth)?.name || h.result?.fourth || '—';
        return `<div class="group">
          <h4>${h.type} — Edição ${h.edition}</h4>
          <div><b>Anfitrião:</b> ${host}</div>
          <div><b>1º:</b> ${p1} • <b>2º:</b> ${p2} • <b>3º:</b> ${p3} • <b>4º:</b> ${p4}</div>
        </div>`;
      }).join('');
    }
    if (openPanel){ $('#panel-history').style.display='block'; show('play'); }
  }

  // ---------- WORD SELECTION HELPERS ----------
  const LEVELS_ORDER = {A1:0,A2:1,B1:2,B2:3,C1:4,C2:5,NI:6};
  function levelCeilingFromEntrosamento(ent){
    const e = clamp(ent, 1, 500);
    if (e <= 100) return 'A1';
    if (e <= 170) return 'A2';
    if (e <= 240) return 'B1';
    if (e <= 310) return 'B2';
    if (e <= 380) return 'C1';
    if (e <= 450) return 'C2';
    return 'NI';
  }
  function filterWordsByDifficulty(words, entrosamento){
    const ceil = levelCeilingFromEntrosamento(entrosamento);
    return words.filter(w => LEVELS_ORDER[w.level ?? 'NI'] <= LEVELS_ORDER[ceil]);
  }

  // ---------- MATCH SIM ----------
  function simulateMatch(homeCode, awayCode, acertosUser, userTeam){
    const H = getTeamState(homeCode).attributes;
    const A = getTeamState(awayCode).attributes;
    const pGolH = clamp(H.ataque/10 + H.meio/20 + (userTeam===homeCode ? 1.5*acertosUser : 0), 0, 100);
    const pGolA = clamp(A.ataque/10 + A.meio/20 + (userTeam===awayCode ? 1.5*acertosUser : 0), 0, 100);
    const pDefH = clamp(H.defesa/10 + H.meio/10, 0, 100);
    const pDefA = clamp(A.defesa/10 + A.meio/10, 0, 100);

    let gh=0, ga=0; const timeline=[];
    for (let m=1; m<=90; m++){
      if (Math.random()*100 < pGolH){
        if (!(Math.random()*100 < pDefA)){ gh++; timeline.push({min:m, team:homeCode, type:'gol'}); }
      }
      if (Math.random()*100 < pGolA){
        if (!(Math.random()*100 < pDefH)){ ga++; timeline.push({min:m, team:awayCode, type:'gol'}); }
      }
    }
    return { gh, ga, timeline };
  }

  // ---------- SMALL HELPERS ----------
  const rndPick = arr => arr[Math.floor(Math.random()*arr.length)];
  const shuffle = a => a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
  function makeGroups(codes, groupsCount=4){
    const perGroup = Math.ceil(codes.length / groupsCount);
    const shuffled = shuffle(codes);
    const groups = {};
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for(let g=0; g<groupsCount; g++){
      groups[letters[g]] = shuffled.slice(g*perGroup, (g+1)*perGroup);
    }
    return groups;
  }
  function makeGroupSchedule(groups){
    const sched = [];
    for (const [g, teams] of Object.entries(groups)){
      for (let i=0;i<teams.length;i++){
        for (let j=i+1;j<teams.length;j++){
          sched.push({ group:g, home:teams[i], away:teams[j], played:false, result:null });
        }
      }
    }
    return sched;
  }
  function id(){ return crypto.randomUUID?.() || ('id_'+Math.random().toString(36).slice(2)); }
  function esc(s){ return (s||'').replace(/[&<>\"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }

  // ---------- BOOT ----------
  (async function init(){
    Selecoes = await loadSelecoes();
    Campeonatos = await loadCampeonatos();
    Words = loadWords();
    if (Words.length===0){ Words = await loadWordsFromFile(); saveWords(Words); }

    // tela menu (kpis) e times
    updateMenuKPIs();
    renderCountries();
    renderPlayPanel();
    renderWords();
  })();

})();
