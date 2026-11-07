import '../../domain/entities/user_entity.dart';

class UserManagementModel extends UserManagementEntity {
  const UserManagementModel({
    required super.userId,
    required super.username,
    required super.fullName,
    super.email,
    super.phone,
    required super.role,
    super.roles,
    super.isActive,
    super.bankAccountNumber,
    super.companyName,
    super.createdAt,
  });

  factory UserManagementModel.fromJson(Map<String, dynamic> json) {
    final rawRoles = json['roles'];
    List<String> parsedRoles = [];
    if (rawRoles is List) {
      parsedRoles = rawRoles.map((r) {
        if (r is Map && r.containsKey('role')) {
          return r['role']?['name']?.toString() ?? r['role']?.toString() ?? '';
        }
        return r.toString();
      }).where((s) => s.isNotEmpty).toList();
    }

    final primaryRole = json['role']?.toString() ??
        (parsedRoles.isNotEmpty ? parsedRoles.first : 'weaver');

    return UserManagementModel(
      userId: int.tryParse(json['userId']?.toString() ?? json['id']?.toString() ?? '0') ?? 0,
      username: json['username']?.toString() ?? '',
      fullName: json['fullName']?.toString() ??
          '${json['firstName'] ?? ''} ${json['lastName'] ?? ''}'.trim(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      role: primaryRole,
      roles: parsedRoles.isNotEmpty ? parsedRoles : [primaryRole],
      isActive: json['isActive'] == null || json['isActive'] == true,
      bankAccountNumber: json['bankAccountNumber']?.toString(),
      companyName: json['companyName']?.toString(),
      createdAt: json['createdAt']?.toString() ?? '',
    );
  }
}
