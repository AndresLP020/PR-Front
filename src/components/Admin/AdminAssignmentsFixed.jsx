import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    IconButton,
    Tooltip,
    Badge,
    Slide,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    InputAdornment,
    FormControl,
    InputLabel,
    Select
} from '@mui/material';
import {
    Assignment as AssignmentIcon,
    Schedule,
    CheckCircle,
    Warning,
    Search,
    Refresh,
    Visibility,
    Done,
    Close,
    CalendarToday,
    FileDownload,
    Person,
    School,
    AdminPanelSettings,
    Edit as EditIcon,
    PlaylistAddCheck,
    AssignmentInd,
    FilterList
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';
import { 
    getAdminAllAssignments, 
    markAssignmentCompletedByAdmin,
    updateAssignmentByAdmin,
    getTeachersStatusForAssignment,
    updateTeacherStatusInAssignment
} from '../../services/assignmentService';
import EditAssignment from './EditAssignment';
import ScheduledAssignments from './ScheduledAssignmentsSimple';

// Custom animated components
const AnimatedBadge = motion(Badge);

const AdminAssignments = ({ open, onClose }) => {
    console.log('🔄 AdminAssignmentsFixed - Rendering with props:', { open, onClose: !!onClose });
    
    const theme = useTheme();
    console.log('🎨 Theme loaded:', !!theme);
    
    // Estados principales
    const [assignments, setAssignments] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [teachers, setTeachers] = useState([]);
    
    // Estados para filtros
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('-createdAt');
    const [teacherFilter, setTeacherFilter] = useState('all');
    
    // Estados para paginación
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Estados para diálogos
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showDetailDialog, setShowDetailDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showScheduledDialog, setShowScheduledDialog] = useState(false);
    const [showTeacherStatusDialog, setShowTeacherStatusDialog] = useState(false);
    const [assignmentTeachers, setAssignmentTeachers] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Usar la misma API de estadísticas que Structure.jsx
    const loadStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No hay token de autenticación');
            const response = await fetch('http://localhost:3001/api/stats/teachers', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const responseData = await response.text();
            if (!response.ok) throw new Error(`Error ${response.status}: ${responseData}`);
            const data = JSON.parse(responseData);
            if (!Array.isArray(data)) throw new Error('Los datos recibidos no son un array');
            // Procesar igual que Structure.jsx
            const statsMap = {};
            data.forEach(stat => {
                if (stat && stat.teacherId) {
                    statsMap[stat.teacherId] = {
                        teacherName: stat.teacherName,
                        email: stat.email,
                        total: stat.total || 0,
                        completed: stat.completed || 0,
                        pending: stat.pending || 0,
                        overdue: stat.overdue || 0
                    };
                }
            });
            setStats(statsMap);
        } catch (error) {
            console.error('❌ Error loading teacher stats:', error);
        }
    }, []);

    const loadAssignments = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            
            console.log('🔍 Loading assignments with filters:', {
                statusFilter,
                searchTerm,
                sortBy,
                page,
                teacherFilter
            });
            
            const params = {
                status: statusFilter === 'overdue' ? 'overdue' : 
                       statusFilter === 'pending' ? 'pending' : statusFilter,
                // Añadir fecha actual para comparar con dueDate
                currentDate: new Date().toISOString(),
                search: searchTerm,
                sort: sortBy,
                page: page,
                limit: 10,
                ...(teacherFilter !== 'all' && { teacherId: teacherFilter })
            };

            console.log('📤 Calling getAdminAllAssignments with params:', params);
            const response = await getAdminAllAssignments(params);
            
            console.log('📥 Response received:', response);
            
            if (response && response.success) {
                console.log('✅ Setting assignments:', response.data?.assignments?.length || 0);
                console.log('✅ Setting teachers:', response.data?.teachers?.length || 0);
                
                setAssignments(response.data?.assignments || []);
                setTotalPages(response.data?.pagination?.pages || 1);
                setTeachers(response.data?.teachers || []);
            } else {
                setError('Error en la respuesta del servidor');
                console.error('❌ Invalid response:', response);
            }
        } catch (error) {
            console.error('❌ Error loading assignments:', error);
            console.error('❌ Error stack:', error.stack);
            console.error('❌ Error response:', error.response);
            console.error('❌ Error message:', error.message);
            
            let errorMessage = 'Error desconocido';
            if (error.message) {
                errorMessage = error.message;
            } else if (error.error) {
                errorMessage = error.error;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            setError('Error cargando asignaciones: ' + errorMessage);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [statusFilter, searchTerm, sortBy, page, teacherFilter]);

    // Cargar datos cuando se abre el diálogo
    useEffect(() => {
        if (open) {
            console.log('🔄 Dialog opened, loading data...');
            loadStats();
            loadAssignments();
        }
    }, [open, loadStats, loadAssignments]);

    // Resetear página cuando cambien los filtros
    useEffect(() => {
        if (page !== 1) {
            console.log('🔄 Resetting page to 1 due to filter change');
            setPage(1);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, searchTerm, sortBy, teacherFilter]);

    const handleRefresh = useCallback(() => {
        console.log('🔄 === REFRESH MANUAL TRIGGERED ===');
        console.log('📊 Current filter states:', {
            statusFilter,
            searchTerm,
            sortBy,
            teacherFilter,
            page
        });
        console.log('📈 Current stats:', stats);
        console.log('📋 Current assignments count:', assignments.length);
        
        setIsRefreshing(true);
        loadAssignments();
        loadStats();
    }, [loadAssignments, loadStats, statusFilter, searchTerm, sortBy, teacherFilter, page, stats, assignments.length]);

    const handleCompleteAssignment = async (assignmentId) => {
        try {
            setActionLoading(true);
            setError('');
            
            const response = await markAssignmentCompletedByAdmin(assignmentId);
            
            if (response.success) {
                await loadAssignments();
                await loadStats();
                setShowDetailDialog(false);
            } else {
                throw new Error(response.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error completing assignment:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Error marcando como completado';
            setError(errorMessage);
        } finally {
            setActionLoading(false);
        }
    };

    const handleEditAssignment = (assignment) => {
        setSelectedAssignment(assignment);
        setShowEditDialog(true);
    };

    // Nueva función para manejar el diálogo de estados de docentes
    const handleManageTeacherStates = async (assignment) => {
        try {
            setActionLoading(true);
            setSelectedAssignment(assignment);
            
            // Usar el servicio en lugar de fetch directo
            const data = await getTeachersStatusForAssignment(assignment._id);
            setAssignmentTeachers(data.teachersStatus || []);
            setShowTeacherStatusDialog(true);
        } catch (error) {
            console.error('Error:', error);
            setError(error.message || 'Error al cargar los estados de los docentes');
        } finally {
            setActionLoading(false);
        }
    };

    // Función para actualizar el estado de un docente específico
    const handleUpdateTeacherStatus = async (teacherId, newStatus) => {
        try {
            setActionLoading(true);
            
            // Usar el servicio en lugar de fetch directo
            await updateTeacherStatusInAssignment(selectedAssignment._id, teacherId, newStatus);
            
            // Recargar los estados actualizados
            await handleManageTeacherStates(selectedAssignment);
            await loadAssignments(); // Recargar la lista principal
        } catch (error) {
            console.error('Error:', error);
            setError(error.message || 'Error al actualizar el estado del docente');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveAssignment = async (updatedData) => {
        try {
            setActionLoading(true);
            setError('');
            
            const response = await updateAssignmentByAdmin(updatedData._id, updatedData);
            
            if (response.success) {
                await loadAssignments();
                await loadStats();
                setShowEditDialog(false);
                setSelectedAssignment(null);
                
                // Mostrar mensaje específico según el tipo de operación
                if (response.type === 'specific_assignment_created') {
                    // Podríamos mostrar una notificación especial aquí
                    console.log('✅ Asignación específica creada para el docente seleccionado');
                } else {
                    console.log('✅ Asignación actualizada para todos los docentes');
                }
            } else {
                throw new Error(response.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error updating assignment:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Error actualizando asignación';
            setError(errorMessage);
        } finally {
            setActionLoading(false);
        }
    };

    // Función para determinar si una asignación está vencida
    const isAssignmentOverdue = (assignment) => {
        if (assignment.status !== 'pending') return false;
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        return now > dueDate;
    };

    // Función para obtener el estado real de la asignación (incluyendo vencidas)
    const getRealAssignmentStatus = (assignment) => {
        if (assignment.status === 'pending' && isAssignmentOverdue(assignment)) {
            return 'overdue';
        }
        return assignment.status;
    };

    const getStatusColor = (assignment) => {
        const realStatus = getRealAssignmentStatus(assignment);
        switch (realStatus) {
            case 'completed':
                return 'success';
            case 'completed-late':
                return 'warning';
            case 'not-delivered':
            case 'overdue':
                return 'error';
            case 'pending':
                return 'info';
            default:
                return 'grey';
        }
    };

    const getStatusLabel = (assignment) => {
        const realStatus = getRealAssignmentStatus(assignment);
        switch (realStatus) {
            case 'completed':
                return 'Entregado';
            case 'completed-late':
                return 'Entregado con Retraso';
            case 'not-delivered':
                return 'No Entregado';
            case 'overdue':
                return 'Vencida';
            case 'pending':
                return 'Pendiente';
            default:
                return realStatus || 'Desconocido';
        }
    };

    const formatDateWithTime = (dateString) => {
        try {
            if (!dateString || dateString === 'Invalid Date') return 'Fecha inválida';
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Fecha inválida';
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Error formatting date with time:', error);
            return 'Fecha inválida';
        }
    };

    // Si no está abierto, no renderizar nada
    if (!open) {
        console.log('🚪 AdminAssignmentsFixed - Dialog closed, not rendering');
        return null;
    }

    console.log('🎬 AdminAssignmentsFixed - About to render Dialog with states:', {
        assignments: assignments.length,
        stats: !!stats,
        loading,
        error: !!error,
        teachers: teachers.length
    });

    try {
        return (
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="xl"
                fullWidth
                TransitionComponent={Slide}
                transitionDuration={300}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        background: theme?.palette?.background?.paper && theme?.palette?.grey?.[50] 
                            ? `linear-gradient(to bottom, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`
                            : '#ffffff',
                        minHeight: '90vh'
                    }
                }}
        >
            <DialogTitle sx={{ 
                py: 2,
                px: 3,
                background: `linear-gradient(to right, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <AdminPanelSettings sx={{ fontSize: 28 }} />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        Gestión de Asignaciones
                    </Typography>
                </Box>
                <IconButton 
                    onClick={onClose}
                    sx={{ color: 'white' }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {/* Estadísticas generales */}
                {stats && stats.overview && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {[
                            { 
                                icon: <AssignmentIcon sx={{ fontSize: 32 }} />, 
                                value: stats.overview.total, 
                                label: 'Total',
                                color: 'primary',
                                filterValue: 'all'
                            },
                            { 
                                icon: <Schedule sx={{ fontSize: 32 }} />, 
                                value: stats.overview.pending, 
                                label: 'Pendientes',
                                color: 'info',
                                filterValue: 'pending'
                            },
                            { 
                                icon: <CheckCircle sx={{ fontSize: 32 }} />, 
                                value: stats.overview.completed, 
                                label: 'Entregadas',
                                color: 'success',
                                filterValue: 'completed'
                            },
                            { 
                                icon: <Warning sx={{ fontSize: 32 }} />, 
                                value: stats.overview['completed-late'] || 0, 
                                label: 'Entregadas con Retraso',
                                color: 'warning',
                                filterValue: 'completed-late'
                            },
                            { 
                                icon: <Close sx={{ fontSize: 32 }} />, 
                                value: stats.overview['not-delivered'] || 0, 
                        label: 'No Entregado',
                                color: 'error',
                                filterValue: 'not-delivered'
                            }
                        ].map((stat, index) => (
                            <Grid item xs={6} sm={4} md={2.4} key={index}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    whileHover={{ y: -5 }}
                                >
                                    <Card 
                                        onClick={() => {
                                            setStatusFilter(stat.filterValue);
                                            setPage(1);
                                        }}
                                        sx={{ 
                                            height: '100%', 
                                            borderRadius: 2,
                                            boxShadow: theme.shadows[3],
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            border: statusFilter === stat.filterValue ? `2px solid ${theme.palette[stat.color].main}` : 'none',
                                            '&:hover': {
                                                boxShadow: theme.shadows[6],
                                                transform: 'translateY(-2px)'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ textAlign: 'center', py: 2 }}>
                                            <AnimatedBadge 
                                                badgeContent={stat.value} 
                                                color={stat.color} 
                                                max={999}
                                            >
                                                {React.cloneElement(stat.icon, { 
                                                    color: stat.color,
                                                    sx: { fontSize: 32 }
                                                })}
                                            </AnimatedBadge>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                {stat.label}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* Controles de filtros mejorados */}
                <Paper sx={{ 
                    p: 3, 
                    mb: 3, 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    {/* Título de filtros */}
                    <Typography variant="h6" sx={{ 
                        mb: 3, 
                        fontWeight: 'bold',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <FilterList />
                        Filtros y Búsqueda
                    </Typography>

                    {/* Barra de búsqueda destacada */}
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            fullWidth
                            size="medium"
                            placeholder="🔍 Buscar asignaciones por título o descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.8) 100%)',
                                    '&:hover': {
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    },
                                    '&.Mui-focused': {
                                        boxShadow: '0 4px 20px rgba(25,118,210,0.2)',
                                    }
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: 'primary.main', fontSize: 24 }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>

                    {/* Botones de filtro por estado */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ 
                            mb: 2, 
                            fontWeight: 'bold',
                            color: 'text.primary'
                        }}>
                            Filtrar por Estado
                        </Typography>
                        <Box sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 1.5,
                            justifyContent: { xs: 'center', md: 'flex-start' }
                        }}>
                            {[
                                { 
                                    value: 'all', 
                                    label: 'Todos', 
                                    icon: <AssignmentIcon />, 
                                    color: 'primary',
                                    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                },
                                { 
                                    value: 'pending', 
                                    label: 'Pendientes', 
                                    icon: <Schedule />, 
                                    color: 'info',
                                    gradient: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
                                    status: 'pending'
                                },
                                { 
                                    value: 'overdue', 
                                    label: 'Vencidas', 
                                    icon: <Close />, 
                                    color: 'error',
                                    gradient: 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)'
                                },
                                { 
                                    value: 'completed', 
                                    label: 'Entregadas', 
                                    icon: <CheckCircle />, 
                                    color: 'success',
                                    gradient: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)'
                                },
                            ].map((filter) => (
                                <motion.div
                                    key={filter.value}
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        variant={statusFilter === filter.value ? "contained" : "outlined"}
                                        onClick={() => {
                                            setStatusFilter(filter.value);
                                            setPage(1);
                                        }}
                                        startIcon={filter.icon}
                                        sx={{
                                            borderRadius: 3,
                                            px: 3,
                                            py: 1.5,
                                            fontWeight: 'bold',
                                            textTransform: 'none',
                                            fontSize: '0.9rem',
                                            minWidth: 140,
                                            boxShadow: statusFilter === filter.value 
                                                ? '0 8px 25px rgba(0,0,0,0.15)' 
                                                : '0 4px 15px rgba(0,0,0,0.1)',
                                            background: statusFilter === filter.value 
                                                ? filter.gradient
                                                : 'rgba(255,255,255,0.8)',
                                            border: statusFilter === filter.value 
                                                ? 'none'
                                                : `2px solid ${theme.palette[filter.color].main}`,
                                            color: statusFilter === filter.value 
                                                ? 'white'
                                                : theme.palette[filter.color].main,
                                            '&:hover': {
                                                background: statusFilter === filter.value 
                                                    ? filter.gradient
                                                    : `${theme.palette[filter.color].main}15`,
                                                boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                                                transform: 'translateY(-2px)',
                                            },
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        }}
                                    >
                                        {filter.label}
                                    </Button>
                                </motion.div>
                            ))}
                        </Box>
                    </Box>

                    {/* Controles adicionales */}
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel sx={{ fontWeight: 'bold' }}>Ordenar por</InputLabel>
                                <Select
                                    value={sortBy}
                                    label="Ordenar por"
                                    onChange={(e) => setSortBy(e.target.value)}
                                    sx={{
                                        borderRadius: 2,
                                        '& .MuiOutlinedInput-root': {
                                            background: 'rgba(255,255,255,0.8)',
                                        }
                                    }}
                                >
                                    <MenuItem value="-createdAt">📅 Más recientes</MenuItem>
                                    <MenuItem value="createdAt">📅 Más antiguas</MenuItem>
                                    <MenuItem value="dueDate">⏰ Fecha de entrega (próximas)</MenuItem>
                                    <MenuItem value="-dueDate">⏰ Fecha de entrega (lejanas)</MenuItem>
                                    <MenuItem value="title">🔤 Título A-Z</MenuItem>
                                    <MenuItem value="-title">🔤 Título Z-A</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth>
                                <InputLabel sx={{ fontWeight: 'bold' }}>Filtrar por Docente</InputLabel>
                                <Select
                                    value={teacherFilter}
                                    onChange={(e) => setTeacherFilter(e.target.value)}
                                    label="Filtrar por Docente"
                                    sx={{
                                        borderRadius: 2,
                                        '& .MuiOutlinedInput-root': {
                                            background: 'rgba(255,255,255,0.8)',
                                        }
                                    }}
                                >
                                    <MenuItem value="all">
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Person />
                                            Todos los docentes
                                        </Box>
                                    </MenuItem>
                                    {teachers.map((teacher) => (
                                        <MenuItem key={teacher._id} value={teacher._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <School />
                                                {`${teacher.nombre} ${teacher.apellidoPaterno} ${teacher.apellidoMaterno}`}
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing}
                                    startIcon={isRefreshing ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
                                    sx={{
                                        borderRadius: 3,
                                        py: 1.5,
                                        fontWeight: 'bold',
                                        textTransform: 'none',
                                        fontSize: '1rem',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                                        '&:hover': {
                                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                                            boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
                                            transform: 'translateY(-2px)',
                                        },
                                        '&:disabled': {
                                            background: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
                                        },
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    }}
                                >
                                    {isRefreshing ? 'Actualizando...' : 'Actualizar'}
                                </Button>
                            </motion.div>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Mensajes de error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Alert 
                                severity="error" 
                                sx={{ mb: 2 }} 
                                onClose={() => setError('')}
                                variant="filled"
                            >
                                {error}
                            </Alert>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tabla de asignaciones */}
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                        <CircularProgress size={60} />
                    </Box>
                ) : assignments.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                        <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No se encontraron asignaciones
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Ajusta los filtros para ver más resultados
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 3 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Título</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Docente</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Fecha de Entrega</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Fecha de Cierre</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {assignments.map((assignment) => {
                                    return (
                                        <TableRow 
                                            key={assignment._id}
                                            hover
                                            sx={{
                                                '&:last-child td, &:last-child th': { border: 0 },
                                                borderLeft: `4px solid ${theme?.palette?.[getStatusColor(assignment)]?.main || '#ccc'}`
                                            }}
                                        >
                                            <TableCell>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                                    {assignment.title}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ 
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden'
                                                }}>
                                                    {assignment.description}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <School sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Box>
                                                        {(() => {
                                                            if (teacherFilter !== 'all') {
                                                                const selectedTeacher = assignment.assignedTo?.find(teacher => teacher._id === teacherFilter);
                                                                if (selectedTeacher) {
                                                                    return (
                                                                        <>
                                                                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                                                {`${selectedTeacher.nombre} ${selectedTeacher.apellidoPaterno} ${selectedTeacher.apellidoMaterno}`}
                                                                            </Typography>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                {selectedTeacher.email}
                                                                            </Typography>
                                                                        </>
                                                                    );
                                                                }
                                                            }
                                                            
                                                            if (assignment.assignedTo && assignment.assignedTo.length > 0) {
                                                                const firstTeacher = assignment.assignedTo[0];
                                                                return (
                                                                    <>
                                                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                                            {`${firstTeacher.nombre} ${firstTeacher.apellidoPaterno} ${firstTeacher.apellidoMaterno}`}
                                                                            {assignment.assignedTo.length > 1 && ` +${assignment.assignedTo.length - 1} más`}
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {firstTeacher.email}
                                                                        </Typography>
                                                                    </>
                                                                );
                                                            }
                                                            
                                                            return (
                                                                <>
                                                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                                        Sin asignar
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Sin email
                                                                    </Typography>
                                                                </>
                                                            );
                                                        })()}
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getStatusLabel(assignment)}
                                                    color={getStatusColor(assignment)}
                                                    size="small"
                                                    sx={{ fontWeight: 'bold' }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {formatDateWithTime(assignment.dueDate)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {formatDateWithTime(assignment.closeDate)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="Ver Detalles">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                setSelectedAssignment(assignment);
                                                                setShowDetailDialog(true);
                                                            }}
                                                            color="primary"
                                                        >
                                                            <Visibility />
                                                        </IconButton>
                                                    </Tooltip>
                                                    
                                                    {assignment.status === 'pending' && (
                                                        <Tooltip title="Marcar como Completado">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleCompleteAssignment(assignment._id)}
                                                                color="success"
                                                                disabled={actionLoading}
                                                            >
                                                                <Done />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip title="Editar Asignación">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEditAssignment(assignment)}
                                                            color="info"
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                    
                                                    <Tooltip title="Gestionar Estados de Docentes">
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Paginación */}
                {totalPages > 1 && (
                    <Box display="flex" justifyContent="center" mt={2}>
                        <Button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            variant="outlined"
                            sx={{ mr: 2 }}
                        >
                            Anterior
                        </Button>
                        <Typography sx={{ px: 2, py: 1, alignSelf: 'center' }}>
                            Página {page} de {totalPages}
                        </Typography>
                        <Button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            variant="outlined"
                            sx={{ ml: 2 }}
                        >
                            Siguiente
                        </Button>
                    </Box>
                )}
            </DialogContent>

            {/* Diálogo de detalles de asignación */}
            <Dialog
                open={showDetailDialog}
                onClose={() => setShowDetailDialog(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        background: `linear-gradient(to bottom, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`
                    }
                }}
            >
                {selectedAssignment && (
                    <>
                        <DialogTitle sx={{ 
                            py: 2,
                            px: 3,
                            background: `linear-gradient(to right, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                {selectedAssignment.title}
                            </Typography>
                            <IconButton 
                                onClick={() => setShowDetailDialog(false)}
                                sx={{ color: 'white' }}
                            >
                                <Close />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{ p: 3 }}>
                            <Box mb={2}>
                                <Chip
                                    label={getStatusLabel(selectedAssignment)}
                                    color={getStatusColor(selectedAssignment)}
                                    sx={{ 
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: 1
                                    }}
                                />
                            </Box>
                            
                            <Typography variant="body1" paragraph sx={{ 
                                whiteSpace: 'pre-line',
                                lineHeight: 1.6
                            }}>
                                {selectedAssignment.description}
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" sx={{ 
                                        mb: 2,
                                        fontWeight: 'bold',
                                        color: 'primary.main'
                                    }}>
                                        Información del Docente
                                    </Typography>
                                    <Box sx={{ 
                                        p: 2,
                                        borderRadius: 2,
                                        background: theme.palette.grey[50],
                                        boxShadow: theme.shadows[1]
                                    }}>
                                        <Typography variant="body1" sx={{ mb: 1 }}>
                                            <strong>Docente Asignado:</strong> {selectedAssignment.assignedTo && selectedAssignment.assignedTo.length > 0 ? 
                                                `${selectedAssignment.assignedTo[0].nombre} ${selectedAssignment.assignedTo[0].apellidoPaterno} ${selectedAssignment.assignedTo[0].apellidoMaterno}` :
                                                'Sin asignar'
                                            }
                                        </Typography>
                                        <Typography variant="body1">
                                            <strong>Email:</strong> {selectedAssignment.assignedTo && selectedAssignment.assignedTo.length > 0 ?
                                                selectedAssignment.assignedTo[0].email :
                                                'Sin email'
                                            }
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1" sx={{ 
                                        mb: 2,
                                        fontWeight: 'bold',
                                        color: 'primary.main'
                                    }}>
                                        Fechas Importantes
                                    </Typography>
                                    <Box sx={{ 
                                        p: 2,
                                        borderRadius: 2,
                                        background: theme.palette.grey[50],
                                        boxShadow: theme.shadows[1]
                                    }}>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Fecha de Entrega:</strong> {formatDateWithTime(selectedAssignment.dueDate)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            <strong>Fecha de Cierre:</strong> {formatDateWithTime(selectedAssignment.closeDate)}
                                        </Typography>
                                        <Typography variant="body2">
                                            <strong>Creado el:</strong> {formatDateWithTime(selectedAssignment.createdAt)}
                                        </Typography>
                                    </Box>
                                </Grid>

                                {selectedAssignment.attachments && selectedAssignment.attachments.length > 0 && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle1" sx={{ 
                                            mb: 2,
                                            fontWeight: 'bold',
                                            color: 'primary.main'
                                        }}>
                                            Archivos Adjuntos
                                        </Typography>
                                        <Box sx={{ 
                                            p: 2,
                                            borderRadius: 2,
                                            background: theme.palette.grey[50],
                                            boxShadow: theme.shadows[1]
                                        }}>
                                            <Grid container spacing={1}>
                                                {selectedAssignment.attachments.map((file, index) => (
                                                    <Grid item key={index}>
                                                        <Chip
                                                            icon={<FileDownload />}
                                                            label={file.fileName}
                                                            onClick={() => window.open(`http://localhost:3001/${file.fileUrl}`, '_blank')}
                                                            sx={{ 
                                                                mr: 1, 
                                                                mb: 1,
                                                                cursor: 'pointer',
                                                                '&:hover': {
                                                                    background: theme.palette.primary.light,
                                                                    color: 'white'
                                                                }
                                                            }}
                                                            variant="outlined"
                                                        />
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ 
                            p: 2,
                            borderTop: `1px solid ${theme.palette.divider}`
                        }}>
                            {selectedAssignment.status === 'pending' && (
                                <Button
                                    color="success"
                                    variant="contained"
                                    startIcon={<Done />}
                                    onClick={() => handleCompleteAssignment(selectedAssignment._id)}
                                    disabled={actionLoading}
                                    sx={{ mr: 1 }}
                                >
                                    {actionLoading ? 'Completando...' : 'Marcar como Completado'}
                                </Button>
                            )}
                            <Button 
                                onClick={() => setShowDetailDialog(false)}
                                variant="outlined"
                            >
                                Cerrar
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Diálogo de edición de asignación */}
            <EditAssignment 
                open={showEditDialog}
                onClose={() => setShowEditDialog(false)}
                assignment={selectedAssignment}
                onSave={handleSaveAssignment}
                teachers={teachers}
                loading={actionLoading}
            />

            {/* Diálogo de asignaciones programadas */}
            <ScheduledAssignments
                open={showScheduledDialog}
                onClose={() => setShowScheduledDialog(false)}
                teachers={teachers}
            />

            {/* Diálogo para gestionar estados de docentes */}
            <Dialog
                open={showTeacherStatusDialog}
                onClose={() => setShowTeacherStatusDialog(false)}
                maxWidth="md"
                fullWidth
                TransitionComponent={Slide}
                transitionDuration={300}
            >
                <DialogTitle sx={{ 
                    backgroundColor: 'primary.main', 
                    color: 'primary.contrastText',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <PlaylistAddCheck />
                        <Typography variant="h6">
                            Gestionar Estados de Docentes
                        </Typography>
                    </Box>
                    <IconButton 
                        onClick={() => setShowTeacherStatusDialog(false)}
                        sx={{ color: 'primary.contrastText' }}
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent sx={{ p: 3 }}>
                    {selectedAssignment && (
                        <>
                            <Typography variant="h6" gutterBottom>
                                {selectedAssignment.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {selectedAssignment.description}
                            </Typography>
                            
                            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                                Estados de Entrega por Docente
                            </Typography>
                            
                            {assignmentTeachers.length === 0 ? (
                                <Typography variant="body1" color="text.secondary">
                                    {actionLoading ? 'Cargando docentes...' : 'No hay docentes asignados a esta actividad.'}
                                </Typography>
                            ) : (
                                <Grid container spacing={2}>
                                    {assignmentTeachers.map((teacher, index) => (
                                        <Grid item xs={12} key={index}>
                                            <Paper 
                                                elevation={2} 
                                                sx={{ 
                                                    p: 2, 
                                                    borderRadius: 2,
                                                    border: '1px solid',
                                                    borderColor: 'divider'
                                                }}
                                            >
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Box display="flex" alignItems="center" gap={2}>
                                                        <AssignmentInd color="primary" />
                                                        <Box>
                                                            <Typography variant="subtitle1" fontWeight="bold">
                                                                {teacher.nombre} {teacher.apellidoPaterno} {teacher.apellidoMaterno || ''}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {teacher.email}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    
                                                    <Box display="flex" alignItems="center" gap={2}>
                                                        <FormControl size="small" sx={{ minWidth: 200 }}>
                                                            <InputLabel>Seleccionar Estado</InputLabel>
                                                            <Select
                                                                value={teacher.status || 'pending'}
                                                                label="Seleccionar Estado"
                                                                onChange={(e) => handleUpdateTeacherStatus(teacher._id || teacher.teacherId, e.target.value)}
                                                                disabled={actionLoading}
                                                            >
                                                                <MenuItem value="completed">
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <Chip 
                                                                            size="small" 
                                                                            label="Entregado" 
                                                                            sx={{ 
                                                                                backgroundColor: '#4caf50', 
                                                                                color: 'white',
                                                                                minWidth: 80
                                                                            }} 
                                                                        />
                                                                    </Box>
                                                                </MenuItem>
                                                                <MenuItem value="completed-late">
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <Chip 
                                                                            size="small" 
                                                                            label="Entregado con Retraso" 
                                                                            sx={{ 
                                                                                backgroundColor: '#ff9800', 
                                                                                color: 'white',
                                                                                minWidth: 80
                                                                            }} 
                                                                        />
                                                                    </Box>
                                                                </MenuItem>
                                                                <MenuItem value="not-delivered">
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <Chip 
                                                                            size="small" 
                                                                            label="No Entregado" 
                                                                            sx={{ 
                                                                                backgroundColor: '#f44336', 
                                                                                color: 'white',
                                                                                minWidth: 80
                                                                            }} 
                                                                        />
                                                                    </Box>
                                                                </MenuItem>
                                                                <MenuItem value="pending">
                                                                    <Box display="flex" alignItems="center" gap={1}>
                                                                        <Chip 
                                                                            size="small" 
                                                                            label="Pendiente" 
                                                                            sx={{ 
                                                                                backgroundColor: '#795548', 
                                                                                color: 'white',
                                                                                minWidth: 80
                                                                            }} 
                                                                        />
                                                                    </Box>
                                                                </MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                        
                                                        {/* Mostrar estado actual */}
                                                        <Box>
                                                            {teacher.status === 'completed' && (
                                                                <Chip 
                                                                    size="small" 
                                                                    label="Entregado" 
                                                                    sx={{ backgroundColor: '#4caf50', color: 'white' }} 
                                                                />
                                                            )}
                                                            {teacher.status === 'completed-late' && (
                                                                <Chip 
                                                                    size="small" 
                                                                    label="Entregado con Retraso" 
                                                                    sx={{ backgroundColor: '#ff9800', color: 'white' }} 
                                                                />
                                                            )}
                                                            {teacher.status === 'not-delivered' && (
                                                                <Chip 
                                                                    size="small" 
                                                                    label="No Entregado" 
                                                                    sx={{ backgroundColor: '#f44336', color: 'white' }} 
                                                                />
                                                            )}
                                                            {(!teacher.status || teacher.status === 'pending') && (
                                                                <Chip 
                                                                    size="small" 
                                                                    label="Pendiente" 
                                                                    sx={{ backgroundColor: '#795548', color: 'white' }} 
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </>
                    )}
                </DialogContent>
                
                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        onClick={() => setShowTeacherStatusDialog(false)}
                        variant="outlined"
                    >
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
    } catch (error) {
        console.error('🚨 AdminAssignmentsFixed - Render error:', error);
        return (
            <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        Error en el Componente
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        {error.message || 'Error desconocido'}
                    </Typography>
                    <Button onClick={onClose} variant="contained">
                        Cerrar
                    </Button>
                </Box>
            </Dialog>
        );
    }
};

export default AdminAssignments;