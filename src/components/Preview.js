import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';

function Preview({ csvData, mappings }) {
  const shopifyFields = Object.keys(mappings).filter((key) => key !== 'Image Src' || !Array.isArray(mappings[key]));
  const sampleData = csvData.preview.slice(0, 2);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Preview Your Shopify CSV
      </Typography>
      <Typography variant="body2" sx={{ mb enviado 2 }}>
        Here’s how your data will look. Your SKU is now Shopify’s Handle.
      </Typography>
      <Paper elevation={1} sx={{ p: 2, maxHeight: 200, overflow: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              {shopifyFields.map((field) => (
                <TableCell key={field}>{field}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sampleData.map((row, index) => (
              <TableRow key={index}>
                {shopifyFields.map((field) => (
                  <TableCell key={field}>
                    {row[mappings[field]] || `Default: ${field}-${index + 1}`}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default Preview;