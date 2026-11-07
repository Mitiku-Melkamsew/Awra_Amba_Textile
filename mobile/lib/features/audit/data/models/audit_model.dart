import '../../domain/entities/audit_entity.dart';

class AuditLogItemModel extends AuditLogItemEntity {
  const AuditLogItemModel({
    required super.id,
    super.actorUserId,
    super.actorUsername,
    required super.action,
    required super.entityType,
    super.entityId,
    super.details,
    super.ipAddress,
    required super.createdAt,
  });

  factory AuditLogItemModel.fromJson(Map<String, dynamic> json) {
    return AuditLogItemModel(
      id: int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      actorUserId: json['actorUserId'] != null ? int.tryParse(json['actorUserId'].toString()) : null,
      actorUsername: json['actorUsername']?.toString() ?? json['actor']?['username']?.toString() ?? 'System',
      action: json['action']?.toString() ?? '',
      entityType: json['entityType']?.toString() ?? '',
      entityId: json['entityId']?.toString(),
      details: json['details'],
      ipAddress: json['ipAddress']?.toString(),
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }
}
