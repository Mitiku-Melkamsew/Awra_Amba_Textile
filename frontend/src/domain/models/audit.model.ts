export interface AuditLog {
  auditLogId: number;
  actorUserId?: number | null;
  userId?: number | null;
  action: string;
  entityType?: string;
  entityName?: string;
  entityId?: string | number | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
  actor?: {
    userId: number;
    username: string;
    fullName?: string;
  } | null;
  user?: {
    userId: number;
    username: string;
    fullName?: string;
  } | null;
}
