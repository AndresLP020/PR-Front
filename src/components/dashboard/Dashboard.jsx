import React, { useContext } from 'react';
import { Box, Typography, Paper, Container } from '@mui/material';
import { AuthContext } from '../../contexts/AuthContext';
import { SecureExample } from '../examples/SecureExample';
import TeacherAssignments from './TeacherAssignments';

export default function Dashboard() {
  const { currentUser } = useContext(AuthContext);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Bienvenido, {currentUser?.name || 'Usuario'}
          </Typography>
          <Typography>
            Rol: {currentUser?.role || 'No especificado'}
          </Typography>
        </Paper>

        {/* Componente de prueba del cifrado híbrido */}
        <Paper sx={{ mb: 3 }}>
          <SecureExample />
        </Paper>

        {/* Lista de asignaciones (si es profesor) */}
        {currentUser?.role === 'profesor' && (
          <Paper>
            <TeacherAssignments />
          </Paper>
        )}
      </Box>
    </Container>
  );
}