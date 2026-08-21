import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';
import { UnauthorizedError } from '@back-stage/shared';

// Mock modules at the top level
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;

  beforeEach(() => {
    mockUserRepository = {
      findByCode: vi.fn(),
    };
    service = new AuthService(mockUserRepository);

    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('returns JWT token for valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        code: 'admin',
        email: 'admin@example.com',
        fullName: 'Admin User',
        roles: ['admin'],
        password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
      };

      mockUserRepository.findByCode.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue('mocked-jwt-token');

      const result = await service.login('admin', 'password123');

      expect(result.token).toBeDefined();
      expect(result.token).toBe('mocked-jwt-token');
      expect(result.user.id).toBe('user-1');
      expect(result.user.roles).toContain('admin');
    });

    it('throws UnauthorizedError for incorrect password', async () => {
      const mockUser = {
        id: 'user-1',
        code: 'admin',
        email: 'admin@example.com',
        fullName: 'Admin User',
        roles: ['admin'],
        password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz',
      };

      mockUserRepository.findByCode.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(service.login('admin', 'wrongpassword')).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('throws UnauthorizedError for non-existent user', async () => {
      mockUserRepository.findByCode.mockResolvedValue(null);

      await expect(service.login('nonexistent', 'password123')).rejects.toThrow(
        UnauthorizedError,
      );
    });
  });

  describe('validateToken', () => {
    it('decodes and returns user from valid JWT', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const decodedPayload = {
        id: 'user-1',
        role: 'admin',
      };

      vi.mocked(jwt.verify).mockReturnValue(decodedPayload as never);

      const result = service.validateToken(token);

      expect(result.id).toBe('user-1');
      expect(result.role).toBe('admin');
    });

    it('throws UnauthorizedError for invalid JWT', () => {
      const invalidToken = 'invalid.token.here';

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => service.validateToken(invalidToken)).toThrow(UnauthorizedError);
    });
  });

  describe('hasPermission', () => {
    it('grants admin access to all resources', () => {
      const adminUser = {
        id: 'admin-1',
        roles: ['admin'],
      };

      expect(service.hasPermission(adminUser, 'delete_server')).toBe(true);
    });

    it('grants maintainer write but not delete', () => {
      const maintainerUser = {
        id: 'maintainer-1',
        roles: ['maintainer'],
      };

      expect(service.hasPermission(maintainerUser, 'create_server')).toBe(true);
      expect(service.hasPermission(maintainerUser, 'delete_server')).toBe(false);
    });

    it('grants viewer read-only access', () => {
      const viewerUser = {
        id: 'viewer-1',
        roles: ['viewer'],
      };

      expect(service.hasPermission(viewerUser, 'read_server')).toBe(true);
      expect(service.hasPermission(viewerUser, 'create_server')).toBe(false);
    });
  });
});
