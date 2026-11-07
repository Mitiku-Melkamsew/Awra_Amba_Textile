import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/json_response.dart';
import '../models/user_model.dart';

abstract class UsersRemoteDataSource {
  Future<List<UserManagementModel>> getUsers({String? role, String? search});
  Future<UserManagementModel> getUser(int userId);
  Future<void> updateUserStatus({required int userId, required bool isActive});
  Future<void> resetPassword({
    required int userId,
    required String newPassword,
  });
  Future<UserManagementModel> createUser({
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

class UsersRemoteDataSourceImpl implements UsersRemoteDataSource {
  final ApiClient apiClient;

  UsersRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<List<UserManagementModel>> getUsers({
    String? role,
    String? search,
  }) async {
    final queryParams = <String, dynamic>{};
    if (role != null && role.isNotEmpty) queryParams['role'] = role;
    if (search != null && search.isNotEmpty) queryParams['search'] = search;

    final response = await apiClient.dio.get(
      ApiConstants.users,
      queryParameters: queryParams,
    );

    final list = extractJsonList(response.data, key: 'users');
    return list
        .map((e) => UserManagementModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<UserManagementModel> getUser(int userId) async {
    final response = await apiClient.dio.get(ApiConstants.userById(userId));
    return UserManagementModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<void> updateUserStatus({
    required int userId,
    required bool isActive,
  }) async {
    await apiClient.dio.patch(
      ApiConstants.userStatus(userId),
      data: {'isActive': isActive},
    );
  }

  @override
  Future<void> resetPassword({
    required int userId,
    required String newPassword,
  }) async {
    await apiClient.dio.post(
      ApiConstants.userResetPassword(userId),
      data: {'newPassword': newPassword},
    );
  }

  @override
  Future<UserManagementModel> createUser({
    required String firstName,
    required String lastName,
    required String username,
    required String password,
    required String role,
    String? phone,
    String? email,
    String? bankAccountNumber,
    String? companyName,
  }) async {
    final response = await apiClient.dio.post(
      ApiConstants.users,
      data: {
        'firstName': firstName,
        'lastName': lastName,
        'username': username,
        'password': password,
        'role': role,
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        if (email != null && email.isNotEmpty) 'email': email,
        if (bankAccountNumber != null && bankAccountNumber.isNotEmpty)
          'bankAccountNumber': bankAccountNumber,
        if (companyName != null && companyName.isNotEmpty)
          'companyName': companyName,
      },
    );
    return UserManagementModel.fromJson(response.data as Map<String, dynamic>);
  }
}
