import 'package:equatable/equatable.dart';

class AuthUserEntity extends Equatable {
  final int userId;
  final String username;
  final String role; // 'admin', 'weaver', 'merchant'
  final int? weaverId;
  final int? merchantId;

  const AuthUserEntity({
    required this.userId,
    required this.username,
    required this.role,
    this.weaverId,
    this.merchantId,
  });

  bool get isAdmin => role.toLowerCase() == 'admin';
  bool get isWeaver => role.toLowerCase() == 'weaver';
  bool get isMerchant => role.toLowerCase() == 'merchant';

  @override
  List<Object?> get props => [userId, username, role, weaverId, merchantId];
}
