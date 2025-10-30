import React, { useState } from 'react';
import { useSecureService } from '../../services/secureService';
import { Box, Button, Typography, CircularProgress } from '@mui/material';

export const SecureExample = () => {
  const secureService = useSecureService();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSecureTest = async () => {
    setLoading(true);
    try {
      // Ejemplo: crear una asignación de prueba de forma segura
      const testAssignment = {
        title: 'Test Seguro ' + new Date().toISOString(),
        description: 'Esta asignación fue enviada usando cifrado híbrido',
        dueDate: new Date(Date.now() + 24*60*60*1000).toISOString()
      };

      const response = await secureService.secureAssignment.create(testAssignment);
      setResult({
        success: true,
        data: response
      });
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Prueba de Cifrado Híbrido
      </Typography>

      <Button 
        variant="contained" 
        onClick={handleSecureTest}
        disabled={loading}
        sx={{ my: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Enviar Asignación Segura'}
      </Button>

      {result && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography color={result.success ? 'success.main' : 'error.main'}>
            {result.success ? '¡Éxito!' : 'Error'}
          </Typography>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(result.data || result.error, null, 2)}
          </pre>
        </Box>
      )}
    </Box>
  );
};