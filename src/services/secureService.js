import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const createSecureService = (apiBase = import.meta.env.VITE_API_URL) => {
  // Closure para mantener el contexto
  let secureRequestFn = null;

  const setSecureRequest = (fn) => {
    secureRequestFn = fn;
  };

  const ensureSecureRequest = () => {
    if (!secureRequestFn) throw new Error('SecureService not initialized with AuthContext');
  };

  return {
    init: (secureRequest) => {
      setSecureRequest(secureRequest);
    },

    // Wrapper genérico para peticiones seguras
    securePost: async (endpoint, data) => {
      ensureSecureRequest();
      const payload = {
        endpoint,
        method: 'POST',
        data
      };
      return await secureRequestFn(payload);
    },

    // Ejemplo: enviar una asignación de forma segura
    secureAssignment: {
      create: async (assignmentData) => {
        return await exports.securePost('/api/assignments', assignmentData);
      },
      
      update: async (id, assignmentData) => {
        return await exports.securePost(`/api/assignments/${id}`, assignmentData);
      },
      
      updateStage: async (id, stage) => {
        return await exports.securePost(`/api/assignments/${id}/stage`, { stage });
      }
    }
  };
};

// Hook personalizado para usar el servicio seguro
export const useSecureService = () => {
  const { secureRequest } = useContext(AuthContext);
  const service = createSecureService();
  service.init(secureRequest);
  return service;
};