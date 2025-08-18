// HOME (Menu) — navegação por hash para os módulos
(function(){
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));

  // Cada card redireciona para uma rota hash:
  // #play, #selecoes, #palavras, #historico
  $$('.menu-card').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const t = btn.getAttribute('data-target');
      const routes = {
        play: '#play',
        selecoes: '#selecoes',
        palavras: '#palavras',
        historico: '#historico'
      };
      // Define a rota (os outros módulos vão "ouvir" isso depois)
      location.hash = routes[t] || '#';
    });
  });

  // Pequeno “prefetch” opcional para dar sensação de agilidade no clique:
  // se você já tiver arquivos separados (play.css/js etc.), pode habilitar:
  // prefetch('play.css'); prefetch('selecoes.css'); ...
  function prefetch(href){
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = href; document.head.appendChild(l);
  }

  // Ajuste de rolagem ao voltar para a home
  window.addEventListener('hashchange', ()=>{
    if(!location.hash || location.hash==='#'){ window.scrollTo({top:0, behavior:'smooth'}); }
  });
})();
