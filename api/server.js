const express = require('express');
const Papa = require('papaparse');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://csv-mapper-clean.vercel.app'
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

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

app.post('/generate', (req, res) => {
  const { mappings, isMultiImage, delimiters, sessionId } = req.body;
  const data = (global.tempDataStore && global.tempDataStore[sessionId]) || [];

  console.log('Mappings:', JSON.stringify(mappings, null, 2));
  console.log('isMultiImage:', JSON.stringify(isMultiImage, null, 2));
  console.log('delimiters:', JSON.stringify(delimiters, null, 2));
  console.log('First data row:', JSON.stringify(data[0], null, 2));
  console.log('Data length:', data.length);

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

    console.log(`Row ${index + 1} mainRow:`, JSON.stringify(mainRow, null, 2));
    console.log(`Row ${index + 1} images:`, JSON.stringify(images, null, 2));
  });

  if (global.tempDataStore && sessionId && global.tempDataStore[sessionId]) {
    delete global.tempDataStore[sessionId];
  }

  const csv = Papa.unparse(shopifyData, {
    columns: shopifyFieldOrder,
  });
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});

module.exports = app;