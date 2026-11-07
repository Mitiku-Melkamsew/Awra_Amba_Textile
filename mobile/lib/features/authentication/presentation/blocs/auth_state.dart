import 'package:equatable/equatable.dart';
import '../../domain/entities/auth_user_entity.dart';

enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

class AuthState extends Equatable {
  final AuthStatus status;
  final AuthUserEntity? user;
  final String? errorMessage;
  final String? serverUrl;

  const AuthState({
    this.status = AuthStatus.initial,
    this.user,
    this.errorMessage,
    this.serverUrl,
  });

  bool get isAuthenticated => status == AuthStatus.authenticated && user != null;
  bool get isAdmin => user?.isAdmin ?? false;
  bool get isWeaver => user?.isWeaver ?? false;

  AuthState copyWith({
    AuthStatus? status,
    AuthUserEntity? user,
    String? errorMessage,
    String? serverUrl,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage,
      serverUrl: serverUrl ?? this.serverUrl,
    );
  }

  @override
  List<Object?> get props => [status, user, errorMessage, serverUrl];
}
