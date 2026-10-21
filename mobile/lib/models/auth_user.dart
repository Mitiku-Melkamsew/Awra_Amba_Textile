import 'package:equatable/equatable.dart';

class AuthUser extends Equatable {
  final int userId;
  final String username;
  final String role; // 'admin', 'weaver', 'merchant'
  final int? weaverId;
  final int? merchantId;

  const AuthUser({
    required this.userId,
    required this.username,
    required this.role,
    this.weaverId,
    this.merchantId,
  });

  bool get isAdmin => role.toLowerCase() == 'admin';
  bool get isWeaver => role.toLowerCase() == 'weaver';
  bool get isMerchant => role.toLowerCase() == 'merchant';

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
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

  @override
  List<Object?> get props => [userId, username, role, weaverId, merchantId];
}
