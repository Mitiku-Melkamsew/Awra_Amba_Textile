import 'package:equatable/equatable.dart';
import '../../domain/entities/user_entity.dart';

enum UsersStatus { initial, loading, success, actionSuccess, error }

class UsersState extends Equatable {
  final UsersStatus status;
  final List<UserManagementEntity> users;
  final String? roleFilter;
  final String? searchQuery;
  final String? errorMessage;
  final String? successMessage;

  const UsersState({
    this.status = UsersStatus.initial,
    this.users = const [],
    this.roleFilter,
    this.searchQuery,
    this.errorMessage,
    this.successMessage,
  });

  UsersState copyWith({
    UsersStatus? status,
    List<UserManagementEntity>? users,
    String? roleFilter,
    String? searchQuery,
    String? errorMessage,
    String? successMessage,
  }) {
    return UsersState(
      status: status ?? this.status,
      users: users ?? this.users,
      roleFilter: roleFilter ?? this.roleFilter,
      searchQuery: searchQuery ?? this.searchQuery,
      errorMessage: errorMessage,
      successMessage: successMessage,
    );
  }

  @override
  List<Object?> get props => [
    status,
    users,
    roleFilter,
    searchQuery,
    errorMessage,
    successMessage,
  ];
}
