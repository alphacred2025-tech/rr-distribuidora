module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({ publicKey: process.env.MP_PUBLIC_KEY || '' });
};
