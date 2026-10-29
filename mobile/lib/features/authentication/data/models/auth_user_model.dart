import '../../domain/entities/auth_user_entity.dart';

class AuthUserModel extends AuthUserEntity {
  const AuthUserModel({
    required super.userId,
    required super.username,
    required super.role,
    super.weaverId,
    super.merchantId,
  });

  factory AuthUserModel.fromJson(Map<String, dynamic> json) {
    return AuthUserModel(
      userId: json['userId'] is int
          ? json['userId']
          : int.tryParse(json['userId'].toString()) ?? 0,
      username: json['username'] ?? '',
      role: json['role'] ?? 'weaver',
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
      'role': role,
      'weaverId': weaverId,
      'merchantId': merchantId,
    };
  }

  factory AuthUserModel.fromEntity(AuthUserEntity entity) {
    return AuthUserModel(
      userId: entity.userId,
      username: entity.username,
      role: entity.role,
      weaverId: entity.weaverId,
      merchantId: entity.merchantId,
    );
  }
}
