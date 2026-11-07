import 'package:equatable/equatable.dart';

class UserManagementEntity extends Equatable {
  final int userId;
  final String username;
  final String fullName;
  final String? email;
  final String? phone;
  final String role;
  final List<String> roles;
  final bool isActive;
  final String? bankAccountNumber;
  final String? companyName;
  final String createdAt;

  const UserManagementEntity({
    required this.userId,
    required this.username,
    required this.fullName,
    this.email,
    this.phone,
    required this.role,
    this.roles = const [],
    this.isActive = true,
    this.bankAccountNumber,
    this.companyName,
    this.createdAt = '',
  });

  bool get isAdmin => role == 'admin' || roles.contains('admin');
  bool get isWeaver => role == 'weaver' || roles.contains('weaver');
  bool get isMerchant => role == 'merchant' || roles.contains('merchant');

  @override
  List<Object?> get props => [
    userId,
    username,
    fullName,
    email,
    phone,
    role,
    roles,
    isActive,
    bankAccountNumber,
    companyName,
  ];
}
