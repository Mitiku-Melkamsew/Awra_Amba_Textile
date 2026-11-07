import '../entities/user_entity.dart';

abstract class UsersRepository {
  Future<List<UserManagementEntity>> getUsers({String? role, String? search});
  Future<UserManagementEntity> getUser(int userId);
  Future<void> updateUserStatus({required int userId, required bool isActive});
  Future<void> resetPassword({required int userId, required String newPassword});
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
  });
}
