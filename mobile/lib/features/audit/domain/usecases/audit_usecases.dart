import '../../../../core/usecase/usecase.dart';
import '../entities/audit_entity.dart';
import '../repositories/audit_repository.dart';

class GetAuditLogsParams {
  final String? entityType;
  final String? action;
  final int? limit;

  const GetAuditLogsParams({this.entityType, this.action, this.limit});
}

class GetAuditLogsUseCase implements UseCase<List<AuditLogItemEntity>, GetAuditLogsParams> {
  final AuditRepository repository;
  GetAuditLogsUseCase(this.repository);

  @override
  Future<List<AuditLogItemEntity>> call(GetAuditLogsParams params) {
    return repository.getAuditLogs(
      entityType: params.entityType,
      action: params.action,
      limit: params.limit,
    );
  }
}
