import '../../../../core/usecase/usecase.dart';
import '../entities/user_entity.dart';
import '../repositories/users_repository.dart';

class GetUsersParams {
  final String? role;
  final String? search;
  const GetUsersParams({this.role, this.search});
}

class GetUsersUseCase implements UseCase<List<UserManagementEntity>, GetUsersParams> {
  final UsersRepository repository;
  GetUsersUseCase(this.repository);

  @override
  Future<List<UserManagementEntity>> call(GetUsersParams params) {
    return repository.getUsers(role: params.role, search: params.search);
  }
}

class UpdateUserStatusParams {
  final int userId;
  final bool isActive;
  const UpdateUserStatusParams({required this.userId, required this.isActive});
}

class UpdateUserStatusUseCase implements UseCase<void, UpdateUserStatusParams> {
  final UsersRepository repository;
  UpdateUserStatusUseCase(this.repository);

  @override
  Future<void> call(UpdateUserStatusParams params) {
    return repository.updateUserStatus(userId: params.userId, isActive: params.isActive);
  }
}

class ResetPasswordParams {
  final int userId;
  final String newPassword;
  const ResetPasswordParams({required this.userId, required this.newPassword});
}

class ResetPasswordUseCase implements UseCase<void, ResetPasswordParams> {
  final UsersRepository repository;
  ResetPasswordUseCase(this.repository);

  @override
  Future<void> call(ResetPasswordParams params) {
    return repository.resetPassword(userId: params.userId, newPassword: params.newPassword);
  }
}

class CreateUserParams {
  final String firstName;
  final String lastName;
  final String username;
  final String password;
  final String role;
  final String? phone;
  final String? email;
  final String? bankAccountNumber;
  final String? companyName;

  const CreateUserParams({
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
}

class CreateUserUseCase implements UseCase<UserManagementEntity, CreateUserParams> {
  final UsersRepository repository;
  CreateUserUseCase(this.repository);

  @override
  Future<UserManagementEntity> call(CreateUserParams params) {
    return repository.createUser(
      firstName: params.firstName,
      lastName: params.lastName,
      username: params.username,
      password: params.password,
      role: params.role,
      phone: params.phone,
      email: params.email,
      bankAccountNumber: params.bankAccountNumber,
      companyName: params.companyName,
    );
  }
}
