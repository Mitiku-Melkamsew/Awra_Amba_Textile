import 'package:shared_preferences/shared_preferences.dart';

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

  Future<void> saveUserRaw(String jsonString) async {
    await _prefs.setString(_keyUser, jsonString);
  }

  String? getUserRaw() {
    return _prefs.getString(_keyUser);
  }

  Future<void> removeUser() async {
    await _prefs.remove(_keyUser);
  }

  Future<void> saveBaseUrl(String url) async {
    await _prefs.setString(_keyBaseUrl, url);
  }

  String? getBaseUrl() {
    final savedUrl = _prefs.getString(_keyBaseUrl);
    if (savedUrl == null || savedUrl.isEmpty) {
      return savedUrl;
    }

    final migratedUrl = savedUrl.replaceFirst(':3002/api/v1', ':3001/api/v1');
    if (migratedUrl != savedUrl) {
      _prefs.setString(_keyBaseUrl, migratedUrl);
    }
    return migratedUrl;
  }

  Future<void> clearAll() async {
    await _prefs.remove(_keyToken);
    await _prefs.remove(_keyUser);
  }
}
