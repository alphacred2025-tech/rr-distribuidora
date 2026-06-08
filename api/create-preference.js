const { MercadoPagoConfig, Preference } = require('mercadopago');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const pedido = req.body;

    if (!pedido || !pedido.carrinho || !pedido.numero) {
      return res.status(400).json({ error: 'Dados do pedido inválidos' });
    }

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const items = pedido.carrinho.map(item => ({
      id: item.cestaId || item.nome,
      title: String(item.nome).slice(0, 256),
      quantity: item.quantidade || 1,
      unit_price: parseFloat(item.preco),
      currency_id: 'BRL',
    }));

    if (pedido.taxaEntrega && parseFloat(pedido.taxaEntrega) > 0) {
      items.push({
        id: 'taxa_entrega',
        title: 'Taxa de Entrega',
        quantity: 1,
        unit_price: parseFloat(pedido.taxaEntrega),
        currency_id: 'BRL',
      });
    }

    const baseUrl = `https://${req.headers.host}`;

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items,
        payer: {
          name: pedido.cliente.nome,
          email: pedido.cliente.email || 'cliente@rrdistribuidora.com.br',
          phone: pedido.cliente.telefone
            ? { number: pedido.cliente.telefone.replace(/\D/g, '') }
            : undefined,
        },
        back_urls: {
          success: `${baseUrl}/confirmacao.html`,
          failure: `${baseUrl}/pagamento.html`,
          pending: `${baseUrl}/confirmacao.html`,
        },
        auto_return: 'approved',
        external_reference: pedido.numero,
        notification_url: `${baseUrl}/api/mp-webhook`,
        statement_descriptor: 'RR DISTRIBUIDORA',
      },
    });

    res.status(200).json({
      init_point:         result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      preference_id:      result.id,
    });
  } catch (err) {
    console.error('[MP] create-preference error:', err);
    res.status(500).json({ error: err.message || 'Erro ao criar preferência de pagamento' });
  }
};
