export interface AuthenticatedUser {
  id: string;
  code: string;
  email: string;
  fullName: string;
  roles: string[];
  organizationId: string;
  organizationName: string;
}

export interface JwtPayload {
  sub: string;
  code: string;
  email: string;
  fullName: string;
  roles: string[];
  organizationId: string;
  organizationName: string;
}

export interface PendingOrgPayload {
  sub: string;
  type: 'pending_org_selection';
}
