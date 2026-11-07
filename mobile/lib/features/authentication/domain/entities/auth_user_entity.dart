import 'package:equatable/equatable.dart';

class AuthUserEntity extends Equatable {
  final int userId;
  final String username;
  final String? fullName;
  final String? phone;
  final String? email;
  final String role; // 'admin', 'weaver', 'merchant'
  final List<String> roles;
  final int? weaverId;
  final int? merchantId;

  const AuthUserEntity({
    required this.userId,
    required this.username,
    this.fullName,
    this.phone,
    this.email,
    required this.role,
    this.roles = const [],
    this.weaverId,
    this.merchantId,
  });

  bool get isAdmin =>
      roles.map((r) => r.toLowerCase()).contains('admin') ||
      role.toLowerCase() == 'admin';

  bool get isWeaver =>
      roles.map((r) => r.toLowerCase()).contains('weaver') ||
      role.toLowerCase() == 'weaver';

  bool get isMerchant =>
      roles.map((r) => r.toLowerCase()).contains('merchant') ||
      role.toLowerCase() == 'merchant';

  String get displayName =>
      (fullName != null && fullName!.trim().isNotEmpty) ? fullName! : username;

  @override
  List<Object?> get props => [
    userId,
    username,
    fullName,
    phone,
    email,
    role,
    roles,
    weaverId,
    merchantId,
  ];
}
