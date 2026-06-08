const { MercadoPagoConfig, Payment } = require('mercadopago');

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

      // Aqui você pode atualizar o Supabase com o status do pagamento.
      // Ex: marcar pedido como pago quando status === 'approved'
      // Requer SUPABASE_URL + SUPABASE_SERVICE_KEY como env vars no Vercel.
    }

    // Sempre responde 200 para o MP não retentar
    res.status(200).end();
  } catch (err) {
    console.error('[MP webhook] error:', err);
    res.status(200).end();
  }
};
