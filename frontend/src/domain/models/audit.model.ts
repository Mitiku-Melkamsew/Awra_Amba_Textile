export interface AuditLog {
  auditLogId: number;
  userId?: number | null;
  action: string;
  entityName: string;
  entityId?: string | number | null;
  details?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    userId: number;
    username: string;
    fullName?: string;
  } | null;
}
