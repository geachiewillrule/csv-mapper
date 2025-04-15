import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Menu,
  MenuItem as DropdownMenuItem,
} from '@mui/material';

const shopifyFields = [
  { value: 'Handle', required: true },
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
  { value: 'Google Shopping / AdWords Labels', required: false }
];

const suggestMappings = (header) => {
  const lowerHeader = header.toLowerCase();
  if (lowerHeader.includes('sku')) return 'Handle';
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

const Mapper = ({ headers, csvData, onGenerate }) => {
  const [mappings, setMappings] = useState({});
  const [suggestedMappings, setSuggestedMappings] = useState({});
  const [isMultiImage, setIsMultiImage] = useState(
    headers.reduce((acc, header) => ({ ...acc, [header]: false }), {})
  );
  const [delimiters, setDelimiters] = useState(
    headers.reduce((acc, header) => ({ ...acc, [header]: '' }), {})
  );
  const [presets, setPresets] = useState(
    JSON.parse(localStorage.getItem('mappingPresets') || '{}')
  );
  const [anchorEl, setAnchorEl] = useState(null);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    const initialMappings = {};
    const initialSuggestions = {};
    headers.forEach((header) => {
      const suggestedField = suggestMappings(header);
      if (suggestedField === 'Image Src') {
        initialMappings['Image Src'] = initialMappings['Image Src'] || [];
        initialMappings['Image Src'].push(header);
        initialSuggestions[header] = 'Image Src';
      } else if (suggestedField && !Object.values(initialMappings).includes(header)) {
        initialMappings[suggestedField] = header;
        initialSuggestions[header] = suggestedField;
      }
    });
    setMappings(initialMappings);
    setSuggestedMappings(initialSuggestions);
  }, [headers]);

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

  const validateMappings = () => {
    const invalidDelimiters = Object.entries(isMultiImage).filter(
      ([field, isMulti]) => isMulti && !delimiters[field]
    );
    if (invalidDelimiters.length > 0) {
      alert(`Please specify delimiters for multi-image columns: ${invalidDelimiters.map(([f]) => f).join(', ')}`);
      return false;
    }
    return true;
  };

  const handleGenerate = () => {
    if (!validateMappings()) return;
    console.log('Sending mappings:', JSON.stringify(mappings, null, 2));
    onGenerate({ mappings, isMultiImage, delimiters });
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
    <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Map Columns
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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
      <TableContainer sx={{ maxHeight: 400, overflow: 'auto' }}>
        <Table stickyHeader>
          <TableBody>
            {headers.map((header) => (
              <TableRow key={header}>
                <TableCell sx={{ fontWeight: 'medium', minWidth: 150 }}>{header}</TableCell>
                <TableCell sx={{ minWidth: 300 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Tooltip
                      title={
                        suggestedMappings[header]
                          ? `Suggested mapping based on header "${header}"`
                          : ''
                      }
                      disableInteractive
                    >
                      <FormControl fullWidth>
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
                          <MenuItem value="">-- None --</MenuItem>
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
                              {field.value} {field.required && '(required)'}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Tooltip>
                    {(mappings['Image Src'] && mappings['Image Src'].includes(header)) && (
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={!!isMultiImage[header]}
                              onChange={(e) => handleMultiImageChange(header, e.target.checked)}
                            />
                          }
                          label="Contains multiple images"
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
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button
        variant="contained"
        color="primary"
        onClick={handleGenerate}
        sx={{ mt: 2 }}
      >
        Generate Shopify CSV
      </Button>
    </Paper>
  );
};

export default Mapper;