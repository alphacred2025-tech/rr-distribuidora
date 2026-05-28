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

async function salvarPedido(pedido) {
  try {
    // 1. Registrar / atualizar cliente (upsert por telefone)
    const clientePayload = {
      nome:     pedido.cliente.nome,
      telefone: pedido.cliente.telefone,
      email:    pedido.cliente.email    || null,
      cpf:      pedido.cliente.cpf      || null,
      origem:   'site',
    };

    let clienteId;
    if (pedido.cliente.telefone) {
      const { data: existe } = await db
        .from('clientes')
        .select('id')
        .eq('telefone', pedido.cliente.telefone)
        .maybeSingle();

      if (existe) {
        clienteId = existe.id;
        await db.from('clientes').update({ nome: clientePayload.nome, email: clientePayload.email }).eq('id', clienteId);
      } else {
        const { data: novo, error } = await db.from('clientes').insert(clientePayload).select('id').single();
        if (error) throw error;
        clienteId = novo.id;
      }
    } else {
      const { data: novo, error } = await db.from('clientes').insert(clientePayload).select('id').single();
      if (error) throw error;
      clienteId = novo.id;
    }

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

    // 3. Registrar pedido
    const end = pedido.tipoEntrega === 'entrega' ? pedido.endereco : {};
    const { data: novoPedido, error: e2 } = await db
      .from('pedidos')
      .insert({
        numero:          pedido.numero,
        cliente_id:      clienteId,
        total:           pedido.total,
        forma_entrega:   pedido.tipoEntrega,
        forma_pagamento: pedido.pagamento,
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
      })
      .select('id')
      .single();

    if (e2) throw e2;

    // 4. Registrar itens da cesta
    const itensBatch = pedido.carrinho.map(item => ({
      pedido_id:          novoPedido.id,
      cesta_id:           item.cestaId   || null,
      cesta_nome:         item.nome,
      preco:              item.preco,
      quantidade:         item.quantidade,
      itens_selecionados: item.itens     || [],
    }));

    const { error: e3 } = await db.from('itens_pedido').insert(itensBatch);
    if (e3) throw e3;

    // 5. Criar registro de entrega (status inicial = pendente)
    const { error: e4 } = await db.from('entregas').insert({
      pedido_id: novoPedido.id,
      status:    'pendente',
    });
    if (e4) console.warn('[DB] Aviso ao criar entrega:', e4.message);

    // 6. Criar lançamento financeiro automático (receita)
    const descricao = `Pedido #${pedido.numero} — ${pedido.cliente.nome}`;
    const { error: e5 } = await db.from('lancamentos').insert({
      tipo:       'receita',
      categoria:  'vendas_site',
      descricao,
      valor:      pedido.total,
      data:       new Date().toISOString().split('T')[0],
      pedido_id:  novoPedido.id,
    });
    if (e5) console.warn('[DB] Aviso ao criar lançamento:', e5.message);

    // 7. Decrementar estoque para cada item do pedido
    try {
      for (const item of pedido.carrinho) {
        const nomeCesta = (item.nome || '').trim();
        const { data: prod } = await db
          .from('produtos')
          .select('id, estoque_atual')
          .ilike('nome', nomeCesta)
          .maybeSingle();

        if (prod) {
          const novoEst = Math.max(0, prod.estoque_atual - (item.quantidade || 1));
          await db.from('produtos').update({ estoque_atual: novoEst }).eq('id', prod.id);
          await db.from('estoque_movimentos').insert({
            produto_id:  prod.id,
            pedido_id:   novoPedido.id,
            tipo:        'saida',
            quantidade:  item.quantidade || 1,
            observacao:  `Pedido #${pedido.numero}`,
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
          pedido_id:    novoPedido.id,
          valor_pedido: pedido.total,
          pct:          afiliadoPct,
          valor:        valorComissao,
          status:       'pendente',
        });
        // Atualiza totais do afiliado
        const { data: afilAtual } = await db.from('afiliados').select('total_vendas, total_comissoes').eq('id', afiliadoId).single();
        if (afilAtual) {
          await db.from('afiliados').update({
            total_vendas:    (afilAtual.total_vendas    || 0) + pedido.total,
            total_comissoes: (afilAtual.total_comissoes || 0) + valorComissao,
          }).eq('id', afiliadoId);
        }
        // Limpa o código de afiliado após o pedido ser registrado
        localStorage.removeItem('rr_afiliado');
      } catch(e) { console.warn('[DB] Aviso ao registrar comissão:', e.message); }
    }

    return true;
  } catch (err) {
    // Silencioso pro cliente — fluxo WhatsApp segue mesmo se o DB falhar
    console.error('[DB] Erro ao salvar pedido:', err.message || err);
    return false;
  }
}
