import 'package:equatable/equatable.dart';

class WeaverEntity extends Equatable {
  final int weaverId;
  final String firstName;
  final String lastName;
  final String? phone;
  final String? email;
  final String? bankAccountNumber;

  const WeaverEntity({
    required this.weaverId,
    required this.firstName,
    required this.lastName,
    this.phone,
    this.email,
    this.bankAccountNumber,
  });

  String get fullName => '$firstName $lastName'.trim();

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
