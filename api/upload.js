const multer = require('multer');
const Papa = require('papaparse');
const fs = require('fs').promises;
const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 600 }); // 10-min TTL

const upload = multer({ dest: '/tmp/uploads/' });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://csv-mapper-clean.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uploadHandler = upload.single('csv');
  uploadHandler(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ error: 'Failed to process CSV' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
      const filePath = req.file.path;
      const csvData = await fs.readFile(filePath, 'utf8');
      let parsedData;
      Papa.parse(csvData, {
        complete: (result) => {
          parsedData = result;
        },
        header: true,
        error: (parseErr) => {
          console.error('Parse error:', parseErr);
          throw new Error('Failed to parse CSV');
        }
      });
      if (!parsedData) {
        throw new Error('Failed to parse CSV');
      }
      const sessionId = Date.now().toString();
      cache.set(sessionId, parsedData.data);
      await fs.unlink(filePath).catch(cleanupErr => console.error('Cleanup error:', cleanupErr));
      res.status(200).json({
        sessionId,
        headers: parsedData.meta.fields,
        preview: parsedData.data.slice(0, 5),
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to process CSV' });
    }
  });
};