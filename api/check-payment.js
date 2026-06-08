const { MercadoPagoConfig, Payment } = require('mercadopago');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing payment id' });

  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const paymentApi = new Payment(client);
    const result = await paymentApi.get({ id: String(id) });

    res.status(200).json({
      status:          result.status,
      id:              result.id,
      payment_type_id: result.payment_type_id,
    });
  } catch (err) {
    console.error('[check-payment] error:', err);
    res.status(500).json({ error: err.message });
  }
};
