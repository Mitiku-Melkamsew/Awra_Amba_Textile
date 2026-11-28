import { project, serializeUserBrief, type AnyRecord } from "./project.js";

const AUDIT_LOG_KEYS = [
  "auditLogId",
  "actorUserId",
  "action",
  "entityType",
  "entityId",
  "details",
  "createdAt",
] as const;

export function serializeAuditLog(log: AnyRecord): AnyRecord {
  const out = project(log, AUDIT_LOG_KEYS);
  if (log.actor) {
    out.actor = serializeUserBrief(log.actor);
  }
  return out;
}

export function serializeAuditList(result: { logs: AnyRecord[]; total: number }) {
  return {
    logs: (result.logs ?? []).map(serializeAuditLog),
    total: Number(result.total ?? 0),
  };
}
