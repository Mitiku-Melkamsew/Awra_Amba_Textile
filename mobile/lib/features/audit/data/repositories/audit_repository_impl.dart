import '../../domain/entities/audit_entity.dart';
import '../../domain/repositories/audit_repository.dart';
import '../datasources/audit_remote_data_source.dart';

class AuditRepositoryImpl implements AuditRepository {
  final AuditRemoteDataSource remoteDataSource;

  AuditRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<AuditLogItemEntity>> getAuditLogs({
    String? entityType,
    String? action,
    int? limit,
  }) =>
      remoteDataSource.getAuditLogs(
        entityType: entityType,
        action: action,
        limit: limit,
      );
}
