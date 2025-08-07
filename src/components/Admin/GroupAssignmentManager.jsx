import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
    Search, 
    Users, 
    CheckCircle, 
    Clock, 
    AlertTriangle, 
    XCircle,
    UserCheck,
    UserX,
    RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

const GroupAssignmentManager = ({ onRefresh }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedTeachers, setSelectedTeachers] = useState([]);
    const [updating, setUpdating] = useState(false);

    // Cargar grupos de asignaciones
    const fetchGroups = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assignments/admin/grouped?search=${searchTerm}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar grupos de asignaciones');
            }

            const data = await response.json();
            setGroups(data.data.groups || []);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al cargar grupos de asignaciones');
        } finally {
            setLoading(false);
        }
    };

    // Cargar grupos cuando se abre el modal o cambia la búsqueda
    useEffect(() => {
        if (isOpen) {
            fetchGroups();
        }
    }, [isOpen, searchTerm]);

    // Manejar selección de grupo
    const handleGroupSelect = (group) => {
        setSelectedGroup(group);
        setSelectedTeachers(group.assignments.map(a => a.assignmentId));
    };

    // Manejar selección individual de docentes
    const handleTeacherToggle = (assignmentId) => {
        setSelectedTeachers(prev => 
            prev.includes(assignmentId) 
                ? prev.filter(id => id !== assignmentId)
                : [...prev, assignmentId]
        );
    };

    // Seleccionar todos los docentes
    const handleSelectAll = () => {
        if (!selectedGroup) return;
        setSelectedTeachers(selectedGroup.assignments.map(a => a.assignmentId));
    };

    // Deseleccionar todos los docentes
    const handleDeselectAll = () => {
        setSelectedTeachers([]);
    };

    // Actualizar estados masivamente
    const handleBulkUpdate = async (status) => {
        if (selectedTeachers.length === 0) {
            toast.error('Selecciona al menos un docente');
            return;
        }

        setUpdating(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assignments/admin/group-status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    assignmentIds: selectedTeachers,
                    status: status
                })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar estados');
            }

            const data = await response.json();
            
            toast.success(`${data.data.updatedCount} asignación(es) actualizada(s) exitosamente`);
            
            // Refrescar datos
            await fetchGroups();
            if (onRefresh) onRefresh();
            
            // Limpiar selección
            setSelectedTeachers([]);
            
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al actualizar estados');
        } finally {
            setUpdating(false);
        }
    };

    // Obtener color del estado
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'completed-late': return 'bg-yellow-100 text-yellow-800';
            case 'not-delivered': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Obtener etiqueta del estado
    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return 'Completada';
            case 'completed-late': return 'Con Retraso';
            case 'not-delivered': return 'No Entregada';
            case 'pending': return 'Pendiente';
            default: return status;
        }
    };

    // Obtener icono del estado
    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'completed-late': return <AlertTriangle className="w-4 h-4" />;
            case 'not-delivered': return <XCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Users className="w-4 h-4" />
                    Gestión Grupal
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Gestión Grupal de Asignaciones
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex gap-6">
                    {/* Panel izquierdo - Lista de grupos */}
                    <div className="w-1/2 flex flex-col">
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Buscar asignación..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : groups.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    No se encontraron asignaciones
                                </div>
                            ) : (
                                groups.map((group, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                            selectedGroup === group 
                                                ? 'border-blue-500 bg-blue-50' 
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => handleGroupSelect(group)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-sm line-clamp-2">
                                                {group.title}
                                            </h3>
                                            <Badge variant="outline" className="ml-2 shrink-0">
                                                {group.totalTeachers} docentes
                                            </Badge>
                                        </div>
                                        
                                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                            {group.description}
                                        </p>

                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex gap-2">
                                                <span className="text-green-600">
                                                    ✓ {group.completedCount}
                                                </span>
                                                <span className="text-blue-600">
                                                    ⏳ {group.pendingCount}
                                                </span>
                                            </div>
                                            <span className="text-gray-500">
                                                {Math.round(group.completionRate)}% completado
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Panel derecho - Detalles del grupo seleccionado */}
                    <div className="w-1/2 flex flex-col">
                        {selectedGroup ? (
                            <>
                                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                    <h3 className="font-semibold mb-2">{selectedGroup.title}</h3>
                                    <p className="text-sm text-gray-600 mb-3">{selectedGroup.description}</p>
                                    
                                    <div className="flex gap-4 text-sm">
                                        <span>
                                            <strong>Vencimiento:</strong> {new Date(selectedGroup.dueDate).toLocaleDateString()}
                                        </span>
                                        <span>
                                            <strong>Cierre:</strong> {new Date(selectedGroup.closeDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Controles de selección */}
                                <div className="mb-4 flex gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={handleSelectAll}
                                        className="gap-1"
                                    >
                                        <UserCheck className="w-4 h-4" />
                                        Todos
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={handleDeselectAll}
                                        className="gap-1"
                                    >
                                        <UserX className="w-4 h-4" />
                                        Ninguno
                                    </Button>
                                    <div className="ml-auto text-sm text-gray-600 flex items-center">
                                        {selectedTeachers.length} de {selectedGroup.totalTeachers} seleccionados
                                    </div>
                                </div>

                                {/* Lista de docentes */}
                                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                                    {selectedGroup.assignments.map((assignment) => (
                                        <div 
                                            key={assignment.assignmentId}
                                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                                        >
                                            <Checkbox
                                                checked={selectedTeachers.includes(assignment.assignmentId)}
                                                onCheckedChange={() => handleTeacherToggle(assignment.assignmentId)}
                                            />
                                            
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">
                                                    {assignment.teacherName}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {assignment.teacherEmail}
                                                </div>
                                            </div>

                                            <Badge className={`${getStatusColor(assignment.status)} gap-1`}>
                                                {getStatusIcon(assignment.status)}
                                                {getStatusLabel(assignment.status)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>

                                {/* Botones de acción */}
                                <div className="flex gap-2 pt-4 border-t">
                                    <Button
                                        size="sm"
                                        onClick={() => handleBulkUpdate('completed')}
                                        disabled={updating || selectedTeachers.length === 0}
                                        className="bg-green-600 hover:bg-green-700 gap-1"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Completadas
                                    </Button>
                                    
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleBulkUpdate('completed-late')}
                                        disabled={updating || selectedTeachers.length === 0}
                                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 gap-1"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        Con Retraso
                                    </Button>
                                    
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleBulkUpdate('not-delivered')}
                                        disabled={updating || selectedTeachers.length === 0}
                                        className="border-red-300 text-red-700 hover:bg-red-50 gap-1"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        No Entregadas
                                    </Button>
                                    
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleBulkUpdate('pending')}
                                        disabled={updating || selectedTeachers.length === 0}
                                        className="border-blue-300 text-blue-700 hover:bg-blue-50 gap-1"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Pendientes
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p>Selecciona una asignación para ver los docentes</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {updating && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-lg flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span>Actualizando estados...</span>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default GroupAssignmentManager;