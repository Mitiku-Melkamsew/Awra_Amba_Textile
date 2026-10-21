import 'package:equatable/equatable.dart';
import '../../models/auth_user.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AuthState extends Equatable {
  final AuthStatus status;
  final AuthUser? user;
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
    AuthUser? user,
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
