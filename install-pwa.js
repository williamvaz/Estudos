let deferredPrompt = null;

// cria banner simples
function createInstallBanner() {
  if (document.getElementById('pwa-install')) return;

  const bar = document.createElement('div');
  bar.id = 'pwa-install';
  bar.style.position = 'fixed';
  bar.style.left = '0';
  bar.style.right = '0';
  bar.style.bottom = '0';
  bar.style.zIndex = '9999';
  bar.style.display = 'flex';
  bar.style.gap = '12px';
  bar.style.alignItems = 'center';
  bar.style.justifyContent = 'space-between';
  bar.style.padding = '10px 14px';
  bar.style.borderTopLeftRadius = '10px';
  bar.style.borderTopRightRadius = '10px';
  bar.style.background = '#2b1b1b';
  bar.style.color = '#fff';
  bar.style.boxShadow = '0 -6px 16px rgba(0,0,0,.35)';
  bar.style.fontFamily = 'system-ui, sans-serif';

  const left = document.createElement('div');
  left.style.display = 'flex';
  left.style.alignItems = 'center';
  left.style.gap = '10px';
  left.innerHTML = `
    <img src="Icone.webp" alt="Ícone" width="28" height="28" style="border-radius:6px">
    <div>
      <div style="font-weight:600">Instalar Estudos Futebol</div>
      <div style="opacity:.8;font-size:12px">Use como app no seu S23</div>
    </div>
  `;

  const btn = document.createElement('button');
  btn.textContent = 'Instalar';
  btn.style.padding = '8px 14px';
  btn.style.border = 'none';
  btn.style.borderRadius = '12px';
  btn.style.fontWeight = '600';
  btn.style.cursor = 'pointer';
  btn.style.background = '#7a4d4d';
  btn.style.color = '#fff';

  const close = document.createElement('button');
  close.textContent = 'X';
  close.setAttribute('aria-label', 'Fechar');
  close.style.background = 'transparent';
  close.style.border = 'none';
  close.style.color = '#fff';
  close.style.fontSize = '16px';
  close.style.opacity = '.7';

  bar.appendChild(left);
  bar.appendChild(btn);
  bar.appendChild(close);
  document.body.appendChild(bar);

  btn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();               // abre o prompt nativo
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    bar.remove();                          // some após a escolha
  });

  close.addEventListener('click', () => bar.remove());
}

// só faz sentido no mobile
function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// captura o evento e mostra o banner
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (isMobile()) createInstallBanner();
});

// se já estiver instalado, não mostrar
window.addEventListener('appinstalled', () => {
  const bar = document.getElementById('pwa-install');
  if (bar) bar.remove();
});
