import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import TeacherAssignments from './TeacherAssignments';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  Grid,
  Container,
  Chip,
  Paper,
  Alert,
  LinearProgress,
  useTheme,
  useMediaQuery,
  IconButton,
  Divider,
  Skeleton
} from '@mui/material';
import {
  School,
  Email,
  Person,
  Close,
  Dashboard,
  AccountCircle
} from '@mui/icons-material';

const ActiveSession = () => {
  const { currentUser, loading } = useContext(AuthContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [error, setError] = useState('');
  const [openWelcome, setOpenWelcome] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shouldReload, setShouldReload] = useState(false);

  useEffect(() => {
    console.log('🔍 ActiveSession - Estado actual:', { 
      loading, 
      currentUser: !!currentUser,
      userRole: currentUser?.role 
    });
    
    if (currentUser) {
      console.log('✅ Usuario cargado:', {
        nombre: currentUser.nombre,
        email: currentUser.email,
        role: currentUser.role,
        fotoPerfil: currentUser.fotoPerfil
      });
    }
  }, [loading, currentUser]);

  // Sistema de recarga automática - 3 recargas como F5 al entrar
  useEffect(() => {
    if (!loading && currentUser) {
      const reloadKey = `docente_dashboard_reload`;
      const reloadCount = parseInt(sessionStorage.getItem(reloadKey) || '0');
      
      console.log(`🔄 Recarga automática del dashboard - Contador: ${reloadCount}/3`);
      
      // Si ya recargamos 3 veces, mostrar contenido
      if (reloadCount >= 3) {
        console.log('✅ 3 recargas completadas, mostrando dashboard');
        setImageLoaded(true);
        // Limpiar contador después de un tiempo
        setTimeout(() => {
          sessionStorage.removeItem(reloadKey);
        }, 60000); // 1 minuto
        return;
      }

      // Incrementar contador y recargar
      const newCount = reloadCount + 1;
      sessionStorage.setItem(reloadKey, newCount.toString());
      
      console.log(`🔄 Ejecutando recarga automática ${newCount}/3 (como F5)...`);
      
      // Recarga inmediata como presionar F5
      setTimeout(() => {
        window.location.reload();
      }, 800);
      
    } else {
      // No hay usuario, mostrar contenido normalmente
      setImageLoaded(true);
    }
  }, [loading, currentUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpenWelcome(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Mostrar mensaje de recarga si es necesario
  if (shouldReload) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, p: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh">
          <LinearProgress 
            sx={{ 
              width: '100%', 
              maxWidth: 400,
              height: 6,
              borderRadius: 3,
              mb: 3,
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                borderRadius: 3,
              }
            }} 
          />
          <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
            Cargando imágenes de perfil...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Recargando página para optimizar la carga de contenido
          </Typography>
        </Box>
      </Container>
    );
  }

  // Pantalla de loading simplificada
  if (loading || !imageLoaded) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, p: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh">
          <LinearProgress 
            sx={{ 
              width: '100%', 
              maxWidth: 400,
              height: 6,
              borderRadius: 3,
              mb: 3,
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                borderRadius: 3,
              }
            }} 
          />
          
          <Skeleton variant="circular" width={80} height={80} sx={{ mb: 2 }} />
          <Skeleton variant="text" width={250} height={32} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={180} height={24} />
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Skeleton variant="rectangular" width={120} height={60} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" width={120} height={60} sx={{ borderRadius: 2 }} />
            <Skeleton variant="rectangular" width={120} height={60} sx={{ borderRadius: 2 }} />
          </Box>
        </Box>
      </Container>
    );
  }

  // Si no hay usuario, mostrar mensaje
  if (!currentUser) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, p: 3 }}>
        <Alert severity="warning">
          No se pudo cargar la información del usuario. Por favor, inicia sesión nuevamente.
        </Alert>
      </Container>
    );
  }

  // Verificar si el usuario es docente
  if (currentUser.role !== 'docente') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, p: 3 }}>
        <Alert severity="info">
          Esta sección está disponible solo para usuarios con rol de docente.
        </Alert>
      </Container>
    );
  }

  // Configuración de información del usuario
  const userInfo = [
    {
      icon: <Person />,
      label: 'Número de Control',
      value: currentUser?.numeroControl || 'N/A',
      color: '#3b82f6'
    },
    {
      icon: <Email />,
      label: 'Correo',
      value: currentUser?.email || 'N/A',
      color: '#ef4444'
    },
    {
      icon: <School />,
      label: 'Carrera',
      value: currentUser?.carrera?.nombre || 'N/A',
      color: '#10b981'
    }
  ];

  // Determinar la URL de la imagen
  const getImageUrl = () => {
    if (!currentUser?.fotoPerfil || imageError) {
      return undefined; // Usar avatar por defecto
    }
    return `http://localhost:3001/uploads/perfiles/${currentUser.fotoPerfil}?t=${Date.now()}`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 6, sm: 8, md: 10 }, p: 3 }}>
      <Box>
        {/* Mensaje de bienvenida con más espacio del navbar */}
        {openWelcome && currentUser && (
          <Alert
            severity="success"
            sx={{ 
              mb: 4,
              mt: { xs: 2, sm: 3, md: 4 }, // Espacio adicional desde el top
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
              '& .MuiAlert-icon': {
                color: 'white',
              }
            }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={() => setOpenWelcome(false)}
              >
                <Close />
              </IconButton>
            }
          >
            <Typography variant={isMobile ? "body2" : "body1"} fontWeight="medium">
              ¡Bienvenido(a) {`${currentUser.nombre} ${currentUser.apellidoPaterno}`}! 
              {!isMobile && " Iniciaste sesión correctamente."}
            </Typography>
          </Alert>
        )}

        {/* Mensaje de error */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={() => setError('')}
              >
                <Close />
              </IconButton>
            }
          >
            {error}
          </Alert>
        )}

        {/* Mensaje informativo si hubo problemas con la imagen */}
        {imageError && (
          <Alert 
            severity="info" 
            sx={{ mb: 3, borderRadius: 2 }}
          >
            <Typography variant="body2">
              No se pudo cargar la imagen de perfil. Se está usando el avatar por defecto.
            </Typography>
          </Alert>
        )}

        {/* Perfil del usuario */}
        <Card sx={{ 
          mb: 3, 
          borderRadius: 3,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Barra de gradiente superior */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c)',
          }} />
          
          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              {/* Avatar */}
              <Grid item xs={12} md={4} display="flex" justifyContent="center">
                <Avatar
                  src={getImageUrl()}
                  alt={`Foto de perfil de ${currentUser?.nombre || 'Usuario'}`}
                  sx={{ 
                    width: { xs: 120, sm: 140, md: 160 },
                    height: { xs: 120, sm: 140, md: 160 },
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    border: '4px solid white',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                  }}
                  onError={() => {
                    console.log('❌ Error en Avatar component');
                    setImageError(true);
                  }}
                >
                  {currentUser?.nombre?.charAt(0) || 'U'}
                </Avatar>
              </Grid>

              {/* Información del usuario */}
              <Grid item xs={12} md={8}>
                <Box textAlign={{ xs: 'center', md: 'left' }}>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"}
                    fontWeight="bold" 
                    sx={{ 
                      mb: 2,
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {`${currentUser?.nombre || ''} ${currentUser?.apellidoPaterno || ''} ${currentUser?.apellidoMaterno || ''}`}
                  </Typography>
                  
                  <Box display="flex" justifyContent={{ xs: 'center', md: 'flex-start' }} mb={2}>
                    <Chip
                      icon={<AccountCircle />}
                      label="Docente"
                      color="primary"
                      size={isMobile ? "small" : "medium"}
                      sx={{ fontWeight: 'medium' }}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    {userInfo.map((info, index) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2,
                            borderRadius: 2,
                            background: 'rgba(248, 250, 252, 0.8)',
                            border: '1px solid rgba(226, 232, 240, 0.6)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                            }
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={2}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 2,
                                background: info.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                              }}
                            >
                              {info.icon}
                            </Box>
                            <Box flex={1}>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  textTransform: 'uppercase',
                                  fontWeight: 'bold',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                {info.label}
                              </Typography>
                              <Typography 
                                variant="body1"
                                color="text.primary"
                                fontWeight="medium"
                                sx={{ wordBreak: 'break-word' }}
                              >
                                {info.value}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Sección de asignaciones */}
        <Box>
          <Typography 
            variant={isMobile ? "h5" : "h4"}
            fontWeight="bold" 
            sx={{ 
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Dashboard />
            Mis Asignaciones
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}
          >
            <TeacherAssignments />
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default ActiveSession;