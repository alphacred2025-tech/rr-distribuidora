// ============================================================
// database.js — RR Distribuidora
// Integração Supabase: salva clientes, pedidos, itens,
// entregas e lançamentos financeiros
// ============================================================

const SUPABASE_URL = 'https://tyqcapyezlamjffbjagl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cWNhcHllemxhbWpmZmJqYWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MDU5MTQsImV4cCI6MjA5NTQ4MTkxNH0.JGqb9LFloiQ3fx8RvlH2d3bms1rDld7iEcICuZGfyXs';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

    // 2. Registrar pedido
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
      })
      .select('id')
      .single();

    if (e2) throw e2;

    // 3. Registrar itens da cesta
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

    // 4. Criar registro de entrega (status inicial = pendente)
    const { error: e4 } = await db.from('entregas').insert({
      pedido_id: novoPedido.id,
      status:    'pendente',
    });
    if (e4) console.warn('[DB] Aviso ao criar entrega:', e4.message);

    // 5. Criar lançamento financeiro automático (receita)
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

    return true;
  } catch (err) {
    // Silencioso pro cliente — fluxo WhatsApp segue mesmo se o DB falhar
    console.error('[DB] Erro ao salvar pedido:', err.message || err);
    return false;
  }
}
