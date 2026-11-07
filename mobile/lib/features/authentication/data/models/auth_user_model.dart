import '../../domain/entities/auth_user_entity.dart';

class AuthUserModel extends AuthUserEntity {
  const AuthUserModel({
    required super.userId,
    required super.username,
    super.fullName,
    super.phone,
    super.email,
    required super.role,
    super.roles = const [],
    super.weaverId,
    super.merchantId,
  });

  factory AuthUserModel.fromJson(Map<String, dynamic> json) {
    final rawRoles = json['roles'];
    List<String> parsedRoles = [];
    if (rawRoles is List) {
      parsedRoles = rawRoles.map((e) => e.toString()).toList();
    } else if (json['role'] != null) {
      parsedRoles = [json['role'].toString()];
    }

    final primaryRole = json['role'] ??
        (parsedRoles.isNotEmpty ? parsedRoles.first : 'weaver');

    return AuthUserModel(
      userId: json['userId'] is int
          ? json['userId']
          : int.tryParse(json['userId']?.toString() ?? '') ?? 0,
      username: json['username'] ?? '',
      fullName: json['fullName']?.toString(),
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
      role: primaryRole,
      roles: parsedRoles,
      weaverId: json['weaverId'] != null
          ? int.tryParse(json['weaverId'].toString())
          : null,
      merchantId: json['merchantId'] != null
          ? int.tryParse(json['merchantId'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'username': username,
      'fullName': fullName,
      'phone': phone,
      'email': email,
      'role': role,
      'roles': roles,
      'weaverId': weaverId,
      'merchantId': merchantId,
    };
  }

  factory AuthUserModel.fromEntity(AuthUserEntity entity) {
    return AuthUserModel(
      userId: entity.userId,
      username: entity.username,
      fullName: entity.fullName,
      phone: entity.phone,
      email: entity.email,
      role: entity.role,
      roles: entity.roles,
      weaverId: entity.weaverId,
      merchantId: entity.merchantId,
    );
  }
}
