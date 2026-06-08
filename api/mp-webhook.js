const { MercadoPagoConfig, Payment } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  // MP verifica o endpoint com GET antes de enviar eventos
  if (req.method === 'GET') return res.status(200).end();

  try {
    const { type, data } = req.body || {};

    if (type === 'payment' && data?.id) {
      const client = new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN,
      });

      const paymentApi = new Payment(client);
      const payment = await paymentApi.get({ id: String(data.id) });

      console.log('[MP webhook] payment_id=%s status=%s ref=%s method=%s',
        payment.id, payment.status, payment.external_reference, payment.payment_type_id);

      if (payment.external_reference) {
        const db = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        );

        let statusPagamento;
        if (payment.status === 'approved')                              statusPagamento = 'pago';
        else if (['rejected','cancelled'].includes(payment.status))     statusPagamento = 'falhou';
        else                                                            statusPagamento = 'pendente';

        const { error } = await db.from('pedidos')
          .update({
            status_pagamento: statusPagamento,
            mp_payment_id:    String(payment.id),
          })
          .eq('numero', payment.external_reference);

        if (error) console.error('[MP webhook] supabase error:', error.message);
        else console.log('[MP webhook] pedido %s → %s', payment.external_reference, statusPagamento);
      }
    }

    // Sempre responde 200 para o MP não retentar
    res.status(200).end();
  } catch (err) {
    console.error('[MP webhook] error:', err);
    res.status(200).end();
  }
};
