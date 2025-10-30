import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSecureService } from '../src/services/secureService';

describe('secureService', () => {
  let service;
  let mockSecureRequest;

  beforeEach(() => {
    mockSecureRequest = vi.fn();
    service = createSecureService();
    service.init(mockSecureRequest);
  });

  it('envía peticiones POST seguras', async () => {
    const testData = { key: 'value' };
    mockSecureRequest.mockResolvedValue({ success: true });

    const result = await service.securePost('/test/endpoint', testData);

    expect(mockSecureRequest).toHaveBeenCalledWith({
      endpoint: '/test/endpoint',
      method: 'POST',
      data: testData
    });
    expect(result).toEqual({ success: true });
  });

  it('maneja errores en peticiones seguras', async () => {
    mockSecureRequest.mockRejectedValue(new Error('test error'));

    await expect(
      service.securePost('/test/endpoint', {})
    ).rejects.toThrow('test error');
  });

  it('envía asignaciones de forma segura', async () => {
    const testAssignment = {
      title: 'Test Assignment',
      description: 'Test Description'
    };
    mockSecureRequest.mockResolvedValue({ id: '123', ...testAssignment });

    const result = await service.secureAssignment.create(testAssignment);

    expect(mockSecureRequest).toHaveBeenCalledWith({
      endpoint: '/api/assignments',
      method: 'POST',
      data: testAssignment
    });
    expect(result).toHaveProperty('id', '123');
  });

  it('actualiza estados de asignación de forma segura', async () => {
    const testId = '123';
    const testStage = 'en curso';
    mockSecureRequest.mockResolvedValue({ success: true });

    await service.secureAssignment.updateStage(testId, testStage);

    expect(mockSecureRequest).toHaveBeenCalledWith({
      endpoint: `/api/assignments/${testId}/stage`,
      method: 'POST',
      data: { stage: testStage }
    });
  });

  it('falla si no se inicializa con secureRequest', async () => {
    const uninitializedService = createSecureService();
    
    await expect(
      uninitializedService.securePost('/test', {})
    ).rejects.toThrow('SecureService not initialized');
  });
});