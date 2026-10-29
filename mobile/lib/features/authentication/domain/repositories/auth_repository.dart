import '../entities/auth_user_entity.dart';

abstract class AuthRepository {
  Future<AuthUserEntity> login(String username, String password);
  Future<AuthUserEntity> signup({
    required String firstName,
    required String lastName,
    required String username,
    required String password,
    String? phone,
  });
  Future<AuthUserEntity?> getCurrentUser();
  Future<void> logout();
  void updateServerUrl(String url);
}
