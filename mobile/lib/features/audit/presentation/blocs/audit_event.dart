import 'package:equatable/equatable.dart';

abstract class AuditEvent extends Equatable {
  const AuditEvent();

  @override
  List<Object?> get props => [];
}

class LoadAuditLogs extends AuditEvent {
  final String? entityType;
  final String? action;

  const LoadAuditLogs({this.entityType, this.action});

  @override
  List<Object?> get props => [entityType, action];
}
