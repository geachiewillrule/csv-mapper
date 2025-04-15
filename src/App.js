import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Container, Typography, Box, Paper } from '@mui/material';
import Upload from './components/Upload';
import Mapper from './components/Mapper';
import theme from './theme';
import axios from 'axios';

function App() {
  const [csvData, setCsvData] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || '';

  const handleSetCsvData = (data) => {
    console.log('Setting csvData:', data);
    setCsvData(data && data.headers && Array.isArray(data.headers) ? data : null);
  };

  const handleGenerate = async ({ mappings, isMultiImage, delimiters }) => {
    if (!csvData || !csvData.sessionId) {
      console.error('No valid sessionId available');
      alert('Please upload a CSV first.');
      return;
    }

    try {
      console.log('Generating with sessionId:', csvData.sessionId);
      const response = await axios.post(`${API_URL}/generate`, {
        mappings,
        isMultiImage,
        delimiters,
        sessionId: csvData.sessionId,
      }, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'shopify_import.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Generate failed:', error);
      alert('Failed to generate CSV. Please try again.');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              CSV to Shopify Converter
            </Typography>
            <Upload setCsvData={handleSetCsvData} />
            {csvData && csvData.headers && Array.isArray(csvData.headers) ? (
              <Box mt={4}>
                <Typography variant="h6" gutterBottom>
                  Headers
                </Typography>
                <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                  <ul>
                    {csvData.headers.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </Paper>
                <Typography variant="h6" gutterBottom>
                  Preview
                </Typography>
                <Paper elevation={1} sx={{ p: 2, mb: 2, maxHeight: 200, overflow: 'auto' }}>
                  <pre>{JSON.stringify(csvData.preview, null, 2)}</pre>
                </Paper>
                <Mapper headers={csvData.headers} csvData={csvData} onGenerate={handleGenerate} />
              </Box>
            ) : (
              <Typography mt={2}>No CSV data loaded</Typography>
            )}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;