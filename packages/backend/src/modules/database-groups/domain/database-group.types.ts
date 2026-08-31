export interface DatabaseGroup {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  createdByUserId?: string | null;
  memberCount: number;
  applicationCount: number;
  // Only populated by the list endpoint (findAll) — lets a caller match a set
  // of database ids against every grupo without an extra request per grupo.
  // The single-grupo endpoints omit it; use `members` on DatabaseGroupDetail
  // there instead, which already carries the full row per banco.
  databaseIds?: string[];
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
