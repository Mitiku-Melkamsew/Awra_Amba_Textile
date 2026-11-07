import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object?> get props => [];
}

class AppStarted extends AuthEvent {}

class LoginSubmitted extends AuthEvent {
  final String username;
  final String password;

  const LoginSubmitted({required this.username, required this.password});

  @override
  List<Object?> get props => [username, password];
}

class SignupSubmitted extends AuthEvent {
  final String firstName;
  final String lastName;
  final String username;
  final String password;
  final String? phone;
  final String role;
  final String? companyName;

  const SignupSubmitted({
    required this.firstName,
    required this.lastName,
    required this.username,
    required this.password,
    this.phone,
    this.role = 'weaver',
    this.companyName,
  });

  @override
  List<Object?> get props => [firstName, lastName, username, password, phone, role, companyName];
}

class LogoutRequested extends AuthEvent {}

class ServerUrlUpdated extends AuthEvent {
  final String newUrl;

  const ServerUrlUpdated(this.newUrl);

  @override
  List<Object?> get props => [newUrl];
}
