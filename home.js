// home.js – Estrutura base (tema futebol) + dados de exemplo + SRS palavras
(function(){
  // ----- Estado & helpers -----
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
      if(v==='menu') updateKPIs();
      if(v==='words') renderWords();
    });
  });

  // ----- MOCK: Times / Países -----
  const countries = [
    {
      code:'BR', flag:'🇧🇷', name:'Brasil',
      trophies:{ league:10, cup:6, continental:3, world:2, medals:8 },
      players:[
        {name:'Rafael Silva', pos:'GOL', age:28, overall:84},
        {name:'Carlos Lima', pos:'ZAG', age:31, overall:82},
        {name:'João Pedro', pos:'MEI', age:24, overall:85},
        {name:'Marcos Araújo', pos:'ATA', age:26, overall:88}
      ]
    },
    {
      code:'AR', flag:'🇦🇷', name:'Argentina',
      trophies:{ league:8, cup:5, continental:4, world:3, medals:5 },
      players:[
        {name:'Luciano Díaz', pos:'GOL', age:27, overall:83},
        {name:'S. Fernández', pos:'ZAG', age:29, overall:81},
        {name:'Tomás Ibarra', pos:'MEI', age:25, overall:86},
        {name:'E. Benítez', pos:'ATA', age:23, overall:87}
      ]
    },
    {
      code:'ES', flag:'🇪🇸', name:'Espanha',
      trophies:{ league:7, cup:6, continental:3, world:1, medals:7 },
      players:[
        {name:'Álvaro Ruiz', pos:'GOL', age:30, overall:82},
        {name:'P. Martín', pos:'ZAG', age:28, overall:84},
        {name:'Iñigo Soto', pos:'MEI', age:24, overall:85},
        {name:'D. Moreno', pos:'ATA', age:27, overall:86}
      ]
    }
  ];
  let currentCountry = null;

  // ----- MENU KPIs -----
  function updateKPIs(){
    const teams = countries.length;
    const players = countries.reduce((n,c)=> n + c.players.length, 0);
    const words = loadWords().length;
    $('#kpi-teams').textContent = teams;
    $('#kpi-players').textContent = players;
    $('#kpi-words').textContent = words;
  }
  updateKPIs();

  // ----- VIEW: PLAY (stub campeonatos) -----
  const cmpList = [];
  $('#cmp-criar')?.addEventListener('click', ()=>{
    const nome = $('#cmp-nome').value.trim() || 'Campeonato sem nome';
    const times = Math.max(2, Math.min(64, +$('#cmp-times').value||8));
    const formato = $('#cmp-formato').value;
    const novo = { id: crypto.randomUUID?.() || String(Date.now()), nome, times, formato, createdAt: new Date().toISOString() };
    cmpList.push(novo);
    $('#cmp-feedback').textContent = `Criado: ${nome} (${times} times • ${formato}).`;
    renderCmpList();
  });
  function renderCmpList(){
    const ul = $('#cmp-list'); ul.innerHTML = '';
    if(!cmpList.length){ ul.innerHTML = '<li class="muted">Nenhum campeonato salvo (stub).</li>'; return; }
    cmpList.forEach(c=>{
      const li = document.createElement('li');
      li.textContent = `${c.nome} — ${c.times} times • ${c.formato}`;
      ul.appendChild(li);
    });
  }
  renderCmpList();

  // ----- VIEW: TEAMS -----
  function renderCountries(){
    const list = $('#country-list');
    list.innerHTML = '';
    countries.forEach(c=>{
      const item = document.createElement('div');
      item.className = 'country-item';
      item.innerHTML = `<span>${c.flag}</span><span>${c.name}</span>`;
      item.addEventListener('click', ()=>{
        currentCountry = c;
        $$('.country-item').forEach(x=>x.classList.remove('active'));
        item.classList.add('active');
        renderTeamPanel();
      });
      list.appendChild(item);
    });
    if(!currentCountry && countries[0]){ // pré-seleciona
      currentCountry = countries[0];
      setTimeout(()=> list.firstChild?.classList.add('active'), 0);
      renderTeamPanel();
    }
  }

  function renderTeamPanel(){
    if(!currentCountry) return;
    $('#team-flag').textContent = currentCountry.flag;
    $('#team-name').textContent = currentCountry.name;
    $('#team-meta').textContent = `Código: ${currentCountry.code}`;

    const t = currentCountry.trophies || {};
    const row = $('#trophy-row'); row.innerHTML = '';
    const parts = [
      {icon:'🏆', label:'Liga', val:t.league||0},
      {icon:'🥇', label:'Copa', val:t.cup||0},
      {icon:'🌍', label:'Continental', val:t.continental||0},
      {icon:'🌎', label:'Mundial', val:t.world||0},
      {icon:'🎖️', label:'Medalhas', val:t.medals||0},
    ];
    parts.forEach(p=>{
      const div = document.createElement('div');
      div.className='trophy';
      div.innerHTML = `<span>${p.icon}</span><span>${p.label}</span><span class="count">${p.val}</span>`;
      row.appendChild(div);
    });

    renderPlayers();
  }

  $('#player-search')?.addEventListener('input', renderPlayers);
  function renderPlayers(){
    const q = ($('#player-search')?.value || '').toLowerCase().trim();
    const tbody = $('#player-tbody'); tbody.innerHTML = '';
    if(!currentCountry){ return; }
    currentCountry.players
      .filter(p => !q || p.name.toLowerCase().includes(q) || p.pos.toLowerCase().includes(q))
      .forEach(p=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${p.name}</td>
          <td>${p.pos}</td>
          <td>${p.age}</td>
          <td>${p.overall}</td>
        `;
        tbody.appendChild(tr);
      });
  }

  // ----- VIEW: WORDS + SRS -----
  const WORDS_KEY = 'estudos_words_bank_v1';
  function loadWords(){
    try{
      const raw = localStorage.getItem(WORDS_KEY);
      if(raw) return JSON.parse(raw).map(ensureSRS);
    }catch(e){}
    // seed inicial
    return [
      {id:id(), term:'although', level:'C1', def:'used to say something that contrasts with another'},
      {id:id(), term:'dog', level:'A1', def:'a common animal kept by people for pleasure or to guard places'},
      {id:id(), term:'accountability', level:'C2', def:'the fact of being responsible for your decisions or actions'},
    ].map(ensureSRS);
  }
  function saveWords(arr){ localStorage.setItem(WORDS_KEY, JSON.stringify(arr)); }
  let words = loadWords();

  function today(){ return new Date().toISOString().slice(0,10); }
  function ensureSRS(w){
    if(!w.ease) w.ease=2.5;
    if(!w.interval) w.interval=0;
    if(!w.streak) w.streak=0;
    if(!w.nextDue) w.nextDue=today();
    return w;
  }
  function isDue(w){ return !w.nextDue || w.nextDue <= today(); }

  function applySRS(w, grade){
    if(grade<3){
      w.streak=0;
      w.ease=Math.max(1.3, w.ease-0.2);
      w.interval=0.5;
    } else {
      w.streak++;
      w.ease=Math.min(3.0, w.ease+(grade===4?0.15:0.05));
      w.interval=w.interval<1?1:Math.round(w.interval*w.ease);
    }
    const next=new Date();
    next.setDate(next.getDate()+Math.max(1,Math.round(w.interval)));
    w.nextDue=next.toISOString().slice(0,10);
    saveWords(words);
  }

  $('#w-add').addEventListener('click', ()=>{
    const term = $('#w-term').value.trim();
    const level = $('#w-level').value;
    const def = $('#w-def').value.trim();
    if(!term || !def){ alert('Informe termo e descrição.'); return; }
    words.push(ensureSRS({id:id(), term, level, def}));
    saveWords(words);
    $('#w-term').value=''; $('#w-def').value='';
    renderWords();
    updateKPIs();
  });

  $('#w-export').addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(words,null,2)], {type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='words_export.json';
    a.click(); URL.revokeObjectURL(a.href);
  });

$('#w-import').addEventListener('change', async (e)=>{
  const f = e.target.files[0]; if(!f) return;
  try{
    const txt = await f.text();
    const arr = JSON.parse(txt);
    if(!Array.isArray(arr)) throw 0;
    // aceita vários formatos: {term}, {word}, {termo}
    const mapped = arr.map(x=>ensureSRS({
      id: id(),
      term: x.term || x.word || x.termo || '',
      level: (x.level || x.cefr || 'NI').toUpperCase(),
      def: x.def || x.descricao || x.description || x.definition || '',
      pos: x.pos || '',
      url: x.definition_url || '',
      audio: x.voice_url || ''
    })).filter(x=>x.term && x.def);
    words = words.concat(mapped);
    saveWords(words);
    renderWords();
    updateKPIs();
    alert(`Importados ${mapped.length} itens.`);
  }catch{ 
    alert('JSON inválido.'); 
  }
  e.target.value='';
});

  $('#w-filter-level').addEventListener('input', renderWords);
  $('#w-search').addEventListener('input', renderWords);

  function renderWords(){
    const lvl = $('#w-filter-level').value;
    const q = ($('#w-search').value || '').toLowerCase().trim();
    const tbody = $('#w-tbody'); tbody.innerHTML = '';
    words
      .filter(w => (lvl? w.level===lvl : true) && (!q || w.term.toLowerCase().includes(q) || w.def.toLowerCase().includes(q)))
      .forEach(w=>{
        const due = isDue(w) ? "Hoje" : w.nextDue;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><b>${esc(w.term)}</b></td>
          <td><span class="pill">${w.level}</span></td>
          <td>${esc(w.def)}</td>
          <td class="due">${due}</td>
          <td class="right">
            <button class="ghost" data-act="edit" data-id="${w.id}">Editar</button>
            <button class="ghost" data-act="del" data-id="${w.id}" style="border-color:#ef4444;color:#ef9999">Excluir</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

    tbody.querySelectorAll('button').forEach(b=> b.addEventListener('click', onWordAction));
  }

  function onWordAction(e){
    const id = e.currentTarget.getAttribute('data-id');
    const act = e.currentTarget.getAttribute('data-act');
    const ix = words.findIndex(w=>w.id===id); if(ix<0) return;
    if(act==='del'){
      if(confirm('Excluir palavra?')){ words.splice(ix,1); saveWords(words); renderWords(); updateKPIs(); }
    }else if(act==='edit'){
      const w = words[ix];
      const term = prompt('Termo', w.term); if(term==null) return;
      const level = (prompt('Nível (A1–C2/NI)', w.level)||w.level).toUpperCase();
      const def = prompt('Descrição/definição', w.def)||w.def;
      words[ix] = ensureSRS({...w, term, level, def});
      saveWords(words); renderWords();
    }
  }

  // ----- Utils -----
  function id(){ return crypto.randomUUID?.() || ('id_'+Math.random().toString(36).slice(2)); }
  function esc(s){ return (s||'').replace(/[&<>\"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }

  // Inicial
  show('menu');
  renderCountries();
  renderWords();

})();

