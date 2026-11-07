import 'package:equatable/equatable.dart';

class AuditLogItemEntity extends Equatable {
  final int id;
  final int? actorUserId;
  final String actorUsername;
  final String action;
  final String entityType;
  final String? entityId;
  final dynamic details;
  final String? ipAddress;
  final String createdAt;

  const AuditLogItemEntity({
    required this.id,
    this.actorUserId,
    this.actorUsername = 'System',
    required this.action,
    required this.entityType,
    this.entityId,
    this.details,
    this.ipAddress,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
    id,
    actorUserId,
    actorUsername,
    action,
    entityType,
    entityId,
    details,
    ipAddress,
    createdAt,
  ];
}
