import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/auth_user_model.dart';

abstract class AuthRemoteDataSource {
  Future<Map<String, dynamic>> login(String username, String password);
  Future<Map<String, dynamic>> signup({
    required String firstName,
    required String lastName,
    required String username,
    required String password,
    String? phone,
  });
  Future<AuthUserModel?> getMe();
  void updateBaseUrl(String url);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient apiClient;

  AuthRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await apiClient.dio.post(
      ApiConstants.authLogin,
      data: {'username': username, 'password': password},
    );
    return response.data as Map<String, dynamic>;
  }

  @override
  Future<Map<String, dynamic>> signup({
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
    return response.data as Map<String, dynamic>;
  }

  @override
  Future<AuthUserModel?> getMe() async {
    final response = await apiClient.dio.get(ApiConstants.authMe);
    return AuthUserModel.fromJson(response.data['user']);
  }

  @override
  void updateBaseUrl(String url) {
    apiClient.updateBaseUrl(url);
  }
}
