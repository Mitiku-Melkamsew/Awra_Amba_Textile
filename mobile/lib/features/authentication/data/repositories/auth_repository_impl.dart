import '../../domain/entities/auth_user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_local_data_source.dart';
import '../datasources/auth_remote_data_source.dart';
import '../models/auth_user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final AuthLocalDataSource localDataSource;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
  });

  @override
  Future<AuthUserEntity> login(String username, String password) async {
    final response = await remoteDataSource.login(username, password);
    final token = response['token'] as String;
    final userModel = AuthUserModel.fromJson(response['user']);

    await localDataSource.saveToken(token);
    await localDataSource.saveUser(userModel);

    return userModel;
  }

  @override
  Future<AuthUserEntity> signup({
    required String firstName,
    required String lastName,
    required String username,
    required String password,
    String? phone,
  }) async {
    final response = await remoteDataSource.signup(
      firstName: firstName,
      lastName: lastName,
      username: username,
      password: password,
      phone: phone,
    );
    final token = response['token'] as String;
    final userModel = AuthUserModel.fromJson(response['user']);

    await localDataSource.saveToken(token);
    await localDataSource.saveUser(userModel);

    return userModel;
  }

  @override
  Future<AuthUserEntity?> getCurrentUser() async {
    final token = localDataSource.getToken();
    if (token == null) return null;

    try {
      final user = await remoteDataSource.getMe();
      if (user != null) {
        await localDataSource.saveUser(user);
        return user;
      }
    } catch (_) {
      // Return cached user if offline or network failed
      return localDataSource.getUser();
    }
    return localDataSource.getUser();
  }

  @override
  Future<void> logout() async {
    await localDataSource.clearAll();
  }

  @override
  void updateServerUrl(String url) {
    remoteDataSource.updateBaseUrl(url);
  }
}
