// selecoes.js — Lista de Seleções (flag • nome • score) + score persistente
(() => {
  'use strict';

  // roda só se a tabela existir (garante que estamos na página certa)
  const table = document.getElementById('sel-table');
  if (!table) return;

  // ------- helpers -------
  const LKEY_STATE = 'team_state_v3';
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // slug para usar como id/clave no localStorage (baseado em Team)
  function slugify(str){
    return String(str)
      .normalize('NFD').replace(/\p{Diacritic}/gu,'')
      .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  }

  // estado persistente (score móvel)
  function loadState(){
    try { return JSON.parse(localStorage.getItem(LKEY_STATE) || '{}'); }
    catch { return {}; }
  }
  function saveState(m){ localStorage.setItem(LKEY_STATE, JSON.stringify(m)); }
  function ensureTeamState(state, code){
    if (!state[code]) state[code] = { score: 250 }; // inicial
    state[code].score = clamp(Number(state[code].score) || 250, 1, 9999);
  }

  // mapeia JSON {Tournament, Team, Path}
  function normalizeSelecoes(raw){
    return (raw || []).map(s => {
      const name = s.Team;
      return {
        code: slugify(name),      // ex.: "afeganistao"
        name,                     // "Afeganistão"
        flag: s.Path,             // "Flags/Afeganistão.jpg"
        tournament: s.Tournament  // "AFC", "UEFA", ...
      };
    }).filter(s => s.code && s.name);
  }

  // ------- render -------
  let DATA = [];
  let sortKey = 'name';
  let sortDir = 1; // 1 asc, -1 desc

  function composeRow(s){
    return `<tr data-code="${s.code}">
      <td><img class="flag" src="${s.flag}" alt="${s.name}" onerror="this.style.visibility='hidden'"></td>
      <td>${s.name}</td>
      <td class="right">${s.state.score}</td>
    </tr>`;
  }

  function renderTable(){
    const tbody = document.getElementById('sel-tbody');
    const k = sortKey, d = sortDir;
    const get = s => k === 'name'
      ? s.name.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()
      : s.state.score;

    tbody.innerHTML = [...DATA].sort((a,b)=>{
      const A=get(a), B=get(b);
      if (A < B) return -1*d;
      if (A > B) return  1*d;
      return 0;
    }).map(composeRow).join('');
  }

  function bindSort(){
    document.querySelectorAll('#sel-table thead th.sortable').forEach(th=>{
      th.addEventListener('click', ()=>{
        const key = th.getAttribute('data-sort');
        if (sortKey === key) sortDir *= -1; else { sortKey = key; sortDir = 1; }
        document.querySelectorAll('#sel-table thead th.sortable')
          .forEach(x=>x.classList.remove('asc','desc'));
        th.classList.add(sortDir===1 ? 'asc' : 'desc');
        renderTable();
      });
    });
  }

  function showErr(msg){
    const el = document.getElementById('erro');
    if (!el) return;
    el.textContent = msg;
    el.style.display = '';
  }
  function clearErr(){
    const el = document.getElementById('erro');
    if (!el) return;
    el.style.display = 'none';
  }

  // ------- boot -------
  (async function init(){
    bindSort();
    clearErr();

    // 1) pega JSON
    let selecoes = [];
    try {
      const r = await fetch('Selecoes.json', { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const raw = await r.json();
      selecoes = normalizeSelecoes(raw);
    } catch (e) {
      console.error('Falha ao carregar Selecoes.json', e);
      showErr('Não consegui carregar Selecoes.json. Verifique o arquivo ao lado da página.');
      return;
    }

    // 2) mescla com localStorage (score móvel)
    const state = loadState();
    selecoes.forEach(s => ensureTeamState(state, s.code));
    saveState(state);

    // 3) junta dados e renderiza
    DATA = selecoes.map(s => ({ ...s, state: state[s.code] }));
    renderTable();
  })();
})();
