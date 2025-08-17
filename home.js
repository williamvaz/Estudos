// home.js — Lógica principal do simulador de estudos (A1–C2 + NI)
(function(){
  const KEY='estudos_words_v1';
  /** @type {Array<Word>} */
  let banco = load();
  let session = {mode:'flash', queue:[], idx:0, hits:0, miss:0};

  /**
   * @typedef {Object} Word
   * @property {string} id
   * @property {string} termo
   * @property {string} traducao
   * @property {string} level // A1..C2, NI
   * @property {string} exemplo
   * @property {string} notas
   * @property {number} ease // 1.3–3.0
   * @property {number} interval // em dias
   * @property {string} nextDue // ISO date (YYYY-MM-DD)
   * @property {number} streak // acertos seguidos
   * @property {'new'|'learning'|'review'} status
   */

  /* ---------- Util ---------- */
  const $=sel=>document.querySelector(sel);
  const el={
    badgeCount:$('#badge-count'), badgeDue:$('#badge-due'),
    tbody:$('#tbody-lista'),
    inp:{ termo:$('#inp-termo'), trad:$('#inp-trad'), level:$('#inp-level'), ex:$('#inp-ex'), notas:$('#inp-notas') },
    filter:{ level:$('#filter-level'), status:$('#filter-status'), search:$('#search') },
    export:$('#btn-export'), importer:$('#importer'), reset:$('#btn-reset'),
    tabs:$('#mode-tabs'), chkDue:$('#chk-only-due'), chkRand:$('#chk-rand'), newSession:$('#btn-new-session'),
    kpi:{hit:$('#kpi-hit'), miss:$('#kpi-miss'), sessions:$('#kpi-sessions'), ease:$('#kpi-ease')},
    flash:{card:$('#flash-card'), front:$('#flash-front'), back:$('#flash-back'), extra:$('#flash-extra'), hard:$('#btn-hard'), good:$('#btn-good'), easy:$('#btn-easy')},
    quiz:{q:$('#quiz-q'), opts:$('#quiz-opts')},
    dig:{q:$('#dig-q'), a:$('#dig-a'), check:$('#dig-check'), fb:$('#dig-feedback')},
    ui:{flash:$('#ui-flash'), quiz:$('#ui-quiz'), dig:$('#ui-dig')}
  };

  function today(){ return new Date().toISOString().slice(0,10); }
  function daysFromNow(d){
    const x=new Date();
    x.setDate(x.getDate()+d);
    return x.toISOString().slice(0,10);
  }
  function isDue(word){ return !word.nextDue || word.nextDue<=today(); }
  function save(){ localStorage.setItem(KEY, JSON.stringify(banco)); }
  function load(){
    try{
      const raw=localStorage.getItem(KEY);
      if(raw) return JSON.parse(raw);
    }catch(e){}
    // seed com 6 exemplos
    return [
      mk('although','embora','C1','Although it was late, he kept working.','Conjunção contrastiva'),
      mk('dog','cachorro','A1','The dog is friendly.',''),
      mk('accountability','responsabilização','C2','We value accountability.','política corporativa'),
      mk('sturdy','robusto','B2','A sturdy table.','sin.: solid'),
      mk('albeit','embora (formal)','C2','He was making progress, albeit slowly.','sin.: although'),
      mk('wholesome','saudável','B2','A wholesome meal.','')
    ];
  }
  function mk(termo,traducao,level='NI',exemplo='',notas=''){
    const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ('id_'+Math.random().toString(36).slice(2));
    return {id, termo, traducao, level, exemplo, notas, ease:2.5, interval:0, nextDue:today(), streak:0, status:'new'};
  }

  /* ---------- Render Lista ---------- */
  function render(){
    const q = (el.filter.search.value||'').toLowerCase().trim();
    const lvl = el.filter.level.value; const st = el.filter.status.value;
    const data = banco
      .filter(w =>
        (lvl? w.level===lvl : true) &&
        (st? (st==='due'? isDue(w) : w.status===st) : true) &&
        (!q || w.termo.toLowerCase().includes(q) || w.traducao.toLowerCase().includes(q) || (w.notas||'').toLowerCase().includes(q))
      )
      .sort((a,b)=> (a.nextDue||'').localeCompare(b.nextDue||''));

    el.tbody.innerHTML = data.map(w=>{
      const due=isDue(w); const dueTxt= w.nextDue ? w.nextDue : '—';
      return `<tr>
        <td><b>${esc(w.termo)}</b><div class="small muted">${esc(w.exemplo||'')}</div></td>
        <td>${esc(w.traducao)}</td>
        <td><span class="tag">${w.level}</span></td>
        <td>${tagStatus(w)}</td>
        <td class="due">${due? 'Hoje' : dueTxt}</td>
        <td class="right">
          <button data-act="now" data-id="${w.id}" class="ghost">Estudar</button>
          <button data-act="edit" data-id="${w.id}">Editar</button>
          <button data-act="del" data-id="${w.id}" style="color:#fca5a5;border-color:#fca5a5">Excluir</button>
        </td>
      </tr>`;
    }).join('');

    el.badgeCount.textContent = `${banco.length} itens`;
    el.badgeDue.textContent = `${banco.filter(isDue).length} devidos hoje`;

    // actions
    el.tbody.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',onListAction));

    // KPIs
    const avgEase = (banco.reduce((s,w)=>s+w.ease,0)/(banco.length||1)).toFixed(2);
    el.kpi.ease.textContent = avgEase;
  }
  function tagStatus(w){
    const map={new:'Novos', learning:'Aprendendo', review:'Revisão'}; const lbl=map[w.status]||w.status;
    return `<span class="tag">${lbl}</span> <span class="small muted">(${w.streak}✓)</span>`;
  }
  function esc(s){return (s||'').replace(/[&<>\"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}

  /* ---------- CRUD ---------- */
  $('#btn-add').addEventListener('click', ()=>{
    const t=el.inp.termo.value.trim(); const tr=el.inp.trad.value.trim();
    if(!t||!tr){alert('Informe termo e tradução'); return}
    banco.push(mk(t,tr,el.inp.level.value,el.inp.ex.value.trim(),el.inp.notas.value.trim()));
    save(); clearInputs(); render();
  });
  function clearInputs(){
    for(const k in el.inp){ el.inp[k].value = (k==='level'?'NI':''); }
  }

  function onListAction(ev){
    const id=ev.currentTarget.getAttribute('data-id'); const act=ev.currentTarget.getAttribute('data-act');
    const ix=banco.findIndex(w=>w.id===id); if(ix<0) return;
    if(act==='del'){
      if(confirm('Excluir item?')){ banco.splice(ix,1); save(); render(); }
    }
    if(act==='edit'){
      const w=banco[ix];
      const termo=prompt('Termo', w.termo); if(termo==null) return;
      const traducao=prompt('Tradução', w.traducao); if(traducao==null) return;
      const level=(prompt('Nível (A1–C2/NI)', w.level)||w.level).toUpperCase();
      const exemplo=prompt('Exemplo', w.exemplo||'')||'';
      const notas=prompt('Notas', w.notas||'')||'';
      banco[ix]={...w, termo, traducao, level, exemplo, notas}; save(); render();
    }
    if(act==='now'){
      startSession(session.mode, [banco[ix]]);
    }
  }

  /* ---------- Import/Export/Reset ---------- */
  el.export.addEventListener('click', ()=>{
    const blob=new Blob([JSON.stringify(banco,null,2)], {type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='estudos_export.json'; a.click(); URL.revokeObjectURL(a.href);
  });
  el.importer.addEventListener('change', async (e)=>{
    const file=e.target.files[0]; if(!file) return;
    const txt=await file.text();
    try{
      const arr=JSON.parse(txt); if(!Array.isArray(arr)) throw 0;
      const mapped=arr.map(x=> mk(
        x.termo||x.term||'',
        x.traducao||x.translation||'',
        (x.level||x.cefr||'NI').toUpperCase(),
        x.exemplo||x.example||'',
        x.notas||x.notes||''
      )).filter(w=>w.termo && w.traducao);
      banco=banco.concat(mapped); save(); render(); alert(`Importados ${mapped.length} itens.`);
    }catch{ alert('JSON inválido.'); }
    e.target.value='';
  });
  el.reset.addEventListener('click',()=>{ if(confirm('Apagar TODOS os dados?')){ banco=[]; save(); render(); }});

  /* ---------- Filtros ---------- */
  [el.filter.level, el.filter.status, el.filter.search].forEach(x=>x.addEventListener('input', render));

  /* ---------- Tabs de modo ---------- */
  el.tabs.addEventListener('click', (e)=>{
    const t=e.target.closest('.tab'); if(!t) return;
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    setMode(t.dataset.mode);
  });
  function setMode(m){ session.mode=m; showUI(m); }
  function showUI(m){
    el.ui.flash.classList.toggle('hidden', m!=='flash');
    el.ui.quiz.classList.toggle('hidden', m!=='quiz');
    el.ui.dig.classList.toggle('hidden', m!=='digitar');
  }

  /* ---------- Sessão ---------- */
  el.newSession.addEventListener('click', ()=>{
    const pool = banco.filter(w=> el.chkDue.checked ? isDue(w) : true);
    startSession(session.mode, pool);
  });

  function startSession(mode, pool){
    if(!pool.length){ alert('Sem itens no conjunto selecionado.'); return; }
    let q = [...pool];
    if(el.chkRand && el.chkRand.checked) q = shuffle(q);
    session.queue=q; session.idx=0; session.hits=0; session.miss=0;
    addSessionCount();
    if(mode==='flash') setupFlash();
    if(mode==='quiz') setupQuiz();
    if(mode==='digitar') setupDig();
    updateKPIs();
  }

  function updateKPIs(){ el.kpi.hit.textContent=session.hits; el.kpi.miss.textContent=session.miss; }
  function addSessionCount(){
    const k='estudos_sessions_count';
    const n=+(localStorage.getItem(k)||0)+1; localStorage.setItem(k,n);
    el.kpi.sessions.textContent=n;
  }

  /* ---------- Flashcards ---------- */
  let flipped=false; let current=null;
  function setupFlash(){
    nextFlash();
    el.flash.card.onclick=()=>flip();
    el.flash.hard.onclick=()=>grade(1);
    el.flash.good.onclick=()=>grade(3);
    el.flash.easy.onclick=()=>grade(4);
  }
  function nextFlash(){
    current=session.queue[session.idx%session.queue.length];
    renderFlash(current,false);
  }
  function renderFlash(w,show){
    flipped=!!show;
    el.flash.front.textContent=w.termo;
    el.flash.back.textContent= show? w.traducao : 'Clique para revelar';
    el.flash.extra.textContent = show? (w.exemplo||w.notas||'') : '';
  }
  function flip(){ if(!current) return; flipped=!flipped; renderFlash(current,flipped); }
  function grade(qual){
    if(!current) return;
    const ok = (qual>=3);
    if(ok) session.hits++; else session.miss++;
    applySRS(current, qual);
    session.idx++; if(session.idx>=session.queue.length) session.idx=0;
    save(); render(); updateKPIs(); nextFlash();
  }

  /* ---------- Quiz ---------- */
  function setupQuiz(){
    if(session.queue.length<2){ alert('Adicione mais itens para usar o quiz.'); return; }
    quizNext();
  }
  function quizNext(){
    current = session.queue[session.idx%session.queue.length];
    el.quiz.q.textContent=current.termo;
    const opts=makeQuizOptions(current); el.quiz.opts.innerHTML='';
    opts.forEach(txt=>{
      const b=document.createElement('button');
      b.textContent=txt;
      b.onclick=()=>quizPick(txt);
      el.quiz.opts.appendChild(b);
    });
  }
  function makeQuizOptions(correct){
    const pool = shuffle(banco.filter(w=>w.id!==correct.id)).slice(0,3).map(w=>w.traducao);
    const arr=[...pool, correct.traducao]; return shuffle(arr);
  }
  function quizPick(txt){
    const ok = (txt===current.traducao);
    applySRS(current, ok?3:1);
    if(ok) session.hits++; else session.miss++;
    session.idx++; save(); render(); updateKPIs(); quizNext();
  }

  /* ---------- Digitação ---------- */
  function setupDig(){ current = session.queue[0]; renderDig(current); }
  function renderDig(w){
    el.dig.q.textContent=w.termo;
    el.dig.a.value='';
    el.dig.fb.textContent='';
  }
  el.dig.check.addEventListener('click', ()=>{
    if(!current) return;
    const ans=el.dig.a.value.trim().toLowerCase();
    const target=current.traducao.trim().toLowerCase();
    const ok = ans===target;
    el.dig.fb.textContent = ok? '✔ Correto!' : `✘ Correto: ${current.traducao}`;
    if(ok) session.hits++; else session.miss++;
    applySRS(current, ok?3:1);
    session.idx++;
    current=session.queue[session.idx%session.queue.length];
    save(); render(); updateKPIs(); renderDig(current);
  });

  /* ---------- SRS (SM-2 lite) ---------- */
  function applySRS(w, grade){
    // grade: 1=hard/erro, 3=good, 4=easy
    const q=grade;
    if(q<3){
      w.streak=0;
      w.ease=Math.max(1.3, w.ease-0.2);
      w.interval = 0.5; // meia-diária ~ amanhã
    }else{
      w.streak=(w.streak||0)+1;
      w.ease = Math.min(3.0, w.ease + (q===4?0.15:0.05));
      if(w.interval<1) w.interval=1; else w.interval = Math.round(w.interval * w.ease);
    }
    const days = Math.max(1, Math.round(w.interval));
    w.nextDue = daysFromNow(days);
    w.status = w.streak===0? 'learning' : 'review';
  }

  /* ---------- Helpers ---------- */
  function shuffle(a){
    for(let i=a.length-1;i>0;i--){
      const j=Math.floor(Math.random()* (i+1));
      [a[i],a[j]]=[a[j],a[i]];
    }
    return a;
  }

  // Inicialização
  render();
  el.kpi.sessions.textContent = +(localStorage.getItem('estudos_sessions_count')||0);

})();
