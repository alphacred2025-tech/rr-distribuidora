const { MercadoPagoConfig, Payment } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { pedidoNumero, ...formData } = req.body;

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const paymentApi = new Payment(client);
    const result = await paymentApi.create({
      body: {
        ...formData,
        external_reference: pedidoNumero,
        notification_url: `https://${req.headers.host}/api/mp-webhook`,
        statement_descriptor: 'RR DISTRIBUIDORA',
      },
    });

    // Atualiza status no Supabase imediatamente
    if (pedidoNumero && (result.status === 'approved' || result.status === 'pending')) {
      try {
        const db = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        );
        await db.from('pedidos').update({
          status_pagamento: result.status === 'approved' ? 'pago' : 'pendente',
          mp_payment_id:    String(result.id),
        }).eq('numero', pedidoNumero);
      } catch (dbErr) {
        console.error('[process-payment] supabase update error:', dbErr.message);
      }
    }

    res.status(200).json({
      status:                result.status,
      id:                    result.id,
      payment_type_id:       result.payment_type_id,
      point_of_interaction:  result.point_of_interaction,
    });
  } catch (err) {
    console.error('[process-payment] error:', err);
    res.status(500).json({ error: err.message || 'Erro ao processar pagamento' });
  }
};
