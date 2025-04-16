import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Container, Typography, Box, Stepper, Step, StepLabel, Button, Alert, Snackbar } from '@mui/material';
import Upload from './components/Upload';
import Mapper from './components/Mapper';
import Preview from './components/Preview';
import theme from './theme';
import axios from 'axios';

function App() {
  const [csvData, setCsvData] = useState(null);
  const [mappings, setMappings] = useState({});
  const [isMultiImage, setIsMultiImage] = useState({});
  const [delimiters, setDelimiters] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const API_URL = process.env.REACT_APP_API_URL || '';

  const steps = ['Upload CSV', 'Map Fields', 'Preview Mappings', 'Generate CSV'];

  const handleSetCsvData = (data) => {
    console.log('Setting csvData:', data);
    setCsvData(data && data.headers && Array.isArray(data.headers) ? data : null);
    if (data && data.headers) {
      const suggestedMapping = data.headers.includes('SKU') ? { Handle: 'SKU' } : 
        data.headers.includes('Item Code') ? { Handle: 'Item Code' } : {};
      setMappings(suggestedMapping);
      setSnackbar({ open: true, message: 'CSV Uploaded!' });
    } else {
      setError('Failed to upload CSV.');
    }
  };

  const handleMappingChange = ({ mappings, isMultiImage, delimiters }) => {
    setMappings(mappings);
    setIsMultiImage(isMultiImage);
    setDelimiters(delimiters);
  };

  const handleGenerate = async () => {
    if (!csvData || !csvData.sessionId) {
      setError('No valid sessionId available.');
      setSnackbar({ open: true, message: 'Please upload a CSV first.' });
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
      setSnackbar({ open: true, message: 'CSV Downloaded!' });
    } catch (error) {
      console.error('Generate failed:', error);
      setError('Failed to generate CSV.');
      setSnackbar({ open: true, message: 'Failed to generate CSV. Try again.' });
    }
  };

  const handleNext = () => {
    if (activeStep === 1 && !mappings.Handle) {
      setError('Please map the Handle field (usually your SKU).');
      setSnackbar({ open: true, message: 'Map Handle to continue.' });
      return;
    }
    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleStartOver = () => {
    setCsvData(null);
    setMappings({});
    setIsMultiImage({});
    setDelimiters({});
    setActiveStep(0);
    setError(null);
    setSnackbar({ open: true, message: 'Started over!' });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ open: false, message: '' });
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <Upload setCsvData={handleSetCsvData} />;
      case 1:
        return csvData && csvData.headers ? (
          <Mapper
            headers={csvData.headers}
            csvData={csvData}
            onMappingChange={handleMappingChange}
            initialMappings={mappings}
          />
        ) : (
          <Typography>No CSV data loaded.</Typography>
        );
      case 2:
        return csvData && csvData.headers ? (
          <Preview csvData={csvData} mappings={mappings} />
        ) : (
          <Typography>No CSV data loaded.</Typography>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Mapping Summary
            </Typography>
            <ul>
              {Object.entries(mappings).map(([shopify, supplier]) => (
                <li key={shopify}>{`${shopify}: ${supplier}`}</li>
              ))}
            </ul>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerate}
              sx={{ mt: 2 }}
            >
              Generate
            </Button>
          </Box>
        );
      default:
        return <Typography>Unknown step.</Typography>;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              CSV to Shopify Converter
            </Typography>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Box sx={{ minHeight: '300px' }}>
              {getStepContent(activeStep)}
            </Box>
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              <Box>
                {activeStep === steps.length - 1 && (
                  <Button
                    variant="outlined"
                    onClick={handleStartOver}
                    sx={{ mr: 1 }}
                  >
                    Start Over
                  </Button>
                )}
                {activeStep < steps.length - 1 && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    disabled={activeStep === 0 && !csvData}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Container>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          message={snackbar.message}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;