import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';

import type { AuthenticatedUser, JwtPayload, PendingOrgPayload } from './auth.types.js';

export function signAccessToken(user: AuthenticatedUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    code: user.code,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles,
    organizationId: user.organizationId,
    organizationName: user.organizationName,
  };

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AuthenticatedUser {
  const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

  return {
    id: decoded.sub,
    code: decoded.code,
    email: decoded.email,
    fullName: decoded.fullName,
    roles: decoded.roles,
    organizationId: decoded.organizationId,
    organizationName: decoded.organizationName,
  };
}

export function signPendingToken(userId: string): string {
  const payload: PendingOrgPayload = { sub: userId, type: 'pending_org_selection' };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '5m' });
}

export function verifyPendingToken(token: string): PendingOrgPayload {
  const decoded = jwt.verify(token, env.jwtSecret) as PendingOrgPayload;
  if (decoded.type !== 'pending_org_selection') {
    throw new Error('Token invalido');
  }
  return decoded;
}
