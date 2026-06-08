module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const key = process.env.MP_PUBLIC_KEY || '';
  console.log('[mp-public-key] key length:', key.length, 'starts:', key.slice(0, 10));
  res.json({ publicKey: key });
};
