const Papa = require('papaparse');
const { get } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'https://csv-mapper-clean.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mappings, isMultiImage, delimiters, sessionId } = req.body;
    console.log('Fetching from Blob:', sessionId);
    let data;
    try {
      const blob = await get(`sessions/${sessionId}.json`, {
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      if (!blob) {
        throw new Error('Blob not found');
      }
      const rawData = await blob.text();
      data = JSON.parse(rawData);
      console.log('Blob fetched:', `sessions/${sessionId}.json`);
    } catch (error) {
      console.error('Blob error:', error);
      return res.status(400).json({ error: 'Invalid or expired session' });
    }

    if (!sessionId || !data) {
      console.log('Invalid sessionId or no data:', { sessionId, data });
      return res.status(400).json({ error: 'Invalid or expired session' });
    }

    const shopifyFieldOrder = [
      'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags', 'Published',
      'Option1 Name', 'Option1 Value', 'Option1 Linked To', 'Option2 Name', 'Option2 Value', 'Option2 Linked To',
      'Option3 Name', 'Option3 Value', 'Option3 Linked To', 'Variant SKU', 'Variant Grams', 'Variant Inventory Tracker',
      'Variant Inventory Qty', 'Variant Inventory Policy', 'Variant Fulfillment Service', 'Variant Price',
      'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable', 'Variant Barcode', 'Image Src',
      'Image Position', 'Image Alt Text', 'Gift Card', 'SEO Title', 'SEO Description',
      'Google Shopping / Google Product Category', 'Google Shopping / Gender', 'Google Shopping / Age Group',
      'Google Shopping / MPN', 'Google Shopping / Condition', 'Google Shopping / Custom Product',
      'Google Shopping / Custom Label 0', 'Google Shopping / Custom Label 1', 'Google Shopping / Custom Label 2',
      'Google Shopping / Custom Label 3', 'Google Shopping / Custom Label 4', 'Variant Image', 'Variant Weight Unit',
      'Variant Tax Code', 'Cost per item', 'Included / Australia', 'Price / Australia', 'Compare At Price / Australia',
      'Status', 'Google Shopping / AdWords Grouping', 'Google Shopping / AdWords Labels'
    ];

    const defaults = {
      'Handle': (row, index) => `product-${index + 1}`,
      'Variant Inventory Qty': 0,
      'Variant Inventory Policy': 'deny',
      'Status': 'active',
      'Variant Price': 0,
      'Variant SKU': (row, index) => `sku-${index + 1}`,
      'Published': 'TRUE',
      'Gift Card': 'FALSE',
      'Variant Taxable': 'TRUE',
      'Variant Requires Shipping': 'TRUE',
      'Variant Fulfillment Service': 'manual',
      'Variant Weight Unit': 'g',
      'Google Shopping / Condition': 'used'
    };

    const shopifyData = [];
    data.forEach((row, index) => {
      const mainRow = {};
      shopifyFieldOrder.forEach((field) => {
        mainRow[field] = '';
      });

      Object.entries(mappings).forEach(([shopifyField, supplierField]) => {
        if (shopifyField !== 'Image Src' && supplierField && row[supplierField] !== undefined) {
          mainRow[shopifyField] = String(row[supplierField]).trim();
        }
      });

      Object.keys(defaults).forEach((field) => {
        if (mainRow[field] === '') {
          mainRow[field] = typeof defaults[field] === 'function' ? defaults[field](row, index) : defaults[field];
        }
      });

      const imageColumns = Array.isArray(mappings['Image Src']) ? mappings['Image Src'] : [];
      let images = [];
      imageColumns.forEach((col) => {
        if (row[col] && row[col] !== '') {
          if (isMultiImage[col] && delimiters[col]) {
            const delimiter = delimiters[col];
            const splitImages = row[col].split(delimiter).map((img) => img.trim()).filter(Boolean);
            images.push(...splitImages);
          } else {
            images.push(row[col]);
          }
        }
      });

      if (images.length > 0) {
        mainRow['Image Src'] = images[0];
        mainRow['Image Position'] = '1';
      }
      shopifyData.push(mainRow);

      images.slice(1).forEach((image, imgIndex) => {
        const imageRow = {};
        shopifyFieldOrder.forEach((field) => {
          imageRow[field] = '';
        });
        imageRow['Handle'] = mainRow['Handle'];
        imageRow['Image Src'] = image;
        imageRow['Image Position'] = String(imgIndex + 2);
        shopifyData.push(imageRow);
      });
    });

    // Delete blob after use
    await fetch(`https://api.vercel.com/v2/blob/files/sessions/${sessionId}.json`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`
      }
    }).catch(err => console.error('Blob delete error:', err));

    const csv = Papa.unparse(shopifyData, {
      columns: shopifyFieldOrder,
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=shopify_import.csv');
    res.status(200).send(csv);
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
};