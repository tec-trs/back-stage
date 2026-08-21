export interface ServerGroup {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  environment?: string;
  status: 'active' | 'maintenance' | 'inactive';
  criticality?: 'low' | 'medium' | 'high' | 'critical';
  vipHostname?: string;
  vipAddress?: string;
  loadBalancerType?: string;
  healthCheckInterval?: number;
  healthCheckPath?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ServerGroupMember {
  id: string;
  groupId: string;
  serverId: string;
  order: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateServerGroupDto {
  name: string;
  description?: string;
  environment?: string;
  status?: 'active' | 'maintenance' | 'inactive';
  criticality?: string;
  vipHostname?: string;
  vipAddress?: string;
  loadBalancerType?: string;
  healthCheckInterval?: number;
  healthCheckPath?: string;
}

export interface UpdateServerGroupDto {
  name?: string;
  description?: string;
  environment?: string;
  status?: string;
  criticality?: string;
  vipHostname?: string;
  vipAddress?: string;
  loadBalancerType?: string;
  healthCheckInterval?: number;
  healthCheckPath?: string;
}

export interface AddGroupMemberDto {
  serverId: string;
  order?: number;
}
