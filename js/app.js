// ============================================================
// app.js — RR Distribuidora
// Lógica específica por página + utilitários compartilhados
// ============================================================

// ─── Utilitários ────────────────────────────────────────────

function gerarNumeroPedido() {
  const base = Date.now().toString().slice(-6);
  return 'RR' + base;
}

function formatarCPF(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

function formatarTelefone(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{4})$/, '$1-$2')
    .slice(0, 15);
}

function formatarCEP(value) {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
}

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf[10]);
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function mostrarErro(campo, mensagem) {
  const grupo = campo.closest('.form-group');
  if (!grupo) return;
  grupo.classList.add('erro');
  let msg = grupo.querySelector('.erro-msg');
  if (!msg) {
    msg = document.createElement('span');
    msg.className = 'erro-msg';
    grupo.appendChild(msg);
  }
  msg.textContent = mensagem;
}

function limparErro(campo) {
  const grupo = campo.closest('.form-group');
  if (!grupo) return;
  grupo.classList.remove('erro');
  const msg = grupo.querySelector('.erro-msg');
  if (msg) msg.remove();
}

// ─── Busca CEP (ViaCEP) ─────────────────────────────────────

async function buscarCEP(cep) {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await res.json();
    if (data.erro) return null;
    return data;
  } catch (e) {
    console.error('Erro ao buscar CEP:', e);
    return null;
  }
}

// ─── Construtor de mensagem WhatsApp ────────────────────────

function construirMensagemWhatsApp(pedido) {
  const itens = pedido.carrinho.map(item => {
    const itensNomes = (item.itens || []).join(', ');
    return `• ${item.nome} (${item.quantidade}x) — ${formatarPreco(item.preco * item.quantidade)}\n  Itens: ${itensNomes}`;
  }).join('\n');

  const entrega = pedido.tipoEntrega === 'entrega'
    ? `Entrega em: ${pedido.endereco.logradouro}, ${pedido.endereco.numero}${pedido.endereco.complemento ? ' / ' + pedido.endereco.complemento : ''} — CEP ${pedido.endereco.cep} — ${pedido.endereco.bairro}, ${pedido.endereco.cidade}/${pedido.endereco.uf}`
    : 'Retirada na loja';

  const msg = [
    `Olá! Acabei de realizar o pedido *#${pedido.numero}* na RR Distribuidora. 🛒`,
    ``,
    `*Pedido:*`,
    itens,
    ``,
    `*Total:* ${formatarPreco(pedido.total)}`,
    `*Pagamento:* ${pedido.pagamento === 'pix' ? 'PIX' : 'Cartão de Crédito'}`,
    ``,
    `*${entrega}*`,
    ``,
    `*Cliente:* ${pedido.cliente.nome}`,
    `*Telefone:* ${pedido.cliente.telefone}`,
  ].join('\n');

  return msg;
}

// ─── INDEX — renderiza grid de produtos ─────────────────────

function renderProducts(categoria) {
  const grid = document.getElementById('produtos-grid');
  if (!grid) return;

  const cat = categoria || 'simples';
  const cestas = getCestasByCategoria(cat);

  grid.innerHTML = cestas.map(cesta => {
    const badge = cesta.peso ? cesta.peso : '🎁 Especial';
    const icone = cat === 'completa' ? '⭐' : cat === 'especial' ? '🎁' : '🧺';
    return `
      <div class="produto-card" data-id="${cesta.id}">
        <div class="produto-card__badge">${badge}</div>
        <div class="produto-card__img">
          <img
            src="assets/img/cesta-real.png"
            alt="${cesta.nome}"
            class="produto-card__foto"
            onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
          >
          <div class="produto-card__img-fallback" style="display:none">${icone}</div>
        </div>
        <div class="produto-card__body">
          <h3 class="produto-card__nome">${cesta.nome}</h3>
          <p class="produto-card__desc">${cesta.descricao}</p>
          <div class="produto-card__preco">${formatarPreco(cesta.preco)}</div>
          <a href="produto.html?id=${cesta.id}" class="btn btn--primary produto-card__btn">
            Personalizar
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('tab-btn--ativo'));
      btn.classList.add('tab-btn--ativo');
      renderProducts(btn.dataset.cat);
    });
  });
}

// ─── PRODUTO — página de personalização ─────────────────────

function initProduto() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  const cesta = getCestaById(id);

  if (!cesta) {
    document.getElementById('produto-conteudo').innerHTML = `
      <div class="empty-state">
        <p>Produto não encontrado.</p>
        <a href="index.html" class="btn btn--primary">Voltar para a loja</a>
      </div>`;
    return;
  }

  // Preenche dados do produto
  document.getElementById('produto-nome').textContent = cesta.nome;
  document.getElementById('produto-peso').textContent = cesta.peso || '—';
  document.getElementById('produto-preco').textContent = formatarPreco(cesta.preco);
  document.getElementById('produto-descricao').textContent = cesta.descricao;
  document.title = `${cesta.nome} — RR Distribuidora`;

  const itensPre = getItensParaCesta(cesta.id);
  const lista = document.getElementById('itens-lista');

  // Agrupa itens por categoria
  const categorias = { alimento: 'Alimentos', limpeza: 'Limpeza', higiene: 'Higiene' };
  const grupos = {};
  ITENS_DISPONIVEIS.forEach(item => {
    if (!grupos[item.categoria]) grupos[item.categoria] = [];
    grupos[item.categoria].push(item);
  });

  let html = '';
  Object.entries(grupos).forEach(([cat, itens]) => {
    html += `<div class="itens-grupo"><h4 class="itens-grupo__titulo">${categorias[cat]}</h4><div class="itens-grupo__lista">`;
    itens.forEach(item => {
      const checked = itensPre.includes(item.id) ? 'checked' : '';
      html += `
        <label class="item-checkbox ${checked ? 'item-checkbox--checked' : ''}">
          <input type="checkbox" name="item" value="${item.id}" data-nome="${item.nome}" ${checked}>
          <span class="item-checkbox__box"></span>
          <span class="item-checkbox__nome">${item.nome}</span>
        </label>`;
    });
    html += `</div></div>`;
  });
  lista.innerHTML = html;

  // Atualiza visual dos checkboxes ao clicar
  lista.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', function () {
      this.closest('.item-checkbox').classList.toggle('item-checkbox--checked', this.checked);
    });
  });

  // Controle de quantidade
  const qtyInput = document.getElementById('quantidade');
  document.getElementById('qty-minus').addEventListener('click', () => {
    const v = parseInt(qtyInput.value);
    if (v > 1) qtyInput.value = v - 1;
  });
  document.getElementById('qty-plus').addEventListener('click', () => {
    const v = parseInt(qtyInput.value);
    if (v < 10) qtyInput.value = v + 1;
  });

  // Adicionar ao carrinho
  document.getElementById('btn-adicionar').addEventListener('click', () => {
    const selecionados = Array.from(lista.querySelectorAll('input[type=checkbox]:checked'))
      .map(cb => cb.dataset.nome);

    if (selecionados.length === 0) {
      alert('Por favor, selecione pelo menos um item para a sua cesta.');
      return;
    }

    const qty = parseInt(qtyInput.value) || 1;
    addToCart(cesta, selecionados, qty);

    // Feedback visual
    const btn = document.getElementById('btn-adicionar');
    const origHTML = btn.innerHTML;
    btn.textContent = '✓ Adicionado!';
    btn.classList.add('btn--sucesso');
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = origHTML;
      btn.classList.remove('btn--sucesso');
      btn.disabled = false;
    }, 2000);
  });

  document.getElementById('btn-ir-carrinho').addEventListener('click', () => {
    const selecionados = Array.from(lista.querySelectorAll('input[type=checkbox]:checked'))
      .map(cb => cb.dataset.nome);
    const qty = parseInt(qtyInput.value) || 1;
    if (selecionados.length > 0) addToCart(cesta, selecionados, qty);
    window.location.href = 'carrinho.html';
  });
}

// ─── CARRINHO — renderiza lista ─────────────────────────────

function renderCart() {
  const cart = getCart();
  const container = document.getElementById('carrinho-lista');
  const emptyMsg = document.getElementById('carrinho-vazio');
  const cartConteudo = document.getElementById('carrinho-conteudo');

  if (!container) return;

  if (cart.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'flex';
    if (cartConteudo) cartConteudo.style.display = 'none';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';
  if (cartConteudo) cartConteudo.style.display = 'block';

  container.innerHTML = cart.map((item, index) => `
    <div class="carrinho-item" data-index="${index}">
      <div class="carrinho-item__info">
        <h3 class="carrinho-item__nome">${item.nome}</h3>
        <p class="carrinho-item__peso">Peso: ${item.peso || '—'}</p>
        <div class="carrinho-item__itens">
          <span class="carrinho-item__itens-label">Itens selecionados:</span>
          <span class="carrinho-item__itens-lista">${(item.itens || []).join(', ')}</span>
        </div>
      </div>
      <div class="carrinho-item__acoes">
        <div class="qty-control">
          <button class="qty-btn" onclick="alterarQtd(${index}, -1)">−</button>
          <span class="qty-valor">${item.quantidade}</span>
          <button class="qty-btn" onclick="alterarQtd(${index}, 1)">+</button>
        </div>
        <div class="carrinho-item__preco">${formatarPreco(item.preco * item.quantidade)}</div>
        <button class="btn-remover" onclick="removerItem(${index})" title="Remover item">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  atualizarTotal();
}

function alterarQtd(index, delta) {
  const cart = getCart();
  if (!cart[index]) return;
  const novaQtd = cart[index].quantidade + delta;
  if (novaQtd < 1) return;
  updateQuantidade(index, novaQtd);
  renderCart();
}

function removerItem(index) {
  removeFromCart(index);
  renderCart();
}

function atualizarTotal() {
  const totalEl = document.getElementById('carrinho-total');
  if (totalEl) totalEl.textContent = formatarPreco(getTotal());
}

// ─── CHECKOUT ────────────────────────────────────────────────

function initCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    window.location.href = 'index.html';
    return;
  }

  renderResumoCheckout();

  // Máscaras
  const cpfInput = document.getElementById('cpf');
  const telInput = document.getElementById('telefone');
  const cepInput = document.getElementById('cep');

  if (cpfInput) cpfInput.addEventListener('input', e => { e.target.value = formatarCPF(e.target.value); limparErro(e.target); });
  if (telInput) telInput.addEventListener('input', e => { e.target.value = formatarTelefone(e.target.value); limparErro(e.target); });
  if (cepInput) {
    cepInput.addEventListener('input', e => { e.target.value = formatarCEP(e.target.value); limparErro(e.target); });
    cepInput.addEventListener('blur', async e => {
      const cep = e.target.value;
      if (cep.replace(/\D/g, '').length === 8) {
        const loadingEl = document.getElementById('cep-loading');
        if (loadingEl) loadingEl.style.display = 'inline';
        const dados = await buscarCEP(cep);
        if (loadingEl) loadingEl.style.display = 'none';
        if (dados) {
          preencherEndereco(dados);
          limparErro(e.target);
        } else {
          mostrarErro(e.target, 'CEP não encontrado. Verifique e tente novamente.');
        }
      }
    });
  }

  // Entrega/Retirada toggle
  const radioEntrega = document.querySelectorAll('input[name="tipoEntrega"]');
  radioEntrega.forEach(r => r.addEventListener('change', toggleEntrega));
  toggleEntrega();

  // Submit
  const form = document.getElementById('form-checkout');
  if (form) form.addEventListener('submit', submitCheckout);
}

function preencherEndereco(dados) {
  const campos = {
    logradouro: document.getElementById('logradouro'),
    bairro:     document.getElementById('bairro'),
    cidade:     document.getElementById('cidade'),
    uf:         document.getElementById('uf'),
  };
  if (campos.logradouro) campos.logradouro.value = dados.logradouro || '';
  if (campos.bairro)     campos.bairro.value     = dados.bairro     || '';
  if (campos.cidade)     campos.cidade.value     = dados.localidade || '';
  if (campos.uf)         campos.uf.value         = dados.uf         || '';

  const numeroInput = document.getElementById('numero');
  if (numeroInput) numeroInput.focus();

  // Calcula taxa de entrega pelo bairro/cidade
  calcularFrete(dados.bairro || '', dados.localidade || '');
}

let _taxasEntrega = null;

async function calcularFrete(bairro, cidade) {
  const freteEl = document.getElementById('frete-info');
  if (!freteEl) return;

  if (!_taxasEntrega) {
    try {
      const res = await fetch('/api/taxas-entrega');
      const { taxas } = await res.json();
      _taxasEntrega = taxas || [];
    } catch (e) { _taxasEntrega = []; }
  }

  const bairroNorm = (bairro || '').toLowerCase().trim();
  const cidadeNorm = (cidade  || '').toLowerCase().trim();

  const encontrado = _taxasEntrega.find(t =>
    t.bairro.toLowerCase().trim() === bairroNorm ||
    (t.municipio && t.municipio.toLowerCase().trim() === cidadeNorm && !_taxasEntrega.some(x => x.bairro.toLowerCase().trim() === bairroNorm))
  );

  const freteTxt  = document.getElementById('frete-valor');
  const freteHide = document.getElementById('frete-aviso');

  if (encontrado) {
    const taxa = parseFloat(encontrado.taxa) || 0;
    window._taxaEntregaAtual = taxa;
    if (freteTxt) freteTxt.textContent = taxa === 0 ? 'Grátis' : 'R$ ' + taxa.toFixed(2).replace('.', ',');
    if (freteHide) freteHide.style.display = 'none';
    freteEl.style.display = '';
  } else {
    window._taxaEntregaAtual = 0;
    if (freteTxt) freteTxt.textContent = 'Consultar';
    if (freteHide) freteHide.style.display = '';
    freteEl.style.display = '';
  }
}

function toggleEntrega() {
  const tipo = document.querySelector('input[name="tipoEntrega"]:checked')?.value;
  const secaoEntrega = document.getElementById('secao-entrega');
  if (secaoEntrega) {
    secaoEntrega.style.display = tipo === 'entrega' ? 'block' : 'none';
    const inputs = secaoEntrega.querySelectorAll('input, select');
    inputs.forEach(i => i.required = (tipo === 'entrega'));
  }
}

function renderResumoCheckout() {
  const cart = getCart();
  const container = document.getElementById('resumo-itens');
  if (!container) return;

  container.innerHTML = cart.map(item => `
    <div class="resumo-item">
      <span class="resumo-item__nome">${item.nome} × ${item.quantidade}</span>
      <span class="resumo-item__preco">${formatarPreco(item.preco * item.quantidade)}</span>
    </div>
  `).join('');

  const totalEl = document.getElementById('resumo-total');
  if (totalEl) totalEl.textContent = formatarPreco(getTotal());
}

function submitCheckout(e) {
  e.preventDefault();
  let valido = true;

  const nome = document.getElementById('nome');
  const cpf = document.getElementById('cpf');
  const tel = document.getElementById('telefone');
  const email = document.getElementById('email');

  if (!nome.value.trim() || nome.value.trim().length < 3) {
    mostrarErro(nome, 'Informe seu nome completo.'); valido = false;
  } else limparErro(nome);

  if (!validarCPF(cpf.value)) {
    mostrarErro(cpf, 'CPF inválido.'); valido = false;
  } else limparErro(cpf);

  if (tel.value.replace(/\D/g, '').length < 10) {
    mostrarErro(tel, 'Telefone inválido.'); valido = false;
  } else limparErro(tel);

  if (!validarEmail(email.value)) {
    mostrarErro(email, 'E-mail inválido.'); valido = false;
  } else limparErro(email);

  const tipo = document.querySelector('input[name="tipoEntrega"]:checked')?.value;
  if (tipo === 'entrega') {
    const cep = document.getElementById('cep');
    const numero = document.getElementById('numero');
    if (cep.value.replace(/\D/g, '').length !== 8) {
      mostrarErro(cep, 'CEP inválido.'); valido = false;
    } else limparErro(cep);
    if (!numero.value.trim()) {
      mostrarErro(numero, 'Informe o número.'); valido = false;
    } else limparErro(numero);
  }

  if (!valido) return;

  // Salva dados do pedido
  const pedido = {
    numero: gerarNumeroPedido(),
    cliente: {
      nome: nome.value.trim(),
      cpf: cpf.value,
      telefone: tel.value,
      email: email.value.trim(),
    },
    tipoEntrega: tipo,
    endereco: tipo === 'entrega' ? {
      cep: document.getElementById('cep').value,
      logradouro: document.getElementById('logradouro').value,
      numero: document.getElementById('numero').value,
      complemento: document.getElementById('complemento')?.value || '',
      bairro: document.getElementById('bairro').value,
      cidade: document.getElementById('cidade').value,
      uf: document.getElementById('uf').value,
    } : {},
    carrinho: getCart(),
    taxaEntrega: tipo === 'entrega' ? (window._taxaEntregaAtual || 0) : 0,
    total: getTotal() + (tipo === 'entrega' ? (window._taxaEntregaAtual || 0) : 0),
    pagamento: null,
  };

  localStorage.setItem('rr_pedido', JSON.stringify(pedido));
  window.location.href = 'pagamento.html';
}

// ─── PAGAMENTO ───────────────────────────────────────────────

function initPagamento() {
  const pedido = JSON.parse(localStorage.getItem('rr_pedido') || 'null');
  if (!pedido || !pedido.carrinho || pedido.carrinho.length === 0) {
    window.location.href = 'index.html';
    return;
  }

  // Preenche resumo lateral e header
  const resumoEl = document.getElementById('pagamento-resumo');
  if (resumoEl) {
    resumoEl.innerHTML = pedido.carrinho.map(item => `
      <div class="resumo-item">
        <span>${item.nome} × ${item.quantidade}</span>
        <span>${formatarPreco(item.preco * item.quantidade)}</span>
      </div>
    `).join('') + `<div class="resumo-total-linha"><strong>Total</strong><strong>${formatarPreco(pedido.total)}</strong></div>`;
  }

  document.getElementById('pagamento-numero-pedido').textContent = pedido.numero;
  document.getElementById('pagamento-total').textContent = formatarPreco(pedido.total);

  const totalEl = document.getElementById('mp-total-valor');
  if (totalEl) totalEl.textContent = formatarPreco(pedido.total);

  // Botão Mercado Pago (Checkout Pro)
  const btnMP = document.getElementById('btn-pagar-mp');
  if (btnMP) {
    btnMP.addEventListener('click', async () => {
      const erroEl = document.getElementById('mp-erro');
      btnMP.disabled = true;
      btnMP.textContent = 'Aguarde…';
      if (erroEl) erroEl.style.display = 'none';
      try {
        const res  = await fetch('/api/create-preference', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(pedido),
        });
        const data = await res.json();
        if (!res.ok || !data.init_point) throw new Error(data.error || 'Erro ao criar sessão');
        pedido.pagamento = 'mercadopago';
        localStorage.setItem('rr_pedido', JSON.stringify(pedido));

        // Salva pedido ANTES de redirecionar ao MP
        // → pedidos com PIX gerado mas não pago ficam visíveis no admin
        if (typeof salvarPedido === 'function' && !pedido.savedToDb) {
          const savedId = await salvarPedido(pedido);
          if (savedId) {
            pedido.savedToDb = true;
            localStorage.setItem('rr_pedido', JSON.stringify(pedido));
          }
        }

        window.location.href = data.init_point;
      } catch (err) {
        btnMP.disabled = false;
        btnMP.innerHTML = 'Pagar <span id="mp-total-valor">' + formatarPreco(pedido.total) + '</span> →';
        if (erroEl) { erroEl.textContent = err.message; erroEl.style.display = ''; }
      }
    });
  }
}

function detectarBandeira(numero) {
  const bandeiras = {
    visa:       /^4/,
    mastercard: /^5[1-5]|^2[2-7]/,
    amex:       /^3[47]/,
    elo:        /^4011|^4312|^4389|^4514|^4576|^5041|^5067|^509/,
    hipercard:  /^6062/,
  };
  const icone = document.getElementById('bandeira-icone');
  if (!icone) return;
  let encontrada = '';
  for (const [band, regex] of Object.entries(bandeiras)) {
    if (regex.test(numero)) { encontrada = band; break; }
  }
  icone.className = 'bandeira-icone ' + (encontrada ? 'bandeira-' + encontrada : '');
  icone.textContent = encontrada ? encontrada.charAt(0).toUpperCase() + encontrada.slice(1) : '';
}

// ─── CONFIRMAÇÃO ─────────────────────────────────────────────

function _labelPagamento(metodo) {
  const labels = {
    pix:           'PIX',
    credit_card:   'Cartão de Crédito',
    debit_card:    'Cartão de Débito',
    bolbradesco:   'Boleto Bancário',
    pec:           'Boleto Bancário',
    account_money: 'Saldo Mercado Pago',
    mercadopago:   'Mercado Pago',
    cartao:        'Cartão de Crédito',
  };
  return labels[metodo] || 'Mercado Pago';
}

function initConfirmacao() {
  const pedido = JSON.parse(localStorage.getItem('rr_pedido') || 'null');
  if (!pedido) { window.location.href = 'index.html'; return; }

  // Detecta retorno do Mercado Pago (parâmetros na URL)
  const params        = new URLSearchParams(location.search);
  const mpPaymentId   = params.get('payment_id');
  const mpStatus      = params.get('status');
  const mpPaymentType = params.get('payment_type');

  if (mpPaymentId) {
    pedido.mpPaymentId = mpPaymentId;
    pedido.mpStatus    = mpStatus;
    if (mpPaymentType) pedido.pagamento = mpPaymentType;
    else if (!pedido.pagamento || pedido.pagamento === 'mercadopago') pedido.pagamento = 'mercadopago';
    localStorage.setItem('rr_pedido', JSON.stringify(pedido));

    // Pagamento pendente (ex: boleto gerado, PIX aguardando)
    if (mpStatus === 'pending') {
      const subtitulo = document.querySelector('.conf-subtitulo');
      if (subtitulo) subtitulo.textContent = 'Seu pagamento está sendo processado. Você receberá a confirmação em breve.';
    }
  }

  document.getElementById('conf-numero').textContent = pedido.numero;
  document.getElementById('conf-nome').textContent = pedido.cliente.nome;
  document.getElementById('conf-pagamento').textContent = _labelPagamento(pedido.pagamento);

  const entregaEl = document.getElementById('conf-entrega');
  if (entregaEl) {
    if (pedido.tipoEntrega === 'entrega') {
      const e = pedido.endereco;
      entregaEl.textContent = `${e.logradouro}, ${e.numero}${e.complemento ? ' / ' + e.complemento : ''} — ${e.bairro}, ${e.cidade}/${e.uf} — CEP ${e.cep}`;
    } else {
      entregaEl.textContent = 'Retirada na loja';
    }
  }

  const itensEl = document.getElementById('conf-itens');
  if (itensEl) {
    itensEl.innerHTML = pedido.carrinho.map(item => `
      <div class="resumo-item">
        <span>${item.nome} × ${item.quantidade}</span>
        <span>${formatarPreco(item.preco * item.quantidade)}</span>
      </div>
    `).join('');
  }

  document.getElementById('conf-total').textContent = formatarPreco(pedido.total);

  // Se veio do MP (payment_id na URL) → só atualiza status (pedido já foi salvo antes do redirect)
  // Se não veio do MP (PIX manual) → salva agora
  if (mpPaymentId && pedido.savedToDb) {
    if (typeof registrarPagamentoConfirmado === 'function') {
      registrarPagamentoConfirmado(pedido.numero, mpPaymentId, mpPaymentType);
    }
  } else if (!pedido.savedToDb && typeof salvarPedido === 'function') {
    salvarPedido(pedido);
  }

  // Botão WhatsApp
  const msg = construirMensagemWhatsApp(pedido);
  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  const btnWA = document.getElementById('btn-whatsapp');
  if (btnWA) btnWA.href = waLink;

  // Countdown para redirect automático
  let countdown = 5;
  const countEl = document.getElementById('countdown');
  const timer = setInterval(() => {
    countdown--;
    if (countEl) countEl.textContent = countdown;
    if (countdown <= 0) {
      clearInterval(timer);
      clearCart();
      window.location.href = waLink;
    }
  }, 1000);

  // Limpar carrinho se usuário clicar manualmente
  if (btnWA) btnWA.addEventListener('click', () => { clearInterval(timer); clearCart(); });
}

// ─── Init por página ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  switch (page) {
    case 'index':      renderProducts('simples'); initTabs(); break;
    case 'produto':    initProduto(); break;
    case 'carrinho':   renderCart(); break;
    case 'checkout':   initCheckout(); break;
    case 'pagamento':  initPagamento(); break;
    case 'confirmacao':initConfirmacao(); break;
  }
});
