import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../storage/token_storage.dart';

class ApiClient {
  late final Dio dio;
  final TokenStorage tokenStorage;

  ApiClient({required this.tokenStorage}) {
    // Web-safe platform check: Avoid dart:io Platform on web platforms
    final bool isAndroid = !kIsWeb && defaultTargetPlatform == TargetPlatform.android;
    final defaultUrl = isAndroid
        ? ApiConstants.defaultAndroidBaseUrl
        : ApiConstants.defaultLocalhostBaseUrl;

    final initialBaseUrl = tokenStorage.getBaseUrl() ?? defaultUrl;

    dio = Dio(
      BaseOptions(
        baseUrl: initialBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Dynamic baseUrl update if user configured a custom server IP
          final customUrl = tokenStorage.getBaseUrl();
          if (customUrl != null && customUrl.isNotEmpty) {
            options.baseUrl = customUrl;
          }

          final token = tokenStorage.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          String errorMessage = 'Network error occurred';
          if (e.response != null) {
            final data = e.response?.data;
            if (data is Map && data.containsKey('error')) {
              errorMessage = data['error'].toString();
            } else if (data is Map && data.containsKey('message')) {
              errorMessage = data['message'].toString();
            } else {
              errorMessage = 'Server error (${e.response?.statusCode})';
            }
          } else if (e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.receiveTimeout) {
            errorMessage = 'Connection timed out. Check server connectivity.';
          } else if (e.type == DioExceptionType.connectionError) {
            errorMessage = 'Cannot reach backend server. Verify server IP/port.';
          }
          return handler.next(
            DioException(
              requestOptions: e.requestOptions,
              response: e.response,
              type: e.type,
              error: errorMessage,
            ),
          );
        },
      ),
    );
  }

  void updateBaseUrl(String newUrl) {
    dio.options.baseUrl = newUrl;
    tokenStorage.saveBaseUrl(newUrl);
  }
}
