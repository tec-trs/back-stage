export interface VIP {
  id: string;
  organizationId: string;
  hostname: string;
  displayName?: string;
  description?: string;
  vipAddress?: string;
  loadBalancerType?: string;
  healthCheckInterval?: number;
  healthCheckPath?: string;
  status: 'active' | 'maintenance' | 'inactive';
  environment?: string;
  criticality?: 'low' | 'medium' | 'high' | 'critical';
  ownerTeam?: string;
  ownerUserId?: string;
  costCenter?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface VIPServer {
  id: string;
  vipId: string;
  serverId: string;
  order: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateVIPDto {
  hostname: string;
  displayName?: string;
  description?: string;
  vipAddress?: string;
  loadBalancerType?: string;
  healthCheckInterval?: number;
  healthCheckPath?: string;
  status?: 'active' | 'maintenance' | 'inactive';
  environment?: string;
  criticality?: string;
  ownerTeam?: string;
  ownerUserId?: string;
  costCenter?: string;
}

export interface UpdateVIPDto {
  hostname?: string;
  displayName?: string;
  description?: string;
  vipAddress?: string;
  loadBalancerType?: string;
  healthCheckInterval?: number;
  healthCheckPath?: string;
  status?: string;
  environment?: string;
  criticality?: string;
  ownerTeam?: string;
  ownerUserId?: string;
  costCenter?: string;
}

export interface AddVIPServerDto {
  serverId: string;
  order?: number;
}
