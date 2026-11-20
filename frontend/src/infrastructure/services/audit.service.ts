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
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const query = new URLSearchParams();
    const entityType = params?.entityType ?? params?.entityName;
    if (entityType && entityType !== "All areas") {
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
    const res = await request<any>(`/audit-logs${queryString}`);
    if (Array.isArray(res)) {
      return { logs: res, total: res.length };
    }
    return { logs: res?.logs ?? [], total: res?.total ?? (res?.logs?.length ?? 0) };
  },
};
