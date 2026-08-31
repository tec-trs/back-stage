export interface DatabaseGroup {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  createdByUserId?: string | null;
  memberCount: number;
  applicationCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface DatabaseGroupMember {
  // The membership row's own id — used to detach a banco from the grupo.
  id: string;
  databaseId: string;
  name: string;
  displayName?: string | null;
  status?: string;
  criticality?: string;
  hostedOnServerId?: string | null;
  hostedOnServerLabel?: string | null;
}

export interface DatabaseGroupApplicationLink {
  // The link row's own id — used to un-document an aplicacao from the grupo.
  id: string;
  applicationId: string;
  displayName?: string | null;
  status?: string;
}

export interface DatabaseGroupDetail extends DatabaseGroup {
  members: DatabaseGroupMember[];
  applications: DatabaseGroupApplicationLink[];
}

export interface CreateDatabaseGroupDto {
  name: string;
  description?: string;
}

export interface UpdateDatabaseGroupDto {
  name?: string;
  description?: string;
}
