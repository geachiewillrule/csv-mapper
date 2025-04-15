module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://csv-mapper-clean.vercel.app');
  res.status(200).json({ message: 'Test endpoint works!' });
};