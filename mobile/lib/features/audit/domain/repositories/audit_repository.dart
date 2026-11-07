import '../entities/audit_entity.dart';

abstract class AuditRepository {
  Future<List<AuditLogItemEntity>> getAuditLogs({
    String? entityType,
    String? action,
    int? limit,
  });
}
