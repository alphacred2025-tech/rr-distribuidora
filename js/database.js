// ============================================================
// database.js — RR Distribuidora
// Integração Supabase: salva clientes, pedidos, itens,
// entregas, lançamentos, afiliados e estoque
// ============================================================

const SUPABASE_URL = 'https://tyqcapyezlamjffbjagl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cWNhcHllemxhbWpmZmJqYWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDU5MTQsImV4cCI6MjA5NTQ4MTkxNH0.JGqb9LFloiQ3fx8RvlH2d3bms1rDld7iEcICuZGfyXs';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Captura código de afiliado da URL (salva em localStorage) ─
(function capturarAfiliado() {
  try {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) localStorage.setItem('rr_afiliado', ref.toUpperCase());
  } catch(e) {}
})();

// UUID v4 gerado no cliente — evita depender de SELECT após INSERT
// (o role anon não tem política SELECT em clientes/pedidos)
function _uid() {
  try {
    return crypto.randomUUID();
  } catch(e) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
}

async function salvarPedido(pedido) {
  try {
    // 1. Registrar cliente — UUID gerado aqui, sem SELECT de volta
    const clienteId = _uid();
    const { error: ecli } = await db.from('clientes').insert({
      id:       clienteId,
      nome:     pedido.cliente.nome,
      telefone: pedido.cliente.telefone || null,
      email:    pedido.cliente.email    || null,
      cpf:      pedido.cliente.cpf      || null,
      origem:   'site',
    });
    if (ecli) throw ecli;

    // 2. Resolver afiliado (código salvo em localStorage)
    let afiliadoId = null;
    let afiliadoPct = 0;
    try {
      const codigoRef = localStorage.getItem('rr_afiliado');
      if (codigoRef) {
        const { data: afil } = await db
          .from('afiliados')
          .select('id, comissao_pct')
          .eq('codigo', codigoRef)
          .eq('ativo', true)
          .maybeSingle();
        if (afil) { afiliadoId = afil.id; afiliadoPct = afil.comissao_pct; }
      }
    } catch(e) {}

    // 3. Registrar pedido — UUID gerado aqui, sem SELECT de volta
    const pedidoId = _uid();
    const end = pedido.tipoEntrega === 'entrega' ? (pedido.endereco || {}) : {};
    const { error: e2 } = await db.from('pedidos').insert({
      id:              pedidoId,
      numero:          pedido.numero,
      cliente_id:      clienteId,
      total:           pedido.total,
      forma_entrega:   pedido.tipoEntrega   || 'entrega',
      forma_pagamento: pedido.pagamento     || 'pix',
      cep:             end.cep         || null,
      logradouro:      end.logradouro  || null,
      numero_end:      end.numero      || null,
      complemento:     end.complemento || null,
      bairro:          end.bairro      || null,
      cidade:          end.cidade      || null,
      uf:              end.uf          || null,
      troco_para:      pedido.trocoPara || null,
      origem:          'site',
      afiliado_id:     afiliadoId,
    });
    if (e2) throw e2;

    // 4. Registrar itens da cesta
    const itensBatch = (pedido.carrinho || []).map(item => ({
      pedido_id:          pedidoId,
      cesta_id:           item.cestaId   || null,
      cesta_nome:         item.nome,
      preco:              item.preco,
      quantidade:         item.quantidade || 1,
      itens_selecionados: item.itens      || [],
    }));
    const { error: e3 } = await db.from('itens_pedido').insert(itensBatch);
    if (e3) throw e3;

    // 5. Criar registro de entrega (status inicial = pendente)
    const { error: e4 } = await db.from('entregas').insert({
      pedido_id: pedidoId,
      status:    'pendente',
    });
    if (e4) console.warn('[DB] Aviso ao criar entrega:', e4.message);

    // 6. Criar lançamento financeiro automático (receita)
    const { error: e5 } = await db.from('lancamentos').insert({
      tipo:       'receita',
      categoria:  'vendas_site',
      descricao:  `Pedido #${pedido.numero} — ${pedido.cliente.nome}`,
      valor:      pedido.total,
      data:       new Date().toISOString().split('T')[0],
      pedido_id:  pedidoId,
    });
    if (e5) console.warn('[DB] Aviso ao criar lançamento:', e5.message);

    // 7. Decrementar ingredientes do estoque via RPC (SECURITY DEFINER)
    // itens_selecionados = nomes dos ingredientes escolhidos pelo cliente
    try {
      for (const item of (pedido.carrinho || [])) {
        const ingredientes = item.itens || [];
        if (ingredientes.length > 0) {
          await db.rpc('decrementar_ingredientes_pedido', {
            p_itens:      ingredientes,
            p_quantidade: item.quantidade || 1,
            p_pedido_id:  pedidoId,
            p_numero:     pedido.numero,
          });
        }
      }
    } catch(e) { console.warn('[DB] Aviso ao atualizar estoque:', e.message); }

    // 8. Registrar comissão do afiliado
    if (afiliadoId && afiliadoPct > 0) {
      try {
        const valorComissao = parseFloat(((pedido.total * afiliadoPct) / 100).toFixed(2));
        await db.from('comissoes_afiliados').insert({
          afiliado_id:  afiliadoId,
          pedido_id:    pedidoId,
          valor_pedido: pedido.total,
          pct:          afiliadoPct,
          valor:        valorComissao,
          status:       'pendente',
        });
        const { data: afilAtual } = await db.from('afiliados')
          .select('total_vendas, total_comissoes').eq('id', afiliadoId).single();
        if (afilAtual) {
          await db.from('afiliados').update({
            total_vendas:    (afilAtual.total_vendas    || 0) + pedido.total,
            total_comissoes: (afilAtual.total_comissoes || 0) + valorComissao,
          }).eq('id', afiliadoId);
        }
        localStorage.removeItem('rr_afiliado');
      } catch(e) { console.warn('[DB] Aviso ao registrar comissão:', e.message); }
    }

    console.log('[DB] Pedido salvo com sucesso:', pedidoId);
    return true;
  } catch (err) {
    // Silencioso pro cliente — fluxo WhatsApp segue mesmo se o DB falhar
    console.error('[DB] Erro ao salvar pedido:', err?.message || err);
    return false;
  }
}
