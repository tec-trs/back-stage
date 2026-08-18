import { UnauthorizedError } from '@back-stage/shared';

import { signAccessToken, signPendingToken, verifyPendingToken } from '../../../shared/auth/jwt.js';
import { comparePassword } from '../../../shared/auth/password.js';
import type { UserAuthRecord, UserOrganization, UserAuthRepository } from '../infrastructure/user-auth.repository.js';

export interface AuthUser {
  id: string;
  code: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface LoginResult {
  status: 'ok';
  accessToken: string;
  user: AuthUser;
  organizationId: string;
  organizationName: string;
}

export interface SelectOrgResult {
  status: 'select_org';
  pendingToken: string;
  organizations: UserOrganization[];
}

export class LoginService {
  public constructor(private readonly userAuthRepository: UserAuthRepository) {}

  public async execute(code: string, password: string): Promise<LoginResult | SelectOrgResult> {
    const record = await this.userAuthRepository.findByCode(code);

    if (!record || !record.is_active) {
      throw new UnauthorizedError('Credenciais invalidas');
    }

    const passwordMatches = await comparePassword(password, record.password_hash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Credenciais invalidas');
    }

    const organizations = await this.userAuthRepository.findOrganizationsByUserId(record.id);

    if (organizations.length === 0) {
      throw new UnauthorizedError('Usuario nao pertence a nenhuma organizacao');
    }

    if (organizations.length === 1) {
      return this.buildLoginResult(record, organizations[0]);
    }

    return {
      status: 'select_org',
      pendingToken: signPendingToken(record.id),
      organizations,
    };
  }

  public async selectOrg(pendingToken: string, organizationId: string): Promise<LoginResult> {
    let payload: { sub: string };
    try {
      payload = verifyPendingToken(pendingToken);
    } catch {
      throw new UnauthorizedError('Token expirado ou invalido');
    }

    const isMember = await this.userAuthRepository.isMember(payload.sub, organizationId);
    if (!isMember) {
      throw new UnauthorizedError('Usuario nao pertence a esta organizacao');
    }

    const organizations = await this.userAuthRepository.findOrganizationsByUserId(payload.sub);
    const org = organizations.find((o) => o.id === organizationId);
    if (!org) throw new UnauthorizedError('Organizacao nao encontrada');

    const record = await this.userAuthRepository.findById(payload.sub);
    if (!record) throw new UnauthorizedError('Usuario nao encontrado');

    return this.buildLoginResult(record, org);
  }

  public async switchOrg(userId: string, organizationId: string): Promise<LoginResult> {
    const isMember = await this.userAuthRepository.isMember(userId, organizationId);
    if (!isMember) {
      throw new UnauthorizedError('Usuario nao pertence a esta organizacao');
    }

    const organizations = await this.userAuthRepository.findOrganizationsByUserId(userId);
    const org = organizations.find((o) => o.id === organizationId);
    if (!org) throw new UnauthorizedError('Organizacao nao encontrada');

    const record = await this.userAuthRepository.findById(userId);
    if (!record) throw new UnauthorizedError('Usuario nao encontrado');

    return this.buildLoginResult(record, org);
  }

  private buildLoginResult(record: UserAuthRecord, org: UserOrganization): LoginResult {
    const user: AuthUser = {
      id: record.id,
      code: record.code,
      email: record.email,
      fullName: record.full_name,
      roles: record.roles,
    };

    const accessToken = signAccessToken({
      ...user,
      organizationId: org.id,
      organizationName: org.name,
    });

    return {
      status: 'ok',
      accessToken,
      user,
      organizationId: org.id,
      organizationName: org.name,
    };
  }
}
