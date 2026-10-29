import 'dart:convert';
import 'package:awra_amba_textile/core/storage/token_storage.dart';
import '../models/auth_user_model.dart';

abstract class AuthLocalDataSource {
  Future<void> saveToken(String token);
  String? getToken();
  Future<void> removeToken();

  Future<void> saveUser(AuthUserModel user);
  AuthUserModel? getUser();
  Future<void> removeUser();

  Future<void> clearAll();
}

class AuthLocalDataSourceImpl implements AuthLocalDataSource {
  final TokenStorage tokenStorage;

  AuthLocalDataSourceImpl({required this.tokenStorage});

  @override
  Future<void> saveToken(String token) => tokenStorage.saveToken(token);

  @override
  String? getToken() => tokenStorage.getToken();

  @override
  Future<void> removeToken() => tokenStorage.removeToken();

  @override
  Future<void> saveUser(AuthUserModel user) async {
    await tokenStorage.saveUserRaw(jsonEncode(user.toJson()));
  }

  @override
  AuthUserModel? getUser() {
    final rawUser = tokenStorage.getUserRaw();
    if (rawUser == null) return null;
    try {
      final Map<String, dynamic> data = jsonDecode(rawUser);
      return AuthUserModel.fromJson(data);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> removeUser() => tokenStorage.removeUser();

  @override
  Future<void> clearAll() => tokenStorage.clearAll();
}
