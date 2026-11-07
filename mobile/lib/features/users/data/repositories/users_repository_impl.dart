import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/users_repository.dart';
import '../datasources/users_remote_data_source.dart';

class UsersRepositoryImpl implements UsersRepository {
  final UsersRemoteDataSource remoteDataSource;

  UsersRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<UserManagementEntity>> getUsers({String? role, String? search}) =>
      remoteDataSource.getUsers(role: role, search: search);

  @override
  Future<UserManagementEntity> getUser(int userId) =>
      remoteDataSource.getUser(userId);

  @override
  Future<void> updateUserStatus({required int userId, required bool isActive}) =>
      remoteDataSource.updateUserStatus(userId: userId, isActive: isActive);

  @override
  Future<void> resetPassword({required int userId, required String newPassword}) =>
      remoteDataSource.resetPassword(userId: userId, newPassword: newPassword);

  @override
  Future<UserManagementEntity> createUser({
    required String firstName,
    required String lastName,
    required String username,
    required String password,
    required String role,
    String? phone,
    String? email,
    String? bankAccountNumber,
    String? companyName,
  }) =>
      remoteDataSource.createUser(
        firstName: firstName,
        lastName: lastName,
        username: username,
        password: password,
        role: role,
        phone: phone,
        email: email,
        bankAccountNumber: bankAccountNumber,
        companyName: companyName,
      );
}
