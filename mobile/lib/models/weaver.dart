import 'package:equatable/equatable.dart';

class Weaver extends Equatable {
  final int weaverId;
  final String firstName;
  final String lastName;
  final String? phone;
  final String? email;
  final String? bankAccountNumber;

  const Weaver({
    required this.weaverId,
    required this.firstName,
    required this.lastName,
    this.phone,
    this.email,
    this.bankAccountNumber,
  });

  String get fullName => '$firstName $lastName'.trim();

  factory Weaver.fromJson(Map<String, dynamic> json) {
    return Weaver(
      weaverId: json['weaverId'] is int
          ? json['weaverId']
          : int.tryParse(json['weaverId'].toString()) ?? 0,
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      phone: json['phone']?.toString(),
      email: json['email']?.toString(),
      bankAccountNumber: json['bankAccountNumber']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'weaverId': weaverId,
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'email': email,
      'bankAccountNumber': bankAccountNumber,
    };
  }

  @override
  List<Object?> get props => [
        weaverId,
        firstName,
        lastName,
        phone,
        email,
        bankAccountNumber,
      ];
}
