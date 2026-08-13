export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  fullName: string;
  roles: string[];
}
