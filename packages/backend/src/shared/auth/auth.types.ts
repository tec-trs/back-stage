export interface AuthenticatedUser {
  id: string;
  code: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface JwtPayload {
  sub: string;
  code: string;
  email: string;
  fullName: string;
  roles: string[];
}
