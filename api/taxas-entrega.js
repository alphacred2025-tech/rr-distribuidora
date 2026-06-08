const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min cache
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const db = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data } = await db
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'taxas_bairros')
      .single();

    const taxas = data?.valor ? JSON.parse(data.valor) : [];
    res.status(200).json({ taxas });
  } catch (err) {
    console.error('[taxas-entrega]', err);
    res.status(200).json({ taxas: [] });
  }
};
