import { request } from "../http/api-client";
import type { AuditLog } from "../../domain/models";

export const auditService = {
  async listLogs(params?: {
    entityName?: string;
    entityType?: string;
    action?: string;
    actorUserId?: number;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    const query = new URLSearchParams();
    const entityType = params?.entityType ?? params?.entityName;
    if (entityType) {
      query.append("entityType", entityType);
      query.append("entityName", entityType);
    }
    if (params?.action) query.append("action", params.action);
    if (params?.actorUserId) query.append("actorUserId", String(params.actorUserId));
    if (params?.entityId) query.append("entityId", params.entityId);
    if (params?.startDate) query.append("startDate", params.startDate);
    if (params?.endDate) query.append("endDate", params.endDate);
    if (params?.limit) query.append("limit", String(params.limit));
    if (params?.offset) query.append("offset", String(params.offset));
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await request<AuditLog[] | { logs: AuditLog[]; total: number }>(`/audit-logs${queryString}`);
    return Array.isArray(res) ? res : (res.logs ?? []);
  },
};
