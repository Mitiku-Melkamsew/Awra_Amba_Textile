import 'package:equatable/equatable.dart';

abstract class UsersEvent extends Equatable {
  const UsersEvent();

  @override
  List<Object?> get props => [];
}

class LoadUsers extends UsersEvent {
  final String? role;
  final String? search;

  const LoadUsers({this.role, this.search});

  @override
  List<Object?> get props => [role, search];
}

class ToggleUserStatusSubmitted extends UsersEvent {
  final int userId;
  final bool newStatus;

  const ToggleUserStatusSubmitted({required this.userId, required this.newStatus});

  @override
  List<Object?> get props => [userId, newStatus];
}

class ResetPasswordSubmitted extends UsersEvent {
  final int userId;
  final String newPassword;

  const ResetPasswordSubmitted({required this.userId, required this.newPassword});

  @override
  List<Object?> get props => [userId, newPassword];
}

class CreateUserSubmitted extends UsersEvent {
  final String firstName;
  final String lastName;
  final String username;
  final String password;
  final String role;
  final String? phone;
  final String? email;
  final String? bankAccountNumber;
  final String? companyName;

  const CreateUserSubmitted({
    required this.firstName,
    required this.lastName,
    required this.username,
    required this.password,
    required this.role,
    this.phone,
    this.email,
    this.bankAccountNumber,
    this.companyName,
  });

  @override
  List<Object?> get props => [
    firstName,
    lastName,
    username,
    password,
    role,
    phone,
    email,
    bankAccountNumber,
    companyName,
  ];
}
