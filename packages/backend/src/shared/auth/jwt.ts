import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';

import type { AuthenticatedUser, JwtPayload } from './auth.types.js';

export function signAccessToken(user: AuthenticatedUser): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles,
  };

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AuthenticatedUser {
  const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

  return {
    id: decoded.sub,
    email: decoded.email,
    fullName: decoded.fullName,
    roles: decoded.roles,
  };
}
