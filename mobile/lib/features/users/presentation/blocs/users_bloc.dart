import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/users_usecases.dart';
import 'users_event.dart';
import 'users_state.dart';

class UsersBloc extends Bloc<UsersEvent, UsersState> {
  final GetUsersUseCase getUsersUseCase;
  final UpdateUserStatusUseCase updateUserStatusUseCase;
  final ResetPasswordUseCase resetPasswordUseCase;
  final CreateUserUseCase createUserUseCase;

  UsersBloc({
    required this.getUsersUseCase,
    required this.updateUserStatusUseCase,
    required this.resetPasswordUseCase,
    required this.createUserUseCase,
  }) : super(const UsersState()) {
    on<LoadUsers>(_onLoadUsers);
    on<ToggleUserStatusSubmitted>(_onToggleUserStatusSubmitted);
    on<ResetPasswordSubmitted>(_onResetPasswordSubmitted);
    on<CreateUserSubmitted>(_onCreateUserSubmitted);
  }

  Future<void> _onLoadUsers(
    LoadUsers event,
    Emitter<UsersState> emit,
  ) async {
    emit(state.copyWith(
      status: UsersStatus.loading,
      roleFilter: event.role,
      searchQuery: event.search,
      errorMessage: null,
    ));
    try {
      final list = await getUsersUseCase(
        GetUsersParams(role: event.role, search: event.search),
      );
      emit(state.copyWith(status: UsersStatus.success, users: list));
    } catch (e) {
      emit(state.copyWith(
        status: UsersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onToggleUserStatusSubmitted(
    ToggleUserStatusSubmitted event,
    Emitter<UsersState> emit,
  ) async {
    emit(state.copyWith(status: UsersStatus.loading, errorMessage: null));
    try {
      await updateUserStatusUseCase(
        UpdateUserStatusParams(userId: event.userId, isActive: event.newStatus),
      );
      final list = await getUsersUseCase(
        GetUsersParams(role: state.roleFilter, search: state.searchQuery),
      );
      emit(state.copyWith(
        status: UsersStatus.actionSuccess,
        users: list,
        successMessage: 'User status updated',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: UsersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onResetPasswordSubmitted(
    ResetPasswordSubmitted event,
    Emitter<UsersState> emit,
  ) async {
    emit(state.copyWith(status: UsersStatus.loading, errorMessage: null));
    try {
      await resetPasswordUseCase(
        ResetPasswordParams(userId: event.userId, newPassword: event.newPassword),
      );
      emit(state.copyWith(
        status: UsersStatus.actionSuccess,
        successMessage: 'Password reset successfully',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: UsersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }

  Future<void> _onCreateUserSubmitted(
    CreateUserSubmitted event,
    Emitter<UsersState> emit,
  ) async {
    emit(state.copyWith(status: UsersStatus.loading, errorMessage: null));
    try {
      await createUserUseCase(
        CreateUserParams(
          firstName: event.firstName,
          lastName: event.lastName,
          username: event.username,
          password: event.password,
          role: event.role,
          phone: event.phone,
          email: event.email,
          bankAccountNumber: event.bankAccountNumber,
          companyName: event.companyName,
        ),
      );
      final list = await getUsersUseCase(
        GetUsersParams(role: state.roleFilter, search: state.searchQuery),
      );
      emit(state.copyWith(
        status: UsersStatus.actionSuccess,
        users: list,
        successMessage: 'User @${event.username} created successfully',
      ));
    } catch (e) {
      emit(state.copyWith(
        status: UsersStatus.error,
        errorMessage: e.toString().replaceAll('Exception: ', ''),
      ));
    }
  }
}
