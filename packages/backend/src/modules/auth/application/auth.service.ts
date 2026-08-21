import { UnauthorizedError } from '@back-stage/shared';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { UserAuthRepository } from '../infrastructure/user-auth.repository.js';

export interface User {
  id: string;
  code: string;
  email: string;
  fullName: string;
  roles: string[];
  password_hash: string;
}

export interface AuthenticatedUser {
  id: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['read_server', 'create_server', 'update_server', 'delete_server'],
  maintainer: ['read_server', 'create_server', 'update_server'],
  viewer: ['read_server'],
};

export class AuthService {
  constructor(private userRepository: UserAuthRepository) {}

  async login(code: string, password: string): Promise<{ token: string; user: User }> {
    const user = await this.userRepository.findByCode(code);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid password');
    }

    const token = jwt.sign({ id: user.id, role: user.roles[0] }, JWT_SECRET, {
      expiresIn: '1h',
    });

    return {
      token,
      user,
    };
  }

  validateToken(token: string): AuthenticatedUser {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
      return decoded;
    } catch {
      throw new UnauthorizedError('Invalid token');
    }
  }

  hasPermission(user: { roles: string[] }, permission: string): boolean {
    const userRole = user.roles[0];
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission);
  }
}
