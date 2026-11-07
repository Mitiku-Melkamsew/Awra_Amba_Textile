import 'package:equatable/equatable.dart';
import '../../domain/entities/audit_entity.dart';

enum AuditStatus { initial, loading, success, error }

class AuditState extends Equatable {
  final AuditStatus status;
  final List<AuditLogItemEntity> logs;
  final String? entityFilter;
  final String? errorMessage;

  const AuditState({
    this.status = AuditStatus.initial,
    this.logs = const [],
    this.entityFilter,
    this.errorMessage,
  });

  AuditState copyWith({
    AuditStatus? status,
    List<AuditLogItemEntity>? logs,
    String? entityFilter,
    String? errorMessage,
  }) {
    return AuditState(
      status: status ?? this.status,
      logs: logs ?? this.logs,
      entityFilter: entityFilter ?? this.entityFilter,
      errorMessage: errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, logs, entityFilter, errorMessage];
}
