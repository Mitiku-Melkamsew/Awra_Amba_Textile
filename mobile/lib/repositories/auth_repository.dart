import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/auth_user.dart';

class AuthRepository {
  final ApiClient apiClient;

  AuthRepository({required this.apiClient});

  Future<AuthUser> login(String username, String password) async {
    final response = await apiClient.dio.post(
      ApiConstants.authLogin,
      data: {'username': username, 'password': password},
    );

    final token = response.data['token'] as String;
    final user = AuthUser.fromJson(response.data['user']);

    await apiClient.tokenStorage.saveToken(token);
    await apiClient.tokenStorage.saveUser(user);

    return user;
  }

  Future<AuthUser> signup({
    required String firstName,
    required String lastName,
    required String username,
    required String password,
    String? phone,
  }) async {
    final response = await apiClient.dio.post(
      ApiConstants.authSignup,
      data: {
        'firstName': firstName,
        'lastName': lastName,
        'username': username,
        'password': password,
        'phone': phone,
      },
    );

    final token = response.data['token'] as String;
    final user = AuthUser.fromJson(response.data['user']);

    await apiClient.tokenStorage.saveToken(token);
    await apiClient.tokenStorage.saveUser(user);

    return user;
  }

  Future<AuthUser?> getMe() async {
    final token = apiClient.tokenStorage.getToken();
    if (token == null) return null;

    try {
      final response = await apiClient.dio.get(ApiConstants.authMe);
      final user = AuthUser.fromJson(response.data['user']);
      await apiClient.tokenStorage.saveUser(user);
      return user;
    } catch (_) {
      return apiClient.tokenStorage.getUser();
    }
  }

  Future<void> logout() async {
    await apiClient.tokenStorage.clearAll();
  }
}
