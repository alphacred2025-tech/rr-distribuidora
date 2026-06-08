// ============================================================
// admin-core.js — RR Distribuidora — Compartilhado
// ============================================================

const SUPA_URL = 'https://tyqcapyezlamjffbjagl.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cWNhcHllemxhbWpmZmJqYWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDU5MTQsImV4cCI6MjA5NTQ4MTkxNH0.JGqb9LFloiQ3fx8RvlH2d3bms1rDld7iEcICuZGfyXs';

const db = supabase.createClient(SUPA_URL, SUPA_KEY);

let currentUser    = null;
let currentProfile = null;

const PAPEIS = { admin:'Administrador', vendedor:'Vendedor', logistica:'Logística', financeiro:'Financeiro', montador:'Montador', motoboy:'Motoboy' };
const STATUS  = { pendente:'Pendente', em_preparo:'Em preparo', saiu:'Saiu para entrega', entregue:'Entregue', cancelado:'Cancelado' };
const ROTAS   = { admin:'painel.html', vendedor:'comercial.html', logistica:'logistica.html', financeiro:'financeiro.html', montador:'logistica.html', motoboy:'logistica.html' };

// ── Auth ──────────────────────────────────────────────────────

async function requireAuth(papeisOk = null) {
  const { data: { session } } = await db.auth.getSession();
  if (!session) { location.href = 'index.html'; return null; }

  const { data: p } = await db.from('profiles').select('*').eq('id', session.user.id).single();
  if (!p || !p.ativo) { await db.auth.signOut(); location.href = 'index.html'; return null; }

  currentUser    = session.user;
  currentProfile = p;

  if (papeisOk && !papeisOk.includes(p.papel)) { location.href = ROTAS[p.papel] || 'index.html'; return null; }

  const q = id => document.getElementById(id);
  if (q('user-nome'))  q('user-nome').textContent  = p.nome;
  if (q('user-papel')) q('user-papel').textContent = PAPEIS[p.papel] || p.papel;

  document.querySelectorAll('[data-roles]').forEach(el => {
    el.style.display = el.dataset.roles.split(',').includes(p.papel) ? '' : 'none';
  });

  return p;
}

async function logout() {
  await db.auth.signOut();
  location.href = 'index.html';
}

// ── Formatação ────────────────────────────────────────────────

const fmtR$ = v => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v || 0);

function fmtData(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' });
}

function fmtHora(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
}

function fmtDataHora(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' }) + ' ' +
         dt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
}

function tempoAtras(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h/24)}d atrás`;
}

function badgeStatus(s) {
  return `<span class="badge badge--${s}">${STATUS[s] || s}</span>`;
}
function badgePapel(p) {
  return `<span class="badge badge--${p}">${PAPEIS[p] || p}</span>`;
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// ── Toast ─────────────────────────────────────────────────────

function toast(msg, tipo = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast--${tipo}`;
  el.innerHTML = `<span>${msg}</span>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast--show'));
  setTimeout(() => { el.classList.remove('toast--show'); setTimeout(() => el.remove(), 400); }, 3500);
}

// ── Beep ──────────────────────────────────────────────────────

function beepNovoPedido() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [440, 554, 659].forEach((freq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      const t = ctx.currentTime + i * .18;
      g.gain.setValueAtTime(.22, t);
      g.gain.exponentialRampToValueAtTime(.001, t + .35);
      o.start(t); o.stop(t + .35);
    });
  } catch(e) {}
}

// ── Modal ─────────────────────────────────────────────────────

function abrirModal(id) { document.getElementById(id)?.classList.add('modal-overlay--show'); }
function fecharModal(id) { document.getElementById(id)?.classList.remove('modal-overlay--show'); }

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('modal-overlay--show');
});

// ── Sidebar mobile ────────────────────────────────────────────

function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('sidebar--aberta');
  document.querySelector('.sidebar-overlay')?.classList.toggle('sidebar-overlay--show');
}

// ── Comanda ───────────────────────────────────────────────────

function gerarComanda(pedido, nomeVendedor, taxaEntrega) {
  const p     = pedido.forma_pagamento || '';
  const av    = p === 'avista'  ? 'X' : ' ';
  const ca    = p === 'cartao'  ? 'X' : ' ';
  const px    = p === 'pix'     ? 'X' : ' ';
  const cli   = pedido.clientes || {};
  const nome  = cli.nome      || '';
  const fone  = cli.telefone  || '';
  const end   = pedido.forma_entrega === 'entrega'
                  ? `${pedido.logradouro || ''}, ${pedido.numero_end || ''}`
                  : 'Retirada na loja';
  const bairro = pedido.forma_entrega === 'entrega' ? (pedido.bairro || '') : '—';
  const kilos  = (pedido.itens_pedido || [])
                  .map(i => `${i.cesta_nome}${i.quantidade > 1 ? ` x${i.quantidade}` : ''}`)
                  .join(', ') || '—';
  const taxa  = taxaEntrega ? fmtR$(Number(taxaEntrega)) : '';

  return `Distribuidora RR\n\nAvista(${av}) Cartão(${ca}) Pix(${px})\nVendedor: ${nomeVendedor || 'Site Online'}\nCliente: ${nome}\nTelefone: ${fone}\nEndereço: ${end}\nBairro: ${bairro}\nValor: ${fmtR$(pedido.total)}\nTaxa: ${taxa}\nTroco: \nKilos: ${kilos}\nObs: `;
}

// ── Sidebar HTML ──────────────────────────────────────────────

function renderSidebar(paginaAtiva) {
  const wrap = document.getElementById('sidebar-wrap');
  if (!wrap) return;
  wrap.innerHTML = `
  <aside class="sidebar">
    <div class="sidebar__logo">
      <img src="../assets/img/logo-white.svg" alt="RR">
      <div><div class="sidebar__logo-label">RR Distribuidora</div><div class="sidebar__logo-sub">Painel Interno</div></div>
    </div>
    <div class="sidebar__user">
      <div class="sidebar__user-nome" id="user-nome">Carregando…</div>
      <div class="sidebar__user-papel" id="user-papel">—</div>
    </div>
    <nav class="sidebar__nav">
      <div class="nav-section">Navegação</div>
      <a href="painel.html" class="nav-link ${paginaAtiva==='painel'?'nav-link--ativo':''}" data-roles="admin">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        Dashboard
      </a>
      <a href="pedidos.html" class="nav-link ${paginaAtiva==='pedidos'?'nav-link--ativo':''}" data-roles="admin,vendedor,logistica">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        Pedidos
        <span class="nav-badge" id="badge-pgto-pendente" style="display:none">0</span>
      </a>
      <a href="comercial.html" class="nav-link ${paginaAtiva==='comercial'?'nav-link--ativo':''}" data-roles="admin,vendedor">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        Comercial
      </a>
      <a href="logistica.html" class="nav-link ${paginaAtiva==='logistica'?'nav-link--ativo':''}" data-roles="admin,logistica,montador,motoboy">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
        Logística
        <span class="nav-badge" id="badge-pendentes" style="display:none">0</span>
      </a>
      <a href="financeiro.html" class="nav-link ${paginaAtiva==='financeiro'?'nav-link--ativo':''}" data-roles="admin,financeiro">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        Financeiro
      </a>
      <a href="estoque.html" class="nav-link ${paginaAtiva==='estoque'?'nav-link--ativo':''}" data-roles="admin,logistica">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        Estoque
        <span class="nav-badge" id="badge-estoque" style="display:none">!</span>
      </a>
      <a href="afiliados.html" class="nav-link ${paginaAtiva==='afiliados'?'nav-link--ativo':''}" data-roles="admin">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
        Afiliados
      </a>
      <a href="relatorios.html" class="nav-link ${paginaAtiva==='relatorios'?'nav-link--ativo':''}" data-roles="admin,financeiro">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
        Relatórios
      </a>
      <a href="config.html" class="nav-link ${paginaAtiva==='config'?'nav-link--ativo':''}" data-roles="admin">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        Configurações
      </a>
    </nav>
    <div class="sidebar__bottom">
      <button class="btn-logout" onclick="logout()">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        Sair
      </button>
    </div>
  </aside>
  <div class="sidebar-overlay" onclick="toggleSidebar()"></div>`;
}

// Atualiza badge de pendentes na sidebar
async function atualizarBadgePendentes() {
  const [
    { count: cEntregas },
    { count: cPgtoPendente },
  ] = await Promise.all([
    db.from('entregas').select('*', { count:'exact', head:true }).in('status', ['pendente','em_preparo']),
    db.from('pedidos').select('*', { count:'exact', head:true }).eq('status_pagamento', 'pendente'),
  ]);

  const badgeLog = document.getElementById('badge-pendentes');
  if (badgeLog) {
    if ((cEntregas || 0) > 0) { badgeLog.textContent = cEntregas; badgeLog.style.display = ''; }
    else badgeLog.style.display = 'none';
  }

  const badgePgto = document.getElementById('badge-pgto-pendente');
  if (badgePgto) {
    if ((cPgtoPendente || 0) > 0) { badgePgto.textContent = cPgtoPendente; badgePgto.style.display = ''; }
    else badgePgto.style.display = 'none';
  }
}

// Atualiza badge de estoque crítico na sidebar
function atualizarBadgeEstoque(count) {
  const badge = document.getElementById('badge-estoque');
  if (!badge) return;
  if (count > 0) { badge.textContent = count; badge.style.display = ''; }
  else badge.style.display = 'none';
}

async function verificarEstoqueCritico() {
  const { data } = await db.from('produtos').select('estoque_atual, estoque_minimo').eq('ativo', true);
  const count = (data || []).filter(p => p.estoque_atual <= p.estoque_minimo).length;
  atualizarBadgeEstoque(count);
}
