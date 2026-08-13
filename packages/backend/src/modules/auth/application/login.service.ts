import { UnauthorizedError } from '@back-stage/shared';

import { signAccessToken } from '../../../shared/auth/jwt.js';
import { comparePassword } from '../../../shared/auth/password.js';
import type { UserAuthRepository } from '../infrastructure/user-auth.repository.js';

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    roles: string[];
  };
}

export class LoginService {
  public constructor(private readonly userAuthRepository: UserAuthRepository) {}

  public async execute(email: string, password: string): Promise<LoginResult> {
    const record = await this.userAuthRepository.findByEmail(email);

    if (!record || !record.is_active) {
      throw new UnauthorizedError('Credenciais invalidas');
    }

    const passwordMatches = await comparePassword(password, record.password_hash);

    if (!passwordMatches) {
      throw new UnauthorizedError('Credenciais invalidas');
    }

    const user = {
      id: record.id,
      email: record.email,
      fullName: record.full_name,
      roles: record.roles,
    };

    return {
      accessToken: signAccessToken(user),
      user,
    };
  }
}
