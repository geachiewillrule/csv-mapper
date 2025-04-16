import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  Tooltip,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Menu,
  MenuItem as DropdownMenuItem,
} from '@mui/material';

const shopifyFields = [
  { value: 'Handle', label: 'Handle (usually SKU)', required: true },
  { value: 'Title', required: true },
  { value: 'Body (HTML)', required: false },
  { value: 'Vendor', required: false },
  { value: 'Product Category', required: false },
  { value: 'Type', required: false },
  { value: 'Tags', required: false },
  { value: 'Published', required: false },
  { value: 'Option1 Name', required: false },
  { value: 'Option1 Value', required: false },
  { value: 'Option1 Linked To', required: false },
  { value: 'Option2 Name', required: false },
  { value: 'Option2 Value', required: false },
  { value: 'Option2 Linked To', required: false },
  { value: 'Option3 Name', required: false },
  { value: 'Option3 Value', required: false },
  { value: 'Option3 Linked To', required: false },
  { value: 'Variant SKU', required: true },
  { value: 'Variant Grams', required: false },
  { value: 'Variant Inventory Tracker', required: false },
  { value: 'Variant Inventory Qty', required: true },
  { value: 'Variant Inventory Policy', required: false },
  { value: 'Variant Fulfillment Service', required: false },
  { value: 'Variant Price', required: true },
  { value: 'Variant Compare At Price', required: false },
  { value: 'Variant Requires Shipping', required: false },
  { value: 'Variant Taxable', required: false },
  { value: 'Variant Barcode', required: false },
  { value: 'Image Src', required: false },
  { value: 'Image Position', required: false },
  { value: 'Image Alt Text', required: false },
  { value: 'Gift Card', required: false },
  { value: 'SEO Title', required: false },
  { value: 'SEO Description', required: false },
  { value: 'Google Shopping / Google Product Category', required: false },
  { value: 'Google Shopping / Gender', required: false },
  { value: 'Google Shopping / Age Group', required: false },
  { value: 'Google Shopping / MPN', required: false },
  { value: 'Google Shopping / Condition', required: false },
  { value: 'Google Shopping / Custom Product', required: false },
  { value: 'Google Shopping / Custom Label 0', required: false },
  { value: 'Google Shopping / Custom Label 1', required: false },
  { value: 'Google Shopping / Custom Label 2', required: false },
  { value: 'Google Shopping / Custom Label 3', required: false },
  { value: 'Google Shopping / Custom Label 4', required: false },
  { value: 'Variant Image', required: false },
  { value: 'Variant Weight Unit', required: false },
  { value: 'Variant Tax Code', required: false },
  { value: 'Cost per item', required: false },
  { value: 'Included / Australia', required: false },
  { value: 'Price / Australia', required: false },
  { value: 'Compare At Price / Australia', required: false },
  { value: 'Status', required: true },
  { value: 'Google Shopping / AdWords Grouping', required: false },
  { value: 'Google Shopping / AdWords Labels', required: false },
];

const suggestMappings = (header) => {
  const lowerHeader = header.toLowerCase();
  if (lowerHeader.includes('sku') || lowerHeader.includes('item code')) return 'Handle';
  if (lowerHeader.includes('name') || lowerHeader.includes('title')) return 'Title';
  if (lowerHeader.includes('description')) return 'Body (HTML)';
  if (lowerHeader.includes('brand') || lowerHeader.includes('vendor')) return 'Vendor';
  if (lowerHeader.includes('rrp') || lowerHeader.includes('price')) return 'Price / Australia';
  if (lowerHeader.includes('upc') || lowerHeader.includes('ean') || lowerHeader.includes('barcode')) return 'Variant Barcode';
  if (lowerHeader.includes('weight')) return 'Variant Grams';
  if (lowerHeader.includes('image') || lowerHeader.includes('url')) return 'Image Src';
  if (lowerHeader.includes('active') || lowerHeader.includes('status')) return 'Status';
  return '';
};

function Mapper({ headers, csvData, onMappingChange, initialMappings, initialIsMultiImage, initialDelimiters }) {
  const [mappings, setMappings] = useState(initialMappings || {});
  const [isMultiImage, setIsMultiImage] = useState(initialIsMultiImage || {});
  const [delimiters, setDelimiters] = useState(initialDelimiters || {});
  const [suggestedMappings, setSuggestedMappings] = useState({});
  const [presets, setPresets] = useState(JSON.parse(localStorage.getItem('mappingPresets') || '{}'));
  const [anchorEl, setAnchorEl] = useState(null);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    const initialSuggestions = {};
    headers.forEach((header) => {
      const suggestedField = suggestMappings(header);
      if (suggestedField === 'Image Src') {
        initialSuggestions[header] = 'Image Src';
      } else if (suggestedField && !Object.values(mappings).includes(header)) {
        initialSuggestions[header] = suggestedField;
      }
    });
    setSuggestedMappings(initialSuggestions);
  }, [headers, mappings]);

  useEffect(() => {
    onMappingChange({ mappings, isMultiImage, delimiters });
  }, [mappings, isMultiImage, delimiters, onMappingChange]);

  const handleMappingChange = (supplierField, shopifyField) => {
    const newMappings = { ...mappings };

    if (shopifyField === 'Image Src') {
      const currentImageSrc = Array.isArray(newMappings['Image Src']) ? newMappings['Image Src'] : [];
      if (shopifyField && !currentImageSrc.includes(supplierField)) {
        newMappings['Image Src'] = [...currentImageSrc, supplierField];
      }
    } else if (shopifyField) {
      newMappings[shopifyField] = supplierField;
    } else {
      Object.keys(newMappings).forEach((key) => {
        if (key === 'Image Src') {
          newMappings[key] = newMappings[key].filter((sf) => sf !== supplierField);
          if (newMappings[key].length === 0) {
            delete newMappings[key];
          }
        } else if (newMappings[key] === supplierField) {
          delete newMappings[key];
        }
      });
    }

    Object.keys(newMappings).forEach((key) => {
      if (key !== 'Image Src' && newMappings[key] === supplierField && key !== shopifyField) {
        delete newMappings[key];
      }
    });

    setMappings(newMappings);

    if (shopifyField !== 'Image Src') {
      setIsMultiImage({ ...isMultiImage, [supplierField]: false });
      setDelimiters({ ...delimiters, [supplierField]: '' });
    }
  };

  const handleMultiImageChange = (supplierField, checked) => {
    setIsMultiImage({ ...isMultiImage, [supplierField]: checked });
    if (!checked) {
      setDelimiters({ ...delimiters, [supplierField]: '' });
    }
  };

  const handleDelimiterChange = (supplierField, value) => {
    setDelimiters({ ...delimiters, [supplierField]: value });
  };

  const handleSavePreset = () => {
    if (!presetName) {
      alert('Please enter a preset name');
      return;
    }
    const newPresets = { ...presets, [presetName]: mappings };
    setPresets(newPresets);
    localStorage.setItem('mappingPresets', JSON.stringify(newPresets));
    setPresetName('');
    alert(`Preset "${presetName}" saved!`);
  };

  const handleLoadPresetMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLoadPreset = (presetName) => {
    setMappings(presets[presetName]);
    setAnchorEl(null);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Map each <strong>Uploaded CSV Header</strong> to a <strong>Shopify Field</strong> on the same row. Start with your SKU for Handle!
      </Alert>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Uploaded CSV Headers
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Shopify Fields
            </Typography>
          </Box>
        </Box>
        {headers.map((header) => (
          <Box
            key={header}
            sx={{
              display: 'flex',
              gap: 2,
              mb: 2,
              alignItems: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Typography
              sx={{
                flex: 1,
                fontWeight: 'medium',
                borderLeft: '2px solid green',
                pl: 1,
              }}
            >
              {header}
            </Typography>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Shopify Field</InputLabel>
              <Select
                value={
                  Object.keys(mappings).find((key) =>
                    key === 'Image Src'
                      ? mappings[key].includes(header)
                      : mappings[key] === header
                  ) || ''
                }
                onChange={(e) => handleMappingChange(header, e.target.value)}
                label="Shopify Field"
                sx={{
                  ...(suggestedMappings[header] && {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'green',
                      borderWidth: 2,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'darkgreen',
                      borderWidth: 2,
                    },
                  }),
                }}
              >
                <MenuItem value="">Unmapped</MenuItem>
                {shopifyFields.map((field) => (
                  <MenuItem
                    key={field.value}
                    value={field.value}
                    disabled={
                      field.value !== 'Image Src' &&
                      Object.keys(mappings).includes(field.value) &&
                      mappings[field.value] !== header
                    }
                  >
                    {field.label || field.value}
                    {field.required && ' (required)'}
                    {field.value === 'Handle' && (
                      <Tooltip title="Shopify’s Handle is your supplier’s unique product code, like SKU or Item Code (e.g., TW15ASCE).">
                        <span style={{ marginLeft: 4 }}>ℹ️</span>
                      </Tooltip>
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        ))}
      </Box>
      <Box sx={{ mb: 2 }}>
        {mappings['Image Src'] && Array.isArray(mappings['Image Src']) && mappings['Image Src'].map((header) => (
          <Box key={header} sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!isMultiImage[header]}
                  onChange={(e) => handleMultiImageChange(header, e.target.checked)}
                />
              }
              label={`Multiple images in ${header}`}
            />
            {isMultiImage[header] && (
              <TextField
                label="Delimiter (e.g., comma)"
                value={delimiters[header] || ''}
                onChange={(e) => handleDelimiterChange(header, e.target.value)}
                size="small"
                sx={{ width: 150 }}
              />
            )}
          </Box>
        ))}
      </Box>
      <Typography variant="h6" gutterBottom>
        Sample Data from Your CSV
      </Typography>
      <Paper elevation={1} sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              {headers.slice(0, 5).map((header) => (
                <TableCell key={header}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {csvData.preview.slice(0, 2).map((row, index) => (
              <TableRow key={index}>
                {headers.slice(0, 5).map((header) => (
                  <TableCell key={header}>{row[header] || ''}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <TextField
          label="Preset Name"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          size="small"
          sx={{ width: 200 }}
        />
        <Button
          variant="outlined"
          onClick={handleSavePreset}
          disabled={!presetName}
        >
          Save Preset
        </Button>
        <Button
          variant="outlined"
          onClick={handleLoadPresetMenu}
          disabled={!Object.keys(presets).length}
        >
          Load Preset
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
        >
          {Object.keys(presets).map((name) => (
            <DropdownMenuItem key={name} onClick={() => handleLoadPreset(name)}>
              {name}
            </DropdownMenuItem>
          ))}
        </Menu>
      </Box>
    </Box>
  );
}

export default Mapper;