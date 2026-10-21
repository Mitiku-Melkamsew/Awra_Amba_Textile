import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../models/auth_user.dart';

class TokenStorage {
  static const String _keyToken = 'auth_token';
  static const String _keyUser = 'auth_user';
  static const String _keyBaseUrl = 'custom_base_url';

  final SharedPreferences _prefs;

  TokenStorage(this._prefs);

  static Future<TokenStorage> create() async {
    final prefs = await SharedPreferences.getInstance();
    return TokenStorage(prefs);
  }

  Future<void> saveToken(String token) async {
    await _prefs.setString(_keyToken, token);
  }

  String? getToken() {
    return _prefs.getString(_keyToken);
  }

  Future<void> removeToken() async {
    await _prefs.remove(_keyToken);
  }

  Future<void> saveUser(AuthUser user) async {
    await _prefs.setString(_keyUser, jsonEncode(user.toJson()));
  }

  AuthUser? getUser() {
    final userStr = _prefs.getString(_keyUser);
    if (userStr == null) return null;
    try {
      return AuthUser.fromJson(jsonDecode(userStr));
    } catch (_) {
      return null;
    }
  }

  Future<void> removeUser() async {
    await _prefs.remove(_keyUser);
  }

  Future<void> saveBaseUrl(String url) async {
    await _prefs.setString(_keyBaseUrl, url);
  }

  String? getBaseUrl() {
    return _prefs.getString(_keyBaseUrl);
  }

  Future<void> clearAll() async {
    await _prefs.remove(_keyToken);
    await _prefs.remove(_keyUser);
  }
}
