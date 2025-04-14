import React, { useState } from 'react';
import { Button, Box, Input } from '@mui/material';
import axios from 'axios';

const Upload = ({ setCsvData }) => {
  const [file, setFile] = useState(null);
  const API_URL = process.env.REACT_APP_API_URL || '';
  console.log('API_URL:', API_URL); // Debug
  const handleUpload = async () => {
    console.log('Attempting upload to:', `${API_URL}/upload`); // Debug
    const formData = new FormData();
    formData.append('csv', file);
    try {
      const response = await axios.post(`${API_URL}/upload`, formData);
      setCsvData(response.data);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload CSV. Please try again.');
    }
  };
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <Input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
        inputProps={{ 'aria-label': 'Upload CSV file' }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        disabled={!file}
      >
        Upload CSV
      </Button>
    </Box>
  );
};
export default Upload;