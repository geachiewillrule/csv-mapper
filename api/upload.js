const multer = require('multer');
const Papa = require('papaparse');
const fs = require('fs').promises;
const { put } = require('@vercel/blob');

const upload = multer({ dest: '/tmp/uploads/' });

module.exports = async (req, res) => {
  console.log('Starting upload handler');
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
      console.log('Reading file:', req.file.path);
      const filePath = req.file.path;
      const csvData = await fs.readFile(filePath, 'utf8');
      console.log('File read, parsing CSV');
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
      console.log('Parsed data, sessionId:', sessionId);
      console.log('BLOB_READ_WRITE_TOKEN:', !!process.env.BLOB_READ_WRITE_TOKEN);
      console.log('Before Blob put');
      try {
        const blob = await put(`sessions/${sessionId}.json`, JSON.stringify(parsedData.data), {
          access: 'public',
          addRandomSuffix: false
        });
        console.log('Blob stored:', blob.url);
      } catch (blobErr) {
        console.error('Blob put error:', blobErr);
        throw blobErr;
      }
      await fs.unlink(filePath).catch(cleanupErr => console.error('Cleanup error:', cleanupErr));
      console.log('Sending upload response');
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