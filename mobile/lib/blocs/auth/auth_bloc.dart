import 'package:flutter_bloc/flutter_bloc.dart';
import '../../repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;

  AuthBloc({required this.authRepository}) : super(const AuthState()) {
    on<AppStarted>(_onAppStarted);
    on<LoginSubmitted>(_onLoginSubmitted);
    on<SignupSubmitted>(_onSignupSubmitted);
    on<LogoutRequested>(_onLogoutRequested);
    on<ServerUrlUpdated>(_onServerUrlUpdated);
  }

  Future<void> _onAppStarted(AppStarted event, Emitter<AuthState> emit) async {
    emit(state.copyWith(status: AuthStatus.loading));
    try {
      final user = await authRepository.getMe();
      if (user != null) {
        emit(state.copyWith(status: AuthStatus.authenticated, user: user));
      } else {
        emit(state.copyWith(status: AuthStatus.unauthenticated));
      }
    } catch (_) {
      emit(state.copyWith(status: AuthStatus.unauthenticated));
    }
  }

  Future<void> _onLoginSubmitted(
    LoginSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));
    try {
      final user = await authRepository.login(event.username, event.password);
      emit(state.copyWith(status: AuthStatus.authenticated, user: user));
    } catch (e) {
      emit(
        state.copyWith(
          status: AuthStatus.error,
          errorMessage: e.toString().replaceAll('Exception: ', ''),
        ),
      );
    }
  }

  Future<void> _onSignupSubmitted(
    SignupSubmitted event,
    Emitter<AuthState> emit,
  ) async {
    emit(state.copyWith(status: AuthStatus.loading, errorMessage: null));
    try {
      final user = await authRepository.signup(
        firstName: event.firstName,
        lastName: event.lastName,
        username: event.username,
        password: event.password,
        phone: event.phone,
      );
      emit(state.copyWith(status: AuthStatus.authenticated, user: user));
    } catch (e) {
      emit(
        state.copyWith(
          status: AuthStatus.error,
          errorMessage: e.toString().replaceAll('Exception: ', ''),
        ),
      );
    }
  }

  Future<void> _onLogoutRequested(
    LogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    await authRepository.logout();
    emit(const AuthState(status: AuthStatus.unauthenticated));
  }

  void _onServerUrlUpdated(ServerUrlUpdated event, Emitter<AuthState> emit) {
    authRepository.apiClient.updateBaseUrl(event.newUrl);
    emit(state.copyWith(serverUrl: event.newUrl));
  }
}
